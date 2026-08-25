/* Swap-to-substitute on the Woolworths order (checkout detail view).
   The first three line items each have real Woolies alternatives: swipe the
   card left/right and the next option slides in (price, tag and the order
   total follow); tap the card and a small modal grows out of it listing the
   alternatives. A gentle peek on landing hints that the cards swipe.
   Only when the store is Woolworths (body.woolies). */
(function () {
  var SPRING = "cubic-bezier(0.22, 1, 0.36, 1)";
  var SUBS = [
    [
      { img: "prod-steak.png", name: "Beef Rump Steak", price: 7.5, was: 9.2, flag: "On special", good: true },
      { img: "sub-eyefillet.jpg", name: "Beef Eye Fillet Thick Cut 320g", price: 26.0, flag: "Premium cut" },
      { img: "sub-chuck.jpg", name: "Beef Chuck Steak 500g", price: 14.4, flag: "Slow cook" },
      { img: "sub-porterhouse.jpg", name: "Beef Porterhouse & Butter 400g", price: 18.0, flag: "2 steaks" },
      { img: "sub-stirfry.jpg", name: "Macro Grass Fed Stir-Fry Beef 500g", price: 13.0, flag: "Grass fed", good: true },
    ],
    [
      { img: "prod-oliveoil.png", name: "Extra Virgin Olive Oil", price: 25.6, was: 28.9, flag: "On special", good: true },
      { img: "sub-redisland.jpg", name: "Red Island Extra Virgin Olive Oil 500mL", price: 13.0, flag: "Australian", good: true },
      { img: "sub-canolaspray.jpg", name: "Canola Cooking Spray 400g", price: 3.3, flag: "Lightest" },
      { img: "sub-vegoil.jpg", name: "Vegetable Oil 750mL", price: 4.0, flag: "Cheapest", good: true },
    ],
    [
      { img: "prod-garlic.png", name: "Garlic Head", price: 1.6, flag: null },
      { img: "sub-garliccloves.jpg", name: "Garlic Cloves 70g", price: 2.9, flag: "Peeled" },
      { img: "sub-garlic3.jpg", name: "Garlic 3 pack", price: 3.5, flag: "Best value", good: true },
    ],
  ];
  function money(n) { return "$" + n.toFixed(2); }
  function woolies() { return document.body.classList.contains("woolies"); }

  var lines = Array.prototype.slice.call(document.querySelectorAll("#viewDetail .detail-lines > .line-item")).slice(0, SUBS.length);
  if (!lines.length) return;
  var totalsEl = document.querySelector("#viewDetail .totals-card");
  var subEl = totalsEl && totalsEl.querySelector(".tr:first-child .v");
  var grandEl = totalsEl && totalsEl.querySelector(".tr.grand .v");
  var cta = document.getElementById("placeOrder");

  function cardHTML(o, forText) {
    return (
      '<span class="li-img"><img src="assets/img/' + o.img + '" alt="" /></span>' +
      '<div class="li-body"><p class="li-name">' + o.name + '</p><p class="li-for">' + forText + "</p>" +
      (o.flag ? '<span class="li-flag rtag ' + (o.good ? "rtag--good" : "rtag--info") + '">' + o.flag + "</span>" : "") +
      "</div>" +
      '<div class="li-price"><p class="p' + (o.was ? " deal" : "") + '">' + money(o.price) + "</p>" + (o.was ? '<p class="was">' + money(o.was) + "</p>" : "") + "</div>"
    );
  }

  /* ---- totals follow the swaps ---- */
  var state = lines.map(function () { return 0; });
  var baseTotal = null, baseSub = null, lastTotal = null;
  function numberOf(el) { return parseFloat((el.textContent || "").replace(/[^\d.]/g, "")) || 0; }
  function animateNumber(el, from, to, prefix) {
    var t0 = performance.now();
    (function step(now) {
      var k = Math.min(1, (now - t0) / 520); k = 1 - Math.pow(1 - k, 3);
      el.textContent = (prefix || "") + money(from + (to - from) * k);
      if (k < 1) requestAnimationFrame(step);
    })(t0);
  }
  function retotal() {
    if (!grandEl) return;
    if (baseTotal === null) { baseTotal = numberOf(grandEl); baseSub = numberOf(subEl); lastTotal = baseTotal; }
    var delta = 0;
    state.forEach(function (i, li) { delta += SUBS[li][i].price - SUBS[li][0].price; });
    var newSub = baseSub + delta, newTotal = baseTotal + delta, from = lastTotal;
    lastTotal = newTotal;
    animateNumber(subEl, newSub - (newTotal - from), newSub);
    animateNumber(grandEl, from, newTotal);
    if (cta) animateNumber(cta, from, newTotal, cta.textContent.replace(/\s*·\s*\$[\d.,]+$/, "") + " · ");
    grandEl.animate([{ transform: "scale(1)" }, { transform: "scale(1.08)" }, { transform: "scale(1)" }], { duration: 320, easing: "ease-out" });
  }

  /* ---- the substitutes modal: grows out of the tapped card ---- */
  var modal = document.createElement("div");
  modal.className = "swap-modal";
  modal.hidden = true;
  modal.innerHTML = '<div class="swap-modal__scrim"></div><div class="swap-modal__card"><div class="swap-modal__inner"></div></div>';
  document.body.appendChild(modal);
  var mScrim = modal.querySelector(".swap-modal__scrim");
  var mCard = modal.querySelector(".swap-modal__card");
  var mInner = modal.querySelector(".swap-modal__inner");
  var mFrom = null, mOpen = false;
  function openModal(fromEl, html, onPick) {
    mFrom = fromEl; mOpen = true;
    mInner.innerHTML = html;
    modal.hidden = false;
    mScrim.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 280, easing: "ease-out", fill: "forwards" });
    var first = fromEl.getBoundingClientRect();
    var last = mCard.getBoundingClientRect();
    mCard.style.transformOrigin = "0 0";
    mCard.animate(
      [
        { transform: "translate(" + (first.left - last.left) + "px," + (first.top - last.top) + "px) scale(" + (first.width / last.width) + "," + (first.height / last.height) + ")", borderRadius: "16px", opacity: 0.7 },
        { transform: "none", borderRadius: "28px", opacity: 1 },
      ],
      { duration: 520, easing: "cubic-bezier(0.2, 0.9, 0.25, 1)", fill: "forwards" }
    );
    mInner.animate([{ opacity: 0, transform: "translateY(10px)" }, { opacity: 0, transform: "translateY(10px)", offset: 0.35 }, { opacity: 1, transform: "none" }], { duration: 620, easing: "ease-out", fill: "forwards" });
    mInner.querySelectorAll(".li-alt").forEach(function (b) {
      b.addEventListener("click", function (e) { e.stopPropagation(); onPick(Number(b.dataset.i)); });
    });
  }
  function closeModal() {
    if (!mOpen) return;
    mOpen = false;
    var first = mFrom ? mFrom.getBoundingClientRect() : null;
    var last = mCard.getBoundingClientRect();
    mScrim.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 260, easing: "ease-in", fill: "forwards" });
    var kf = first
      ? [{ transform: "none", borderRadius: "28px", opacity: 1 }, { transform: "translate(" + (first.left - last.left) + "px," + (first.top - last.top) + "px) scale(" + (first.width / last.width) + "," + (first.height / last.height) + ")", borderRadius: "16px", opacity: 0 }]
      : [{ transform: "none", opacity: 1 }, { transform: "scale(0.94)", opacity: 0 }];
    mInner.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 160, fill: "forwards" });
    mCard.animate(kf, { duration: 380, easing: "cubic-bezier(0.4, 0, 0.6, 1)", fill: "forwards" }).onfinish = function () {
      modal.hidden = true;
      mCard.getAnimations().forEach(function (a) { a.cancel(); });
      mInner.getAnimations().forEach(function (a) { a.cancel(); });
      mScrim.getAnimations().forEach(function (a) { a.cancel(); });
    };
  }
  mScrim.addEventListener("click", closeModal);
  modal.addEventListener("pointerdown", function (e) { e.stopPropagation(); });

  var equalisers = [];
  lines.forEach(function (line, li) {
    var opts = SUBS[li];
    var forText = (line.querySelector(".li-for") || {}).textContent || "";
    var wrap = document.createElement("div");
    wrap.className = "li-swap";
    line.parentNode.insertBefore(wrap, line);
    var stage = document.createElement("div");
    stage.className = "li-swap__stage";
    wrap.appendChild(stage);
    stage.appendChild(line);
    line.classList.add("li-swap__card");
    // every card in this carousel shares the tallest option's height, so
    // nothing jumps as you swipe (measured once the view is actually laid out)
    var equalised = false;
    function equalise() {
      if (equalised || !stage.offsetWidth) return;
      var max = 0;
      opts.forEach(function (o) {
        var t = document.createElement("div");
        t.className = "line-item li-swap__card";
        t.style.visibility = "hidden";
        t.innerHTML = cardHTML(o, forText);
        stage.appendChild(t);
        max = Math.max(max, t.offsetHeight);
        t.remove();
      });
      if (!max) return;
      equalised = true;
      stage.style.minHeight = max + "px";
      line.style.minHeight = max + "px";
    }
    equalisers.push(equalise);
    equalise();

    var cur = 0, busy = false;
    function settleHeight(h0) {
      var h1 = stage.offsetHeight;
      if (h1 !== h0) stage.animate([{ height: h0 + "px" }, { height: h1 + "px" }], { duration: 320, easing: SPRING });
    }
    function ghostFor(i) {
      var g = document.createElement("div");
      g.className = "line-item li-swap__card li-swap__incoming";
      g.innerHTML = cardHTML(opts[i], forText);
      g.dataset.i = i;
      if (line.style.minHeight) g.style.minHeight = line.style.minHeight;
      stage.appendChild(g);
      return g;
    }
    // incoming is already on stage; both glide to their places, then the
    // card takes on the new product
    function commit(next, incoming, fromX, dirHint) {
      busy = true;
      var w = stage.offsetWidth;
      var dir = dirHint || (next > cur ? 1 : -1);
      line.animate([{ transform: "translateX(" + (fromX || 0) + "px)" }, { transform: "translateX(" + (-dir * (w + 12)) + "px)", opacity: 0.6 }], { duration: 400, easing: SPRING, fill: "forwards" });
      incoming.animate([{ transform: incoming.style.transform || "translateX(" + (dir * (w + 12)) + "px)" }, { transform: "translateX(0)" }], { duration: 440, easing: SPRING }).onfinish = function () {
        var h0 = stage.offsetHeight;
        line.innerHTML = incoming.innerHTML;
        line.getAnimations().forEach(function (a) { a.cancel(); });
        line.style.transform = "";
        incoming.remove();
        settleHeight(h0);
        cur = next; state[li] = cur;
        retotal();
        busy = false;
      };
    }
    function goTo(next) {
      if (busy || next === cur) return;
      var w = stage.offsetWidth, dir = next > cur ? 1 : -1;
      var g = ghostFor(next);
      g.style.transform = "translateX(" + (dir * (w + 12)) + "px)";
      void g.offsetWidth;
      commit(next, g, 0);
    }

    /* the modal: current product on top, the alternatives to swap in */
    function showModal() {
      var o = opts[cur];
      var html =
        '<div class="swap-modal__head"><span class="li-img"><img src="assets/img/' + o.img + '" alt="" /></span>' +
        '<div class="swap-modal__t"><b>' + o.name + "</b><span>" + money(o.price) + (o.flag ? " · " + o.flag : "") + "</span></div></div>" +
        '<p class="swap-modal__l">Swap for</p>' +
        '<div class="swap-modal__list">' +
        opts.map(function (q, i) {
          if (i === cur) return "";
          return '<button class="li-alt" data-i="' + i + '"><span class="li-img"><img src="assets/img/' + q.img + '" alt="" /></span>' +
            '<span class="li-alt__t"><b>' + q.name + "</b>" + (q.flag ? '<span class="rtag ' + (q.good ? "rtag--good" : "rtag--info") + '">' + q.flag + "</span>" : "") + "</span>" +
            '<span class="li-alt__p">' + money(q.price) + "</span><span class=\"li-alt__go\">Swap</span></button>";
        }).join("") + "</div>";
      openModal(line, html, function (i) {
        closeModal();
        setTimeout(function () { goTo(i); }, 260);
      });
    }

    /* ---- swipe: the card follows the finger, the neighbour peeks in ---- */
    var sx = 0, sy = 0, dx = 0, axis = null, ghost = null, dragging = false;
    line.addEventListener("pointerdown", function (e) {
      if (!woolies() || busy) return;
      e.stopPropagation();
      dragging = true; axis = null; dx = 0; sx = e.clientX; sy = e.clientY;
      line.style.transition = "none";
    });
    line.addEventListener("pointermove", function (e) {
      if (!dragging) return;
      var mx = e.clientX - sx, my = e.clientY - sy;
      if (!axis) {
        if (Math.abs(mx) < 6 && Math.abs(my) < 6) return;
        axis = Math.abs(mx) > Math.abs(my) ? "x" : "y";
        if (axis === "x") { try { line.setPointerCapture(e.pointerId); } catch (err) {} }
      }
      if (axis !== "x") return;
      e.preventDefault();
      var dir = mx < 0 ? 1 : -1;
      var next = (cur + dir + opts.length) % opts.length; // wraps: swipe either way, always a next card
      var has = opts.length > 1;
      if (has && (!ghost || Number(ghost.dataset.i) !== next)) { if (ghost) ghost.remove(); ghost = ghostFor(next); }
      if (!has && ghost) { ghost.remove(); ghost = null; }
      var w = stage.offsetWidth;
      dx = has ? mx : mx * 0.25;
      line.style.transform = "translateX(" + dx + "px)";
      if (ghost) ghost.style.transform = "translateX(" + (dir * (w + 12) + dx) + "px)";
    });
    function endSwipe(e) {
      if (!dragging) return;
      dragging = false;
      line.style.transition = "";
      if (axis !== "x") {
        if (!axis && e && e.type === "pointerup" && woolies()) showModal(); // a tap
        return;
      }
      var w = stage.offsetWidth, dir = dx < 0 ? 1 : -1;
      if (ghost && Math.abs(dx) > Math.min(90, w * 0.28)) {
        var g = ghost; ghost = null;
        commit(Number(g.dataset.i), g, dx, dir);
      } else {
        line.animate([{ transform: "translateX(" + dx + "px)" }, { transform: "translateX(0)" }], { duration: 380, easing: "cubic-bezier(0.22, 1.3, 0.36, 1)" }).onfinish = function () { line.style.transform = ""; };
        if (ghost) {
          var gg = ghost; ghost = null;
          gg.animate([{ transform: gg.style.transform }, { transform: "translateX(" + (dir * (w + 12)) + "px)" }], { duration: 300, easing: SPRING }).onfinish = function () { gg.remove(); };
        }
      }
      dx = 0;
    }
    line.addEventListener("pointerup", endSwipe);
    line.addEventListener("pointercancel", endSwipe);
    line.addEventListener("touchmove", function (e) { if (dragging && axis === "x") e.preventDefault(); }, { passive: false });
    line.addEventListener("click", function (e) { if (axis === "x") { e.stopPropagation(); e.preventDefault(); } });

    /* ---- landing hint (first card only): the card drifts aside, a "Swap"
       cue appears where it was, the next option peeks in, then all settle ---- */
    if (li === 0) {
      window.cloveSwapHint = function () {
        if (!woolies() || busy || dragging || opts.length < 2) return;
        var cue = document.createElement("span");
        cue.className = "li-swap__cue";
        cue.innerHTML = 'Swipe to swap<span class="li-swap__cue-arrow">\u21c4</span>';
        stage.insertBefore(cue, line);
        var P = 172; // how far the card drifts: the full "Swipe to swap ⇄" shows
        var D = 3800; // unhurried: the cue holds long enough to read on camera
        line.animate(
          [
            { transform: "translateX(0)", boxShadow: "0 0 0 rgba(15, 18, 21, 0)", easing: "cubic-bezier(0.4, 0, 0.2, 1)" },
            { transform: "translateX(-" + P + "px)", boxShadow: "0 10px 24px rgba(15, 18, 21, 0.14)", offset: 0.3, easing: "linear" },
            { transform: "translateX(-" + P + "px)", boxShadow: "0 10px 24px rgba(15, 18, 21, 0.14)", offset: 0.66, easing: "cubic-bezier(0.2, 0.8, 0.2, 1)" },
            { transform: "translateX(0)", boxShadow: "0 0 0 rgba(15, 18, 21, 0)" },
          ],
          { duration: D }
        ).onfinish = function () { line.style.transform = ""; };
        cue.animate(
          [
            { opacity: 0, easing: "ease-out" },
            { opacity: 1, offset: 0.18, easing: "linear" },
            { opacity: 1, offset: 0.74, easing: "ease-in" },
            { opacity: 0 },
          ],
          { duration: D }
        ).onfinish = function () { cue.remove(); };
      };
    }
  });

  // the hint plays when the Woolworths detail appears (once per visit),
  // and only for a Nearby-stores visit: the delivery detail skips the peek
  var hinted = false;
  var detail = document.getElementById("viewDetail");
  function fromNearby() {
    var btn = document.getElementById("placeOrder");
    return !btn || btn.dataset.mode !== "delivery";
  }
  new MutationObserver(function () {
    if (detail.classList.contains("active")) equalisers.forEach(function (f) { f(); });
    if (detail.classList.contains("active") && woolies() && fromNearby() && !hinted) {
      hinted = true;
      setTimeout(function () { if (window.cloveSwapHint) window.cloveSwapHint(); }, 700);
    }
    if (!detail.classList.contains("active")) closeModal();
  }).observe(detail, { attributes: true, attributeFilter: ["class"] });
  if (detail.classList.contains("active") && woolies() && fromNearby()) { hinted = true; setTimeout(function () { window.cloveSwapHint && window.cloveSwapHint(); }, 900); }
})();
