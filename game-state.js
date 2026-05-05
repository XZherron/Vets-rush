// ============================================
// VETS RUSH - GLOBAL GAME STATE
// Shared by every mini-game page
// ============================================

const VETS_RUSH_SAVE_KEY = 'vetsRushInventory';
const VETS_RUSH_OLD_KEYS = ['vetsRushState', 'vetsRushGameState'];

const DEFAULT_STATE = {
  heroCoins: 0,
  stars: 0,
  shields: 0,
  valor: 100,
  freedom: 0,
  torpedoes: 100,
  flags: 0,
  helmets: 0,
  medals: 0,
  homes: 0,
  beds: 0,

  jackpot: {
    heroCoins: 0,
    stars: 0,
    shields: 0,
    valor: 0,
    freedom: 0,
    torpedoes: 0,
    flags: 0,
    helmets: 0,
    medals: 0,
    homes: 0,
    beds: 0
  },

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
  const incoming = state || {};

  const merged = {
    ...DEFAULT_STATE,
    ...incoming,

    jackpot: {
      ...DEFAULT_STATE.jackpot,
      ...(incoming.jackpot || {})
    },

    upgrades: {
      ...DEFAULT_STATE.upgrades,
      ...(incoming.upgrades || {})
    },

    highScores: {
      ...DEFAULT_STATE.highScores,
      ...(incoming.highScores || {})
    }
  };

  // Make sure all main inventory values are numbers.
  [
    'heroCoins',
    'stars',
    'shields',
    'valor',
    'freedom',
    'torpedoes',
    'flags',
    'helmets',
    'medals',
    'homes',
    'beds'
  ].forEach(key => {
    merged[key] = Number(merged[key]) || 0;
  });

  // Make sure jackpot values are numbers.
  Object.keys(DEFAULT_STATE.jackpot).forEach(key => {
    merged.jackpot[key] = Number(merged.jackpot[key]) || 0;
  });

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
  let saved = localStorage.getItem(VETS_RUSH_SAVE_KEY);

  // One-time migration from older project keys.
  if (!saved) {
    for (const oldKey of VETS_RUSH_OLD_KEYS) {
      const oldSave = localStorage.getItem(oldKey);
      if (oldSave) {
        saved = oldSave;
        break;
      }
    }
  }

  if (saved) {
    try {
      const loaded = normalizeGameState(JSON.parse(saved));
      saveGame(loaded);
      return loaded;
    } catch (error) {
      console.warn('VETS RUSH save was corrupted. Starting fresh.', error);
    }
  }

  return normalizeGameState(DEFAULT_STATE);
}

function saveGame(state = window.game) {
  window.game = normalizeGameState(state || window.game || DEFAULT_STATE);

  // Main save key.
  localStorage.setItem(VETS_RUSH_SAVE_KEY, JSON.stringify(window.game));

  // Temporary mirrors so older pages still work while we migrate.
  localStorage.setItem('vetsRushState', JSON.stringify(window.game));
  localStorage.setItem('vetsRushGameState', JSON.stringify(window.game));

  return window.game;
}

let game = loadGame();
window.game = game;

function getGame() {
  game = window.game = normalizeGameState(window.game || game);
  return game;
}

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
  const value = Number(amount) || 0;

  if (typeof game[key] !== 'number') {
    game[key] = 0;
  }

  game[key] += value;

  saveGame(game);
  updateVetsRushUI();

  return game;
}

function spend(type, amount) {
  game = window.game = normalizeGameState(window.game || game);

  const keyMap = {
    coins: 'heroCoins',
    heroCoins: 'heroCoins',
    freedomSpins: 'freedom',
    valorChips: 'valor'
  };

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

function getRewardName(type) {
  const names = {
    heroCoins: 'Hero Coins',
    stars: 'Stars',
    shields: 'Shields',
    valor: 'Valor Chips',
    freedom: 'Freedom Spins',
    torpedoes: 'Torpedoes',
    flags: 'Flags',
    helmets: 'Helmets',
    medals: 'Medals',
    homes: 'Homes',
    beds: 'Beds'
  };

  return names[type] || 'Reward';
}

function ensureJackpot(state = window.game) {
  const safeState = normalizeGameState(state || window.game || game);

  safeState.jackpot = {
    ...DEFAULT_STATE.jackpot,
    ...(safeState.jackpot || {})
  };

  return safeState.jackpot;
}

function addToJackpot(type, amount) {
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
  const value = Number(amount) || 0;

  if (value <= 0) return false;

  ensureJackpot(game);
  game.jackpot[key] = (game.jackpot[key] || 0) + value;

  saveGame(game);
  updateVetsRushUI();

  return true;
}

function awardJackpot() {
  game = window.game = normalizeGameState(window.game || game);
  ensureJackpot(game);

  const messages = [];

  Object.keys(game.jackpot).forEach(type => {
    const amount = Number(game.jackpot[type]) || 0;

    if (amount > 0) {
      if (typeof game[type] !== 'number') {
        game[type] = 0;
      }

      game[type] += amount;

      messages.push({
        type,
        amount,
        label: getRewardName(type)
      });

      game.jackpot[type] = 0;
    }
  });

  saveGame(game);
  updateVetsRushUI();

  return messages;
}

function formatVetsRushNumber(num) {
  num = Number(num) || 0;

  if (num >= 1000000) {
    return (num / 1000000).toFixed(1).replace('.0', '') + 'M';
  }

  if (num >= 1000) {
    return (num / 1000).toFixed(1).replace('.0', '') + 'K';
  }

  return String(num);
}

function updateVetsRushUI() {
  game = window.game = normalizeGameState(window.game || game);

  const idMap = {
    'hero-coins': formatVetsRushNumber(game.heroCoins),
    'heroCoins': game.heroCoins.toLocaleString(),

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
    'bonus-hits': game.upgrades.reinforcedShield,

    'jackpot-coins': game.jackpot.heroCoins || 0,
    'jackpot-stars': game.jackpot.stars || 0,
    'jackpot-shields': game.jackpot.shields || 0,
    'jackpot-valor': game.jackpot.valor || 0,
    'jackpot-freedom': game.jackpot.freedom || 0,
    'jackpot-torpedoes': game.jackpot.torpedoes || 0,
    'jackpot-flags': game.jackpot.flags || 0,
    'jackpot-helmets': game.jackpot.helmets || 0,
    'jackpot-medals': game.jackpot.medals || 0,
    'jackpot-homes': game.jackpot.homes || 0,
    'jackpot-beds': game.jackpot.beds || 0
  };

  Object.entries(idMap).forEach(([id, value]) => {
    const el = document.getElementById(id);
    if (el) {
      el.textContent = value;
    }
  });
}

// New preferred helper names.
function getInventory() {
  return getGame();
}

function saveInventory(state = window.game) {
  return saveGame(state);
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
  get game() {
    return window.game;
  },

  set game(value) {
    window.game = normalizeGameState(value);
    saveGame(window.game);
  },

  DEFAULT_STATE,
  VETS_RUSH_SAVE_KEY,

  getGame,
  getInventory,
  saveInventory,

  loadGame,
  saveGame,
  loadGameState,
  saveGameState,

  addReward,
  spend,
  buyGameUpgrade,

  getRewardName,
  ensureJackpot,
  addToJackpot,
  awardJackpot,

  updateUI: updateVetsRushUI,
  normalizeGameState,
  formatNumber: formatVetsRushNumber
};