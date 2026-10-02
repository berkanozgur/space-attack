# Space Attack — working guide

## Stack and run
Plain HTML, Canvas 2D, and vanilla JavaScript. Open `index.html` directly in a desktop browser; no server or build command is required. No JavaScript modules, dependencies, or asset files. Draw original sprites in code and synthesize sounds.

## File layout
- `AGENTS.md`: standing rules and implementation guide.
- `DESIGN.md`: gameplay, states, HUD, and visual direction.
- `PLAYTEST.md`: manual acceptance checklist.
- `PROMPT_LOG.md`: verbatim user prompts, outcomes, and user-owned reflections.
- `index.html`, `style.css`, and `game.js`: entry point, responsive layout, and game logic. Tuning lives in `CONFIG` in `game.js`.
- `game.test.cjs` and `browser.test.cjs`: optional developer checks, never loaded by the game. Run simulation checks with `node game.test.cjs`; browser checks need a separately available Playwright package and Edge.
- `VERIFICATION.md`: verification evidence and remaining manual checks. Test screenshots are review artifacts, never runtime assets.

## Standing rules
- Sites publishing: identity/static configuration is in `.openai/hosting.json`. Refresh `dist` from root `index.html`, `style.css`, and `game.js` before publishing; only these runtime files are hosted. Keep archives in ignored `.sites-runtime`.
- Work only inside this project folder.
- Update `PROMPT_LOG.md` on every turn without being asked. Append every user prompt verbatim with the system-clock time, a 1–2 sentence outcome, and an empty Reflections field. Only the user fills in reflections.
- Use plain HTML, Canvas 2D, and vanilla JavaScript. No build step, dependencies, or asset files. Sprites are drawn in code; sounds are synthesized.
- Run by opening `index.html` directly; do not use JS modules.
- Use a fixed logical resolution scaled to fit the window, preserving aspect ratio, and time-based movement with a capped time step.
- Keep all tuning numbers in one config block.
- Do not add features the user did not ask for.
- Keep the game small and polished. Implement and pass every core requirement before adding the requested polish.
- Keep design decisions and manual checks consistent with `DESIGN.md` and `PLAYTEST.md`.

