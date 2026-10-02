# Space Attack

A compact retro fixed shooter inspired by Galaxian and the 1982 Emerson Arcadia 2001 game Space Attack. Move sideways, shoot diving enemies, and survive increasingly difficult waves.

[Play online](https://space-attack.bozgur.chatgpt.site) or open `index.html` directly in a desktop browser. No installation, server, or build step needed.

## Controls

| Key | Action |
| --- | --- |
| ← / → or A / D | Move |
| Space | Fire |
| Enter | Start or restart |
| Esc | Pause or resume |
| M | Toggle sound |
| F2 | Temporary wave-skip debug menu |

## Gameplay

Start with three ships and fire one shot at a time. Moving and firing consume energy; enemy shots and collisions destroy your ship. Completing a wave refills energy. Earn a bonus ship at 5,000 points, and keep your best score with localStorage when available.

## Project

Built with plain HTML, Canvas 2D, and vanilla JavaScript. Original pixel sprites are drawn in code, and arcade sounds are synthesized with Web Audio. Gameplay tuning lives in the `CONFIG` block in `game.js`.

- [DESIGN.md](DESIGN.md): mechanics and visual direction.
- [PLAYTEST.md](PLAYTEST.md): manual checks.
- [VERIFICATION.md](VERIFICATION.md): tested behavior and remaining checks.
- [AGENTS.md](AGENTS.md): development rules.
- [PROMPT_LOG.md](PROMPT_LOG.md): requests, outcomes, and reflections.
