# Health tracker variation - handoff brief

## The task

Build a VARIATION of the Clove health tracker as a new page (suggest `clove-home/goals2.html` + `goals2.css`, reusing `goals.js`), answering interview feedback from Anna at Clove. Keep the original `goals.html` untouched so both can be compared side by side. The prototype is a static site in `clove-home/`, no build step, served locally on :4174 and deployed to GitHub Pages at https://reginaldoke.github.io/Reg-Clove-Design-Challenge/ (pushing to main auto-deploys).

## The feedback (from Anna Guerrero, Clove)

1. "How could we make the concept of a primary goal clearer? In your example the primary goal is iron, but that's not easy to see with the other measurements like protein and energy being reflected."
2. "The dial graphic is functional, but would there be a way to make the health goals screen feel more on brand for Clove, which isn't inherently a diet app? Possibly with a pinch more illustration."

## Agreed design direction (from the ideation session)

The unifying reframe: **Clove measures progress in meals cooked, not milligrams.** The screen should read as a cooking plan, not a measurement dashboard.

- Headline the primary goal as a sentence, not a ring: "Your focus this week: Iron" with provenance underneath ("Added from your voice note") - this also showcases the memory system, the spine of the whole submission.
- Demote protein and energy to a quiet supporting row or chips ("Also keeping an eye on: Protein · Energy"), no rings, no percentages at rest. One number on screen = one goal.
- Progress as a story: "2 of 5 iron-rich dinners cooked" (the Home goal-card already uses this framing: "Iron at 38% · 3 dinners to go").
- Replace the dial with illustration. Two candidate metaphors:
  a. A WEEK OF PLATES: seven small drawn plates, each iron-rich dinner cooked fills one in (empty ones are light outlines). Precedent already in the app: `picker.js` `buildStepper` draws N plate elements (`.iw-plates .plate`, salad emoji plates that shrink as N grows).
  b. THE CLOVE FLOWER AS PROGRESS: the brand mark's petals fill in eggplant one per dinner (5 dinners = 5 petals). A ring technically, but Clove's own.
- Ingredient-forward, not nutrient-forward: show where the iron comes from (spinach, pepitas, lentils) as small illustrated items tied to planned meals. The boosters list in `goals.js` LIB already has this data.
- Soften the week chart: replace the line chart with day stamps (M T W T F S S, a small plate/thumbnail appears on days you cooked).
- The primary goal carries the green heart-sparkle goal identity used elsewhere (goal toast disc: linear-gradient(-90deg, #c9e08f, #1aab56 26.9%, #1aab56 49%, #d5ff73) + assets/icons/heart-sparkle-white.svg).

## Current tracker code (the page to vary)

All in `clove-home/`:

- **goals.html** (297 lines) - page markup + inline page script. Structure: `.gl-nav` back chevron; `.gl-title-row` (h1 "Health goals" + `#glEdit` 40px pencil disc that opens the goal sheet); `.pcard.gl-hero` (eyebrow "Health tracker" + concentric rings `#glHeroRings` + center `#glPct`/`#glLbl` "38% iron goal"); `#glPromo` empty state (unreachable, iron is auto-seeded); `#glRings` three ring cards (Iron 38% eggplant / Protein 69% kale / Energy 71% paprika); `#glWeek` This-week line chart (svg `#glChart`, drawWeek() in the inline script); `#glInsCta` grey "Browse iron-rich dinners" button (reveals boosters); `#glPlanWrap` pink `.ai-card` nudge ("Plan meals to hit your iron goal" -> plan.html?ask=1, or plan.html once clovePlanned) revealed late via shared `.ai-card--wait` -> `.ai-card--reveal` at 1500ms; `#glBoost` boosters list; `#glSheet` "What are you working on?" goal chooser sheet.
- **goals.css** (273 lines) - all gl-* styles + `.mem-toast--goal` green toast variant.
- **goals.js** (225 lines) - `CloveGoals` store + LIB + Home card. REUSE THIS, contract:
  - localStorage `cloveGoalsV1`: `{ ids: [], boosted: [], pinned: bool }`.
  - `LIB` = data for iron/protein/sugar/b12/weight/cholesterol/balanced: per-goal `rings` (label/now/goal/pct/tone), `insight` (title/body/cta), `boosters` (name/img/per/pct, photos in `assets/img/goals/`).
  - API used by other pages: `CloveGoals.has(id)`, `.add(id)`, `.primary()`, `.pinned()`, `.mountHome()` (renders the Home goal-card into `#goalPinSlot` on index.html).
  - Ring colours are brand tokens: eggplant-300 (focus), kale-300, paprika-300.
- goals.html ALWAYS seeds iron before render (`if (!G.primary()) G.add("iron")`) so the tracker is never empty.

## Entry points that lead here (wire the variation the same way or deep-link it)

- Voice take goal toast Edit button -> `goals.html` (voice.js line ~461).
- Home goal-card (`#goalPinSlot` on index.html, rendered by `CloveGoals.mountHome()`).
- Profile "Health goals" card (`#goalsCard`).
- Recipe/plan pink nudges relate to the goal but link to plan, not the tracker.
- Presenter panel: K keycap = "Health tracker" -> goals.html (app.js KEYS + a k/K keydown handler); the SCREENS matcher for `p === "goals.html"` highlights the K block with points "Track your iron across the week" / "Scroll down and tap the pink nudge to plan meals". If the variation lives at goals2.html, add a SCREENS matcher for it (and optionally point K at it).
- Arrow-key FLOW in app.js includes goals.html as the step after the voice take.

## Design system context (base.css and shared patterns)

- Tokens in base.css: kale/eggplant/paprika families (e.g. --eggplant-300 #bd53ea, --kale-300 #1aab56 in checkout specials, kale-500 dark green). Fonts: Acaraje (Regular/Medium/SemiBold otf in assets/fonts, with unicode-range fallbacks). Body background #111 dark stage, content inside `.phone` (402px).
- HARD RULES: NO EM DASHES in any app copy. Buttery minimal animations (spring cubic-bezier(0.22, 1, 0.36, 1), things rise/fade in staggered). Match existing Clove patterns rather than inventing new ones.
- Every page MUST include `frame.js` in <head> right after base.css (presenter rounded-corners + front-door redirect) and `app.js` + `memory.js` before page scripts (presenter panel, hotkeys, toasts).
- Pink AI nudge = `.ai-card` (memory.css): eggplant-100 pill, 30px flat eggplant-300 clove disc (`.ai-card__clove`, white clove mark + sparkle), 12px eggplant-500 SemiBold title + Light sub. Entrance = `.ai-card--wait` then `.ai-card--reveal`.
- Illustrated plates precedent: picker.js buildStepper (`.iw-plates .plate`), styles in picker.css.
- Goal toast variant: `.mem-toast--goal` (goals.css), pinned until tapped.
- The clove flower mark assets: assets/icons/clove-white.svg, clove-kale.svg, clove-sparkle.svg, heart-sparkle-white.svg.

## Working practices for the session

- Serve: ruby serve.rb (in the session scratchpad) on :4174, or any static server from clove-home/. Verify every change in the browser (DOM probes are more reliable than pane screenshots).
- Deploy: from the project root, `git add -A && git commit && git push` - GitHub Pages workflow redeploys clove-home/ in ~20s.
- The persistent design/implementation notes live at `~/.claude/projects/-Users-homecomputer-Documents-Clove-ideas/memory/clove-home-implementation.md` - read them first, update them after changes.
