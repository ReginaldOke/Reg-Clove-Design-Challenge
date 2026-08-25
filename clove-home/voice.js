/* Clove voice mode on the recipe page.
   Press V, or tap the pink clove button: the button grows into the voice
   bar (Figma 28075:94888), the clove spins into its seat, the request is
   typed out as spoken, Clove confirms it heard, then rewrites the
   ingredients under a pink swirl and explains the changes in the expanded
   chat surface (Figma 28075:92455). Finally a health goal is added. */
(function () {
  var btn = document.querySelector(".chat-button");
  var section = document.getElementById("ingSection");
  if (!btn || !section) return;

  /* Two takes share the same surface:
     iron      (first mile) "Make this higher in iron" → ingredient swaps → health goal
     leftover  (after shopping) "I didn't use all the spinach" → trims the line,
               offers a dinner that uses it up → "Update meal plan" CTA */
  var SCENARIOS = {
    iron: {
      utter: "Make this higher in iron",
      reply:
        "Done. Two swaps for more iron:\n" +
        "\u2022 Cos lettuce \u2192 baby spinach\n" +
        "\u2022 Croutons \u2192 toasted pepitas\n" +
        "About 4mg more iron a serve.",
    },
    leftover: {
      utter: "I didn\u2019t use all the spinach",
      // ask first, then trim under the swirl, then offer the plan;
      // one CTA on screen at a time
      reply: "Got it. Want me to update this recipe to use less spinach next time?",
      confirmCta: "Update recipe",
      reply2: "Done. Spinach is 1\u00bd cups now.\nFor the handful left over, I can add a quick spinach dinner to your plan.",
      cta: { label: "Update meal plan", href: "plan.html?leftover=spinach" },
    },
  };
  var scenario = SCENARIOS.iron;
  var UTTERANCE = scenario.utter, REPLY = scenario.reply;
  var SPRING = "cubic-bezier(0.24, 1.1, 0.32, 1)";
  var forceLeftover = /[?&]leftover=1/.test(location.search);
  // shopped = ordered (any store), handed over to the Woolies checkout, or
  // took the list into a store (Find in store / cook-tonight)
  function hasShopped() {
    return forceLeftover || !!(localStorage.getItem("cloveOrdered") || localStorage.getItem("cloveShopped") || localStorage.getItem("cloveStoreName"));
  }

  /* ---------- DOM ---------- */
  var wrap = document.createElement("div");
  wrap.className = "voice-wrap";
  wrap.hidden = true;
  wrap.innerHTML =
    '<button class="voice-close" aria-label="Close"><span class="ico ico-24"><img src="assets/icons/x.svg" alt="" style="width:12px;height:12px" /></span></button>' +
    '<div class="voice-bar">' +
    '  <div class="voice-bar__row">' +
    '    <span class="voice-bar__logo"><img class="logo" src="assets/icons/clove-kale.svg" alt="" /><img class="spark" src="assets/icons/clove-sparkle-kale.svg" alt="" /></span>' +
    '    <p class="voice-bar__text"><span class="said"></span><span class="ph">Ask Clove</span></p>' +
    '    <span class="voice-bar__micwrap"><span class="voice-bar__mic">' +
    '      <img class="lines" src="assets/icons/audio-lines.svg" alt="" />' +
    '      <img class="check" src="assets/icons/check.svg" alt="" />' +
    '      <img class="work" src="assets/icons/clove-white.svg" alt="" />' +
    "    </span></span>" +
    "  </div>" +
    '  <div class="voice-bar__chat">' +
    '    <div class="voice-bar__grab" aria-hidden="true"></div>' +
    '    <div class="turns"><p class="you"></p><p class="resp"></p><p class="resp resp2" hidden></p></div>' +
    '    <button class="btn-primary voice-bar__cta" hidden></button>' +
    '    <div class="voice-bar__composer"><div class="field"><span class="ph">Ask Clove something</span>' +
    '      <span class="voice-bar__micwrap"><span class="voice-bar__mic"><img class="lines" src="assets/icons/audio-lines.svg" alt="" /></span></span>' +
    "    </div></div>" +
    "  </div>" +
    "</div>" +
    '<div class="voice-fly"><img class="w" src="assets/icons/clove-white.svg" alt="" /><img class="k" src="assets/icons/clove-kale.svg" alt="" /></div>';
  document.body.appendChild(wrap);

  var bar = wrap.querySelector(".voice-bar");
  var fly = wrap.querySelector(".voice-fly");
  var said = wrap.querySelector(".voice-bar__text .said");
  var logoSeat = wrap.querySelector(".voice-bar__logo");
  var you = wrap.querySelector(".voice-bar__chat .you");
  var resp = wrap.querySelector(".voice-bar__chat .resp");
  var resp2 = wrap.querySelector(".voice-bar__chat .resp2");
  var closeBtn = wrap.querySelector(".voice-close");
  var ctaBtn = wrap.querySelector(".voice-bar__cta");

  var state = "idle"; // idle | running | open (finished, surface still up)
  var done = false;   // ingredients already rewritten (iron) this visit
  var leftoverDone = false;
  var timers = [];
  var activeGlow = null;
  function later(fn, ms) { var t = setTimeout(fn, ms); timers.push(t); return t; }
  function clearTimers() { timers.forEach(clearTimeout); timers = []; }

  /* ---------- ingredients ---------- */
  var rows = Array.prototype.slice.call(section.querySelectorAll(".ing-row[data-h-nm]"));
  rows.forEach(function (r) {
    r._orig = r.querySelector(".ing-row__text").innerHTML;
    r._origDone = r.classList.contains("ing-row--done");
    r._origCheck = r.querySelector(".ing-row__check").innerHTML;
  });
  var aiTag = document.getElementById("ingAiTag");

  /* pink washes behind swapped rows, on a layer under the swirl */
  var washLayer = document.createElement("div");
  washLayer.className = "ing-washes";
  if (getComputedStyle(section).position === "static") section.style.position = "relative";
  section.insertBefore(washLayer, section.firstChild);
  function syncWashes() {
    var sr = section.getBoundingClientRect();
    rows.forEach(function (r) {
      var swapped = r.classList.contains("ing-row--swapped") && !r.classList.contains("settle");
      var w = r._wash;
      if (swapped) {
        if (!w) { w = document.createElement("i"); w.className = "ing-wash"; washLayer.appendChild(w); r._wash = w; }
        var rr = r.getBoundingClientRect();
        w.style.top = (rr.top - sr.top - 2) + "px";
        w.style.height = (rr.height + 4) + "px";
        requestAnimationFrame(function () { w.classList.add("on"); });
      } else if (w) {
        w.classList.remove("on");
        setTimeout(function () { if (r._wash === w && !w.classList.contains("on")) { w.remove(); r._wash = null; } }, 650);
      }
    });
  }
  window.addEventListener("resize", syncWashes);

  // swapped-in quantities scale with the serves stepper (recipe.html's
  // cloveServes); spinach 2 cups and pepitas ¼ cup at 6 serves
  var SWAP_Q = { "baby spinach": { base: 2, unit: "cup", kind: "cup" }, "toasted pepitas": { base: 0.25, unit: "cup", kind: "cup" } };
  function swapQty(r, q) {
    q = q || SWAP_Q[r.dataset.hNm];
    if (window.cloveServes && q) { r._q = q; return window.cloveServes.qtyText(q); }
    return r.dataset.hQty;
  }
  function swapRow(r) {
    var t = r.querySelector(".ing-row__text");
    r.classList.add("ing-row--swapped");
    // a ticked line being replaced comes back as a fresh, unticked ingredient
    if (r.classList.contains("ing-row--done")) {
      r.classList.remove("ing-row--done");
      r.querySelector(".ing-row__check").innerHTML = '<button class="checkcircle" aria-label="Check"></button>';
    }
    t.classList.add("out");
    setTimeout(function () {
      t.innerHTML =
        '<span class="swap-mark">✦</span>' +
        '<span class="qty">' + swapQty(r) + "</span>" +
        '<span class="nm">' + r.dataset.hNm + "</span>" +
        '<span class="note">' + r.dataset.hNote + "</span>";
      t.classList.remove("out");
      t.classList.add("in");
      syncWashes();
      setTimeout(function () { r.classList.add("settle"); syncWashes(); }, 1400);
    }, 170);
  }
  function resetRows() {
    rows.forEach(function (r) {
      r.classList.remove("ing-row--swapped", "settle");
      if (r._origDone) { r.classList.add("ing-row--done"); r.querySelector(".ing-row__check").innerHTML = r._origCheck; }
      var t = r.querySelector(".ing-row__text");
      t.classList.remove("in", "out");
      t.innerHTML = r._orig;
      if (window.cloveServes) window.cloveServes.resetRowQty(r);
    });
    aiTag.hidden = true;
    syncWashes();
  }
  // the iron swaps persist (localStorage cloveIronSwap): on a later visit the
  // recipe already reads "baby spinach", settled, no animation
  function applyIronStatic() {
    rows.forEach(function (r) {
      if (r.classList.contains("ing-row--done")) {
        r.classList.remove("ing-row--done");
        r.querySelector(".ing-row__check").innerHTML = '<button class="checkcircle" aria-label="Check"></button>';
      }
      r.classList.add("ing-row--swapped", "settle");
      r.querySelector(".ing-row__text").innerHTML =
        '<span class="swap-mark">\u2726</span>' +
        '<span class="qty">' + swapQty(r) + "</span>" +
        '<span class="nm">' + r.dataset.hNm + "</span>" +
        '<span class="note">' + r.dataset.hNote + "</span>";
    });
    aiTag.hidden = false;
  }
  function spinachRow() {
    return rows.filter(function (r) { return /spinach/i.test(r.dataset.hNm || ""); })[0] || null;
  }
  // "I didn't use all the spinach": the line is trimmed for next time
  function trimSpinach(animate) {
    var r = spinachRow();
    if (!r) return;
    var t = r.querySelector(".ing-row__text");
    function set() {
      t.innerHTML =
        '<span class="swap-mark">\u2726</span>' +
        '<span class="qty">' + swapQty(r, { base: 1.5, unit: "cup", kind: "cup" }) + "</span>" +
        '<span class="nm">' + r.dataset.hNm + "</span>" +
        '<span class="note">, you had some left over</span>';
    }
    if (!animate) { set(); r.classList.add("ing-row--swapped", "settle"); return; }
    r.classList.remove("settle");
    r.classList.add("ing-row--swapped");
    t.classList.add("out");
    setTimeout(function () {
      set();
      t.classList.remove("out");
      t.classList.add("in");
      syncWashes();
      setTimeout(function () { r.classList.add("settle"); syncWashes(); }, 1600);
    }, 170);
  }

  /* ---------- typewriters ---------- */
  function typeWords(el, text, onDone) {
    var words = text.split(" "), i = 0;
    (function next() {
      el.textContent = words.slice(0, ++i).join(" ");
      if (i < words.length) later(next, 150 + Math.random() * 140);
      else if (onDone) later(onDone, 260);
    })();
  }
  function stream(el, text, onDone) {
    var i = 0;
    (function next() {
      i = Math.min(text.length, i + 1 + (Math.random() < 0.35 ? 1 : 0));
      el.textContent = text.slice(0, i);
      if (i < text.length) later(next, 9 + Math.random() * 12);
      else if (onDone) later(onDone, 200);
    })();
  }

  /* ---------- geometry helpers ---------- */
  function btnRect() { return btn.getBoundingClientRect(); }
  function wrapRect() { return wrap.getBoundingClientRect(); }

  /* ---------- stage 1: button → voice bar ---------- */
  function openBar() {
    wrap.hidden = false;
    wrap.classList.remove("expanded", "settled");
    bar.className = "voice-bar";
    said.textContent = "";
    resp.textContent = "";
    resp2.textContent = "";
    resp2.hidden = true;
    ctaBtn.hidden = true;
    void wrap.offsetWidth;
    wrap.classList.add("on");

    var b = btnRect(), w = wrapRect();
    // final geometry of the bar (as laid out by CSS)
    var f = bar.getBoundingClientRect();
    // start geometry: the pink button's box, expressed in the bar's right/bottom terms
    var startRight = w.right - b.right;
    var startBottom = w.bottom - b.bottom;
    btn.style.transition = "opacity 120ms ease";
    btn.style.opacity = "0";
    bar.animate(
      [
        { width: b.width + "px", height: b.height + "px", right: startRight + "px", bottom: startBottom + "px", borderRadius: "48px", backgroundColor: "#bd53ea", boxShadow: "0 8px 16px rgba(15,18,21,0.15)" },
        { width: f.width + "px", height: f.height + "px", right: (w.right - f.right) + "px", bottom: (w.bottom - f.bottom) + "px", borderRadius: "48px", backgroundColor: "#ffffff", boxShadow: "0 0 20px rgba(0,0,0,0.25)" },
      ],
      { duration: 520, easing: SPRING }
    );
    // the clove lifts out of the button, spins once, lands in its seat
    fly.style.display = "block";
    var seat = logoSeat.getBoundingClientRect();
    var sx = b.left + b.width / 2 - w.left - 16, sy = b.top + b.height / 2 - w.top - 16;
    var ex = seat.left - w.left, ey = seat.top - w.top;
    var flyW = fly.querySelector(".w"), flyK = fly.querySelector(".k");
    flyW.style.opacity = "1"; flyK.style.opacity = "0";
    fly.animate(
      [
        { transform: "translate(" + sx + "px," + sy + "px) rotate(0deg) scale(1)" },
        { transform: "translate(" + ((sx + ex) / 2) + "px," + (Math.min(sy, ey) - 28) + "px) rotate(200deg) scale(1.15)", offset: 0.55 },
        { transform: "translate(" + ex + "px," + ey + "px) rotate(360deg) scale(1)" },
      ],
      { duration: 640, easing: "cubic-bezier(0.3, 0.9, 0.3, 1)" }
    ).onfinish = function () {
      fly.style.display = "none";
      bar.classList.add("landed");
    };
    // white → kale as it crosses onto the white surface
    later(function () { flyW.style.opacity = "0"; flyK.style.opacity = "1"; }, 300);
    later(function () { bar.classList.add("ready"); }, 260);
  }

  /* ---------- stage 2+3: listening → understood ---------- */
  function listen(onDone) {
    bar.classList.add("listening");
    later(function () {
      typeWords(said, UTTERANCE, function () {
        bar.classList.remove("listening");
        bar.classList.add("heard");
        onDone && later(onDone, 700);
      });
    }, 520);
  }

  /* ---------- stage 4: rewrite the ingredients under the swirl ---------- */
  function rewrite(onDone) {
    bar.classList.remove("heard");
    bar.classList.add("working");
    var r = section.getBoundingClientRect();
    var inView = r.top >= 0 && r.top < window.innerHeight * 0.45;
    if (!inView) section.scrollIntoView({ behavior: "smooth", block: "start" });
    section.classList.add("ai-host");
    var glow = AIGlow.wrap(section);
    activeGlow = glow;
    // the swirl frames the ingredient list only, ending above "Add all to Groceries"
    var addAll = section.querySelector(".add-all-btn");
    if (addAll) glow.el.style.bottom = (section.offsetHeight - addAll.offsetTop + 12) + "px";
    later(function () {
      // unhurried: the swirl thinks, each swap lands on its own beat, then
      // the tag, then a pause before Clove explains (room to talk over it)
      var GAP = 900;
      rows.forEach(function (row, i) { later(function () { swapRow(row); }, i * GAP); });
      later(function () {
        aiTag.hidden = false;
        aiTag.animate([{ opacity: 0, transform: "scale(0.6)" }, { opacity: 1, transform: "scale(1)" }], { duration: 360, easing: "cubic-bezier(0.22, 1.4, 0.36, 1)" });
      }, rows.length * GAP + 300);
      later(function () {
        glow.stop();
        activeGlow = null;
        bar.classList.remove("working");
        onDone && onDone();
      }, rows.length * GAP + 1700);
    }, inView ? 2200 : 2600);
  }

  /* the leftover trim runs only after the user confirms in the chat:
     the swirl frames the ingredients, the one line changes, the swirl leaves */
  function trimUnderSwirl(onDone) {
    var r = section.getBoundingClientRect();
    var inView = r.top >= 0 && r.top < window.innerHeight * 0.45;
    if (!inView) section.scrollIntoView({ behavior: "smooth", block: "start" });
    section.classList.add("ai-host");
    var glow = AIGlow.wrap(section);
    activeGlow = glow;
    var addAll = section.querySelector(".add-all-btn");
    if (addAll) glow.el.style.bottom = (section.offsetHeight - addAll.offsetTop + 12) + "px";
    var lead = inView ? 1300 : 1800; // the swirl thinks a moment first
    later(function () { trimSpinach(true); }, lead);
    later(function () {
      glow.stop();
      activeGlow = null;
      onDone && onDone();
    }, lead + 1400);
  }

  /* ---------- stage 5: bar → chat surface, Clove explains ---------- */
  function explain(onDone) {
    // any in-flight geometry animation jumps to its end first (a hidden tab
    // can leave the open-bar morph frozen on its first frame)
    bar.getAnimations().forEach(function (a) { try { a.finish(); } catch (e) {} });
    var first = bar.getBoundingClientRect();
    var w = wrapRect();
    you.textContent = UTTERANCE;
    // measure with the full reply in place so the card never jumps mid-stream
    resp.textContent = REPLY;
    resp.style.minHeight = "";
    wrap.classList.add("expanded");
    var last = bar.getBoundingClientRect();
    resp.style.minHeight = resp.offsetHeight + "px";
    resp.textContent = "";
    bar.animate(
      [
        { width: first.width + "px", height: first.height + "px", right: (w.right - first.right) + "px", borderRadius: "48px" },
        { width: last.width + "px", height: last.height + "px", right: (w.right - last.right) + "px", borderRadius: "32px" },
      ],
      { duration: 520, easing: SPRING }
    ).onfinish = function () { wrap.classList.add("settled"); };
    later(function () { wrap.classList.add("settled"); }, 200);
    later(function () {
      bar.classList.add("streaming");
      // keep the card sized as the reply grows: animate height deltas
      stream(resp, REPLY, function () {
        bar.classList.remove("streaming");
        if (scenario.confirmCta) {
          // ask first: Update recipe → the swirl trims the line → then the
          // plan offer arrives with its own CTA (never two CTAs at once)
          showCta({ label: scenario.confirmCta, onClick: function () {
            hideCta();
            trimUnderSwirl(function () {
              localStorage.setItem("cloveSpinachLess", "1");
              leftoverDone = true;
              later(function () {
                secondMessage(scenario.reply2, function () {
                  if (scenario.cta) showCta(scenario.cta);
                });
              }, 300);
            });
          } });
          onDone && onDone();
          return;
        }
        if (scenario.reply2) {
          // a beat, then the second message arrives as its own bubble of text
          later(function () { secondMessage(scenario.reply2, function () {
            if (scenario.cta) showCta(scenario.cta);
            onDone && onDone();
          }); }, 700);
          return;
        }
        if (scenario.cta) showCta(scenario.cta);
        onDone && onDone();
      });
    }, 520);
  }

  /* the second message: the card grows to make room, the text streams in */
  function secondMessage(text, onDone) {
    bar.getAnimations().forEach(function (a) { try { a.finish(); } catch (e) {} });
    var h0 = bar.offsetHeight;
    resp2.textContent = text;
    resp2.hidden = false;
    resp2.style.minHeight = resp2.offsetHeight + "px";
    resp2.textContent = "";
    var h1 = bar.offsetHeight;
    bar.animate([{ height: h0 + "px" }, { height: h1 + "px" }], { duration: 360, easing: SPRING });
    resp2.classList.add("streaming");
    later(function () {
      stream(resp2, text, function () {
        resp2.classList.remove("streaming");
        onDone && onDone();
      });
    }, 220);
  }

  /* the offer becomes a primary action inside the chat surface */
  function showCta(cta) {
    ctaBtn.textContent = cta.label;
    ctaBtn.classList.remove("busy");
    ctaBtn.onclick = function () {
      if (cta.onClick) { cta.onClick(); return; }
      ctaBtn.classList.add("busy");
      later(function () { location.href = cta.href; }, 220);
    };
    var h0 = bar.offsetHeight;
    ctaBtn.hidden = false;
    var h1 = bar.offsetHeight;
    // the card grows to make room, then the button springs in
    bar.animate([{ height: h0 + "px" }, { height: h1 + "px" }], { duration: 380, easing: SPRING });
    ctaBtn.animate(
      [{ opacity: 0, transform: "translateY(10px) scale(0.96)" }, { opacity: 1, transform: "none" }],
      { duration: 460, easing: "cubic-bezier(0.22, 1.3, 0.36, 1)", delay: 140, fill: "backwards" }
    );
  }

  /* only one CTA on screen: the confirmed one folds away before the next */
  function hideCta() {
    var h0 = bar.offsetHeight;
    ctaBtn.hidden = true;
    var h1 = bar.offsetHeight;
    bar.animate([{ height: h0 + "px" }, { height: h1 + "px" }], { duration: 320, easing: SPRING });
  }

  /* ---------- stage 6: memory ---------- */
  /* a health goal, not a memory: different colour + icon, Edit opens the tracker */
  function remember() {
    // (leftover take: cloveSpinachLess is set when the user confirms the trim)
    localStorage.setItem("cloveIronSwap", "1"); // the recipe stays higher in iron
    if (window.CloveGoals) CloveGoals.add("iron");
    // pinned: stays up until tapped, so there is no rush to hit Edit on camera
    CloveMemory.toast("Health goal: More iron", "Clove will cook toward it · tap Edit to track", { goal: true, pinned: true, href: "profile.html#goals" });
    // the meal-plan card earns its place now that there is a goal to plan for
    if (window.syncPlanBanner) {
      var pb = document.getElementById("planBanner");
      var wasHidden = pb && pb.hidden;
      window.syncPlanBanner();
      if (pb && wasHidden && !pb.hidden) pb.animate([{ opacity: 0, transform: "translateY(8px)" }, { opacity: 1, transform: "none" }], { duration: 420, easing: "cubic-bezier(0.22, 1.1, 0.36, 1)" });
    }
  }

  /* ---------- close: surface shrinks back into the button ---------- */
  function close() {
    if (state === "idle") return;
    clearTimers();
    if (activeGlow) { activeGlow.stop(); activeGlow = null; }
    var b = btnRect(), w = wrapRect();
    var cur = bar.getBoundingClientRect();
    wrap.classList.remove("on");
    bar.animate(
      [
        { width: cur.width + "px", height: cur.height + "px", right: (w.right - cur.right) + "px", bottom: (w.bottom - cur.bottom) + "px", borderRadius: wrap.classList.contains("expanded") ? "32px" : "48px", backgroundColor: "#ffffff" },
        { width: b.width + "px", height: b.height + "px", right: (w.right - b.right) + "px", bottom: (w.bottom - b.bottom) + "px", borderRadius: "48px", backgroundColor: "#bd53ea", opacity: 0.5 },
      ],
      { duration: 340, easing: "cubic-bezier(0.4, 0, 0.6, 1)" }
    ).onfinish = finishClose;
    // animations can stall in a backgrounded tab; never leave the surface half-closed
    setTimeout(finishClose, 420);
    function finishClose() {
      if (wrap.hidden) return;
      wrap.hidden = true;
      wrap.classList.remove("expanded", "settled");
      bar.className = "voice-bar";
      btn.style.opacity = "";
      state = "idle";
    }
  }

  /* ---------- the whole take ---------- */
  // which take comes next: after shopping it is the leftover one
  function nextScenario() {
    if (hasShopped()) return leftoverDone ? null : "leftover";
    return done ? null : "iron";
  }
  function run(which) {
    if (state === "running") return;
    which = which || nextScenario() || (hasShopped() ? "leftover" : "iron");
    scenario = SCENARIOS[which];
    UTTERANCE = scenario.utter; REPLY = scenario.reply;
    clearTimers();
    if (state === "open") { // replay: start clean
      wrap.hidden = true;
      wrap.classList.remove("on", "expanded", "settled");
      bar.className = "voice-bar";
      btn.style.opacity = "";
    }
    if (which === "iron") {
      if (done) resetRows();
      done = false;
    } else {
      // leftover replays start from the iron-swapped recipe
      resetRows();
      applyIronStatic();
      done = true;
      leftoverDone = false;
    }
    state = "running";
    openBar();
    later(function () {
      listen(function () {
        if (scenario === SCENARIOS.leftover) {
          // nothing changes until the user confirms: straight to the chat,
          // where "Update recipe" runs the trim
          bar.classList.remove("heard");
          explain(function () { state = "open"; });
          return;
        }
        rewrite(function () {
          done = true;
          explain(function () {
            later(remember, 500);
            state = "open";
          });
        });
      });
    }, 700);
  }

  /* ---------- triggers ---------- */
  // the pink button starts voice mode here (before chat.js sees the tap);
  // once the recipe has been rewritten the button goes back to opening chat
  document.addEventListener("click", function (e) {
    var hit = e.target.closest && e.target.closest(".chat-button");
    if (!hit) return;
    if (state === "running") { e.stopPropagation(); e.preventDefault(); return; }
    var which = nextScenario();
    if (!which) return; // nothing left to say here: normal chat
    e.stopPropagation();
    e.preventDefault();
    run(which);
  }, true);
  document.addEventListener("keydown", function (e) {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    var t = e.target;
    if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;
    if (e.key === "v" || e.key === "V") { e.preventDefault(); run(); }
    if (e.key === "Escape" && state !== "idle") close();
  });
  closeBtn.addEventListener("click", close);

  /* swipe the surface down to minimise it back into the clove button */
  (function () {
    var startY = 0, dy = 0, dragging = false, t0 = 0;
    var captured = false;
    bar.addEventListener("pointerdown", function (e) {
      if (wrap.hidden) return;
      e.stopPropagation(); // keep app.js's drag-to-scroll out of it
      dragging = true; captured = false; dy = 0; startY = e.clientY; t0 = e.timeStamp;
      bar.style.transition = "none";
      // no pointer capture yet: a plain tap must still click the button under it
    });
    bar.addEventListener("pointermove", function (e) {
      if (!dragging) return;
      e.stopPropagation();
      e.preventDefault();
      dy = Math.max(0, e.clientY - startY);
      if (!captured && dy > 6) { captured = true; try { bar.setPointerCapture(e.pointerId); } catch (err) {} }
      bar.style.transform = "translateY(" + dy + "px)";
      wrap.style.opacity = String(Math.max(0.35, 1 - dy / 360));
    });
    function end(e) {
      if (!dragging) return;
      dragging = false;
      var fast = dy > 24 && (e.timeStamp - t0) < 260;
      bar.style.transition = "transform 320ms cubic-bezier(0.22, 1, 0.36, 1)";
      wrap.style.opacity = "";
      if (dy > 90 || fast) {
        bar.style.transform = "";
        bar.style.transition = "";
        close();
      } else {
        bar.style.transform = "";
        setTimeout(function () { bar.style.transition = ""; }, 340);
      }
      dy = 0;
    }
    bar.addEventListener("pointerup", function (e) { e.stopPropagation(); end(e); });
    bar.addEventListener("pointercancel", end);
    // the page must not scroll under the finger while the sheet is being dragged
    bar.addEventListener("touchmove", function (e) { if (dragging) e.preventDefault(); }, { passive: false });
    // a drag should not count as a tap on anything inside
    bar.addEventListener("click", function (e) { if (dy > 8) { e.stopPropagation(); e.preventDefault(); } }, true);
  })();

  // Leaving the page (e.g. Edit → health tracker) and coming back via the
  // browser's back-forward cache would restore the expanded surface. Fold it
  // away on exit and make sure a restored page starts minimised.
  function resetSurface() {
    clearTimers();
    if (activeGlow) { activeGlow.stop(); activeGlow = null; }
    wrap.hidden = true;
    wrap.classList.remove("on", "expanded", "settled");
    bar.className = "voice-bar";
    btn.style.opacity = "";
    if (state !== "idle") state = "idle";
  }
  // a later visit: the recipe is already higher in iron (and, after the
  // leftover take, lighter on spinach)
  if (localStorage.getItem("cloveIronSwap") || hasShopped()) {
    applyIronStatic();
    done = true;
    if (localStorage.getItem("cloveSpinachLess")) { trimSpinach(false); leftoverDone = true; }
  }
  // ?leftover=1: the take starts by itself (presenting shortcut / FLOW step)
  if (forceLeftover) setTimeout(function () { run("leftover"); }, 900);

  window.addEventListener("pagehide", function () { if (state !== "idle") resetSurface(); });
  window.addEventListener("pageshow", function (e) { if (e.persisted && state !== "idle") resetSurface(); });
})();
