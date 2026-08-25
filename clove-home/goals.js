/* Clove health goals: a small library of goals (from the "Set health goals"
   design), a localStorage store, ring renderers, and the cards that sit on
   the profile and (when pinned) the homepage. Loaded on recipe, profile,
   index and goals pages. */
(function () {
  var KEY = "cloveGoalsV1";

  var LIB = {
    iron: {
      id: "iron", emoji: "🩸", label: "Iron levels", sub: "Deficiency, fatigue",
      color: "var(--eggplant-300)", track: "var(--eggplant-100)", headline: "Let’s get your iron up.",
      heroShort: "iron goal", toast: "Health goal: More iron",
      rings: [
        { label: "Iron", now: "6.8mg", goal: "18mg", pct: 0.38, color: "var(--eggplant-300)", track: "var(--eggplant-100)", unit: "mg", nowN: 6.8, goalN: 18 },
        { label: "Protein", now: "52g", goal: "75g", pct: 0.69, color: "var(--kale-300)", track: "var(--kale-100)" },
        { label: "Energy", now: "6,200kJ", goal: "8,700kJ", pct: 0.71, color: "var(--paprika-300)", track: "var(--paprika-100)" },
      ],
      boosted: { now: "15.2mg", pct: 0.84, nowN: 15.2 },
      targets: [
        { label: "Iron", target: "18mg", why: "Daily target for menstruating adults", color: "var(--eggplant-300)" },
        { label: "Vitamin C", target: "90mg", why: "Paired with plant iron to boost absorption", color: "var(--paprika-300)" },
        { label: "Protein", target: "75g", why: "Unchanged, you are already close", color: "var(--kale-300)" },
      ],
      insight: {
        h: "Your last 3 dinners averaged 4.1mg of iron.",
        b: "That is about a quarter of a day’s target each time. Four dinners tonight would close most of the gap.",
        cta: "Show me iron-rich dinners →",
        done: "Iron ring nearly closed. Keep it up tonight.",
      },
      boostTitle: "Iron boosters",
      items: [
        { title: "Short rib in red wine", img: "short-ribs.webp", time: "3 hrs", gain: "+8.4mg iron", pct: 0.75, why: "Beef is heme iron, you absorb roughly three times more of it than the plant kind." },
        { title: "Sunday beef stew", img: "beef-stew.webp", time: "2 hrs 30", gain: "+7.6mg iron", pct: 0.68, why: "Slow-cooked beef with tomato: the acid helps pull iron out of the pot." },
        { title: "Braised greens & lemon", img: "greens.webp", time: "40 mins", gain: "+5.2mg iron", pct: 0.46, why: "The lemon is not a garnish here, vitamin C roughly doubles plant-iron absorption." },
        { title: "Beans in olive oil", img: "white-beans.webp", time: "20 mins", gain: "+4.8mg iron", pct: 0.43, why: "Cheapest iron in the pantry. Skip the tea afterwards, tannins block it." },
      ],
    },
    protein: {
      id: "protein", emoji: "💪", label: "More protein", sub: "Build and keep muscle",
      color: "var(--kale-300)", track: "var(--kale-100)", headline: "Let’s get you to 130g.",
      heroShort: "protein goal", toast: "Health goal: More protein",
      rings: [
        { label: "Protein", now: "52g", goal: "130g", pct: 0.4, color: "var(--kale-300)", track: "var(--kale-100)", unit: "g", nowN: 52, goalN: 130 },
        { label: "Energy", now: "6,200kJ", goal: "8,700kJ", pct: 0.71, color: "var(--paprika-300)", track: "var(--paprika-100)" },
        { label: "Iron", now: "6.8mg", goal: "18mg", pct: 0.38, color: "var(--eggplant-300)", track: "var(--eggplant-100)" },
      ],
      boosted: { now: "104g", pct: 0.8, nowN: 104 },
      insight: {
        h: "Your dinners average 22g of protein.",
        b: "Dinner is the easiest place to add 30g. Two swaps a week would get you most of the way.",
        cta: "Show me high-protein dinners →",
        done: "Protein ring well on its way.",
      },
      boostTitle: "Protein boosters",
      items: [
        { title: "Short rib in red wine", img: "short-ribs.webp", time: "3 hrs", gain: "+38g protein", pct: 0.29, why: "Slow-cooked beef, a full serve of protein in one pot." },
        { title: "Sunday beef stew", img: "beef-stew.webp", time: "2 hrs 30", gain: "+34g protein", pct: 0.26, why: "Beef and beans together, two protein sources in one bowl." },
        { title: "Beans in olive oil", img: "white-beans.webp", time: "20 mins", gain: "+18g protein", pct: 0.14, why: "Cheap plant protein, pair with the sourdough." },
      ],
    },
    sugar: { id: "sugar", emoji: "🩺", label: "Blood sugar", sub: "Steadier energy", color: "var(--paprika-300)", track: "var(--paprika-100)", heroShort: "fibre goal", toast: "Health goal: Steadier blood sugar",
      rings: [{ label: "Fibre", now: "14g", goal: "30g", pct: 0.47, color: "var(--paprika-300)", track: "var(--paprika-100)" }, { label: "Protein", now: "52g", goal: "75g", pct: 0.69, color: "var(--kale-300)", track: "var(--kale-100)" }, { label: "Energy", now: "6,200kJ", goal: "8,700kJ", pct: 0.71, color: "var(--paprika-300)", track: "var(--paprika-100)" }],
      boosted: { now: "26g", pct: 0.87 }, insight: { h: "Your dinners lean on refined carbs.", b: "Swapping white rice for lentils twice a week would steady the 3pm crash.", cta: "Show me steadier dinners →", done: "Fibre ring nearly closed." }, boostTitle: "Steadier dinners", items: [] },
    b12: { id: "b12", emoji: "🥚", label: "B12 levels", sub: "Energy, focus, vegan diets", color: "var(--paprika-300)", track: "var(--paprika-100)", heroShort: "B12 goal", toast: "Health goal: More B12",
      rings: [{ label: "B12", now: "1.1µg", goal: "2.4µg", pct: 0.46, color: "var(--paprika-300)", track: "var(--paprika-100)" }, { label: "Iron", now: "6.8mg", goal: "18mg", pct: 0.38, color: "var(--eggplant-300)", track: "var(--eggplant-100)" }, { label: "Energy", now: "6,200kJ", goal: "8,700kJ", pct: 0.71, color: "var(--kale-300)", track: "var(--kale-100)" }],
      boosted: { now: "2.1µg", pct: 0.88 }, insight: { h: "Most of your B12 comes from one meal a week.", b: "Fortified soy milk and nutritional yeast at dinner would spread it out.", cta: "Show me B12-rich dinners →", done: "B12 ring nearly closed." }, boostTitle: "B12 boosters", items: [] },
    weight: { id: "weight", emoji: "⚖️", label: "Weight loss", sub: "Fuller on fewer calories", color: "var(--kale-300)", track: "var(--kale-100)", heroShort: "energy goal", toast: "Health goal: Fuller on fewer calories",
      rings: [{ label: "Energy", now: "6,200kJ", goal: "7,200kJ", pct: 0.86, color: "var(--kale-300)", track: "var(--kale-100)" }, { label: "Protein", now: "52g", goal: "90g", pct: 0.58, color: "var(--eggplant-300)", track: "var(--eggplant-100)" }, { label: "Fibre", now: "14g", goal: "30g", pct: 0.47, color: "var(--paprika-300)", track: "var(--paprika-100)" }],
      boosted: { now: "6,900kJ", pct: 0.96 }, insight: { h: "You get hungry an hour after dinner.", b: "More protein and fibre at dinner keeps you full without adding much energy.", cta: "Show me filling dinners →", done: "Right on target tonight." }, boostTitle: "Filling dinners", items: [] },
    cholesterol: { id: "cholesterol", emoji: "🫀", label: "Cholesterol", sub: "Lower LDL, more fibre", color: "var(--paprika-300)", track: "var(--paprika-100)", heroShort: "fibre goal", toast: "Health goal: Lower cholesterol",
      rings: [{ label: "Fibre", now: "14g", goal: "30g", pct: 0.47, color: "var(--paprika-300)", track: "var(--paprika-100)" }, { label: "Sat. fat", now: "18g", goal: "20g", pct: 0.9, color: "var(--paprika-300)", track: "var(--paprika-100)" }, { label: "Energy", now: "6,200kJ", goal: "8,700kJ", pct: 0.71, color: "var(--kale-300)", track: "var(--kale-100)" }],
      boosted: { now: "27g", pct: 0.9 }, insight: { h: "Oats and legumes are doing the heavy lifting.", b: "Two more bean dinners a week would move the LDL needle.", cta: "Show me heart-friendly dinners →", done: "Fibre ring nearly closed." }, boostTitle: "Heart-friendly dinners", items: [] },
    balanced: { id: "balanced", emoji: "🌱", label: "Just eat better", sub: "Balanced, no rules", color: "var(--paprika-300)", track: "var(--paprika-100)", heroShort: "veg goal", toast: "Health goal: Just eat better",
      rings: [{ label: "Veg serves", now: "3", goal: "5", pct: 0.6, color: "var(--paprika-300)", track: "var(--paprika-100)" }, { label: "Protein", now: "52g", goal: "75g", pct: 0.69, color: "var(--kale-300)", track: "var(--kale-100)" }, { label: "Energy", now: "6,200kJ", goal: "8,700kJ", pct: 0.71, color: "var(--eggplant-300)", track: "var(--eggplant-100)" }],
      boosted: { now: "5", pct: 1 }, insight: { h: "Less beige, more green.", b: "One extra veg at dinner gets you to five most days.", cta: "Show me greener dinners →", done: "Five serves, done." }, boostTitle: "Greener dinners", items: [] },
  };
  var ORDER = ["iron", "protein", "sugar", "b12", "weight", "cholesterol", "balanced"];

  function load() {
    try { return JSON.parse(localStorage.getItem(KEY) || "{}"); } catch (e) { return {}; }
  }
  function save(st) { localStorage.setItem(KEY, JSON.stringify(st)); }

  var CloveGoals = {
    LIB: LIB,
    OPTIONS: ORDER.map(function (k) { return LIB[k]; }),
    ids: function () { return load().ids || []; },
    all: function () { return this.ids().map(function (id) { return LIB[id]; }).filter(Boolean); },
    has: function (id) { return this.ids().indexOf(id) > -1; },
    add: function (id) {
      var st = load(); st.ids = st.ids || [];
      if (st.ids.indexOf(id) === -1) st.ids.push(id);
      save(st);
    },
    remove: function (id) {
      var st = load(); st.ids = (st.ids || []).filter(function (x) { return x !== id; }); save(st);
    },
    primary: function () { return this.all()[0] || null; },
    boosted: function () { return !!load().boosted; },
    boostedItem: function () { var st = load(); return st.boosted ? (st.boostedItem == null ? 0 : st.boostedItem) : -1; },
    boost: function (itemIndex) { var st = load(); st.boosted = true; st.boostedItem = itemIndex == null ? 0 : itemIndex; save(st); },
    pinned: function () { return load().pinned !== false; }, // pinned to Home by default
    setPinned: function (b) { var st = load(); st.pinned = !!b; save(st); },
    /* rings shown for the current goal set: the primary goal's rings, with
       any extra goal's focus ring swapped into the last slot */
    rings: function () {
      var goals = this.all();
      if (!goals.length) return [];
      var rings = goals[0].rings.map(function (r) { return Object.assign({}, r); });
      goals.slice(1).forEach(function (g, i) {
        var r = Object.assign({}, g.rings[0]);
        if (rings.some(function (x) { return x.label === r.label; })) return;
        rings[Math.min(rings.length - 1, 2)] = r;
      });
      if (this.boosted()) {
        var b = goals[0].boosted;
        rings[0] = Object.assign({}, rings[0], { now: b.now, pct: b.pct, nowN: b.nowN || rings[0].nowN });
      }
      return rings;
    },
    /* concentric rings SVG. radii shrink per ring; returns markup */
    /* brand gradients for the arcs (same families as the pro/memory gradients) */
    GRADS: {
      "var(--eggplant-300)": ["#e1c3ff", "#bd53ea", "#8f3ecb"],
      "var(--kale-300)": ["#d5ff73", "#1aab56", "#0f7a3c"],
      "var(--paprika-300)": ["#ffd98a", "#f79310", "#d9730a"],
    },
    _gid: 0,
    ringsSVG: function (rings, size, stroke, trackColor, animateIn) {
      var self = this;
      var r0 = size / 2 - stroke / 2 - 1;
      var step = stroke + 3;
      var defs = "";
      var out = '<svg class="gl-ring" width="' + size + '" height="' + size + '" viewBox="0 0 ' + size + " " + size + '" style="transform:rotate(-90deg)">';
      rings.forEach(function (r, i) {
        var g = self.GRADS[r.color];
        if (g) {
          var id = "glg" + (++self._gid);
          defs += '<linearGradient id="' + id + '" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="' + g[0] + '"/><stop offset="55%" stop-color="' + g[1] + '"/><stop offset="100%" stop-color="' + g[2] + '"/></linearGradient>';
          r = Object.assign({}, r, { stroke: "url(#" + id + ")" });
        } else r = Object.assign({}, r, { stroke: r.color });
        rings[i] = r;
      });
      if (defs) out += "<defs>" + defs + "</defs>";
      rings.forEach(function (r, i) {
        var rad = r0 - i * step;
        if (rad <= 4) return;
        var C = 2 * Math.PI * rad;
        var dash = (animateIn ? 0 : r.pct * C).toFixed(1) + " " + C.toFixed(1);
        out += '<circle cx="' + size / 2 + '" cy="' + size / 2 + '" r="' + rad.toFixed(2) + '" fill="none" stroke="' + (trackColor || r.track) + '" stroke-width="' + stroke + '"/>';
        out += '<circle class="gl-ring__arc" data-dash="' + (r.pct * C).toFixed(1) + " " + C.toFixed(1) + '" cx="' + size / 2 + '" cy="' + size / 2 + '" r="' + rad.toFixed(2) + '" fill="none" stroke="' + (r.stroke || r.color) + '" stroke-width="' + stroke + '" stroke-linecap="round" stroke-dasharray="' + dash + '" style="transition:stroke-dasharray 1.1s cubic-bezier(.25,1,.35,1) ' + (i * 0.1) + 's"/>';
      });
      return out + "</svg>";
    },
    /* release rings that were rendered with animateIn */
    playRings: function (scope) {
      (scope || document).querySelectorAll(".gl-ring__arc[data-dash]").forEach(function (c) {
        void c.getBoundingClientRect();
        c.setAttribute("stroke-dasharray", c.dataset.dash);
      });
    },
    headline: function () {
      var g = this.primary(); if (!g) return null;
      var r = this.rings()[0];
      return {
        title: "Your " + r.label.toLowerCase() + " goal",
        line: this.boosted() ? r.label + " ring nearly closed, nice work" : r.label + " at " + Math.round(r.pct * 100) + "% · 3 dinners to go",
        pct: Math.round(r.pct * 100),
      };
    },
    /* ---- cards ---- */
    homeCardHTML: function () {
      var h = this.headline();
      // no goal yet: the tracker still has a home, inviting the first goal
      if (!h) {
        return '<a class="goal-card goal-card--home goal-card--empty" href="goals.html">' +
          '<span class="goal-card__rings">' + this.ringsSVG([
            { pct: 0.38, color: "var(--eggplant-300)" }, { pct: 0.69, color: "var(--kale-300)" }, { pct: 0.71, color: "var(--paprika-300)" },
          ], 76, 8, "#f3f3f3", true) + "</span>" +
          '<span class="goal-card__text"><span class="goal-card__eyebrow"><img src="assets/icons/clove-kale.svg" alt="" />Health tracker</span>' +
          '<span class="goal-card__title">Cook toward a goal</span>' +
          '<span class="goal-card__line">Pick a goal and every dinner Clove suggests works toward it</span></span>' +
          '<span class="goal-card__arrow">→</span></a>';
      }
      return '<a class="goal-card goal-card--home" href="goals.html">' +
        '<span class="goal-card__rings">' + this.ringsSVG(this.rings(), 76, 8, "#f3f3f3", true) + "</span>" +
        '<span class="goal-card__text"><span class="goal-card__eyebrow"><img src="assets/icons/clove-kale.svg" alt="" />Health tracker</span>' +
        '<span class="goal-card__title">' + h.title + "</span>" +
        '<span class="goal-card__line">' + h.line + "</span></span>" +
        '<span class="goal-card__arrow">→</span></a>';
    },
    mountHome: function () {
      var slot = document.getElementById("goalPinSlot");
      if (!slot || slot.dataset.mounted) return; // inline mount already ran
      slot.dataset.mounted = "1";
      if (!this.pinned()) { slot.innerHTML = ""; return; }
      slot.innerHTML = this.homeCardHTML(); // always there, even before the first goal
      var self = this;
      setTimeout(function () { self.playRings(slot); }, 120);
    },
    mountProfile: function () {
      var art = document.getElementById("goalsArt"), sub = document.getElementById("goalsSub");
      if (!art) return;
      var g = this.primary();
      if (g) {
        art.innerHTML = this.ringsSVG(this.rings(), 84, 9, "#f3f3f3", true);
        var h = this.headline();
        sub.textContent = g.rings[0].label + " at " + h.pct + "%";
      } else {
        art.innerHTML = this.ringsSVG([
          { pct: 0.38, color: "var(--eggplant-300)" }, { pct: 0.69, color: "var(--kale-300)" }, { pct: 0.71, color: "var(--paprika-300)" },
        ], 84, 9, "#f3f3f3", true);
        sub.textContent = "Cook toward a goal";
      }
      var self = this;
      setTimeout(function () { self.playRings(art); }, 160);
    },
  };
  window.CloveGoals = CloveGoals;

  document.addEventListener("DOMContentLoaded", function () {
    CloveGoals.mountHome();
    CloveGoals.mountProfile();
  });
})();
