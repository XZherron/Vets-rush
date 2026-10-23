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
  valor: 0,
  freedom: 0,
  torpedoes: 0,
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

heroReveal: {
    currentPlane: "corsair",
    unlockedTiles: {},
    unlockedPlanes: []
  },

  rescueRun: {
    unlockedLevel: 1,
    currentHero: "default",
    unlockedHeroes: ["default"]
  },
  
  spaceForce: {
    highScore: 0,
    bestWave: 1,
    bestMission: 0,
    missionsCompleted: [],
    totalRuns: 0
  },

  tutorials: {
    heroRevealSeen: false
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

	heroReveal: {
      ...DEFAULT_STATE.heroReveal,
      ...(incoming.heroReveal || {}),
      unlockedTiles: {
        ...DEFAULT_STATE.heroReveal.unlockedTiles,
        ...((incoming.heroReveal && incoming.heroReveal.unlockedTiles) || {})
      },
      unlockedPlanes: Array.isArray(incoming.heroReveal && incoming.heroReveal.unlockedPlanes)
        ? incoming.heroReveal.unlockedPlanes
        : DEFAULT_STATE.heroReveal.unlockedPlanes
    },

    rescueRun: {
      ...DEFAULT_STATE.rescueRun,
      ...(incoming.rescueRun || {}),
      unlockedLevel: Number(
        (incoming.rescueRun && incoming.rescueRun.unlockedLevel) ||
        incoming.rescueRunUnlockedLevel ||
        DEFAULT_STATE.rescueRun.unlockedLevel
      ) || 1,
      currentHero:
        (incoming.rescueRun && incoming.rescueRun.currentHero) ||
        incoming.rescueRunCurrentHero ||
        DEFAULT_STATE.rescueRun.currentHero,
      unlockedHeroes: Array.isArray(incoming.rescueRun && incoming.rescueRun.unlockedHeroes)
        ? incoming.rescueRun.unlockedHeroes
        : DEFAULT_STATE.rescueRun.unlockedHeroes
    },
    
    spaceForce: {
      ...DEFAULT_STATE.spaceForce,
      ...(incoming.spaceForce || {}),
      highScore: Number((incoming.spaceForce && incoming.spaceForce.highScore) || incoming.ussfHighScore || 0) || 0,
      bestWave: Number((incoming.spaceForce && incoming.spaceForce.bestWave) || 1) || 1,
      bestMission: Number((incoming.spaceForce && incoming.spaceForce.bestMission) || 0) || 0,
      totalRuns: Number((incoming.spaceForce && incoming.spaceForce.totalRuns) || 0) || 0,
      missionsCompleted: Array.isArray(incoming.spaceForce && incoming.spaceForce.missionsCompleted)
        ? incoming.spaceForce.missionsCompleted
        : []
    },

    tutorials: {
      ...DEFAULT_STATE.tutorials,
      ...(incoming.tutorials || {})
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

function getHeroRevealState() {
  game = window.game = normalizeGameState(window.game || game);
  return game.heroReveal;
}

function hasSeenTutorial(key) {
  game = window.game = normalizeGameState(window.game || game);
  return !!game.tutorials[key];
}

function markTutorialSeen(key) {
  game = window.game = normalizeGameState(window.game || game);
  game.tutorials[key] = true;
  saveGame(game);
  updateVetsRushUI();
}

function saveHeroRevealState(heroRevealState) {
  game = window.game = normalizeGameState(window.game || game);

  game.heroReveal = {
    ...DEFAULT_STATE.heroReveal,
    ...(heroRevealState || {}),
    unlockedTiles: {
      ...DEFAULT_STATE.heroReveal.unlockedTiles,
      ...((heroRevealState && heroRevealState.unlockedTiles) || {})
    },
    unlockedPlanes: Array.isArray(heroRevealState && heroRevealState.unlockedPlanes)
      ? heroRevealState.unlockedPlanes
      : DEFAULT_STATE.heroReveal.unlockedPlanes
  };

  saveGame(game);
  updateVetsRushUI();

  return game.heroReveal;
}

function getRescueRunState() {
  game = window.game = normalizeGameState(window.game || game);
  return game.rescueRun;
}

function saveRescueRunState(rescueRunState) {
  game = window.game = normalizeGameState(window.game || game);

  game.rescueRun = {
    ...DEFAULT_STATE.rescueRun,
    ...(rescueRunState || {}),
    unlockedLevel: Number((rescueRunState && rescueRunState.unlockedLevel) || 1) || 1,
    currentHero: (rescueRunState && rescueRunState.currentHero) || "default",
    unlockedHeroes: Array.isArray(rescueRunState && rescueRunState.unlockedHeroes)
      ? rescueRunState.unlockedHeroes
      : ["default"]
  };

  saveGame(game);
  updateVetsRushUI();

  return game.rescueRun;
}

function getSpaceForceState() {
  game = window.game = normalizeGameState(window.game || game);
  return game.spaceForce;
}

function saveSpaceForceState(spaceForceState) {
  game = window.game = normalizeGameState(window.game || game);

  game.spaceForce = {
    ...DEFAULT_STATE.spaceForce,
    ...(spaceForceState || {}),
    highScore: Number((spaceForceState && spaceForceState.highScore) || 0) || 0,
    bestWave: Number((spaceForceState && spaceForceState.bestWave) || 1) || 1,
    bestMission: Number((spaceForceState && spaceForceState.bestMission) || 0) || 0,
    totalRuns: Number((spaceForceState && spaceForceState.totalRuns) || 0) || 0,
    missionsCompleted: Array.isArray(spaceForceState && spaceForceState.missionsCompleted)
      ? spaceForceState.missionsCompleted
      : []
  };

  saveGame(game);
  updateVetsRushUI();

  return game.spaceForce;
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

const UPGRADE_CONFIG = {
  extraLife: {
    maxLevel: 5,
    costs: {
      shields: { base: 8, scale: 1.75 },
      heroCoins: { base: 1500, scale: 1.8 }
    }
  },

  shieldDuration: {
    maxLevel: 6,
    costs: {
      shields: { base: 6, scale: 1.6 },
      heroCoins: { base: 1000, scale: 1.65 }
    }
  },

  reinforcedShield: {
    maxLevel: 5,
    costs: {
      shields: { base: 10, scale: 1.7 },
      heroCoins: { base: 1250, scale: 1.75 }
    }
  }
};

function getUpgradeLevel(type) {
  game = window.game = normalizeGameState(window.game || game);
  return Number(game.upgrades[type] || 0);
}

function getUpgradeCost(type) {
  const config = UPGRADE_CONFIG[type];
  if (!config) return null;

  const level = getUpgradeLevel(type);

  if (level >= config.maxLevel) {
    return null;
  }

  const shieldCost = Math.ceil(config.costs.shields.base * Math.pow(config.costs.shields.scale, level));
  const coinCost = Math.ceil(config.costs.heroCoins.base * Math.pow(config.costs.heroCoins.scale, level));

  return {
    shields: shieldCost,
    heroCoins: coinCost
  };
}

function canBuyUpgrade(type) {
  const cost = getUpgradeCost(type);
  if (!cost) return false;

  game = window.game = normalizeGameState(window.game || game);

  return (game.shields || 0) >= cost.shields &&
         (game.heroCoins || 0) >= cost.heroCoins;
}

function buyGameUpgrade(type) {
  const config = UPGRADE_CONFIG[type];
  if (!config) return false;

  game = window.game = normalizeGameState(window.game || game);

  const currentLevel = Number(game.upgrades[type] || 0);

  if (currentLevel >= config.maxLevel) {
    return false;
  }

  const cost = getUpgradeCost(type);
  if (!cost) return false;

  if ((game.shields || 0) < cost.shields) {
    return false;
  }

  if ((game.heroCoins || 0) < cost.heroCoins) {
    return false;
  }

  game.shields -= cost.shields;
  game.heroCoins -= cost.heroCoins;

  game.upgrades[type] = currentLevel + 1;

  // Keep legacy flat aliases synced for older pages and Eagle Strike helpers
  if (type === 'extraLife') {
    game.extraLives = game.upgrades.extraLife;
  }

  if (type === 'shieldDuration') {
    game.shieldDuration = game.upgrades.shieldDuration;
  }

  if (type === 'reinforcedShield') {
    game.reinforcedShield = game.upgrades.reinforcedShield;
  }

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

function stealToJackpot(type, amount) {
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
  const requested = Number(amount) || 0;

  if (requested <= 0) {
    return {
      type: key,
      amount: 0,
      success: false
    };
  }

  if (typeof game[key] !== 'number') {
    game[key] = 0;
  }

  const stolen = Math.min(game[key], requested);

  if (stolen <= 0) {
    return {
      type: key,
      amount: 0,
      success: false
    };
  }

  game[key] -= stolen;

  ensureJackpot(game);
  game.jackpot[key] = (game.jackpot[key] || 0) + stolen;

  saveGame(game);
  updateVetsRushUI();

  return {
    type: key,
    amount: stolen,
    success: true,
    label: getRewardName(key)
  };
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
  getHeroRevealState,
  saveHeroRevealState,
  getRescueRunState,
  saveRescueRunState,
  getSpaceForceState,
  saveSpaceForceState,
  hasSeenTutorial,
  markTutorialSeen,

  loadGame,
  saveGame,
  loadGameState,
  saveGameState,

  addReward,
  spend,
  buyGameUpgrade,
  UPGRADE_CONFIG,
  getUpgradeLevel,
  getUpgradeCost,
  canBuyUpgrade,

  getRewardName,
  ensureJackpot,
  addToJackpot,
  stealToJackpot,
  awardJackpot,

  updateUI: updateVetsRushUI,
  normalizeGameState,
  formatNumber: formatVetsRushNumber
};