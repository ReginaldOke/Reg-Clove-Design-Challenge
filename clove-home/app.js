/* Clove prototype, shared behaviours */

// Carousels captured mid-scroll in the design; restore those offsets.
document.querySelectorAll("[data-scroll]").forEach(function (el) {
  el.scrollLeft = Number(el.dataset.scroll);
});

// Suggested prompts drift left forever: duplicate the set once and
// translate by exactly one set-width per loop so the seam is invisible.
(function () {
  var strip = document.querySelector(".prompt-rail__strip");
  if (!strip) return;
  var gap = 12;
  var setWidth = strip.scrollWidth + gap;
  strip.innerHTML += strip.innerHTML;
  strip.style.setProperty("--loop", setWidth + "px");
})();

// Drag-to-scroll with inertia, the page pans vertically and any
// carousel pans horizontally, like touch scrolling on a phone.
(function () {
  var active = false, dragged = false;
  var lastX = 0, lastY = 0, vx = 0, vy = 0, lastT = 0;
  var travel = 0; // total movement, a tap with a little jitter is NOT a drag
  var DRAG_THRESHOLD = 7;
  var rail = null, flick = null;

  document.addEventListener("dragstart", function (e) { e.preventDefault(); });

  document.addEventListener("pointerdown", function (e) {
    if (e.button !== 0) return;
    cancelAnimationFrame(flick);
    active = true; dragged = false; travel = 0;
    lastX = e.clientX; lastY = e.clientY; lastT = e.timeStamp;
    vx = 0; vy = 0;
    rail = e.target.closest(".rail");
    if (rail) rail.classList.add("dragging");
  });

  document.addEventListener("pointermove", function (e) {
    if (!active) return;
    var dx = e.clientX - lastX, dy = e.clientY - lastY;
    var dt = Math.max(1, e.timeStamp - lastT);
    vx = 0.8 * vx + 0.2 * (dx / dt);
    vy = 0.8 * vy + 0.2 * (dy / dt);
    lastX = e.clientX; lastY = e.clientY; lastT = e.timeStamp;
    travel += Math.abs(dx) + Math.abs(dy);
    if (travel <= DRAG_THRESHOLD) return; // still a tap, leave the click alone
    dragged = true;
    if (rail) rail.scrollLeft -= dx;
    window.scrollBy(0, -dy);
  });

  function release() {
    if (!active) return;
    active = false;
    var r = rail;
    if (r) r.classList.remove("dragging");
    rail = null;
    if (!dragged) return; // taps do not glide
    var t = performance.now();
    function glide(now) {
      var dt = now - t; t = now;
      vx *= Math.pow(0.995, dt); vy *= Math.pow(0.995, dt);
      if (Math.abs(vx) < 0.02 && Math.abs(vy) < 0.02) return;
      if (r) r.scrollLeft -= vx * dt;
      window.scrollBy(0, -vy * dt);
      flick = requestAnimationFrame(glide);
    }
    flick = requestAnimationFrame(glide);
  }
  document.addEventListener("pointerup", release);
  document.addEventListener("pointercancel", release);

  // A drag should not register as a tap on whatever it started over.
  document.addEventListener("click", function (e) {
    if (dragged) { e.preventDefault(); e.stopPropagation(); dragged = false; }
  }, true);
})();

// Wipe the demo state but keep the presenter-panel preferences alive.
function cloveResetState() {
  var keep = {
    open: localStorage.getItem("clovePanelOpen"),
    round: localStorage.getItem("clovePanelRound"),
  };
  localStorage.clear();
  sessionStorage.clear();
  if (keep.open !== null) localStorage.setItem("clovePanelOpen", keep.open);
  if (keep.round !== null) localStorage.setItem("clovePanelRound", keep.round);
}

// Recording helpers: "T" starts a CLEAN take from the TikTok entry point;
// "R" starts a clean take from the beginning of the RECIPE flow (the recipe
// as it lands after the import, which seeds the two import memories).
// State is reset either way, so each step only shows what it has earned.
document.addEventListener("keydown", function (e) {
  if (e.metaKey || e.ctrlKey || e.altKey) return;
  var k = e.key;
  if (k !== "r" && k !== "R" && k !== "t" && k !== "T") return;
  var t = e.target;
  if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;
  cloveResetState();
  location.href = (k === "t" || k === "T") ? "tiktok.html" : "recipe.html?saved=1";
});

// Presenting: arrow keys step forward/back through the first-mile flow
// (per the journey map: save from TikTok → recipe → plan → shop → compare → order).
(function () {
  // the recording script, in order: save → explore + serves memory →
  // memory card → iron take → goal tracker → plan → shop → compare →
  // nearby stores → woolies detail → aisle list → cook + leftover → plan
  var FLOW = [
    "tiktok.html",
    "tiktok.html?step=share",
    "tiktok.html?step=ios",
    "tiktok.html?step=import",
    "recipe.html?saved=1",
    "profile.html", // the memory card: see and adjust what Clove saved
    "recipe.html", // the voice take step: press V for the iron request
    "goals.html", // the health goal tracker + the pink plan nudge
    "plan.html?ask=1",
    "plan.html?planned=1",
    "groceries.html",
    "checkout.html", // Clove scans every store and delivery service
    "checkout.html?view=compare", // delivery services
    "checkout.html?view=compare&tab=pickup", // nearby stores + map
    "checkout.html?view=detail", // Woolies pickup detail, swipe hint
    "groceries.html?view=store", // the list regrouped by aisle
    "recipe.html?leftover=1",
    "plan.html?leftover=spinach",
  ];
  document.addEventListener("keydown", function (e) {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    var t = e.target;
    if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;
    var page = location.pathname.split("/").pop() || "index.html";
    var idx = FLOW.indexOf(page + location.search);
    if (idx === -1) {
      // same page, different state: snap to that page's first flow step
      for (var i = 0; i < FLOW.length; i++) {
        if (FLOW[i].split("?")[0] === page) { idx = i; break; }
      }
    }
    if (e.key === "ArrowRight") {
      e.preventDefault();
      if (idx === -1) location.href = FLOW[0];
      else if (idx < FLOW.length - 1) location.href = FLOW[idx + 1];
      else location.href = "index.html"; // the loop closes: home, ready to plan again
    } else {
      e.preventDefault();
      if (idx > 0) location.href = FLOW[idx - 1];
      else if (idx === 0) location.href = "index.html";
    }
  });
})();

// Recording helper: pressing "G" jumps to the grocery list (with its AI nudge).
document.addEventListener("keydown", function (e) {
  if (e.key !== "g" && e.key !== "G") return;
  if (e.metaKey || e.ctrlKey || e.altKey) return;
  var t = e.target;
  if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;
  location.href = "groceries.html";
});

// Recording helper: pressing "K" opens the health tracker (goals page).
document.addEventListener("keydown", function (e) {
  if (e.key !== "k" && e.key !== "K") return;
  if (e.metaKey || e.ctrlKey || e.altKey) return;
  var t = e.target;
  if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;
  location.href = "goals.html";
});

// Recording helper: pressing "P" starts the meal-planning flow from the top
// (empty week, the questions, then the plan builds).
document.addEventListener("keydown", function (e) {
  if (e.key !== "p" && e.key !== "P") return;
  if (e.metaKey || e.ctrlKey || e.altKey) return;
  var t = e.target;
  if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;
  location.href = "plan.html?ask=1";
});

// Recording helper: pressing "H" goes to the homepage.
document.addEventListener("keydown", function (e) {
  if (e.key !== "h" && e.key !== "H") return;
  if (e.metaKey || e.ctrlKey || e.altKey) return;
  var t = e.target;
  if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;
  location.href = "index.html";
});

// Recording helper: pressing "0" resets the demo state for a clean take.
document.addEventListener("keydown", function (e) {
  if (e.key !== "0" || e.metaKey || e.ctrlKey || e.altKey) return;
  var t = e.target;
  if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;
  cloveResetState();
  location.href = "index.html";
});

/* ============================================================
   Presenter controls (desktop): a minimal panel pinned to the
   right edge of the screen. Rounded-frame toggle plus the
   keyboard shortcuts, each a step with plain click-by-click
   pointers; the block for the CURRENT screen is highlighted and
   shows that screen's exact instructions. Collapses to a faint
   "Controls" pill bottom-right. Survives the R / T / 0 resets.
   ============================================================ */
(function () {
  if (window.self !== window.top) return; // never inside the demo iframes
  var KEYS = [
    { k: "T", name: "TikTok save", go: "reset:tiktok.html", pts: [
      "Click Share, then More, then Clove",
      "Two memories appear while it saves"] },
    { k: "R", name: "Recipe", go: "reset:recipe.html?saved=1", pts: [
      "Change serving size, a memory appears",
      "Click Edit on the memory to open it"] },
    { k: "V", name: "Voice note", go: "recipe.html", pts: [
      "Press V on the recipe page",
      "Clove swaps two ingredients, then adds a health goal"] },
    { k: "K", name: "Health tracker", go: "goals.html", pts: [
      "Click Edit on the health goal",
      "The tracker opens",
      "Click the pink nudge to plan meals"] },
    { k: "P", name: "Plan the week", go: "plan.html?ask=1", pts: [
      "Answer the two questions",
      "Clove fills the week with dinners"] },
    { k: "G", name: "Groceries", go: "groceries.html", pts: [
      "Click Start shopping",
      "Answer the questions, then compare stores"] },
    { k: "H", name: "Home", go: "index.html", pts: [
      "Click the health tracker card"] },
    { k: "←|→", name: "Step the flow", go: null, pts: [
      "Move through every screen in order"] },
  ];

  // which key block the current screen belongs to, and the exact
  // instructions to show there (plain click-by-click language)
  var SCREENS = [
    { key: "T", match: function (p, q) { return p === "tiktok.html"; }, pts: [
      "Click Share, then More, then Clove",
      "Two memories appear while it saves",
      "Click Open recipe in Clove"] },
    { key: "R", match: function (p, q) { return p === "recipe.html" && /saved=1/.test(q) && !sessionStorage.getItem("cloveSawMemories"); }, pts: [
      "Change serving size, a memory appears",
      "Click Edit on the memory to open it"] },
    { key: "R", match: function (p, q) { return p === "profile.html"; }, pts: [
      "Every memory Clove has saved so far",
      "Adjust any of them with its pencil",
      "Then go back to the recipe"] },
    { key: "V", match: function (p, q) { return p === "recipe.html" && /leftover=1/.test(q); }, pts: [
      "Click the purple clove button",
      "Click Update recipe",
      "Then click Update meal plan"] },
    { key: "V", match: function (p, q) { return p === "recipe.html"; }, pts: [
      "Press V to ask for more iron",
      "Clove swaps two ingredients, then adds a health goal",
      "Click Edit on the goal to see the tracker"] },
    { key: "K", match: function (p, q) { return p === "goals.html"; }, pts: [
      "Track your iron across the week",
      "Click the pink nudge to plan meals"] },
    { key: "P", match: function (p, q) { return p === "plan.html" && /ask=1/.test(q); }, pts: [
      "Pick days, then click the arrow",
      "Set targets, then click the arrow",
      "Clove fills the week with iron-rich dinners"] },
    { key: "P", match: function (p, q) { return p === "plan.html" && /leftover=spinach/.test(q); }, pts: [
      "Clove adds a spinach pasta dinner",
      "The chat confirms it, ready for the next loop",
      "Press the right arrow to land back on Home"] },
    { key: "P", match: function (p, q) { return p === "plan.html"; }, pts: [
      "Click Grocery List to shop the plan",
      "⋮ on a meal shows its options"] },
    { key: "G", match: function (p, q) { return p === "groceries.html" && /view=(store|aisle)/.test(q); }, pts: [
      "Aisles and product shots for your store",
      "Tick one item, the rest follow",
      "The cook tonight nudge appears"] },
    { key: "G", match: function (p, q) { return p === "groceries.html"; }, pts: [
      "Click Start shopping",
      "Pick a value, then set a budget"] },
    { key: "G", match: function (p, q) { return p === "checkout.html" && /detail/.test(q); }, pts: [
      "The swipe hint plays on the first card",
      "Swipe a card, tap for substitutes",
      "Click Shop this list at Woolies"] },
    { key: "G", match: function (p, q) { return p === "checkout.html" && /tab=pickup/.test(q); }, pts: [
      "Stores near you, prices and stock",
      "Click the small map to expand it",
      "Then click Woolworths Surry Hills"] },
    { key: "G", match: function (p, q) { return p === "checkout.html" && /compare/.test(q); }, pts: [
      "Delivery services and prices",
      "Click Nearby stores to shop in person"] },
    { key: "G", match: function (p, q) { return p === "checkout.html"; }, pts: [
      "Clove scans every store and delivery service nearby"] },
    { key: "H", match: function (p, q) { return p === "index.html" || p === ""; }, pts: [
      "Click the health tracker card"] },
  ];

  var page = location.pathname.split("/").pop() || "index.html";
  var query = location.search;
  // once the memory card has been seen, coming back to the saved recipe means
  // the take moves on: the panel highlights the voice note step instead
  if (page === "profile.html") { try { sessionStorage.setItem("cloveSawMemories", "1"); } catch (e) {} }
  var cur = null;
  for (var i = 0; i < SCREENS.length; i++) {
    if (SCREENS[i].match(page, query)) { cur = SCREENS[i]; break; }
  }

  function pts(list) {
    return '<ul class="cpts">' + list.map(function (x) { return "<li>" + x + "</li>"; }).join("") + "</ul>";
  }

  var panel = document.createElement("aside");
  panel.className = "cpanel";
  panel.innerHTML =
    '<div class="cpanel__head"><span>Prototype controls</span><button class="cpanel__min">Hide</button></div>' +
    '<label class="cpanel__round"><input type="checkbox" /><span class="cb"></span>Rounded corners</label>' +
    '<p class="cpanel__sec">Jump to a section</p>' +
    '<div class="cpanel__keys">' +
    KEYS.map(function (k) {
      var isCur = cur && cur.key === k.k;
      var caps = k.k.split("|").map(function (x) { return '<span class="key">' + x + "</span>"; }).join("");
      return '<div class="ckey' + (k.go ? " go" : "") + (isCur ? " cur" : "") + '"' + (k.go ? ' data-go="' + k.go + '"' : "") + ">" +
        '<div class="ckey__row">' + caps + '<span class="name">' + k.name + "</span></div>" +
        pts(isCur ? cur.pts : k.pts) +
        "</div>";
    }).join("") +
    "</div>";
  document.body.appendChild(panel);

  var pill = document.createElement("button");
  pill.className = "cpanel-pill";
  pill.textContent = "Controls";
  document.body.appendChild(pill);

  function setOpen(open) {
    document.body.classList.toggle("cpanel-open", open);
    localStorage.setItem("clovePanelOpen", open ? "1" : "0");
  }
  function pillTransform() {
    // where the pill sits relative to the panel, centre to centre
    var pr = panel.getBoundingClientRect();
    var gr = pill.getBoundingClientRect();
    var dx = gr.left + gr.width / 2 - (pr.left + pr.width / 2);
    var dy = gr.top + gr.height / 2 - (pr.top + pr.height / 2);
    return "translate(" + dx + "px, " + dy + "px) scale(" + gr.width / pr.width + ")";
  }
  panel.querySelector(".cpanel__min").addEventListener("click", function () {
    // the panel shrinks down into the Controls pill, then hands over
    var to = pillTransform();
    panel.animate(
      [{ transform: "none", opacity: 1 }, { transform: to, opacity: 0.15 }],
      { duration: 420, easing: "cubic-bezier(0.4, 0, 0.2, 1)" }
    ).onfinish = function () { setOpen(false); };
  });
  pill.addEventListener("click", function () {
    var from = pillTransform();
    setOpen(true);
    panel.animate(
      [{ transform: from, opacity: 0.15 }, { transform: "none", opacity: 1 }],
      { duration: 420, easing: "cubic-bezier(0.22, 1, 0.36, 1)" }
    );
  });
  // arriving at the front door (the server sends / here as tiktok.html?start=1):
  // the panel always greets open, even if it was hidden last session
  if (/[?&]start=1/.test(location.search)) {
    localStorage.setItem("clovePanelOpen", "1");
    try { history.replaceState(null, "", location.pathname); } catch (e) {}
  }
  setOpen(localStorage.getItem("clovePanelOpen") !== "0");

  var round = panel.querySelector(".cpanel__round input");
  function setRound(on) {
    // the class lives on <html>: frame.js applies it pre-paint on load
    document.documentElement.classList.toggle("frame-rounded", on);
    round.checked = on;
    localStorage.setItem("clovePanelRound", on ? "1" : "0");
  }
  round.addEventListener("change", function () { setRound(round.checked); });
  setRound(localStorage.getItem("clovePanelRound") === "1");

  // a key block is also a shortcut you can click
  panel.querySelectorAll(".ckey.go").forEach(function (b) {
    b.addEventListener("click", function () {
      var go = b.dataset.go;
      if (go.indexOf("reset:") === 0) { cloveResetState(); go = go.slice(6); }
      location.href = go;
    });
  });
})();

/* ============================================================
   Feature teasers (keys 1 / 2 / 3): looping ~10s animations of the
   three headline features, for the talking-head intro. Each plays a
   real slice of the prototype inside a framed stage, with a slow
   camera that zooms to the moment and taps through it. The demo runs
   in an iframe on a snapshotted copy of the app state, restored on
   every loop and on close, so it never disturbs the real take.
   Press the same number again, or Esc, to close; 1/2/3 switch.
   ============================================================ */
(function () {
  if (window.self !== window.top) return;

  var overlay = null, frame = null, cam = null, stage = null, cursor = null;
  var camS = 1, camTx = 0, camTy = 0; // the camera's current target transform
  var token = null, lsSnap = null, ssSnap = null;

  function snap(st) { var o = {}; for (var i = 0; i < st.length; i++) { var k = st.key(i); o[k] = st.getItem(k); } return o; }
  function restore(st, o) { st.clear(); Object.keys(o).forEach(function (k) { st.setItem(k, o[k]); }); }

  function build() {
    overlay = document.createElement("div");
    overlay.className = "demo-overlay";
    overlay.innerHTML =
      '<div class="demo-stage"><div class="demo-cam"><iframe class="demo-frame" title="Feature demo"></iframe></div><span class="demo-cursor"></span></div>';
    document.body.appendChild(overlay);
    stage = overlay.querySelector(".demo-stage");
    frame = overlay.querySelector(".demo-frame");
    cam = overlay.querySelector(".demo-cam");
    cursor = overlay.querySelector(".demo-cursor");
  }

  function doc() { return frame.contentDocument; }
  function wait(t, ms) { return new Promise(function (res) { setTimeout(function () { res(); }, ms); }).then(function () { if (!t.on) throw "off"; }); }
  function nav(t, url) {
    return new Promise(function (res) {
      frame.onload = function () { setTimeout(res, 80); };
      frame.src = url;
    }).then(function () { if (!t.on) throw "off"; });
  }
  function nextLoad(t) {
    return new Promise(function (res) { frame.onload = function () { setTimeout(res, 80); }; })
      .then(function () { if (!t.on) throw "off"; });
  }
  function zoom(el, s) {
    if (!el) { camS = 1; camTx = 0; camTy = 0; cam.style.transform = "none"; return; }
    var r = el.getBoundingClientRect();
    var cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    camS = s;
    camTx = stage.clientWidth / 2 - s * cx;
    camTy = stage.clientHeight / 2 - s * cy;
    cam.style.transform = "translate(" + camTx + "px," + camTy + "px) scale(" + s + ")";
  }
  // the recording cursor: the same soft circular mobile cursor Screen
  // Studio uses, gliding between targets and pressing to click
  var curX = 200, curY = 400, curShown = false;
  function placeCursor(x, y, ms) {
    cursor.style.transition = "transform " + ms + "ms cubic-bezier(0.3, 0, 0.15, 1), opacity 300ms ease";
    cursor.style.transform = "translate(" + (x - 23) + "px," + (y - 23) + "px)";
    curX = x; curY = y;
  }
  function tap(el, noClick) {
    if (!el) return;
    var r = el.getBoundingClientRect();
    // where the element sits on the stage once the camera settles
    var x = camTx + camS * (r.left + r.width / 2);
    var y = camTy + camS * (r.top + r.height / 2);
    if (!curShown) { placeCursor(x + 60, y + 90, 0); cursor.style.opacity = "1"; curShown = true; }
    var dist = Math.hypot(x - curX, y - curY);
    var glide = Math.max(350, Math.min(900, dist * 1.6));
    placeCursor(x, y, glide);
    setTimeout(function () { cursor.classList.add("press"); }, glide + 60);
    setTimeout(function () {
      cursor.classList.remove("press");
      if (!noClick) el.click();
    }, glide + 240);
  }
  var DEMOS = {
    "1": {
      label: "AI contextual nudges — no dead ends",
      prep: function () { localStorage.removeItem("clovePlanned"); },
      run: function (t) {
        return nav(t, "goals.html")
          .then(function () { return wait(t, 2100); }) // the nudge reveals at 1.5s
          .then(function () { zoom(doc().getElementById("glPlan"), 1.3); return wait(t, 1700); })
          .then(function () { tap(doc().getElementById("glPlan")); return nextLoad(t); })
          .then(function () { return wait(t, 1100); }) // the days question opens
          .then(function () { var g = doc().querySelector(".cask .go"); tap(g); return wait(t, 1300); })
          .then(function () { var g = doc().querySelector(".cask .go"); tap(g); return wait(t, 900); })
          .then(function () { zoom(null); return wait(t, 4600); }); // the week builds itself
      },
    },
    "2": {
      label: "AI memory — Clove learns as you cook",
      prep: function () {},
      run: function (t) {
        return nav(t, "recipe.html?saved=1")
          .then(function () { return wait(t, 900); })
          .then(function () {
            var st = doc().querySelector(".stepper");
            st.scrollIntoView({ block: "center" });
            zoom(st, 1.3);
            return wait(t, 1400);
          })
          .then(function () { tap(doc().querySelector('.stepper button[aria-label="Fewer"]')); return wait(t, 1100); })
          .then(function () { tap(doc().querySelector('.stepper button[aria-label="Fewer"]')); return wait(t, 1300); }) // 6 → 4
          .then(function () { zoom(doc().querySelector(".mem-toast"), 1.25); return wait(t, 2000); })
          .then(function () { return nav(t, "profile.html"); })
          .then(function () { zoom(null); return wait(t, 900); })
          .then(function () { zoom(doc().getElementById("memoryCard"), 1.08); return wait(t, 1100); })
          .then(function () {
            var rows = Array.prototype.slice.call(doc().querySelectorAll("#memoryCard .memory-edit"));
            var row = rows.filter(function (b) { var wrap = b.closest("div"); return /Cooks for/.test(wrap && wrap.parentNode.textContent || ""); })[0] || rows[0];
            tap(row);
            return wait(t, 1200);
          })
          .then(function () { zoom(null); return wait(t, 500); })
          .then(function () { tap(doc().querySelector('.iw-stepper .step-btn[data-d="-1"]')); return wait(t, 1000); })
          .then(function () { tap(doc().querySelector('.iw-stepper .step-btn[data-d="-1"]')); return wait(t, 1600); });
      },
    },
    "3": {
      label: "Grocery shopping — compare, map, shop the aisles",
      prep: function () {
        ["cloveStoreName", "cloveStore", "cloveStoreOn", "cloveOrdered", "cloveShopped"].forEach(function (k) { localStorage.removeItem(k); });
      },
      run: function (t) {
        return nav(t, "groceries.html")
          .then(function () { return wait(t, 1000); })
          .then(function () { zoom(doc().getElementById("shopCta"), 1.25); return wait(t, 1300); })
          .then(function () { tap(doc().getElementById("shopCta"), true); return wait(t, 500); })
          .then(function () { return nav(t, "checkout.html"); }) // Clove scans the stores
          .then(function () { zoom(null); return wait(t, 3300); })
          .then(function () { return nav(t, "checkout.html?view=compare&tab=pickup"); })
          .then(function () { return wait(t, 1300); })
          .then(function () { zoom(doc().getElementById("mapMini"), 1.25); return wait(t, 1100); })
          .then(function () { tap(doc().getElementById("mapMini")); zoom(null); return wait(t, 2800); })
          .then(function () {
            // the Woolies pin closes the map and opens that store's detail
            var pins = doc().querySelectorAll("#mapSheet .co-pin");
            var pin = Array.prototype.filter.call(pins, function (p) {
              return p.querySelector('img[src*="woolworths"]');
            })[0];
            tap(pin || doc().querySelector('.retailer-card[data-retailer="Woolworths Surry Hills"]'));
            return wait(t, 4000); // prices, stock and the swipe-to-swap hint
          });
      },
    },
  };

  function stop() {
    if (token) token.on = false;
    token = null;
  }
  function close() {
    stop();
    if (overlay) overlay.classList.remove("on");
    if (frame) frame.src = "about:blank";
    if (lsSnap) { restore(localStorage, lsSnap); restore(sessionStorage, ssSnap); lsSnap = ssSnap = null; }
    current = null;
  }
  var current = null;
  function start(n) {
    if (!overlay) build();
    if (!lsSnap) { lsSnap = snap(localStorage); ssSnap = snap(sessionStorage); }
    stop();
    var t = { on: true };
    token = t;
    current = n;
    overlay.classList.add("on");
    (function loop() {
      if (!t.on) return;
      // every pass starts from the same snapshotted state
      restore(localStorage, lsSnap);
      restore(sessionStorage, ssSnap);
      DEMOS[n].prep();
      cam.style.transition = "none";
      cam.style.transform = "none";
      camS = 1; camTx = 0; camTy = 0;
      void cam.offsetWidth;
      cam.style.transition = "";
      cursor.style.opacity = "0";
      curShown = false;
      DEMOS[n].run(t).then(
        function () { if (t.on) setTimeout(loop, 1000); },
        function () {} // cancelled mid-run
      );
    })();
  }

  document.addEventListener("keydown", function (e) {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    var el = e.target;
    if (el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable)) return;
    if (e.key === "Escape" && current) { close(); return; }
    if (!DEMOS[e.key]) return;
    e.preventDefault();
    if (current === e.key) close();
    else start(e.key);
  });
})();
