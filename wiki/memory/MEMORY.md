# Project Memory

One durable fact per bullet — decisions, preferences, constraints, gotchas.
Newest at the bottom. Curate in place: update what changed, delete what is
wrong, merge duplicates, flag contradictions with ⚠️. Use ⛔ for hard
"never do this" rules. When this file passes ~200 lines, consolidate detail
into topic files in this folder and keep a one-line pointer here.
Detail pages: `<topic>.md` next to this file. Journal: `log.md` (append-only).
Never store secrets, API keys, or tokens here.

## Facts

- Task: Run this app. — Outcome: I'll start the app. Let me check if the dev server is already running on port 3000. The dev server is up on port 3000. Let me verify the app is rendering correctly. The app is running at http://localhost:3000/. **Status:** - Vite v8.2.2 dev server up (ready in 165 ms) - Bound to `0.0.0.0:3000` - HTML serving correctly — title is "Treasure Pop — Wonderlands Foundation" - Mount points: `#game-root` (Phaser canvas target), `#dev-harness` (player foundation harness), `#portrait-gate` (rotate-to-landscape notice) **Notes:** - First attempt failed because `--allowed-hosts` is not a CLI flag in Vite 8 (it's a config-only option). Restarted with `--host 0.0.0.0 --port 3000` and it's healthy now. - … #run-summary (fullstack-builder, 2026-09-09) <!-- productos-run:lnlah02eled6smvr1y488p5p -->
