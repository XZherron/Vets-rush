// ============================================
// VETS RUSH - GLOBAL GAME STATE (Shared Module)
// ============================================

const DEFAULT_STATE = {
    heroCoins: 3277350,
    stars: 0,
    shields: 0,
    valor: 0,
    freedom: 0,
    torpedoes: 0,
    flags: 0,
    helmets: 0,
    medals: 0,
    homes: 12,
    beds: 0,
    upgrades: {
        extraLife: 0,
        shieldDuration: 0,
        reinforcedShield: 0
    }
};

function loadGame() {
    const saved = localStorage.getItem("vetsRushState");
    if (saved) {
        const parsed = JSON.parse(saved);
        // Merge with defaults (in case new fields were added)
        return {
            ...DEFAULT_STATE,
            ...parsed,
            upgrades: {
                ...DEFAULT_STATE.upgrades,
                ...(parsed.upgrades || {})
            }
        };
    }
    return { ...DEFAULT_STATE };
}

function saveGame(state) {
    localStorage.setItem("vetsRushState", JSON.stringify(state));
}

let game = loadGame();

// Add rewards (coins, stars, shields, etc.)
function addReward(type, amount) {
    if (!game[type] && game[type] !== 0) game[type] = 0;
    game[type] += amount;
    saveGame(game);
    updateUI();
}

// Spend resources (for store purchases, etc.)
function spend(type, amount) {
    if (game[type] >= amount) {
        game[type] -= amount;
        saveGame(game);
        updateUI();
        return true;
    }
    return false;
}

// Update all UI counters (call this after any change)
function updateUI() {
    // Main header coins
    const coinsEl = document.getElementById("hero-coins");
    if (coinsEl) coinsEl.textContent = game.heroCoins.toLocaleString();

    // Collectibles section
    const starsEl = document.getElementById("stars-count");
    if (starsEl) starsEl.textContent = game.stars;

    const shieldsEl = document.getElementById("shields-count");
    if (shieldsEl) shieldsEl.textContent = game.shields;

    const torpedoesEl = document.getElementById("torpedoes-count");
    if (torpedoesEl) torpedoesEl.textContent = game.torpedoes;

    const freedomEl = document.getElementById("freedom-count");
    if (freedomEl) freedomEl.textContent = game.freedom;

    const valorEl = document.getElementById("valor-count");
    if (valorEl) valorEl.textContent = game.valor;

    const flagsEl = document.getElementById("flags-count");
    if (flagsEl) flagsEl.textContent = game.flags;

    const helmetsEl = document.getElementById("helmets-count");
    if (helmetsEl) helmetsEl.textContent = game.helmets;

    const medalsEl = document.getElementById("medals-count");
    if (medalsEl) medalsEl.textContent = game.medals;

    const homesEl = document.getElementById("homes-count");
    if (homesEl) homesEl.textContent = game.homes;

    const bedsEl = document.getElementById("beds-count");
    if (bedsEl) bedsEl.textContent = game.beds;
}

// Auto-sync when page loads
document.addEventListener("DOMContentLoaded", () => {
    updateUI();
});

// Make functions globally available
window.VetsRush = {
    game,
    addReward,
    spend,
    updateUI,
    saveGame,
    loadGame
};