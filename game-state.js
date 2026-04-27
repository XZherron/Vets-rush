// ============================================
// VETS RUSH - GLOBAL GAME STATE
// Shared by every mini-game page
// ============================================
const DEFAULT_STATE = {
  heroCoins: 3277350,
  stars: 0,
  shields: 0,
  valor: 0,
  freedom: 3,
  torpedoes: 0,
  flags: 0,
  helmets: 0,
  medals: 0,
  homes: 12,
  beds: 0,
  highScores: {},
  upgrades: {
    extraLife: 0,
    shieldDuration: 0,
    reinforcedShield: 0
  },
  // legacy flat aliases kept so older pages still work while we migrate
  extraLives: 0,
  shieldDuration: 0,
  reinforcedShield: 0
};

function normalizeGameState(state) {
  const merged = {
    ...DEFAULT_STATE,
    ...(state || {}),
    upgrades: {
      ...DEFAULT_STATE.upgrades,
      ...((state && state.upgrades) || {})
    },
    highScores: {
      ...DEFAULT_STATE.highScores,
      ...((state && state.highScores) || {})
    }
  };

  // Sync legacy flat upgrade values with the nested upgrade object.
  merged.upgrades.extraLife = Number(merged.upgrades.extraLife || merged.extraLives || 0);
  merged.upgrades.shieldDuration = Number(merged.upgrades.shieldDuration || merged.shieldDuration || 0);
  merged.upgrades.reinforcedShield = Number(merged.upgrades.reinforcedShield || merged.reinforcedShield || 0);

  merged.extraLives = merged.upgrades.extraLife;
  merged.shieldDuration = merged.upgrades.shieldDuration;
  merged.reinforcedShield = merged.upgrades.reinforcedShield;

  return merged;
}

function loadGame() {
  let saved = localStorage.getItem('vetsRushState');

  // One-time migration from the old project key.
  if (!saved) {
    const legacy = localStorage.getItem('vetsRushGameState');
    if (legacy) saved = legacy;
  }

  if (saved) {
    try {
      return normalizeGameState(JSON.parse(saved));
    } catch (error) {
      console.warn('VETS RUSH save was corrupted. Starting fresh.', error);
    }
  }

  return normalizeGameState(DEFAULT_STATE);
}

function saveGame(state = window.game) {
  window.game = normalizeGameState(state);
  localStorage.setItem('vetsRushState', JSON.stringify(window.game));
  // Keep the old key mirrored temporarily so older code still reads the same save.
  localStorage.setItem('vetsRushGameState', JSON.stringify(window.game));
  return window.game;
}

let game = loadGame();
window.game = game;

function addReward(type, amount) {
  game = window.game = normalizeGameState(window.game || game);

  const keyMap = {
    coins: 'heroCoins',
    coin: 'heroCoins',
    heroCoin: 'heroCoins',
    heroCoins: 'heroCoins',
    freedomSpins: 'freedom',
    valorChips: 'valor'
  };

  const key = keyMap[type] || type;
  if (typeof game[key] !== 'number') game[key] = 0;
  game[key] += Number(amount) || 0;

  saveGame(game);
  updateVetsRushUI();
}

function spend(type, amount) {
  game = window.game = normalizeGameState(window.game || game);
  const keyMap = { coins: 'heroCoins', freedomSpins: 'freedom', valorChips: 'valor' };
  const key = keyMap[type] || type;
  const cost = Number(amount) || 0;

  if ((game[key] || 0) >= cost) {
    game[key] -= cost;
    saveGame(game);
    updateVetsRushUI();
    return true;
  }

  return false;
}

function buyGameUpgrade(type, cost) {
  if (!spend('shields', cost)) return false;
  game = window.game = normalizeGameState(window.game || game);
  game.upgrades[type] = (game.upgrades[type] || 0) + 1;
  saveGame(game);
  updateVetsRushUI();
  return true;
}

function updateVetsRushUI() {
  game = window.game = normalizeGameState(window.game || game);
  const idMap = {
    'hero-coins': game.heroCoins.toLocaleString(),
    'stars-count': game.stars,
    'shields-count': game.shields,
    'shield-count': game.shields,
    'torpedoes-count': game.torpedoes,
    'freedom-count': game.freedom,
    'valor-count': game.valor,
    'valor-chips': game.valor,
    'flags-count': game.flags,
    'helmets-count': game.helmets,
    'medals-count': game.medals,
    'homes-count': game.homes,
    'beds-count': game.beds,
    'owned-extraLife': game.upgrades.extraLife,
    'owned-shieldDuration': game.upgrades.shieldDuration,
    'bonus-duration': game.upgrades.shieldDuration,
    'owned-reinforced': game.upgrades.reinforcedShield,
    'bonus-hits': game.upgrades.reinforcedShield
  };

  Object.entries(idMap).forEach(([id, value]) => {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
  });
}

// Backward-compatible helper names for older pages.
function loadGameState() {
  game = window.game = loadGame();
  return game;
}

function saveGameState() {
  game = window.game = normalizeGameState(window.game || game);
  saveGame(game);
}

document.addEventListener('DOMContentLoaded', updateVetsRushUI);

window.VetsRush = {
  get game() { return window.game; },
  set game(value) { window.game = normalizeGameState(value); saveGame(window.game); },
  loadGame,
  saveGame,
  loadGameState,
  saveGameState,
  addReward,
  spend,
  buyGameUpgrade,
  updateUI: updateVetsRushUI,
  normalizeGameState
};
