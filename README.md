# Reg's Clove Design Challenge

A recording-ready prototype of Clove's first mile: save a recipe from TikTok, watch Clove build memories, set a health goal by voice, plan the week, shop it in store, and close the loop with leftovers.

## Live prototype

The prototype is published with GitHub Pages. Open it here (lands on the TikTok step with the presenter controls open):

**https://reginaldoke.github.io/Reg-Clove-Design-Challenge/tiktok.html?start=1**

## What's in this repo

- `clove-home/` - the prototype itself. Plain HTML/CSS/JS, no build step.
- `flow-screenshots/` - every step of the flow as numbered 3x screenshots.
- `exports/` - icon exports.
- `.github/workflows/pages.yml` - deploys `clove-home/` to GitHub Pages on every push to `main`.

## Running locally

Serve `clove-home/` with any static server, for example:

```
cd clove-home
python3 -m http.server 4174
```

Then open http://localhost:4174/tiktok.html?start=1

## Presenter controls

- The panel on the right jumps to any section: T TikTok save, R Recipe, V Voice note, K Health tracker, P Plan the week, G Groceries, H Home.
- Arrow keys step through the whole flow in recording order; the last step's right arrow lands back on Home.
- 0 resets all state. Keys 1/2/3 play looping feature teasers.
