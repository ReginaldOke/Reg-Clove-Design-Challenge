/* Presenter tool: DOM → Figma scene extractor. Injected on demand (never
   linked from pages). window.__snap(name) walks the rendered page inside
   the phone, captures exact geometry and styles, and POSTs a scene JSON
   to serve.rb's /scene drop box. */
(function () {
  function pf(v) { return parseFloat(v) || 0; }
  function col(c) {
    var m = /rgba?\(([\d.]+),\s*([\d.]+),\s*([\d.]+)(?:,\s*([\d.]+))?\)/.exec(c || "");
    if (!m) return null;
    return { r: +m[1] / 255, g: +m[2] / 255, b: +m[3] / 255, a: m[4] === undefined ? 1 : +m[4] };
  }
  function grad(bi) {
    var g = /linear-gradient\((?:(-?[\d.]+)deg,\s*)?(.+)\)$/.exec(bi || "");
    if (!g) return null;
    var stops = [], re = /(rgba?\([^)]+\))\s*([\d.]+)%/g, m;
    while ((m = re.exec(g[2]))) { var c = col(m[1]); if (c) stops.push({ p: +m[2] / 100, c: c }); }
    if (stops.length < 2) return null;
    return { angle: g[1] === undefined ? 180 : +g[1], stops: stops };
  }
  function shadow(bs) {
    if (!bs || bs === "none") return null;
    // Chrome serializes: rgba(..) Xpx Ypx Bpx Spx [inset], comma separated
    var first = null;
    bs.split(/,(?![^()]*\))/).forEach(function (s) {
      if (first || /inset/.test(s)) return;
      var c = col(s), n = s.replace(/rgba?\([^)]+\)/, "").trim().split(/\s+/).map(pf);
      if (c && n.length >= 3) first = { c: c, x: n[0], y: n[1], blur: n[2], spread: n[3] || 0 };
    });
    return first;
  }
  function radii(el, cs, r) {
    function one(v) {
      v = String(v).split(" ")[0];
      if (v.indexOf("%") > -1) return Math.min(r.width, r.height) * pf(v) / 100;
      return Math.min(pf(v), Math.min(r.width, r.height) / 2);
    }
    return [one(cs.borderTopLeftRadius), one(cs.borderTopRightRadius), one(cs.borderBottomRightRadius), one(cs.borderBottomLeftRadius)];
  }

  window.__snap = function (name) {
    var phone = document.querySelector(".phone");
    var pr = phone.getBoundingClientRect();
    var L = pr.left, W = Math.round(pr.width);
    var H = Math.round(Math.min(window.innerHeight, document.documentElement.scrollHeight));
    var nodes = [], images = {}, pending = [];

    function clip(r) { // to phone bounds + viewport height
      return !(r.width < 0.5 || r.height < 0.5 || r.bottom < 0.5 || r.top > H - 0.5 || r.right < L + 0.5 || r.left > L + W - 0.5);
    }
    function nm(el) {
      var c = typeof el.className === "string" ? el.className : "";
      return (el.id ? "#" + el.id : "") + (c ? "." + c.trim().split(/\s+/).slice(0, 2).join(".") : "") || el.tagName.toLowerCase();
    }

    function grabImage(el, r) {
      var src = el.currentSrc || el.src;
      if (!src) return null;
      var key = src.split("/").slice(-2).join("/");
      if (!(key in images)) {
        if (/\.svg(\?|$)/.test(src)) {
          images[key] = null;
          pending.push(fetch(src).then(function (x) { return x.text(); }).then(function (t) { images[key] = { svg: t }; }).catch(function () { delete images[key]; }));
        } else {
          try {
            var big = Math.max(r.width, r.height) > 200;
            var scale = big ? Math.min(1.5, 600 / Math.max(r.width, r.height)) : 2;
            var w = Math.max(2, Math.round(Math.min(el.naturalWidth || r.width * 2, r.width * scale)));
            var h = Math.max(2, Math.round(w * (el.naturalHeight || 1) / (el.naturalWidth || 1)));
            var cv = document.createElement("canvas");
            cv.width = w; cv.height = h;
            cv.getContext("2d").drawImage(el, 0, 0, w, h);
            images[key] = { png: cv.toDataURL(big ? "image/jpeg" : "image/png", 0.62).split(",")[1], jpeg: big };
          } catch (e) { return null; }
        }
      }
      return key;
    }

    function pushText(tn, cs, eff) {
      var s = tn.textContent.replace(/\s+/g, " ");
      if (!s.trim()) return;
      var range = document.createRange();
      range.selectNodeContents(tn);
      var r = range.getBoundingClientRect();
      if (!clip(r)) return;
      var c = col(cs.color);
      if (c && c.a === 0 && cs.webkitBackgroundClip === "text") {
        var g = grad(cs.backgroundImage);
        c = g ? g.stops[Math.floor(g.stops.length / 2)].c : { r: 0.74, g: 0.33, b: 0.92, a: 1 };
      }
      nodes.push({
        t: "tx", n: s.trim().slice(0, 24), x: +(r.left - L).toFixed(1), y: +r.top.toFixed(1),
        w: Math.ceil(r.width) + 2, h: Math.ceil(r.height) + 1,
        s: s.trim(), fs: pf(cs.fontSize), fw: cs.fontWeight,
        lh: cs.lineHeight === "normal" ? 0 : pf(cs.lineHeight), ls: pf(cs.letterSpacing),
        c: c, al: cs.textAlign, o: +eff.toFixed(3),
      });
    }

    var svgSeq = 0;
    function walk(el, eff) {
      if (/^(SCRIPT|STYLE|LINK|META|NOSCRIPT|IFRAME)$/.test(el.tagName)) return;
      // inline SVGs (rings, charts) come across whole, as editable vectors
      if (el.tagName.toLowerCase() === "svg") {
        var sr = el.getBoundingClientRect();
        var scs = getComputedStyle(el);
        if (scs.display !== "none" && scs.visibility !== "hidden" && clip(sr)) {
          var key = "inline-svg-" + svgSeq++;
          images[key] = { svg: new XMLSerializer().serializeToString(el) };
          nodes.push({ t: "im", n: "svg." + (el.id || el.parentElement.className || "chart"), x: +(sr.left - L).toFixed(1), y: +sr.top.toFixed(1), w: +sr.width.toFixed(1), h: +sr.height.toFixed(1), rd: [0, 0, 0, 0], o: +(eff * scs.opacity).toFixed(3), k: key, fit: "FIT" });
        }
        return;
      }
      var cs = getComputedStyle(el);
      if (cs.display === "none" || cs.visibility === "hidden") return;
      var o = eff * (+cs.opacity);
      if (o < 0.02) return;
      var c = typeof el.className === "string" ? el.className : "";
      var SKIP = { cpanel: 1, "cpanel-pill": 1, "frame-mask": 1, "demo-overlay": 1, "ai-glow": 1 };
      if (c.split(/\s+/).some(function (x) { return SKIP[x]; })) return;
      var r = el.getBoundingClientRect();
      if (clip(r)) {
        var bg = col(cs.backgroundColor);
        var g = cs.webkitBackgroundClip === "text" ? null : grad(cs.backgroundImage);
        var bw = pf(cs.borderTopWidth);
        var bc = bw > 0 ? col(cs.borderTopColor) : null;
        var sh = shadow(cs.boxShadow);
        var rd = radii(el, cs, r);
        var base = { n: nm(el), x: +(r.left - L).toFixed(1), y: +r.top.toFixed(1), w: +r.width.toFixed(1), h: +r.height.toFixed(1), rd: rd, o: +o.toFixed(3) };
        if (el.tagName === "IMG") {
          var p = el.parentElement, prr = p.getBoundingClientRect(), pcs = getComputedStyle(p);
          if (pcs.overflow.indexOf("hidden") > -1 && Math.abs(prr.width - r.width) < 4 && Math.abs(prr.height - r.height) < 4) rd = base.rd = radii(p, pcs, prr);
          var key = grabImage(el, r);
          if (key) nodes.push(Object.assign(base, { t: "im", k: key, fit: cs.objectFit === "contain" ? "FIT" : "FILL" }));
        } else if ((bg && bg.a > 0.01) || g || (bc && bc.a > 0.01 && bw > 0) || sh) {
          nodes.push(Object.assign(base, { t: "bx", bg: bg && bg.a > 0.01 ? bg : null, g: g, bw: bc ? bw : 0, bc: bc, sh: sh }));
        }
      }
      for (var i = 0; i < el.childNodes.length; i++) {
        var ch = el.childNodes[i];
        if (ch.nodeType === 1) walk(ch, o);
        else if (ch.nodeType === 3) pushText(ch, cs, o);
      }
    }

    walk(document.body, 1);
    return Promise.all(pending).then(function () {
      var scene = { name: name, W: W, H: H, nodes: nodes, images: images };
      var body = JSON.stringify(scene);
      return fetch("/scene?name=" + name, { method: "POST", body: body }).then(function () {
        return { ok: true, nodes: nodes.length, images: Object.keys(images).length, bytes: body.length };
      });
    });
  };
})();
