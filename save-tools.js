// Local, user-controlled backups. No save contents are sent to a server.
(function () {
  'use strict';
  function parseBackup(text) {
    const backup = JSON.parse(text);
    if (!backup || backup.format !== 'vets-rush-save' || backup.version !== 1 ||
        !backup.state || typeof backup.state !== 'object' || Array.isArray(backup.state)) {
      throw new Error('Choose a Vets Rush version 1 backup.');
    }
    for (const key of Object.keys(window.VetsRush.DEFAULT_STATE.jackpot)) {
      if (backup.state[key] !== undefined &&
          (typeof backup.state[key] !== 'number' || !Number.isFinite(backup.state[key]) || backup.state[key] < 0)) {
        throw new Error('This backup contains an invalid ' + key + ' balance.');
      }
    }
    return window.VetsRush.normalizeGameState(backup.state);
  }
  window.VetsRush.parseBackup = parseBackup;
  const section = document.createElement('details');
  section.className = 'save-tools';
  section.innerHTML = '<summary>Save backup &amp; transfer</summary>' +
    '<p>Progress stays in this browser on this website. Download a backup before changing devices, clearing browser data, or moving to vetsrush.com.</p>' +
    '<button type="button" id="save-download">Download save backup</button>' +
    '<label for="save-backup-file">Restore a Vets Rush backup</label>' +
    '<input id="save-backup-file" type="file" accept="application/json,.json">' +
    '<p id="save-tools-status" role="status" aria-live="polite"></p>';
  const style = document.createElement('style');
  style.textContent = '.save-tools{margin:18px 0;padding:16px;background:#101a30;border:1px solid #465578;border-radius:16px;color:#f3f6ff;font:14px/1.5 system-ui}.save-tools summary{cursor:pointer;font-weight:800}.save-tools p{margin:12px 0}.save-tools button{display:block;min-height:44px;padding:10px 14px;border:0;border-radius:10px;background:#ffc52e;color:#161e30;font-weight:800;margin:12px 0}.save-tools label{display:block;margin:12px 0 6px}.save-tools input{max-width:100%;font:inherit}.save-tools #save-tools-status:empty{display:none}';
  document.head.append(style);
  document.getElementById('debug-reset-btn').before(section);
  const status = document.getElementById('save-tools-status');
  document.getElementById('save-download').addEventListener('click', function () {
    const backup = {format:'vets-rush-save', version:1, exportedAt:new Date().toISOString(), source:location.origin, state:window.VetsRush.getGame()};
    const url = URL.createObjectURL(new Blob([JSON.stringify(backup, null, 2)], {type:'application/json'}));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'vets-rush-save-' + new Date().toISOString().slice(0, 10) + '.json';
    link.click();
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
    status.textContent = 'Backup download started. Keep this file somewhere safe.';
  });
  document.getElementById('save-backup-file').addEventListener('change', async function (event) {
    const file = event.target.files[0];
    if (!file) return;
    try {
      if (file.size > 1024 * 1024) throw new Error('Backup is larger than 1 MB.');
      const state = parseBackup(await file.text());
      if (!confirm('Restore this backup with ' + state.heroCoins.toLocaleString() + ' Hero Coins? This replaces progress on this website in this browser. The current save will be kept as a recovery copy.')) return;
      const current = localStorage.getItem(window.VetsRush.VETS_RUSH_SAVE_KEY);
      if (current) localStorage.setItem('vetsRushBeforeImport:' + Date.now(), current);
      window.VetsRush.saveInventory(state);
      window.VetsRush.updateUI();
      if (typeof updateInventoryDisplay === 'function') updateInventoryDisplay();
      status.textContent = 'Backup restored. Your progress is saved on this website.';
    } catch (error) {
      status.textContent = 'Backup was not restored: ' + error.message;
    } finally {
      event.target.value = '';
    }
  });
}());
