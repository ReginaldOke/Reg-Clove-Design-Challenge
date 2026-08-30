/* Shared core for the three health-tracker concepts: the goal dressing
   (META), the per-goal week of dinner slots (localStorage), the recipe
   picker modal, the goal sheet and the week chart. Each concept page owns
   only its rendering; state is shared, so dinners you tick in one concept
   are still ticked in the next. */
(function () {
  var G = window.CloveGoals;
  var R = "assets/img/recipes/";
  var TOTAL = 5;

  var META = {
    Iron: {
      flavor: "iron-rich",
      prov: "Added from your voice note",
      recipes: [
        { t: "Short rib in red wine", img: R + "short-ribs.webp", time: "3 hrs" },
        { t: "Sunday beef stew", img: R + "beef-stew.webp", time: "2 hrs 30" },
        { t: "Braised greens & lemon", img: R + "greens.webp", time: "40 min" },
        { t: "Beans in olive oil", img: R + "white-beans.webp", time: "20 min" },
      ],
      slots: [
        { img: R + "kale-caesar.webp", t: "Kale Caesar salad", done: true },
        { img: R + "greens.webp", t: "Braised greens & lemon", done: true },
        null, null, null,
      ],
    },
    Protein: {
      flavor: "high-protein",
      prov: "Added from your TikTok import",
      recipes: [
        { t: "Short rib in red wine", img: R + "short-ribs.webp", time: "3 hrs" },
        { t: "Chicken bake", img: R + "chicken-bake.webp", time: "45 min" },
        { t: "Drumsticks", img: R + "drumsticks.webp", time: "50 min" },
        { t: "Roast chicken", img: R + "roast-chicken.webp", time: "1 hr 20" },
      ],
      slots: [
        { img: R + "chicken-bake.webp", t: "Chicken bake", done: true },
        { img: R + "white-beans.webp", t: "Beans in olive oil", done: true },
        null, null, null,
      ],
    },
    Fibre: {
      flavor: "fibre-rich",
      prov: "Suggested by Clove",
      recipes: [
        { t: "Crispy rice bowl", img: R + "rice-bowl.webp", time: "30 min" },
        { t: "Charred broccoli", img: R + "charred-broccoli.webp", time: "35 min" },
        { t: "Lettuce cups", img: R + "lettuce-cups.webp", time: "15 min" },
        { t: "Weeknight stir fry", img: R + "stirfry.webp", time: "20 min" },
      ],
      slots: [
        { img: R + "greens.webp", t: "Braised greens & lemon", done: true },
        { img: R + "white-beans.webp", t: "Beans in olive oil", done: true },
        null, null, null,
      ],
    },
  };
  function metaFor(label) {
    return META[label] || {
      flavor: label.toLowerCase() + "-friendly",
      prov: "Set from your kitchen profile",
      recipes: META.Iron.recipes,
      slots: [null, null, null, null, null],
    };
  }

  /* ---- per-goal dinner slots, shared by all three concepts ---- */
  var SKEY = "cloveGoals2V3";
  localStorage.removeItem("cloveGoals2V2");
  var state = (function () {
    try { var s = JSON.parse(localStorage.getItem(SKEY) || "null"); if (s && s.goals) return s; } catch (e) {}
    return { goals: {} };
  })();
  function slotsFor(label) {
    if (!state.goals[label]) state.goals[label] = metaFor(label).slots.map(function (s) { return s && Object.assign({}, s); });
    return state.goals[label];
  }
  function saveState() { localStorage.setItem(SKEY, JSON.stringify(state)); }
  function doneCount(label) { return slotsFor(label).filter(function (s) { return s && s.done; }).length; }
  /* dinners, not milligrams: each ticked dinner is worth ~19% of the ring.
     Everyday meals chip in a per-goal baseline, so the three rings sit at
     different fills (38 / 50 / 64) instead of matching. */
  var PCT_BASE = { Protein: 0.12, Fibre: 0.26 };
  function pctFor(label) { return Math.min(0.96, (PCT_BASE[label] || 0) + 0.19 * doneCount(label)); }
  /* the deck's own dressing over goals.js: the third ring is FIBRE here
     (not Energy), and ring colours follow the plate's food:
     egg = orange, salad = green */
  var RING_OVERRIDE = {
    Protein: { color: "var(--paprika-300)", track: "var(--paprika-100)" },
    Energy: { label: "Fibre", color: "var(--kale-300)", track: "var(--kale-100)", goalN: 30, unit: "g" },
  };
  function slides() {
    var base = G.rings().map(function (r) {
      var o = RING_OVERRIDE[r.label] || {};
      var label = o.label || r.label;
      return { label: label, pct: pctFor(label), color: o.color || r.color, track: o.track || r.track, goalN: o.goalN, unit: o.unit, ring: r };
    });
    extras.forEach(function (lbl) {
      var a = EXTRAS[lbl];
      if (a) base.push({ label: a.label, pct: pctFor(a.label), color: a.color, track: a.track, goalN: a.goalN, unit: a.unit, ring: null });
    });
    return base;
  }

  /* goals the Ask Clove bar can add: full dressing so a described goal
     arrives as a complete plate of its own */
  var ADDABLE = [
    {
      label: "B12", phrase: "I think I need more B12", toast: "Health goal: More B12",
      color: "var(--eggplant-300)", track: "var(--eggplant-100)", goalN: 2.4, unit: "mcg",
      chart: { goal: 1.2, yMax: 2.4, unitLabel: "mcg B12", richVals: [1.6, 1.4, 1.7] },
      meta: {
        flavor: "B12-rich", prov: "You told Clove just now",
        recipes: [
          { t: "Roast chicken", img: R + "roast-chicken.webp", time: "1 hr 20" },
          { t: "Fish in tomato", img: R + "fish-tomato.webp", time: "35 min" },
          { t: "Drumsticks", img: R + "drumsticks.webp", time: "50 min" },
          { t: "Chicken bake", img: R + "chicken-bake.webp", time: "45 min" },
        ],
        slots: [null, null, null, null, null],
      },
    },
    {
      label: "Cholesterol", phrase: "Keep an eye on my cholesterol", toast: "Health goal: Happier cholesterol",
      color: "var(--kale-300)", track: "var(--kale-100)", goalN: 10, unit: "g",
      chart: { goal: 6, yMax: 9, unitLabel: "g wholegrains", richVals: [7.2, 6.8, 7.5] },
      meta: {
        flavor: "heart-friendly", prov: "You told Clove just now",
        recipes: [
          { t: "Grain bowl", img: R + "grain-bowl.webp", time: "25 min" },
          { t: "Charred broccoli", img: R + "charred-broccoli.webp", time: "35 min" },
          { t: "Beans in olive oil", img: R + "white-beans.webp", time: "20 min" },
          { t: "Lettuce cups", img: R + "lettuce-cups.webp", time: "15 min" },
        ],
        slots: [null, null, null, null, null],
      },
    },
  ];
  var EXTRA_KEY = "cloveGoals2Extra";
  var extras = (function () {
    try { return JSON.parse(localStorage.getItem(EXTRA_KEY) || "[]"); } catch (e) { return []; }
  })();
  var EXTRAS = {};
  function registerExtra(a) {
    EXTRAS[a.label] = a;
    META[a.label] = a.meta;
  }
  ADDABLE.forEach(function (a) { if (extras.indexOf(a.label) > -1) registerExtra(a); });

  var T = window.Tracker = {
    TOTAL: TOTAL,
    META: META,
    metaFor: metaFor,
    slotsFor: slotsFor,
    saveState: saveState,
    doneCount: doneCount,
    pctFor: pctFor,
    slides: slides,
    EXTRAS: EXTRAS,
    /* concepts A and B add meals straight into the data as cooked */
    addAsDone: false,
    EMOJI: { Iron: "\ud83e\udd69", Protein: "\ud83c\udf73", Fibre: "\ud83e\udd57", B12: "\ud83e\udd5a", Cholesterol: "\ud83c\udf3e" },
    emojiFor: function (label) { return T.EMOJI[label] || "\ud83c\udf7d\ufe0f"; },
    LIVE_PLAN: "https://reginaldoke.github.io/Reg-Clove-Design-Challenge/plan.html?ask=1",
    /* pages assign this: () => the goal the page is showing right now */
    cur: function () { return slides()[0]; },
    onAdd: null, /* pages assign: function (slotIndex) {} */
  };

  /* a finished week gets one quiet celebration per goal per visit */
  T.maybeCelebrate = function (label) {
    if (doneCount(label) < TOTAL) return false;
    var k = "c-celebrated-" + label;
    if (sessionStorage.getItem(k)) return true;
    sessionStorage.setItem(k, "1");
    setTimeout(function () {
      CloveMemory.toast("Health goal: " + label + " week complete", "", { goal: true });
    }, 600);
    return true;
  };

  /* ---- recipe picker modal (CardRecipe, Figma 28275:52775) ---- */
  var modal = document.getElementById("g2Modal");
  T._replace = null;
  T.openModal = function (replaceIdx) {
    T._replace = typeof replaceIdx === "number" ? replaceIdx : null;
    var s = T.cur(), m = metaFor(s.label), slots = slotsFor(s.label);
    var f = m.flavor;
    document.getElementById("g2ModalH").textContent = f.charAt(0).toUpperCase() + f.slice(1) + " dinners";
    var sub = document.getElementById("g2ModalS");
    if (sub) sub.textContent = T._replace === null ? "Tap a dinner to add it to your week." : "Tap a dinner to swap it in.";
    document.getElementById("g2Rgrid").innerHTML = m.recipes.map(function (r, i) {
      var added = slots.some(function (x, k) { return k !== T._replace && x && x.t === r.t; });
      return '<button class="g2-rcard' + (added ? " added" : "") + '" data-i="' + i + '" style="--d:' + (i * 60) + 'ms">' +
        '<span class="g2-rcard__img"><img src="' + r.img + '" alt="" />' +
        '<span class="g2-rcard__time' + (added ? " in" : "") + '">' + (added ? "In your week ✓" : r.time) + "</span></span>" +
        '<span class="g2-rcard__t">' + r.t + "</span>" +
        '<span class="g2-rcard__src"><span class="g2-rcard__ava"><img src="assets/icons/clove-kale.svg" alt="" /></span>Clove kitchen</span></button>';
    }).join("");
    modal.hidden = false;
    void modal.offsetWidth;
    modal.classList.add("show");
  };
  T.closeModal = function () {
    modal.classList.remove("show");
    setTimeout(function () { modal.hidden = true; }, 480);
  };
  document.getElementById("g2ModalScrim").addEventListener("click", T.closeModal);
  document.getElementById("g2Rgrid").addEventListener("click", function (e) {
    var btn = e.target.closest(".g2-rcard");
    if (!btn || btn.classList.contains("added")) return;
    var s = T.cur(), slots = slotsFor(s.label);
    var r = metaFor(s.label).recipes[Number(btn.dataset.i)];
    var target = T._replace !== null ? T._replace : slots.indexOf(null);
    if (target === -1) return;
    slots[target] = { img: r.img, t: r.t, done: !!T.addAsDone };
    T._replace = null;
    saveState();
    T.closeModal();
    if (T.onAdd) T.onAdd(target);
    setTimeout(function () {
      CloveMemory.toast("Added to meal plan: " + r.t, "", { goal: true });
    }, 380);
  });

  /* ---- meal actions sheet (same bones as plan.html's meal sheet):
          long-press any dinner for cooked-toggle / swap / remove ---- */
  var msheet = document.createElement("div");
  msheet.className = "meal-sheet";
  msheet.innerHTML =
    '<div class="meal-sheet__scrim"></div>' +
    '<div class="meal-sheet__card"><span class="meal-sheet__grab"></span>' +
    '<div class="meal-sheet__head"><span class="meal-sheet__img"><img alt="" /></span>' +
    '<div><p class="meal-sheet__name"></p><p class="ms-sub"></p></div></div>' +
    '<div class="meal-sheet__list"></div></div>';
  document.querySelector(".phone").appendChild(msheet);
  T.openMealSheet = function (i) {
    var s = T.cur(), m = slotsFor(s.label)[i];
    if (!m) return;
    msheet._i = i;
    msheet.querySelector(".meal-sheet__img img").src = m.img;
    msheet.querySelector(".meal-sheet__name").textContent = m.t;
    msheet.querySelector(".ms-sub").textContent = m.done
      ? "Cooked · counts toward your " + s.label.toLowerCase() + " goal"
      : "On the plan for this week";
    function row(act, icon, style, label) {
      return '<button class="meal-sheet__row" data-act="' + act + '"><span class="ico ico-24"><img src="assets/icons/' + icon + '" alt="" style="' + style + '" /></span>' + label + "</button>";
    }
    msheet.querySelector(".meal-sheet__list").innerHTML =
      row("toggle", "check-sm.svg", "transform:translate(-50%,-50%);filter:invert(1);width:16px;height:12px", m.done ? "Mark as not cooked" : "Mark as cooked") +
      row("swap", "swap-24.svg", "transform:translate(-50%,-50%);width:22px;height:22px", "Swap for another dinner") +
      row("remove", "trash-2.svg", "transform:translate(-50%,-50%);width:22px;height:22px", "Remove from this week");
    msheet.classList.add("open");
    void msheet.offsetWidth;
    msheet.classList.add("in");
  };
  T.closeMealSheet = function () {
    msheet.classList.remove("in");
    setTimeout(function () { msheet.classList.remove("open"); }, 480);
  };
  msheet.querySelector(".meal-sheet__scrim").addEventListener("click", T.closeMealSheet);
  msheet.querySelector(".meal-sheet__list").addEventListener("click", function (e) {
    var btn = e.target.closest(".meal-sheet__row");
    if (!btn) return;
    var i = msheet._i, s = T.cur(), slots = slotsFor(s.label);
    if (btn.dataset.act === "toggle") {
      slots[i].done = !slots[i].done;
      saveState();
      T.closeMealSheet();
      if (T.onMealChange) T.onMealChange("toggle", i);
    } else if (btn.dataset.act === "swap") {
      T.closeMealSheet();
      setTimeout(function () { T.openModal(i); }, 300);
    } else if (btn.dataset.act === "remove") {
      slots[i] = null;
      saveState();
      T.closeMealSheet();
      if (T.onMealChange) T.onMealChange("remove", i);
    }
  });

  /* long-press a dinner (in any concept) to open the actions sheet */
  T.bindLongPress = function (container, fn) {
    var timer = null, sx = 0, sy = 0, fired = false;
    container.addEventListener("pointerdown", function (e) {
      var btn = e.target.closest("[data-i]");
      if (!btn) return;
      sx = e.clientX; sy = e.clientY; fired = false;
      clearTimeout(timer);
      timer = setTimeout(function () { fired = true; fn(Number(btn.dataset.i)); }, 480);
    });
    container.addEventListener("pointermove", function (e) {
      if (Math.abs(e.clientX - sx) + Math.abs(e.clientY - sy) > 8) clearTimeout(timer);
    });
    window.addEventListener("pointerup", function () { clearTimeout(timer); });
    window.addEventListener("pointercancel", function () { clearTimeout(timer); });
    container.addEventListener("click", function (e) {
      if (fired) { e.preventDefault(); e.stopPropagation(); fired = false; }
    }, true);
  };

  /* drag a bottom sheet down to dismiss it (shared Clove gesture) */
  T.sheetDrag = function (card, closeFn, base) {
    var d = null, sup = false;
    card.addEventListener("pointerdown", function (e) {
      if (card.scrollTop > 0) return;
      d = { y: e.clientY, moved: false };
    });
    window.addEventListener("pointermove", function (e) {
      if (!d) return;
      var dy = e.clientY - d.y;
      if (dy > 8) d.moved = true;
      if (d.moved && dy > 0) {
        card.style.transition = "none";
        card.style.transform = (base || "") + " translateY(" + dy + "px)";
      }
    });
    function release(e) {
      if (!d) return;
      var dy = e.clientY - d.y, moved = d.moved;
      d = null;
      card.style.transition = "";
      card.style.transform = "";
      if (moved && dy > 90) closeFn();
      if (moved) { sup = true; setTimeout(function () { sup = false; }, 0); }
    }
    window.addEventListener("pointerup", release);
    window.addEventListener("pointercancel", release);
    card.addEventListener("click", function (e) {
      if (sup) { e.preventDefault(); e.stopPropagation(); }
    }, true);
  };
  T.sheetDrag(modal.querySelector(".gl-sheet__card"), T.closeModal, "translate(-50%, 0)");
  T.sheetDrag(msheet.querySelector(".meal-sheet__card"), T.closeMealSheet, "");

  /* ---- the Ask Clove bar, docked under everything: describing a goal
          is the voice-first way into the goal sheet ---- */
  var ask = document.createElement("div");
  ask.className = "ask-bar";
  ask.innerHTML =
    '<button class="ask-bar__pill" aria-label="Describe a health goal">' +
    '<img class="ask-bar__clove" src="assets/icons/clove-kale.svg" alt="" />' +
    '<span class="ask-bar__ph">Describe a health goal</span>' +
    '<span class="ask-bar__mic"><svg viewBox="0 0 20 16" width="17" height="14" fill="none"><g fill="#fff">' +
    '<rect x="0" y="5" width="2.5" height="6" rx="1.25"/>' +
    '<rect x="4.4" y="2.6" width="2.5" height="10.8" rx="1.25"/>' +
    '<rect x="8.75" y="0" width="2.5" height="16" rx="1.25"/>' +
    '<rect x="13.1" y="2.6" width="2.5" height="10.8" rx="1.25"/>' +
    '<rect x="17.5" y="5" width="2.5" height="6" rx="1.25"/>' +
    "</g></svg></span></button>";
  document.querySelector(".phone").appendChild(ask);
  /* tap: the ask types itself out, Clove listens, and the goal lands as
     a brand-new plate (concept pages jump to it via T.onGoalAdded) */
  T.askFlow = function () {
    if (ask._busy) return;
    var next = null;
    for (var i = 0; i < ADDABLE.length; i++) if (extras.indexOf(ADDABLE[i].label) === -1) { next = ADDABLE[i]; break; }
    var ph = ask.querySelector(".ask-bar__ph");
    var mic = ask.querySelector(".ask-bar__mic");
    if (!next) {
      ph.textContent = "You're tracking everything for now";
      setTimeout(function () { ph.textContent = "Describe a health goal"; }, 2200);
      return;
    }
    ask._busy = true;
    ph.classList.add("on");
    ph.textContent = "";
    var words = next.phrase.split(" ");
    words.forEach(function (w, k) {
      setTimeout(function () { ph.textContent += (k ? " " : "") + w; }, 240 + k * 170);
    });
    var typed = 240 + words.length * 170;
    setTimeout(function () { mic.classList.add("listening"); }, typed);
    setTimeout(function () {
      mic.classList.remove("listening");
      extras.push(next.label);
      localStorage.setItem(EXTRA_KEY, JSON.stringify(extras));
      registerExtra(next);
      CloveMemory.toast(next.toast, "", { goal: true });
      if (T.onGoalAdded) T.onGoalAdded(next.label);
    }, typed + 1100);
    setTimeout(function () {
      ph.classList.remove("on");
      ph.textContent = "Describe a health goal";
      ask._busy = false;
    }, typed + 2100);
  };
  ask.querySelector(".ask-bar__pill").addEventListener("click", function () { T.askFlow(); });
  var heart = document.getElementById("glHeart");
  if (heart) heart.addEventListener("click", function () { T.askFlow(); });

  /* ---- goal sheet ("What are you working on?") ---- */
  var sheet = document.getElementById("glSheet");
  T.bindSheet = function (render) {
    function openSheet() {
      var opts = document.getElementById("glOpts");
      opts.innerHTML = G.OPTIONS.map(function (o) {
        var have = G.has(o.id);
        return '<button class="gl-opt' + (have ? " have" : "") + '" data-id="' + o.id + '"' + (have ? " disabled" : "") + '><span class="e">' + o.emoji + '</span><span class="l">' + o.label + "</span>" +
          (have ? '<span class="have-tag">Already tracking</span>' : '<span class="s">' + o.sub + "</span>") + "</button>";
      }).join("");
      sheet.hidden = false;
      void sheet.offsetWidth;
      sheet.classList.add("show");
      opts.querySelectorAll(".gl-opt:not(.have)").forEach(function (b) {
        b.addEventListener("click", function () {
          b.classList.add("on");
          var id = b.dataset.id;
          setTimeout(function () {
            closeSheet();
            G.add(id);
            var g = G.LIB[id];
            setTimeout(function () {
              render(true);
              CloveMemory.toast(g.toast, "Added to your health goals · Clove will cook toward it", { goal: true });
            }, 380);
          }, 260);
        });
      });
    }
    function closeSheet() {
      sheet.classList.remove("show");
      setTimeout(function () { sheet.hidden = true; }, 480);
    }
    document.getElementById("glScrim").addEventListener("click", closeSheet);
    var edit = document.getElementById("glEdit");
    if (edit) edit.addEventListener("click", openSheet);
    T.sheetDrag(sheet.querySelector(".gl-sheet__card"), closeSheet, "translate(-50%, 0)");
  };

  /* ---- pink nudge: press feedback only in this standalone deck ---- */
  T.bindNudge = function () {};

  /* ---- swipe/drag for the plate carousel ----
     Native scroll-snap gives touch swiping, but a mouse cannot drag a
     scroll container, and panning scrollLeft mid-drag fights the snap.
     So: snap off while the pointer is down, pan by hand, then spring to
     the nearest plate on release (with a little flick momentum). */
  T.makeSwipeable = function (car, pitch, count) {
    var down = null, moved = false;
    car.addEventListener("pointerdown", function (e) {
      if (e.button) return;
      down = { x: e.clientX, sl: car.scrollLeft, lastX: e.clientX, lastT: e.timeStamp, vx: 0 };
      moved = false;
      car.classList.add("dragging");
      car.scrollTo({ left: car.scrollLeft }); /* halt any smooth glide */
    });
    window.addEventListener("pointermove", function (e) {
      if (!down) return;
      var dx = e.clientX - down.lastX, dt = Math.max(1, e.timeStamp - down.lastT);
      down.vx = 0.8 * down.vx + 0.2 * (dx / dt);
      down.lastX = e.clientX; down.lastT = e.timeStamp;
      if (Math.abs(e.clientX - down.x) > 6) moved = true;
      if (moved) car.scrollLeft = down.sl - (e.clientX - down.x);
    });
    function release(e) {
      if (!down) return;
      var v = down.vx, was = moved;
      down = null; moved = false;
      if (!was) { car.classList.remove("dragging"); return; }
      var i = Math.max(0, Math.min(count() - 1, Math.round((car.scrollLeft - v * 180) / pitch)));
      car.scrollTo({ left: i * pitch, behavior: "smooth" });
      setTimeout(function () { car.classList.remove("dragging"); }, 480);
      car._swiped = true;
      setTimeout(function () { car._swiped = false; }, 0);
    }
    window.addEventListener("pointerup", release);
    window.addEventListener("pointercancel", release);
    /* a drag must not count as a tap on whatever it started over */
    car.addEventListener("click", function (e) {
      if (car._swiped) { e.preventDefault(); e.stopPropagation(); }
    }, true);
  };

  /* ---- week chart (concepts 1 and 2), dinner-driven ---- */
  T.drawWeek = function (s) {
    var r = s.ring || {};
    var svg = document.getElementById("glChart");
    if (!svg) return;
    var goalN = s.goalN || r.goalN || parseFloat(String(r.goal).replace(/[^\d.]/g, "")) || 1;
    /* a cooked dinner is worth a real dinner's dose, and the y scale is
       trimmed so every tick moves the line a visible step: five dinners
       carry the line right up to the dotted goal line */
    var dinnerWorth = 0.55 * goalN;
    var nowN = T.doneCount(s.label) * dinnerWorth;
    var unit = s.unit || r.unit || String(r.goal).replace(/[\d.,\s]/g, "");
    var SHAPES = { Iron: [0.1, 0.16, 0.52], Protein: [0.55, 0.1, 0.14], Fibre: [0.14, 0.55, 0.12] };
    var weekPct = (SHAPES[s.label] || [0.34, 0.26, 0.37]).concat([0, 0, 0, 0]);
    var W = Math.round(svg.clientWidth) || 320, H = Math.round(svg.clientHeight) || 84, PAD = 8, run = 0, cum = [];
    svg.setAttribute("viewBox", "0 0 " + W + " " + H);
    svg.setAttribute("preserveAspectRatio", "xMidYMid meet");
    weekPct.forEach(function (p, i) { run += i === 3 ? nowN : p * goalN; cum.push(run); });
    var weekGoal = goalN * 7;
    var yMax = weekGoal * 0.55;
    var x = function (i) { return (i / 6) * W; };
    var y = function (v) { return H - PAD - Math.min(1, v / yMax) * (H - PAD * 2); };
    var pts = [{ x: 0, y: H - PAD }].concat(cum.slice(0, 4).map(function (v, i) { return { x: x(i), y: y(v) }; }));
    var d = pts.map(function (p, i) {
      if (!i) return "M" + p.x.toFixed(1) + " " + p.y.toFixed(1);
      var q = pts[i - 1], cx = (q.x + p.x) / 2;
      return "C" + cx.toFixed(1) + " " + q.y.toFixed(1) + " " + cx.toFixed(1) + " " + p.y.toFixed(1) + " " + p.x.toFixed(1) + " " + p.y.toFixed(1);
    }).join(" ");
    var last = pts[pts.length - 1];
    var lg = (G.GRADS[s.color] || [s.color, s.color]);
    lg = [lg[0], lg[1]];
    svg.innerHTML =
      '<defs><linearGradient id="cum" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="' + lg[1] + '" stop-opacity="0.26"/><stop offset="100%" stop-color="' + lg[1] + '" stop-opacity="0"/></linearGradient>' +
      '<linearGradient id="lineG" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stop-color="' + lg[0] + '"/><stop offset="100%" stop-color="' + lg[1] + '"/></linearGradient></defs>' +
      '<line x1="0" y1="8" x2="' + W + '" y2="8" stroke="#e6e2d6" stroke-width="1.5" stroke-dasharray="3 5"/>' +
      '<path d="M0 ' + (H - PAD) + " L" + W + " " + PAD + '" fill="none" stroke="#ddd9cb" stroke-width="1.5" stroke-dasharray="4 5" stroke-linecap="round"/>' +
      '<path d="' + d + " L" + last.x.toFixed(1) + " " + (H - PAD) + ' L0 ' + (H - PAD) + ' Z" fill="url(#cum)"/>' +
      '<path class="gl-line" d="' + d + '" fill="none" stroke="url(#lineG)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>' +
      '<circle cx="' + last.x.toFixed(1) + '" cy="' + last.y.toFixed(1) + '" r="9" fill="' + lg[1] + '" opacity="0.16"/>' +
      '<circle cx="' + last.x.toFixed(1) + '" cy="' + last.y.toFixed(1) + '" r="4.5" fill="' + lg[1] + '" stroke="#fff" stroke-width="2.5"/>';
    var fmt = function (n) { return (Math.round(n * 10) / 10).toLocaleString(); };
    document.getElementById("glWeekTot").textContent = fmt(cum[3]) + unit;
    document.getElementById("glWeekGoal").textContent = fmt(weekGoal) + unit;
    document.getElementById("g2WeekLbl").textContent = s.label + " this week";
    var line = svg.querySelector(".gl-line");
    var len = line.getTotalLength();
    line.style.strokeDasharray = len; line.style.strokeDashoffset = len;
    line.getBoundingClientRect();
    line.style.transition = "stroke-dashoffset 1.1s cubic-bezier(.35,.9,.35,1) .15s";
    line.style.strokeDashoffset = 0;
  };

  // the tracker is never empty
  if (!G.primary()) G.add("iron");
})();
