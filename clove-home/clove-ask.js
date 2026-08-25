/* Clove asks, ambient nudges from the clove button.
   Starts as a small pill just above the clove icon; tapping the pill or
   the clove icon expands it into the full card (or a custom sheet).
   Swipe down to dismiss. */
(function () {
  var SPRING = "cubic-bezier(0.24, 1.1, 0.32, 1)";

  window.CloveAsk = {
    /* swap the question inside an open card: fade out, mutate, grow to the
       new height, fade in (the same move plan.html uses between questions) */
    swap: function (cask, mutate) {
      var wrap = cask.el.querySelector(".cask__body > div");
      var inner = cask.el.querySelector(".cask__inner");
      var h0 = wrap.offsetHeight;
      inner.animate([{ opacity: 1 }, { opacity: 0, transform: "translateY(-8px)" }], { duration: 150, easing: "ease-in" }).onfinish = function () {
        mutate();
        var h1 = wrap.offsetHeight;
        wrap.animate([{ height: h0 + "px" }, { height: h1 + "px" }], { duration: 380, easing: SPRING });
        inner.animate(
          [{ opacity: 0, transform: "translateY(10px)" }, { opacity: 1, transform: "none" }],
          { duration: 300, easing: "ease-out", delay: 70, fill: "backwards" }
        );
      };
    },
    show: function (cfg) {
      var old = document.querySelector(".cask");
      if (old) old.remove();

      var el = document.createElement("div");
      el.className = "cask mini";
      el.innerHTML =
        '<div class="cask__row">' +
        '  <span class="cask__spark"><img src="assets/icons/clove-white.svg" alt="" /></span>' +
        '  <span class="cask__text">' +
        '    <span class="cask__title"></span>' +
        '    <span class="cask__hint">Tap to answer · swipe to dismiss</span>' +
        "  </span>" +
        '  <span class="cask__chev ico ico-20"><img src="assets/icons/chevron-down.svg" alt="" style="transform:translate(-50%,-50%) rotate(180deg)" /></span>' +
        '  <button class="cask__x" aria-label="Dismiss"><img src="assets/icons/x.svg" alt="" /></button>' +
        "</div>" +
        '<div class="cask__body"><div><div class="cask__inner">' +
        '  <button class="cask__qx" aria-label="Close"><img src="assets/icons/x.svg" alt="" /></button>' +
        '  <p class="cask__q"></p>' +
        '  <div class="cask__content"></div>' +
        "</div></div></div>";
      document.body.appendChild(el);

      el.querySelector(".cask__title").textContent = cfg.compact || cfg.title;
      // headerless sheets: no title means no question row, just the grabber
      var qEl = el.querySelector(".cask__q");
      qEl.textContent = cfg.title || "";
      if (!cfg.title) qEl.style.display = "none";
      if (cfg.hint) el.querySelector(".cask__hint").textContent = cfg.hint;

      var content = el.querySelector(".cask__content");
      if (cfg.options) {
        content.innerHTML =
          '<div class="iw-options">' +
          cfg.options
            .map(function (o, i) {
              return '<button class="iw-option" data-i="' + i + '"><span class="t">' + o.t + '</span><span class="s">' + o.s + "</span></button>";
            })
            .join("") +
          "</div>";
        content.querySelectorAll(".iw-option").forEach(function (b) {
          b.addEventListener("click", function (e) {
            e.stopPropagation();
            b.classList.add("on");
            setTimeout(function () {
              dismiss(true);
              if (cfg.onAnswer) cfg.onAnswer(cfg.options[Number(b.dataset.i)]);
            }, 320);
          });
        });
      } else if (cfg.bodyHTML) {
        content.innerHTML = cfg.bodyHTML;
        if (cfg.onBody) cfg.onBody(content, function () { dismiss(true); });
      }

      /* ---- morph in from the clove button ---- */
      var btn = document.querySelector(".chat-button");
      var shownAt = performance.now();
      var showAnim = null;
      // the clove button breathes: a quiet in-breath, then it swells as the
      // question rises out of it and settles back. No rings, no twist.
      function buttonSpeaks() {
        if (!btn) return;
        btn.animate(
          [
            { transform: "scale(1)" },
            { transform: "scale(0.92)", offset: 0.18 },
            { transform: "scale(1.16)", offset: 0.55 },
            { transform: "scale(0.99)", offset: 0.82 },
            { transform: "scale(1)" },
          ],
          { duration: 820, easing: "cubic-bezier(0.3, 0.8, 0.3, 1)" }
        );
      }
      el.classList.add("show");
      if (btn) {
        buttonSpeaks();
        var b = btn.getBoundingClientRect();
        var s = el.getBoundingClientRect();
        var scale = Math.max(0.3, b.width / s.width);
        var dx = b.left + b.width / 2 - (s.left + s.width / 2);
        var dy = b.top + b.height / 2 - (s.top + s.height / 2);
        showAnim = el.animate(
          [
            { transform: "translate(" + dx + "px," + dy + "px) scale(" + scale + ")", borderRadius: "120px", opacity: 0.85 },
            { transform: "none", borderRadius: "999px", opacity: 1 },
          ],
          { duration: 420, easing: SPRING }
        );
      } else {
        el.animate([{ transform: "translateY(18px)", opacity: 0 }, { transform: "none", opacity: 1 }], { duration: 340, easing: SPRING });
      }

      /* ---- expand: mini pill → full card (FLIP) or custom sheet ---- */
      function expand() {
        if (!el.isConnected || !el.classList.contains("mini")) return;
        if (cfg.onExpand) {
          dismiss(true);
          cfg.onExpand();
          return;
        }
        var first = el.getBoundingClientRect();
        var fresh = btn && performance.now() - shownAt < 480; // opened straight into the card
        el.classList.remove("mini");
        el.classList.add("expanded");
        var last = el.getBoundingClientRect();
        if (fresh) {
          // the card emerges from the clove button like a soft blob: a small
          // round form at the button's centre that grows into the card, with
          // one easy overshoot and a calm settle. No glow, the usual shadow.
          if (showAnim) showAnim.cancel();
          var bb = btn.getBoundingClientRect();
          var ox = bb.left + bb.width / 2 - last.left;
          var oy = bb.top + bb.height / 2 - last.top;
          var sc = Math.max(0.1, bb.width / last.width);
          var origin = ox + "px " + oy + "px";
          el.animate(
            [
              { transform: "translateX(-50%) scale(" + sc + ", " + (sc * 1.6) + ")", transformOrigin: origin, borderRadius: "160px", opacity: 0 },
              { transform: "translateX(-50%) scale(" + (sc * 2.2) + ", " + (sc * 2.6) + ")", transformOrigin: origin, borderRadius: "120px", opacity: 1, offset: 0.22 },
              { transform: "translateX(-50%) scale(1.012, 0.992)", transformOrigin: origin, borderRadius: "24px", opacity: 1, offset: 0.74 },
              { transform: "translateX(-50%) scale(1)", transformOrigin: origin, borderRadius: "20px", opacity: 1 },
            ],
            { duration: 720, easing: "cubic-bezier(0.2, 0.85, 0.25, 1)" }
          );
          el.querySelector(".cask__body").firstElementChild.animate(
            [{ opacity: 0, transform: "translateY(8px)" }, { opacity: 0, transform: "translateY(8px)", offset: 0.45 }, { opacity: 1, transform: "none" }],
            { duration: 760, easing: "cubic-bezier(0.22, 1, 0.36, 1)" }
          );
          return;
        }
        // grow out of the pill: anchor the shared bottom-right corner and
        // scale both axes from the pill's box up to the full card
        var dx = first.right - last.right;
        var dy = first.bottom - last.bottom;
        var sx = first.width / last.width;
        var sy = first.height / last.height;
        el.animate(
          [
            { transform: "translateX(calc(-50% + " + dx + "px)) translateY(" + dy + "px) scale(" + sx + ", " + sy + ")", transformOrigin: "100% 100%", borderRadius: "999px" },
            { transform: "translateX(-50%)", transformOrigin: "100% 100%", borderRadius: "20px" },
          ],
          { duration: 440, easing: SPRING }
        );
        el.querySelector(".cask__body").firstElementChild.animate(
          [{ opacity: 0 }, { opacity: 0, offset: 0.35 }, { opacity: 1 }],
          { duration: 520 }
        );
      }

      /* pointer capture (for the swipe) retargets clicks to el itself,
         so listen here rather than on the row */
      el.addEventListener("click", function (e) {
        if (e.target.closest(".cask__x")) return;
        if (swiped) return; // a spring-back swipe is not a tap
        if (el.classList.contains("mini")) expand();
        // expanded: the grabber is for swiping, not toggling
      });
      el.querySelector(".cask__x").addEventListener("click", function (e) {
        e.stopPropagation();
        dismiss();
      });
      el.querySelector(".cask__qx").addEventListener("click", function (e) {
        e.stopPropagation();
        dismiss();
      });

      /* the clove icon also expands a pending nudge */
      function cloveTap(e) {
        if (!el.isConnected) { cleanup(); return; }
        if (el.classList.contains("mini")) {
          e.preventDefault();
          e.stopPropagation();
          expand();
        } else {
          // sheet is open: get out of the chat's way
          dismiss(true);
        }
      }
      function cleanup() {
        if (btn) btn.removeEventListener("click", cloveTap, true);
      }
      if (btn) btn.addEventListener("click", cloveTap, true);

      /* ---- swipe down to dismiss ---- */
      var base = function () { return el.classList.contains("mini") ? "" : "translateX(-50%)"; };
      var startY = null, curY = 0, swiped = false;
      el.addEventListener("pointerdown", function (e) {
        if (e.target.closest("button, a, input")) return;
        startY = e.clientY; curY = 0; swiped = false;
        el.setPointerCapture && el.setPointerCapture(e.pointerId);
        e.stopPropagation();
      });
      el.addEventListener("pointermove", function (e) {
        if (startY === null) return;
        curY = Math.max(0, e.clientY - startY);
        if (curY > 8) swiped = true;
        el.style.transform = (base() ? base() + " " : "") + "translateY(" + curY + "px)";
        el.style.opacity = String(Math.max(0.3, 1 - curY / 220));
      });
      function endSwipe() {
        if (startY === null) return;
        startY = null;
        if (curY > 48) dismiss();
        else {
          el.style.transition = "transform 320ms " + SPRING + ", opacity 200ms ease";
          el.style.transform = base();
          el.style.opacity = "1";
          setTimeout(function () { el.style.transition = ""; }, 340);
        }
      }
      el.addEventListener("pointerup", endSwipe);
      el.addEventListener("pointercancel", endSwipe);

      function dismiss(answered) {
        cleanup();
        el.classList.add("dismissing");
        el.style.transform = (base() ? base() + " " : "") + "translateY(" + (answered ? 12 : 120) + "px)";
        setTimeout(function () { el.remove(); }, 300);
        if (!answered) {
          // a dismissed nudge stays reachable from the Ask Clove sheet
          window.CloveAsk._dismissed = cfg;
          if (cfg.onDismiss) cfg.onDismiss();
        }
      }

      return { dismiss: dismiss, expand: expand, el: el };
    },
  };
})();
