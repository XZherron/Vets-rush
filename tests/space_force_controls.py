"""Local Chromium regression: python3 tests/space_force_controls.py.
Requires Python Playwright and /usr/bin/chromium. No deployment or real saves.
Uses a temporary loopback server and isolated desktop/mobile browser contexts.
"""
import functools
import http.server
import math
from pathlib import Path
import threading
from playwright.sync_api import sync_playwright

root = Path(__file__).resolve().parents[1]
class QuietHandler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *args):
        pass
server = http.server.ThreadingHTTPServer(('127.0.0.1', 0), functools.partial(QuietHandler, directory=str(root)))
threading.Thread(target=server.serve_forever, daemon=True).start()
url = f'http://127.0.0.1:{server.server_port}/space_force_orbital_defense.html'

def position(page):
    return page.evaluate('({x:player.x,y:player.y,speed:player.speed})')
def step(page):
    before = position(page)
    page.evaluate('update()')
    after = position(page)
    return after['x']-before['x'], after['y']-before['y']
def near(actual, expected):
    assert math.isclose(actual, expected, abs_tol=1e-7), (actual, expected)
def touch(cdp, kind, points):
    cdp.send('Input.dispatchTouchEvent', {'type':kind,'touchPoints':points})
def point(page, selector, id=1, dx=0):
    box=page.locator(selector).bounding_box()
    return {'x':box['x']+box['width']/2+dx,'y':box['y']+box['height']/2,'id':id}

try:
    with sync_playwright() as p:
        browser=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
        for mobile in (False, True):
            context=browser.new_context(viewport={'width':900,'height':700},has_touch=mobile,is_mobile=mobile)
            page=context.new_page()
            errors=[]
            page.on('pageerror',lambda error:errors.append(error.stack))
            page.route('**/*',lambda route: route.continue_() if route.request.url.startswith('http://127.0.0.1:') else route.abort())
            # Manual animation steps retain the real game update and event handlers.
            page.add_init_script('window.requestAnimationFrame = () => 0;')
            assert page.goto(url).status==200
            page.evaluate('startGame(0); enemies=[]; asteroids=[]; player.x=WIDTH/2; player.y=HEIGHT/2')
            speed=position(page)['speed']
            if not mobile:
                for key,axis,sign in [('w',1,-1),('a',0,-1),('s',1,1),('d',0,1),('ArrowUp',1,-1),('ArrowLeft',0,-1),('ArrowDown',1,1),('ArrowRight',0,1)]:
                    page.keyboard.down(key); delta=step(page)
                    near(delta[axis],sign*speed);near(delta[1-axis],0)
                    # Held movement persists without repeated keydown.
                    near(step(page)[axis],sign*speed)
                    page.keyboard.up(key);assert step(page)==(0,0)
                page.keyboard.down('w');page.keyboard.down('ArrowUp')
                near(step(page)[1],-speed)
                page.keyboard.up('w');near(step(page)[1],-speed)
                page.keyboard.down('ArrowDown');assert step(page)==(0,0)
                page.keyboard.up('ArrowDown');page.keyboard.up('ArrowUp')
                page.keyboard.down('w');page.keyboard.down('d')
                dx,dy=step(page);near(math.hypot(dx,dy),speed);assert dx>0 and dy<0
                page.keyboard.up('w');page.keyboard.up('d')
                page.evaluate("document.body.insertAdjacentHTML('beforeend','<input id=typing>'); document.querySelector('#typing').focus()")
                page.keyboard.press('w');assert step(page)==(0,0)
                page.evaluate("document.querySelector('#typing').remove()")
                page.keyboard.down('d');page.evaluate("window.dispatchEvent(new Event('blur'))")
                assert step(page)==(0,0);page.keyboard.up('d')
                page.keyboard.down('w');page.evaluate('showMissionSelect(); startGame(0)')
                assert step(page)==(0,0);page.keyboard.up('w')
                page.keyboard.down('a');page.evaluate('endGame(); restartGame()')
                assert step(page)==(0,0);page.keyboard.up('a')
                page.keyboard.down('d')
                page.evaluate("Object.defineProperty(document,'hidden',{configurable:true,value:true}); document.dispatchEvent(new Event('visibilitychange'))")
                assert step(page)==(0,0);page.keyboard.up('d')
                page.keyboard.down('Space');assert page.evaluate('fireButtonPressed && bullets.length>0')
                page.keyboard.up('Space');assert not page.evaluate('fireButtonPressed')
                assert not errors,errors
                for expected in (1, 2, 0):
                    page.keyboard.press('q')
                    assert page.evaluate('currentSpecial')==expected
                    assert page.locator('#power-up-indicator').inner_text()==page.evaluate('specialNames[currentSpecial]+" SELECTED"')
                    assert not errors,errors
                page.evaluate('unlockedSpecials=[true,false,true]')
                page.keyboard.press('q');assert page.evaluate('currentSpecial')==2
                assert not errors,errors
                print('PASS desktop: WASD/arrows, held/alias/opposing keys, normalized diagonal, release, typing, blur/hidden/menu/restart reset, Space fire, Q cycle/wrap/locked skip and visible selection without pageerrors')
            else:
                cdp=context.new_cdp_session(page)
                joystick=point(page,'#joystick-area',dx=35)
                touch(cdp,'touchStart',[joystick]);dx,dy=step(page)
                assert dx>0;near(dy,0)
                fire=point(page,'#fire-button',id=2)
                touch(cdp,'touchStart',[joystick,fire]);assert page.evaluate('fireButtonPressed && bullets.length>0')
                assert step(page)[0]>0
                touch(cdp,'touchEnd',[]);assert step(page)==(0,0)
                assert not page.evaluate('fireButtonPressed')
                for selector,cooldown in [('#special-button','missileCooldown'),('#nova-button','novaCooldown'),('#orbital-button','orbitalCooldown')]:
                    touch(cdp,'touchStart',[point(page,selector)])
                    touch(cdp,'touchEnd',[])
                    assert page.evaluate(cooldown)>0,(selector,cooldown)
                touch(cdp,'touchStart',[point(page,'#joystick-area',dx=35)])
                touch(cdp,'touchCancel',[]);assert step(page)==(0,0)
                print('PASS emulated touch: joystick movement, simultaneous joystick/fire, release, all three specials, touch cancellation')
            assert not errors,errors
            context.close()
        browser.close()
finally:
    server.shutdown()
    server.server_close()
