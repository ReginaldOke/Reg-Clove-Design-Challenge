/* Memory edit pickers. Figma InputWidget patterns */
(function () {
  var overlay = document.createElement("div");
  overlay.className = "picker-overlay";
  overlay.innerHTML =
    '<div class="picker-overlay__scrim"></div>' +
    '<div class="iw">' +
    '  <div class="iw__content">' +
    '    <div class="iw__header">' +
    '      <div class="hgroup">' +
    '        <span class="iw__count" hidden></span>' +
    '        <p class="iw__q"></p>' +
    '        <p class="iw__sub" hidden></p>' +
    "      </div>" +
    '      <button class="iw__close" aria-label="Close"><span class="ico ico-24"><img src="assets/icons/x.svg" alt="" style="width:14px;height:14px" /></span></button>' +
    "    </div>" +
    '    <div class="iw__body"></div>' +
    "  </div>" +
    '  <div class="iw__footer">' +
    '    <input type="text" placeholder="Something else" aria-label="Something else" />' +
    '    <button class="iw__skip" hidden>Skip</button>' +
    '    <button class="iw__submit" aria-label="Save"><span class="ico ico-24"><img src="assets/icons/arrow-up-white.svg" alt="" style="width:16px;height:19px" /></span></button>' +
    "  </div>" +
    '  <button class="iw__save">Save</button>' +
    "</div>";
  overlay.setAttribute("aria-hidden", "true");
  overlay.inert = true;
  document.body.appendChild(overlay);

  var q = overlay.querySelector(".iw__q");
  var sub = overlay.querySelector(".iw__sub");
  var count = overlay.querySelector(".iw__count");
  var body = overlay.querySelector(".iw__body");
  var skip = overlay.querySelector(".iw__skip");
  var saveBtn = overlay.querySelector(".iw__save");
  var current = null; // { row, config, getValue }

  // Save is always there and stays still; changes just mark the sheet dirty
  function markDirty() { saveBtn.classList.add("dirty"); }
  body.addEventListener("click", function () { setTimeout(markDirty, 0); });

  /* ------------------------------------------------------------
     Sheet builders, return a getValue() used on submit
     ------------------------------------------------------------ */
  function buildStepper(cfg) {
    body.innerHTML =
      '<div class="iw-plates" aria-hidden="true"></div>' +
      '<div class="iw-stepper">' +
      '  <button class="step-btn" data-d="-1"><span class="ico ico-24"><img src="assets/icons/minus.svg" alt="" style="width:16px;height:2px" /></span></button>' +
      '  <span class="val"></span>' +
      '  <button class="step-btn" data-d="1"><span class="ico ico-24"><img src="assets/icons/add.svg" alt="" style="width:13.7px;height:13.7px" /></span></button>' +
      "</div>";
    var v = cfg.value;
    var val = body.querySelector(".val");
    var plates = body.querySelector(".iw-plates");
    // one plate per person: the newest pops in, a removed one shrinks and
    // slips away while the row re-centres; plates shrink as the table grows
    function drawPlates() {
      if (!plates) return;
      var n = Math.max(1, Math.min(12, v));
      var size = n <= 3 ? 88 : n <= 5 ? 72 : n <= 8 ? 56 : 44;
      var live = Array.prototype.filter.call(plates.children, function (p) { return !p.classList.contains("leaving"); });
      if (n < live.length) {
        live.slice(n).forEach(function (p, i) {
          p.classList.add("leaving");
          setTimeout(function () { p.remove(); }, 380 + i * 50);
        });
      } else {
        for (var k = live.length; k < n; k++) { var p = document.createElement("span"); p.className = "plate"; p.textContent = "🥗"; plates.appendChild(p); }
      }
      plates.style.setProperty("--size", size + "px");
    }
    function render() { val.textContent = v + " " + (v === 1 ? cfg.unit[0] : cfg.unit[1]); drawPlates(); }
    body.querySelectorAll(".step-btn").forEach(function (b) {
      b.addEventListener("click", function () {
        v = Math.min(cfg.max, Math.max(cfg.min, v + Number(b.dataset.d)));
        render();
      });
    });
    render();
    return function () { return v; };
  }

  function buildRuler(cfg) {
    var TICKS = 21, MID = 10;
    var idx = Math.round((cfg.value - cfg.min) / cfg.step);
    body.innerHTML =
      '<div class="iw-ruler-wrap">' +
      '  <span class="pointer"></span>' +
      '  <p class="big-val"></p>' +
      '  <div class="iw-ruler">' + Array(TICKS).fill("<i></i>").join("") + "</div>" +
      "</div>";
    var bigVal = body.querySelector(".big-val");
    var ruler = body.querySelector(".iw-ruler");
    var ticks = [].slice.call(ruler.children);
    function render() {
      bigVal.textContent = cfg.fmt(cfg.min + idx * cfg.step);
      ticks.forEach(function (t, i) {
        t.className = i === idx ? "on" : (i % 5 === 0 ? "major" : "");
      });
    }
    function pick(clientX) {
      var r = ruler.getBoundingClientRect();
      var i = Math.round(((clientX - r.left) / r.width) * (TICKS - 1));
      idx = Math.min(TICKS - 1, Math.max(0, i));
      render();
    }
    var dragging = false;
    ruler.addEventListener("pointerdown", function (e) { dragging = true; pick(e.clientX); e.stopPropagation(); });
    window.addEventListener("pointermove", function (e) { if (dragging) pick(e.clientX); });
    window.addEventListener("pointerup", function () { dragging = false; });
    render();
    return function () { return cfg.min + idx * cfg.step; };
  }

  function buildOptions(cfg) {
    body.innerHTML =
      '<div class="iw-options">' +
      cfg.options
        .map(function (o, i) {
          return (
            '<button class="iw-option' + (i === cfg.value ? " on" : "") + '" data-i="' + i + '">' +
            '<span class="t">' + o[0] + "</span>" +
            '<span class="s">' + o[1] + "</span>" +
            "</button>"
          );
        })
        .join("") +
      "</div>";
    var sel = cfg.value;
    body.querySelectorAll(".iw-option").forEach(function (b) {
      b.addEventListener("click", function () {
        sel = Number(b.dataset.i);
        body.querySelectorAll(".iw-option").forEach(function (x) { x.classList.remove("on"); });
        b.classList.add("on");
      });
    });
    return function () { return cfg.options[sel][0]; };
  }

  function buildRank(cfg) {
    body.innerHTML =
      '<div class="iw-rank">' +
      cfg.items
        .map(function (t) {
          return (
            '<div class="iw-rank__row">' +
            '<span class="n"></span><span class="t">' + t + "</span>" +
            '<span class="grip"><i></i><i></i><i></i><i></i><i></i><i></i></span>' +
            "</div>"
          );
        })
        .join("") +
      "</div>";
    var list = body.querySelector(".iw-rank");
    function renumber() {
      [].slice.call(list.children).forEach(function (r, i) {
        r.querySelector(".n").textContent = i + 1;
      });
    }
    // pointer drag to reorder
    var lifted = null, startY = 0;
    list.addEventListener("pointerdown", function (e) {
      var row = e.target.closest(".iw-rank__row");
      if (!row) return;
      lifted = row; startY = e.clientY;
      row.classList.add("lifting");
      row.setPointerCapture && row.setPointerCapture(e.pointerId);
      e.stopPropagation();
    });
    window.addEventListener("pointermove", function (e) {
      if (!lifted) return;
      lifted.style.transform = "scale(1.03) translateY(" + (e.clientY - startY) + "px)";
      var rows = [].slice.call(list.children).filter(function (r) { return r !== lifted; });
      var lr = lifted.getBoundingClientRect();
      var mid = lr.top + lr.height / 2;
      for (var i = 0; i < rows.length; i++) {
        var rr = rows[i].getBoundingClientRect();
        if (mid < rr.top + rr.height / 2) {
          if (rows[i].previousElementSibling !== lifted) {
            list.insertBefore(lifted, rows[i]);
            startY = e.clientY; lifted.style.transform = "scale(1.03)";
            renumber();
          }
          return;
        }
      }
      if (list.lastElementChild !== lifted) {
        list.appendChild(lifted);
        startY = e.clientY; lifted.style.transform = "scale(1.03)";
        renumber();
      }
    });
    window.addEventListener("pointerup", function () {
      if (!lifted) return;
      lifted.classList.remove("lifting");
      lifted.style.transform = "";
      lifted = null;
    });
    renumber();
    return function () {
      return [].slice.call(list.querySelectorAll(".t")).map(function (t) { return t.textContent; });
    };
  }

  function buildMacros(cfg) {
    body.innerHTML =
      '<div class="iw-macros">' +
      cfg.rows
        .map(function (r, i) {
          return (
            '<div class="iw-macro" data-i="' + i + '">' +
            '<span class="lbl">' + r.label + "</span>" +
            '<span class="pill">' +
            '<button data-d="-1" aria-label="Less"><span class="ico ico-16"><img src="assets/icons/minus.svg" alt="" style="width:12px;height:2px" /></span></button>' +
            '<span class="v"></span>' +
            '<button data-d="1" aria-label="More"><span class="ico ico-16"><img src="assets/icons/add.svg" alt="" style="width:11px;height:11px" /></span></button>' +
            "</span></div>"
          );
        })
        .join("") +
      "</div>";
    var vals = cfg.rows.map(function (r) { return r.value; });
    function render() {
      body.querySelectorAll(".iw-macro").forEach(function (m, i) {
        m.querySelector(".v").textContent = vals[i] + cfg.rows[i].unit;
      });
    }
    body.querySelectorAll(".iw-macro button").forEach(function (b) {
      b.addEventListener("click", function () {
        var i = Number(b.closest(".iw-macro").dataset.i);
        vals[i] = Math.max(0, vals[i] + Number(b.dataset.d) * cfg.rows[i].step);
        render();
      });
    });
    render();
    return function () { return vals; };
  }

  var BUILDERS = { stepper: buildStepper, ruler: buildRuler, options: buildOptions, rank: buildRank, macros: buildMacros };

  /* ------------------------------------------------------------
     Memory → sheet configs
     ------------------------------------------------------------ */
  var SHEETS = {
    taste: {
      type: "options",
      q: "How do you feel about cilantro?",
      options: [
        ["Love it", "Pile it on everything"],
        ["Take it or leave it", "Fine in small doses"],
        ["No cilantro, ever", "Leave it out of every recipe"],
      ],
      value: 2,
      apply: function (row, v) { row.querySelector(".m").textContent = v === "Love it" ? "Loves cilantro" : v; },
    },
    goal: {
      type: "macros",
      q: "What are your daily nutritional macro targets?",
      count: "2/5",
      skip: true,
      rows: [
        { label: "Calories", value: 550, step: 25, unit: "kcal" },
        { label: "Protein", value: 180, step: 5, unit: "g" },
        { label: "Fat", value: 120, step: 5, unit: "g" },
        { label: "Carbohydrates", value: 130, step: 5, unit: "g" },
      ],
      apply: function (row, v) {
        row.querySelector(".m").textContent = "Aiming for " + v[1] + "g protein a day";
      },
    },
    habit: {
      type: "options",
      q: "Which best describes how you decide what to eat?",
      options: [
        ["Meal planner", "I make a plan each week and stick to it"],
        ["Meal prepper", "I prep meals ahead for the week"],
        ["Free spirit", "I make whatever I’m feeling on the day"],
      ],
      value: 0,
      apply: function (row, v) {
        row.querySelector(".k").textContent = "Habit · " + v.toLowerCase() + ", updated just now";
      },
    },
    household: {
      type: "stepper",
      q: "How many people are you usually cooking dinner for?",
      value: 3,
      min: 1,
      max: 12,
      unit: ["person", "people"],
      apply: function (row, v) {
        row.querySelector(".k").textContent = "Household · cooking for " + v + ", updated just now";
      },
    },
    budget: {
      type: "ruler",
      q: "What’s your rough weekly budget for groceries?",
      count: "2/5",
      skip: true,
      min: 20,
      step: 10,
      value: 120,
      fmt: function (v) { return "$" + v; },
      apply: function (row, v) {
        row.querySelector(".m").textContent = "Grocery budget about $" + v + " a week";
      },
    },
    pantry: {
      type: "rank",
      q: "When it comes to produce, what’s most important to you?",
      sub: "Rank these in order",
      count: "2/5",
      skip: true,
      items: ["Quality", "Organic and ethical sourcing", "Price", "Value"],
      apply: function (row, v) {
        row.querySelector(".k").textContent = "Pantry · " + v[0].toLowerCase() + " first, updated just now";
      },
    },
  };

  function openPicker(key, row, patch) {
    var cfg = SHEETS[key];
    if (patch) cfg = Object.assign({}, cfg || {}, patch);
    if (!cfg || !cfg.type) return;
    q.textContent = cfg.q;
    sub.hidden = !cfg.sub;
    if (cfg.sub) sub.textContent = cfg.sub;
    count.hidden = !cfg.count;
    if (cfg.count) count.textContent = cfg.count;
    skip.hidden = !cfg.skip;
    saveBtn.classList.remove("dirty");
    overlay.querySelector(".iw__footer input").value = "";
    var getValue = BUILDERS[cfg.type](cfg);
    current = { row: row, cfg: cfg, getValue: getValue };
    overlay.inert = false;
    overlay.removeAttribute("aria-hidden");
    overlay.classList.add("open");
  }

  function closePicker() {
    overlay.classList.remove("open");
    overlay.setAttribute("aria-hidden", "true");
    overlay.inert = true;
    current = null;
  }

  overlay.querySelector(".picker-overlay__scrim").addEventListener("click", closePicker);
  overlay.querySelector(".iw__close").addEventListener("click", closePicker);
  skip.addEventListener("click", closePicker);
  overlay.querySelector(".iw__footer input").addEventListener("input", markDirty);
  function doSave() {
    if (current) {
      var free = overlay.querySelector(".iw__footer input").value.trim();
      if (free) {
        current.row.querySelector(".m").textContent = free;
        current.row.querySelector(".k").textContent =
          current.row.querySelector(".k").textContent.split("·")[0].trim() + " · you told Clove just now";
      } else {
        current.cfg.apply(current.row, current.getValue());
      }
      // little confirmation pulse on the row
      var row = current.row;
      row.animate(
        [{ background: "rgba(233,247,200,0.9)" }, { background: "rgba(233,247,200,0)" }],
        { duration: 900, easing: "ease-out" }
      );
      sessionStorage.setItem("memoryEdited", "1");
    }
    closePicker();
  }
  overlay.querySelector(".iw__submit").addEventListener("click", doSave);
  saveBtn.addEventListener("click", doSave);
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") closePicker();
  });

  /* wire the edit buttons */
  document.querySelectorAll(".memory-row").forEach(function (row) {
    var btn = row.querySelector(".memory-edit");
    if (!btn) return;
    btn.addEventListener("click", function () {
      openPicker(row.dataset.picker, row);
    });
  });

  /* flow-added rows (created after this script runs) open pickers too */
  window.ClovePicker = { open: openPicker };

  /* collapsible memory card. Toggled on pointerup with its own tap
     tolerance: the page's drag-to-scroll handler suppresses click events
     for any press that drifts a few pixels, which used to eat the first
     tap on the chevron now and then. */
  var toggle = document.querySelector(".memory-toggle");
  if (toggle) {
    var toggleCard = function () {
      var mc = document.getElementById("memoryCard");
      mc.classList.toggle("collapsed");
      toggle.setAttribute("aria-expanded", mc.classList.contains("collapsed") ? "false" : "true");
    };
    var downAt = null;
    toggle.addEventListener("pointerdown", function (e) { downAt = { x: e.clientX, y: e.clientY }; });
    toggle.addEventListener("pointerup", function (e) {
      if (!downAt) return;
      var moved = Math.abs(e.clientX - downAt.x) + Math.abs(e.clientY - downAt.y);
      downAt = null;
      if (moved < 24) toggleCard(); // a tap, even a slightly jittery one
    });
    // keyboard activation still comes through as a detail-less click
    toggle.addEventListener("click", function (e) { if (e.detail === 0) toggleCard(); });
  }
})();
