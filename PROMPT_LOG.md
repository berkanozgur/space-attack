# Prompt log

## Prompt 1 - time: 2026-10-02 08:18:11 UTC (11:18:11 Europe/Istanbul)

```text
Start a new project, space-attack. You are in an empty folder with that name; work only inside it. 
 
Let's start with four md docs. Docs only in this step, no game code yet. When you are done, give me a short summary and ask only questions that would change the design, then wait. 
 
* AGENTS.md: tech stack, file layout, how to run the game, and the standing rules below. Keep it short enough to navigate and plan from. 
* DESIGN.md: what the game is, the mechanics, the game states (start, play, game over, restart), the HUD, and the art style, so the look stays consistent. 
* PLAYTEST.md: a checklist I will run by hand, built from the requirements below. 
* PROMPT_LOG.md: every prompt I give you, appended on every turn, starting with this one. Structured like: 
   * Prompt 1 - time: the prompt pasted word for word, not summarised. Take the time from the system clock. 
   * Outcome: 1-2 sentences max on what that prompt produced. 
   * Reflections: leave empty, only I fill this in. 
 
Standing rules (put these in AGENTS.md): 
* Update PROMPT_LOG.md on every turn without being asked. 
* Plain HTML, Canvas 2D and vanilla JavaScript. No build step, no dependencies, no asset files. Sprites are drawn in code, sounds are synthesized. 
* The game runs by opening index.html directly, so no JS modules. 
* Fixed logical resolution scaled to fit the window. Time-based movement with a capped time step. 
* All tuning numbers in one config block. 
* Do not add features I did not ask for. 
 
Requirements (all must pass): 
* Runs in a desktop browser. 
* Keyboard movement and firing, with the controls shown on screen. 
* Enemy waves. 
* Working collisions. 
* Score always visible. 
* Health and lives always visible. 
* Difficulty increases as the game goes on. 
* Start screen, game over screen, and restart. 
* Small and polished. Keep the scope tight. 
 
Game description: 
Space Attack is a fixed shooter in the style of Galaxian, inspired by the 1982 Emerson Arcadia 2001 game of the same name. 
 
* The player ship sits at the bottom and moves left and right only. Arrow keys or A/D move, Space fires, Enter starts and restarts. 
* One player shot on screen at a time. 
* The enemy armada sits at the top in rows: yellow flagships on top, then red and green rows. The formation sways side to side. 
* Single enemies peel off, dive at the player while firing, and return to the formation if they survive. 
* Player shots destroy enemies. Divers are worth more than enemies in formation, flagships most. 
* The ship has an energy bar. Enemy shots and collisions drain it. When it is empty the ship is lost and the bar refills. 
* The player starts with 3 ships. No ships left means game over. A bonus ship is awarded at 5,000 points. 
* Clearing the armada starts the next wave: the formation moves faster, enemies dive more often and fire more. 
* HUD: score top left, high score top right, energy bar marked "E" bottom left, reserve ships and wave number bottom right. 
* Start screen shows the title and the controls. Game over shows the final score and how to restart. 
 
Art style: 
Chunky retro pixel sprites on a black background with a sparse starfield. Limited bright palette: yellow, red, green, cyan, white. Blocky score digits. Original sprites in that spirit, not copies. A reference image is included.
 
Polish, only after every requirement passes: explosions, a flash and brief invulnerability when hit, a wave banner between waves, simple sound effects with M to mute.
```

Attachment: reference image supplied with this prompt (`codex-clipboard-43a05dbc-ca52-46a4-af8a-b46282f6d0b7.png`); not copied into the project.

**Outcome:** Created the four requested Markdown documents covering standing rules, game design, manual acceptance checks, and this verbatim prompt log. No game code was added.

**Reflections:** I have spent 15 minutes to craft and polish the first prompt to make a good foundation. I have decided to start with documents so I can review that they could jumpstart the project correctly.

## Prompt 2 - time: 2026-10-02 08:47:42 UTC (11:47:42 Europe/Istanbul)

```text
- Use local storage for high score and fall back to page-session high score if not available.



DESIGN.md Rework: "Enemy shots and enemy-body collisions drain the player's energy. At zero energy, one ship is lost; if any ships remain, restore full energy and resume with a replacement ship." Notes: Energy drained through horizontal movement and shots. Ship is dead on collision and shot. Other statements are correct.\
```

**Outcome:** Updated the design and manual checks for movement/firing energy costs, lethal enemy hits and collisions, and localStorage high score persistence with a page-session fallback. Clarified replacement-ship invulnerability for the later polish phase; no game code was added.

**Reflections:** I left out a gap in the explanation and codex misinterpreted energy mechanic. I reviewed every doc created for 5 mins and provided feedback on changes.

## Prompt 3 - time: 2026-10-02 08:54:25 UTC (11:54:25 Europe/Istanbul)

```text
Docs are approved. Now build the game as described in DESIGN.md, following AGENTS.md.

Scope for this step: every item under Requirements, fully working. Nothing from the polish list yet (no explosions, sounds, wave banner or hit flash). The high score is in scope.

What I expect to be able to do when you finish:
* Open index.html and see the start screen with the title and controls.
* Press Enter and play: move, fire, destroy enemies, get hit by shots and divers.
* See score, high score, energy bar, reserve ships and wave number at all times.
* Clear the armada and get a harder next wave.
* Lose all ships, see game over with my final score, press Enter and start again with everything reset.

Pay attention to these, they are the usual bugs:
* Restart must not leave a second game loop running or keep old enemies, shots or timers.
* One hit must cost energy once, not on every frame of the overlap.
* Arrow keys and Space must not scroll the page.
* Keys must not stay stuck if the window loses focus.
* Shots and enemies that leave the screen must be removed.

When done:
* Check the JavaScript for syntax errors if you have a way to.
* Tell me which files you created and how to run it.
* List which PLAYTEST.md items you could not verify yourself. Do not say something works unless you checked it.
* Update PROMPT_LOG.md.
```

**Outcome:** Implemented the core game without polish, added deterministic checks and a direct-file Edge smoke test, and documented verification limits. Syntax and simulation checks passed; start/play/resized browser screenshots were reviewed, while full manual gameplay and browser-session persistence remain to be verified.

**Reflections:** 

## Prompt 5 - time: 2026-10-02 09:30:45 UTC (12:30:45 Europe/Istanbul)

```text
I will provide instructions for you to follow and make appropriate additions and revisions in DESIGN.md.

&#x20; and Build the reworks.

My test notes:

- Enemy bullets should be fired straight down, not following the user's ship.
- Enemy bullets should be white providing more contrast with the level.
- Enemy ships should move diagonally (consider up is N, it should move either south east or southwest).
- Enemy ships diagonal movement have a lower limit (approximately 4-5 ship lenght) so it moves on a diagonal direction at least a fixed amount of length or time.
- Enemy ships try to encounter the player vertically so they can shoot the player. Their diagonal movements are influenced by players horizontal position.
- Enemies shoot consistently but they can only have 1 bullet active on any time. If a bullet reaches bottom it gets destroyed. Meaning enemy will shoot again. Their shoot frequency increases naturally when they come closer to bottom.
- Enemies that player avoid and reach bottom will be eliminated without giving player score.
- Enemy clusters should be a bit more compacted together.
- ESC may pause the game
```

**Outcome:** Built the revised dives, white straight-down bullets with one active bullet per enemy, zero-score bottom exits, compact formation, and Esc pause/resume, and synchronized design and playtest documents. Syntax, simulation, and direct-file Edge checks passed; revised screens were visually reviewed, with full natural playtesting still outstanding.

**Reflections:** I tested the game for a couple of minutes and give feedback. Most of the changes are caused by agent's own interpretation of mechanics that I left out. Enemy behavior etc. 

## Prompt 6 - time: 2026-10-02 09:48:03 UTC (12:48:03 Europe/Istanbul)

```text
I will additional provide instructions for you to follow and make appropriate additions and revisions in DESIGN.md. Then Build the reworks.



- Score, High Score, Reserve and Wave labels should be removed to keep retro simplicity of the game.
- Everything moves in whole logical pixels per tick: the ship, shots, divers and the formation. No fractional positions when drawing.
- The formation should shift in discrete steps, not glide.
```

**Outcome:** Removed score/high-score/reserve/wave labels while preserving digits and icons, introduced fixed simulation ticks with integer entity positions, and replaced formation glide with discrete four-pixel steps. Updated design and checks; syntax, simulation, and Edge smoke tests passed, and the simplified HUD was visually reviewed.

**Reflections:** I wanted to preserce retro simplicity and looks so I gave a bit of feedback on interface and movement

## Prompt 7 - time: 2026-10-02 09:57:35 UTC (12:57:35 Europe/Istanbul)

```text
- Cluster should move 2x slower rate.

You can move onto the polish phase.
```

**Outcome:** Halved formation stepping frequency and added the approved pixel explosions, ship-loss flash/replacement protection, wave banners, and synthesized sounds with M to mute. Syntax, core/polish simulations, and Edge audio/input checks passed; controlled polish screens were reviewed, while natural pacing and perceived sound quality remain manual checks.

**Reflections:**

## Prompt 8 - time: 2026-10-02 10:15:38 UTC (13:15:38 Europe/Istanbul)

```text
- Finishing a wave refuels energy to full.
- Lets revamp enemy counts. Enemy cluster should have these numebrs:
  - 2 yellow
  - 5 red
  - 7 green
  - 9 red
  - 9 red&#x20;
  - 9 red
- With accordance to this, they should be a bit more compact and closer to the top, without overlapping it with UI decrease the margins.



- Low "e" needs a looping Beeping sound.
- Start game jingle.
- Find a bit more 8 bit arcade--like sound effects.
```

**Outcome:** Added full-energy wave refills, the compact raised six-row/41-enemy armada, a repeating low-energy warning, a start/restart jingle, and stepped arcade-style synthesized effects. Simulation and browser/audio checks passed and formation layout was visually reviewed; perceived sound quality remains a manual listening check.

**Reflections:** I revieved sound effects and cross referenced with the game in shared video. Shared my findings with codex.

## Prompt 9 - time: 2026-10-02 10:30:52 UTC (13:30:52 Europe/Istanbul)

```text
Design instructions

- Find a longer game-start jingle
- Align mute indicator to bottom with other instructions.&#x20;
- Align wave counter and ships (lives) to the left without overlapping them.



Difficulty revamp

- In first wave every 1.5 seconds a ship activates.
- Every 5 waves activated ship count is increased by one. (e.g After 5th wave 2 ships activate instead of 1)
- Increase overall energy consumption by %20



Create a temporary debug menu for me to skip waves.
```

**Outcome:** Lengthened the jingle, realigned HUD indicators, increased energy costs by 20%, and implemented 1.5-second initial activation with larger batches every five waves. Added the temporary F2 wave-skip menu and updated documentation; simulation and Edge checks passed, while jingle quality and difficulty pacing remain manual checks.

**Reflections:** I felt like the game was a bit easy and I couldn't give challenge good. I provided some feedback based on what I understand from the video.

## Prompt 10 - time: 2026-10-02 10:44:05 UTC (13:44:05 Europe/Istanbul)

```text
- I told you the wrong side. Align wave counter and ships (lives) to the right without overlapping them. Wave counter should be rightmost.
- Activated ships should blink to indicate active status better.
- Ship activation timer drops from 1.5s to 1 through 5 levels. After ship count increased. Set a parameter for maximum active ships at a time and increase it moderately throughout levels. from 1-10 let it be 2 and increase it.
```

**Outcome:** Right-aligned lives with wave rightmost, added white/original-color blinking for divers, and implemented repeating five-wave activation ramps plus a configurable simultaneous-active cap growing from 2 by one every ten waves up to 8. Updated design/checks; syntax, simulation, and Edge checks passed, with blink readability and difficulty pacing left for manual review.

**Reflections:**

## Prompt 11 - time: 2026-10-02 10:49:06 UTC (13:49:06 Europe/Istanbul)

```text
Host the project in codex sites and give a sharable link to me.
```

**Outcome:** Registered Space Attack with Sites, configured a static deployment containing only the three game files, and enabled public-link access. Publication proceeds through the Sites workflow, with the verified deployment result reported in chat.

**Reflections:**
