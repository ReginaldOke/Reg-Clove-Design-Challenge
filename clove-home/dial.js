/* Clove dial: the InputWidget ruler (Figma 26028:21963) as a draggable,
   springy tick strip. The chosen tick sits under a pointer; drag the strip
   (or tap a tick) and it glides, ticks swell as they pass the centre, and
   it snaps to the nearest value on release.
   CloveDial.mount(el, {min, max, step, value, fmt, onChange}) → {value()} */
(function () {
  var PITCH = 23; // 6px tick + 17px gap, as in the design

  function mount(host, cfg) {
    var min = cfg.min, max = cfg.max, step = cfg.step || 1;
    var n = Math.round((max - min) / step) + 1;
    var fmt = cfg.fmt || function (v) { return String(v); };

    host.classList.add("dial");
    host.innerHTML =
      '<div class="dial__head"><span class="dial__pointer"></span><p class="dial__val"></p></div>' +
      '<div class="dial__track"><div class="dial__strip">' +
      Array.apply(null, Array(n)).map(function (_, i) { return '<i class="dial__tick' + (i % 5 === 0 ? " major" : "") + '"></i>'; }).join("") +
      "</div></div>";
    var valEl = host.querySelector(".dial__val");
    var track = host.querySelector(".dial__track");
    var strip = host.querySelector(".dial__strip");
    var ticks = Array.prototype.slice.call(strip.children);

    var pos = (cfg.value - min) / step; // float index; the strip is positioned from it
    var shown = Math.round(pos);
    var raf = null, anim = null;

    function centre() { return track.clientWidth / 2; }
    function paint() {
      var x = centre() - 3 - pos * PITCH;
      strip.style.transform = "translate3d(" + x + "px,0,0)";
      for (var i = 0; i < n; i++) {
        var d = Math.abs(i - pos);
        var base = i % 5 === 0 ? 48 : 36;
        var k = Math.max(0, 1 - d / 1.6); // swell within ~1.6 ticks of the centre
        k = k * k * (3 - 2 * k);          // smoothstep
        var h = base + (64 - base) * k;
        var t = ticks[i];
        t.style.height = h.toFixed(1) + "px";
        t.style.opacity = (0.55 + 0.45 * Math.max(0, 1 - d / 9)).toFixed(3); // fades toward the edges
      }
      var near = Math.max(0, Math.min(n - 1, Math.round(pos)));
      if (near !== shown) {
        shown = near;
        ticks.forEach(function (t, i) { t.classList.toggle("on", i === near); });
        valEl.textContent = fmt(min + near * step);
        valEl.animate([{ transform: "scale(1)" }, { transform: "scale(1.06)" }, { transform: "scale(1)" }], { duration: 220, easing: "ease-out" });
        if (navigator.vibrate) try { navigator.vibrate(3); } catch (e) {}
        if (cfg.onChange) cfg.onChange(min + near * step);
      }
    }
    ticks[shown].classList.add("on");
    valEl.textContent = fmt(min + shown * step);

    /* ---- spring to a target index ---- */
    function springTo(target, v0) {
      cancelAnimationFrame(anim);
      var from = pos, vel = v0 || 0, last = performance.now();
      var K = 170, D = 24; // stiffness, damping: a quick, settled spring
      (function tick(now) {
        var dt = Math.min(0.032, (now - last) / 1000); last = now;
        var a = -K * (pos - target) - D * vel;
        vel += a * dt; pos += vel * dt;
        paint();
        if (Math.abs(pos - target) > 0.002 || Math.abs(vel) > 0.02) anim = requestAnimationFrame(tick);
        else { pos = target; paint(); }
      })(last);
    }

    /* ---- drag: the strip follows the finger, then snaps ---- */
    var dragging = false, sx = 0, sp = 0, lastX = 0, lastT = 0, vel = 0, moved = false;
    function clampSoft(p) { // rubber-band past the ends
      if (p < 0) return p * 0.35;
      if (p > n - 1) return n - 1 + (p - (n - 1)) * 0.35;
      return p;
    }
    track.addEventListener("pointerdown", function (e) {
      e.stopPropagation(); // the card's swipe-to-dismiss and the page's drag-scroll stay out
      cancelAnimationFrame(anim);
      dragging = true; moved = false; sx = e.clientX; sp = pos; lastX = e.clientX; lastT = e.timeStamp; vel = 0;
      host.classList.add("dragging");
      try { track.setPointerCapture(e.pointerId); } catch (err) {}
    });
    track.addEventListener("pointermove", function (e) {
      if (!dragging) return;
      e.stopPropagation();
      e.preventDefault();
      var dx = e.clientX - sx;
      if (Math.abs(dx) > 3) moved = true;
      var dt = Math.max(1, e.timeStamp - lastT);
      vel = ((lastX - e.clientX) / PITCH) / (dt / 1000); // ticks per second
      lastX = e.clientX; lastT = e.timeStamp;
      pos = clampSoft(sp - dx / PITCH);
      if (!raf) raf = requestAnimationFrame(function () { raf = null; paint(); });
    });
    function end(e) {
      if (!dragging) return;
      dragging = false;
      host.classList.remove("dragging");
      e && e.stopPropagation && e.stopPropagation();
      var target;
      if (!moved && e) {
        // a tap: go to the tick under the finger
        var r = track.getBoundingClientRect();
        target = Math.round(pos + (e.clientX - (r.left + r.width / 2)) / PITCH);
      } else {
        // a flick carries on a little, then settles on a tick
        target = Math.round(pos + vel * 0.12);
      }
      target = Math.max(0, Math.min(n - 1, target));
      springTo(target, moved ? vel * 0.5 : 0);
    }
    track.addEventListener("pointerup", end);
    track.addEventListener("pointercancel", end);
    track.addEventListener("touchmove", function (e) { if (dragging) e.preventDefault(); }, { passive: false });
    track.addEventListener("click", function (e) { e.stopPropagation(); });

    // first paint once it has a width
    requestAnimationFrame(paint);
    setTimeout(paint, 120);

    return {
      value: function () { return min + Math.max(0, Math.min(n - 1, Math.round(pos))) * step; },
      set: function (v) { springTo(Math.round((v - min) / step)); },
      repaint: paint,
    };
  }

  window.CloveDial = { mount: mount };
})();
