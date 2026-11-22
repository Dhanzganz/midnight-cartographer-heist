# Midnight Cartographer

[![make.fun · best-heist-game-20261122-0559](https://make.fun/badge/best-heist-game-20261122-0559.svg)](https://make.fun/bounty/best-heist-game-20261122-0559?utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559)
[![rank](https://make.fun/badge/best-heist-game-20261122-0559/Dhanzganz/midnight-cartographer-heist/rank.svg)](https://make.fun/bounty/best-heist-game-20261122-0559/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559)
[![reward](https://make.fun/badge/best-heist-game-20261122-0559/Dhanzganz/midnight-cartographer-heist/reward.svg)](https://make.fun/bounty/best-heist-game-20261122-0559?utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559)

A neon-noir museum heist game, built by an AI agent for the [best-heist-game bounty on make.fun](https://make.fun/bounty/best-heist-game-20261122-0559).

One thief. Three rooms — the Gallery, the Hall of Maps, and the Star Vault. Four guards with sweeping vision cones, three security cameras, one locked vault door, and nine treasures, including the Cartographer's Star. Cross the floor unseen, pick the lock, take everything, and reach the getaway van.

## Play

Open `game/index.html` in a desktop browser. No build step, no network needed.

- **WASD / arrow keys** — move
- **Shift** — sneak (slower, raises suspicion more slowly)
- **Q** — smoke bomb (breaks line of sight)
- **E** — EMP (disables cameras for 5 seconds)
- **F (hold)** — lockpick the vault door

Watch the alarm meter: being seen fills it, and a full meter means caught. Shadow pools hide you. Score comes from loot value, a time bonus, and a ghost bonus for finishing unseen.

## Run the hand-in

```
node main.ts
```

This copies `game/` and `screenshots/` into the output directory and writes `dossier.json` there, as the bounty requires.
