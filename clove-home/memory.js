/* Clove memory, shared helpers for the first-mile flow.
   Memories captured anywhere in the prototype land in localStorage and
   surface on the profile memory card. */
(function () {
  window.CloveMemory = {
    add: function (icon, text, kind) {
      var list = JSON.parse(localStorage.getItem("cloveMemV2") || "[]");
      if (list.some(function (m) { return m.text === text; })) return;
      list.push({ icon: icon, text: text, kind: kind, t: Date.now() });
      localStorage.setItem("cloveMemV2", JSON.stringify(list));
      var fresh = this._freshRaw();
      fresh = fresh.filter(function (e) { return e.text !== text; });
      fresh.push({ text: text, t: Date.now() });
      localStorage.setItem("cloveMemNewV2", JSON.stringify(fresh));
    },
    // memories the flow no longer produces; scrubbed from old storage so they
    // never reappear on the memory card
    RETIRED: ["Loves a fresh, crunchy salad", "Health goal: lighter, higher-protein swaps"],
    all: function () {
      var self = this;
      var list = JSON.parse(localStorage.getItem("cloveMemV2") || "[]");
      var kept = list.filter(function (e) { return self.RETIRED.indexOf(e.text) === -1; });
      if (kept.length !== list.length) localStorage.setItem("cloveMemV2", JSON.stringify(kept));
      return kept;
    },
    /* newest first, by capture time — the order the memory card renders in */
    newestFirst: function () {
      return this.all().sort(function (a, b) { return (b.t || 0) - (a.t || 0); });
    },
    _freshRaw: function () {
      // tolerate the old plain-string format
      return JSON.parse(localStorage.getItem("cloveMemNewV2") || "[]").map(function (e) {
        return typeof e === "string" ? { text: e, t: 0 } : e;
      });
    },
    /* only the most recent batch of additions counts as fresh —
       anything added more than 8s before the newest is an older step */
    fresh: function () {
      var raw = this._freshRaw();
      if (!raw.length) return [];
      var maxT = raw.reduce(function (m, e) { return Math.max(m, e.t); }, 0);
      return raw.filter(function (e) { return e.t >= maxT - 8000; }).map(function (e) { return e.text; });
    },
    markSeen: function (text) {
      var fresh = this._freshRaw().filter(function (e) { return e.text !== text; });
      localStorage.setItem("cloveMemNewV2", JSON.stringify(fresh));
    },
    update: function (oldText, newText, newKind) {
      var list = JSON.parse(localStorage.getItem("cloveMemV2") || "[]");
      list.forEach(function (m) {
        if (m.text === oldText) {
          m.text = newText;
          if (newKind) m.kind = newKind;
        }
      });
      localStorage.setItem("cloveMemV2", JSON.stringify(list));
      var fresh = this._freshRaw().map(function (e) {
        if (e.text === oldText) e.text = newText;
        return e;
      });
      localStorage.setItem("cloveMemNewV2", JSON.stringify(fresh));
    },
    remove: function (text) {
      var list = JSON.parse(localStorage.getItem("cloveMemV2") || "[]").filter(function (m) { return m.text !== text; });
      localStorage.setItem("cloveMemV2", JSON.stringify(list));
      this.markSeen(text);
    },
    /* put a removed memory back exactly as it was (undo) */
    restore: function (entry) {
      var list = JSON.parse(localStorage.getItem("cloveMemV2") || "[]");
      if (list.some(function (m) { return m.text === entry.text; })) return;
      list.push(entry);
      localStorage.setItem("cloveMemV2", JSON.stringify(list));
    },
    /* one memory per family: drop older variants (prefix string or RegExp)
       before adding, so re-answering never stacks duplicates */
    replace: function (match, icon, text, kind) {
      var self = this;
      this.all().forEach(function (m) {
        var hit = match.test ? match.test(m.text) : m.text.indexOf(match) === 0;
        if (hit) self.remove(m.text);
      });
      this.add(icon, text, kind);
    },
    // One toast at a time. Memories that land while a toast is still up
    // fold into it: "N memories added" + short summaries in the sub line.
    // opts.short = compact summary used when folded (defaults to text).
    toast: function (text, kind, opts) {
      opts = opts || {};
      var t = document.querySelector(".mem-toast");
      if (!t) {
        t = document.createElement("div");
        t.className = "mem-toast";
        t.innerHTML =
          '<span class="mem-toast__spark"><img src="assets/icons/clove-sparkle.svg" alt="" /></span>' +
          '<span class="mem-toast__text"><b></b><span class="k"></span></span>' +
          '<a class="mem-toast__edit" href="profile.html">Edit</a>';
        document.body.appendChild(t);
        // pinned toasts wait for the user: a tap anywhere but Edit dismisses
        t.addEventListener("click", function (e) {
          if (!t._pinned) return;
          if (e.target.closest && e.target.closest(".mem-toast__edit")) return;
          t.classList.remove("show");
          t._batch = null;
          document.body.classList.remove("has-toast");
        });
      }
      // health-goal variant: green disc + heart-pulse icon, Edit → the goals tracker
      t.classList.toggle("mem-toast--goal", !!opts.goal);
      t.querySelector(".mem-toast__spark img").src = opts.goal ? "assets/icons/heart-sparkle-white.svg" : "assets/icons/clove-sparkle.svg";
      t.querySelector(".mem-toast__edit").href = opts.href || (opts.goal ? "profile.html#goals" : "profile.html");
      var item = { text: text, short: opts.short || text };
      if (t.classList.contains("show") && t._batch) t._batch.push(item);
      else t._batch = [item];
      if (t._batch.length > 1) {
        t.classList.remove("mem-toast--plain");
        t.querySelector("b").textContent = t._batch.length + " memories added";
        t.querySelector(".k").textContent = t._batch.map(function (i) { return i.short; }).join(" · ");
      } else {
        // a single memory is one line, the label light and the fact bold:
        // "Memory: Cooks for 2", "Health goal: More iron"
        t.classList.add("mem-toast--plain");
        var full = opts.goal ? text : "Memory: " + text;
        var b = t.querySelector("b");
        b.textContent = "";
        var cut = full.indexOf(": ") + 2;
        var pfx = document.createElement("span");
        pfx.className = "pfx";
        pfx.textContent = full.slice(0, cut);
        b.appendChild(pfx);
        b.appendChild(document.createTextNode(full.slice(cut)));
        t.querySelector(".k").textContent = "";
      }
      clearTimeout(t._hide);
      t._pinned = !!opts.pinned;
      // restart entrance (body.has-toast lets page headers make room under it)
      t.classList.remove("show");
      void t.offsetWidth;
      t.classList.add("show");
      document.body.classList.add("has-toast");
      // pinned: stays up until the user taps it (or Edit), no timer
      if (!opts.pinned) t._hide = setTimeout(function () { t.classList.remove("show"); t._batch = null; document.body.classList.remove("has-toast"); }, opts.duration || (opts.sticky ? 12000 : 5600));
    },
    // Several memories at once: a single toast, "N memories added".
    toastMany: function (items, opts) {
      var self = this;
      items.forEach(function (i, idx) {
        self.toast(i.text, i.kind, { short: i.short, sticky: opts && opts.sticky, duration: opts && opts.duration });
      });
    },
  };

  /* Coming BACK to a page from the bfcache (e.g. after tapping a toast's
     Edit and returning): a toast frozen mid-display would flash and then
     animate away. Kill it instantly, with no exit transition. */
  window.addEventListener("pageshow", function (e) {
    if (!e.persisted) return;
    var t = document.querySelector(".mem-toast");
    if (!t) return;
    clearTimeout(t._hide);
    t.style.transition = "none";
    t.classList.remove("show");
    t._batch = null;
    document.body.classList.remove("has-toast");
    void t.offsetWidth;
    t.style.transition = "";
  });

  /* AI activity glow: start() while AI works a page, stop() the moment
     it finishes. Never left running after a task completes. */
  window.AIGlow = {
    _el: null,
    start: function (opts) {
      var el = this._el;
      if (!el) {
        el = document.createElement("div");
        el.className = "ai-glow";
        el.innerHTML = '<i class="a"></i><i class="b"></i><i class="c"></i>';
        document.body.appendChild(el);
        this._el = el;
      }
      el.classList.toggle("behind", !!(opts && opts.behind));
      void el.offsetWidth; // commit before fading in
      el.classList.add("on");
    },
    stop: function () {
      if (this._el) this._el.classList.remove("on");
    },
    // Same swirl, but wrapped around ONE element (e.g. the ingredients
    // section) instead of the whole phone. Returns {stop}.
    wrap: function (host) {
      var el = document.createElement("div");
      el.className = "ai-glow-local";
      el.innerHTML = '<i class="a"></i><i class="b"></i><i class="c"></i>';
      if (getComputedStyle(host).position === "static") host.style.position = "relative";
      host.appendChild(el);
      void el.offsetWidth;
      el.classList.add("on");
      return {
        el: el,
        stop: function () {
          el.classList.remove("on");
          setTimeout(function () { el.remove(); }, 760);
        },
      };
    },
  };
})();
