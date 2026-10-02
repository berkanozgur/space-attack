# Manual playtest

Run the core and polish checklists after changes. Restart between checks when needed. Record failures separately; do not mark untested behavior as passing.

## Launch and controls
- [ ] Open `index.html` directly in a desktop browser; the game works without installation, server, dependencies, or external assets.
- [ ] Start screen shows Space Attack, movement/fire controls, and Enter to start.
- [ ] Enter begins a fresh run with score 0, full energy, three total ships (two reserves), and wave 1.
- [ ] Arrow keys and A/D move only left/right; the ship stays within the playfield.
- [ ] Space fires; repeated presses and holding Space never create more than one player shot at once.
- [ ] Controls remain readable on screen during play; movement/fire keys do not scroll the page.
- [ ] Esc pauses and resumes an active run; the scene, bullets, energy, and gameplay timers freeze while paused, and HUD remains visible.
- [ ] Holding Esc does not repeatedly toggle pause. Enter does not reset a paused run; resuming clears held inputs and does not jump the simulation forward.
- [ ] Resize the window: the fixed logical playfield fits with preserved aspect ratio, crisp sprites, and an unclipped HUD.
- [ ] Ship, both kinds of shots, divers, and formation move/draw on whole logical pixels; no subpixel interpolation or blurred fractional sprite edges.
- [ ] Formation holds between discrete four-pixel steps and reverses at its sway limits; wave 1 steps every 0.24 seconds (half the earlier rate), and later waves step more frequently.
- [ ] Compare movement at different refresh rates if available; after a background-tab pause, returning does not cause a large simulation jump.

## Enemies, hits, and scoring
- [ ] Yellow flagships occupy the top, with compact red and green rows below; the armada sways side to side.
- [ ] Each wave contains exactly 2 yellow, 5 red, 7 green, 9 red, 9 red, 9 red in six centered rows; tighter spacing and the raised formation remain clear of the top score digits.
- [ ] Individual enemies leave the formation, dive toward the player, and fire during dives.
- [ ] Divers descend in straight southeast/southwest segments, committed for about 4–5 ship lengths before reconsidering direction toward the player's horizontal position.
- [ ] Enemies seek vertical alignment for shooting without changing direction every frame, and remain inside side boundaries.
- [ ] Enemy bullets are white and travel straight down without following the player.
- [ ] Each diving enemy has at most one active bullet; it fires again when that bullet hits or reaches the combat bottom. Different enemies may each have a bullet.
- [ ] Lower divers naturally fire more frequently because their bullets reach the bottom sooner.
- [ ] Avoided divers exit at the combat bottom without score or normal return to formation; existing bullets survive their owner's exit or destruction until a hit or bottom exit.
- [ ] Player shots destroy enemies on contact and disappear; misses clear so the player can fire again.
- [ ] Each enemy destruction adds score exactly once.
- [ ] Divers award more than formation enemies; flagships award the most.
- [ ] Horizontal movement drains energy over time; each shot actually fired consumes energy. A blocked firing attempt while a shot is already on screen does not consume shot energy.
- [ ] Enemy shots hitting the player immediately destroy one ship, even at full energy; misses do not.
- [ ] Enemy-body collisions immediately destroy one ship, even at full energy, without duplicate ship losses from the same collision event.

## HUD, ships, and progression
- [ ] Score stays visible at top left and high score at top right in every screen/state.
- [ ] Energy marked E stays visible at bottom left; reserve ships and wave stay visible at bottom right.
- [ ] SCORE, HIGH SCORE, RESERVE, and WAVE text labels are absent in all states; digits/icons remain visible. Game over shows bare final-score digits.
- [ ] Energy depletion loses one ship and refills energy if another ship remains; reserve display updates correctly.
- [ ] A ship destroyed by an enemy shot or body collision is replaced with full energy if ships remain; reserve display updates correctly.
- [ ] Reaching/crossing 5,000 points grants exactly one bonus ship; further scoring does not grant the same bonus again.
- [ ] Clear the entire armada by destruction or bottom exits: a new wave starts and the wave number increments; escapes award no score.
- [ ] Completing a wave refuels energy to full before the next wave banner/combat.
- [ ] Later waves have faster formation movement, more frequent dives, and more enemy firing.
- [ ] Activation intervals are 1.5/1.375/1.25/1.125/1 seconds in waves 1–5 and reset at wave 6; batch size still increases every five completed waves.
- [ ] Active caps are 2 in waves 1–10, 3 in 11–20, then grow by one every ten waves up to 8. Full caps prevent new activation; available slots limit partial batches without duplicate selection.
- [ ] Activated enemies blink white/original color while remaining visible and collidable; formation enemies retain their original color, and pause freezes the blink.
- [ ] Movement/firing energy costs are 20% higher; wave refuels still restore full energy.
- [ ] Lose all remaining ships: combat stops and game over shows final score and Enter to restart.
- [ ] Enter restarts with score 0, full energy, three ships, wave 1, reset bonus eligibility, and no leftover shots/enemies or stuck inputs.
- [ ] High score preserves the best score across restarts within the page session.
- [ ] With localStorage available, a new high score survives reloading and reopening the page.
- [ ] With localStorage unavailable or reads/writes failing, gameplay continues and the best score is retained for the page session.

## Art and scope
- [ ] Black background, sparse starfield, chunky original pixel sprites, blocky digits, and the limited bright palette are consistent with the reference's spirit.
- [ ] The game stays small, readable, and limited to the requested mechanics.

## Polish — authorized and implemented
- [ ] Destroying enemies shows short explosions without duplicate score or lingering collision targets.
- [ ] Ship loss shows a flash; the replacement ship briefly resists enemy shots and body collisions, then becomes vulnerable again. The original lethal hit still loses one ship immediately.
- [ ] A readable wave banner appears between waves and clears before combat resumes.
- [ ] Banner freezes combat/energy, ignores fire/movement, and pauses/resumes its countdown with Esc. The first wave starts immediately.
- [ ] Simple synthesized effects work after user interaction; M mutes and unmutes them, with mute controls shown on screen.
- [ ] Start and restart play a short arcade jingle; firing, destruction, ship loss, wave, and bonus cues sound like stepped 8-bit effects without external assets.
- [ ] At 25% energy or below a beep repeats; it stops on wave refuel, ship loss, restart, and mute, and respects pause/resume without queued bursts.
- [ ] M immediately silences active sounds, ignores repeats, and preserves the mute choice through restart. Pause silences audio; unavailable audio does not block play.
- [ ] Restart clears explosions, flash/protection, banners, and active tones without adding another loop.
- [ ] Start/restart jingle is longer (about 2.24 seconds); mute indicator shares the bottom controls baseline. Lives are on the right with wave rightmost and no overlap at multi-digit waves.

## Temporary debugging
- [ ] F2 opens the wave menu and freezes movement, shots, energy, timers, and audio; numeric input does not trigger game controls.
- [ ] Next wave and selected-wave jump work, retaining score/ships and refilling energy with a clean armada, shots, and effects.
- [ ] Invalid targets are ignored; Close/F2/Esc restore the prior play/pause state without stuck keys, time jumps, or another loop.
- [ ] Re-run core gameplay checks after polish to ensure no regressions.
