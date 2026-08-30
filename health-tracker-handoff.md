# Health tracker iterations - session handoff

Read this first, then continue taking design feedback from Reg on the three
health-tracker concepts. The deep implementation notes live in the persistent
memory file (`clove-home-implementation.md`, auto-loaded in this project
folder) - the sections from "HEALTH-TRACKER ITERATIONS repo" onward are the
authority on how everything works. This file is the quick orientation.

## What this is

A shareable prototype deck of THREE live concepts for the Clove health-goals
screen, built for feedback from Anna at Clove. It is a standalone static site:

- Folder: `health-tracker-iterations/` (own git repo, ignored by the parent repo)
- GitHub: https://github.com/ReginaldOke/Clove-health-tracker-iterations (main)
- LIVE: https://reginaldoke.github.io/Clove-health-tracker-iterations/ (Pages,
  legacy build from main root; a push redeploys in ~40s)
- It was extracted from the main prototype in `clove-home/` (which has its own
  older goals2/goals3 pages - DIVERGED, do not sync them).

## The three concepts (all fully interactive, shared state)

- `concept-1.html` (A) - carousel of illustrated plates (steak/egg/salad from
  Reg's Figma) wearing progress rings ON the plate lip; active plate scales up.
- `concept-2.html` (B) - "clean plate" dial: % in the plate's well, cutlery
  either side (glows + tips lean in per goal), week line chart, meal cards.
- `concept-3.html` (C) - "Day by day": Apple-Health-style bar week in light
  Clove style. ONE shared week of meal images; per-goal values/highlights;
  emoji + stepper goal switcher; added meals fill Sunday then Wednesday.
- `index.html` - the deck shell: full-bleed phones, A/B/C letter legend
  bottom-left, subtle end-clamped chevrons (replay target's animations on
  switch), vertical deck + "Next prototype" label on mobile.

Shared plumbing: `tracker.js` (META/state/modal/sheets/week chart/ask flow/
meal actions sheet/swipe helper), `plates.js` (lip rings + plate art),
`concepts.css` (all concept styling on top of copied clove css), `app-lite.js`,
patched `memory.js`. Goals: Iron 🥩 eggplant, Protein 🍳 paprika, Fibre 🥗 kale
(remapped from goals.js Energy); ask-bar/heart adds B12 then Cholesterol.

## Working practices

- Serve locally: ruby server in the session scratchpad on :4175 (see memory;
  pattern: write serve script into scratchpad, `nohup ruby ... &`, launch.json
  "iterations" entry is attach-only; python/launch-spawned servers FAIL here).
- Verify EVERY change in the browser pane via DOM probes + screenshots before
  pushing (pane gotchas: stale frames, rAF stalls - trust DOM state).
- Reset demo state between tests: remove localStorage `cloveGoals2V3` +
  `cloveGoals2Extra`, clear sessionStorage.
- Deploy: `git add -A && git commit && git push` from the folder, then poll
  the live URL for the new content (ruby Net::HTTP loop with sleep 8).
- CACHE-BUST: all css/js refs in concept-1/2/3.html carry `?v=<stamp>`
  (currently 20260827a). If a deploy touches ANY css or js, bump the stamp
  in all three files first - stale CDN/browser JS against new HTML once
  broke the whole live deck ("T.emojiFor is not a function" -> blank pages).
- Update the memory file after changes. NO EM DASHES in app copy. Match Clove
  patterns (tokens in base.css, Acaraje font - slash and some glyphs broken,
  write "3 of 5" style or use the count element patterns already there).
- Editing: python heredoc patches with `assert old in s` - and verify file
  size after (one bad script zeroed concept-3.html; restore via git).

## Status

All feedback to date is implemented, verified, pushed and live. No open tasks.
The user reviews the live site or localhost:4175 and sends screenshots with
short notes; respond by implementing, verifying in-browser, pushing, and
confirming the Pages rebuild.
