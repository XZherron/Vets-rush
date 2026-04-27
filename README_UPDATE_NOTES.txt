# VETS RUSH updated files

This package adds `game-state.js` and wires the uploaded HTML files to use the shared VETS RUSH save state.

Upload these files to the root of your GitHub repo, replacing the existing files.

Important changes:
- Added shared `game-state.js`
- Migrates old `vetsRushGameState` saves to `vetsRushState`
- Keeps the old key mirrored temporarily for compatibility
- Eagle Strike now reads Store upgrades for extra lives and shield duration
- Eagle Strike rewards now add directly to the shared balance
- Store upgrades now write to the shared upgrade object
- Fixed the duplicate `const win` bug in `spin.html`
- Changed mini-game buttons from opening new tabs to same-window navigation
