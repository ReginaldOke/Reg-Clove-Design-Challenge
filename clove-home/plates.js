/* Clove plate illustrations, one per health goal, drawn in the same flat
   language as the original salad plate (greens #01911D/#44BA3A/#44D238/
   #519823, tomato #FD2C01, plate well #F5F5F5).

   Each plate is built from FIVE "portions" (<g class="pp" data-p="1..5">):
   one per dinner in the week. Concept 1 shows the finished plate; concept 3
   reveals portions one by one as dinners are ticked off, so the plate
   itself becomes the progress chart. */
(function () {
  var uid = 0;

  /* small vocabulary of shapes, all centred on 0,0 */
  function leaf(x, y, rot, s, fill, vein) {
    return '<g transform="translate(' + x + " " + y + ") rotate(" + rot + ") scale(" + (s || 1) + ')">' +
      '<path d="M0 -17 C9 -14 13 -5 10 4 C8 11 3 15 0 17 C-3 15 -8 11 -10 4 C-13 -5 -9 -14 0 -17 Z" fill="' + fill + '"/>' +
      '<path d="M0 12 C1 6 1 -2 0 -12" fill="none" stroke="' + (vein || "#8FDC7A") + '" stroke-width="1.6" stroke-linecap="round"/>' +
      "</g>";
  }
  function pepita(x, y, rot) {
    return '<g transform="translate(' + x + " " + y + ") rotate(" + rot + ')">' +
      '<ellipse rx="3.4" ry="5.6" fill="#EAD68F" stroke="#D8BF72" stroke-width="1"/>' +
      "</g>";
  }
  function tomato(x, y, s) {
    return '<g transform="translate(' + x + " " + y + ") scale(" + (s || 1) + ')">' +
      '<circle r="7.2" fill="#FD2C01"/>' +
      '<circle cx="-2.2" cy="-2.4" r="2" fill="#FF7E5F"/>' +
      '<path d="M0 -6.6 L1.6 -8.8 L0.4 -7 L2.8 -8 L1.2 -6.4 L3 -6.2 L0.6 -5.8 Z" fill="#519823"/>' +
      "</g>";
  }
  function egg(x, y, rot, s) {
    return '<g transform="translate(' + x + " " + y + ") rotate(" + rot + ") scale(" + (s || 1) + ')">' +
      '<path d="M-22 2 C-24 -10 -14 -20 -2 -21 C11 -22 22 -14 22 -3 C22 8 16 18 4 20 C-8 22 -20 13 -22 2 Z" fill="#FFFFFF" stroke="#EAE3D3" stroke-width="1.5"/>' +
      '<circle cx="1" cy="-1" r="8.5" fill="#F7B500"/>' +
      '<circle cx="-1.8" cy="-3.8" r="2.6" fill="#FFD84D"/>' +
      "</g>";
  }
  function toast(x, y, rot, s) {
    return '<g transform="translate(' + x + " " + y + ") rotate(" + rot + ") scale(" + (s || 1) + ')">' +
      '<rect x="-20" y="-7" width="40" height="14" rx="5" fill="#E9BA6E" stroke="#D9A755" stroke-width="1.5"/>' +
      '<rect x="-15" y="-2.6" width="30" height="5.2" rx="2.6" fill="#F3D49A"/>' +
      "</g>";
  }
  function orange(x, y, s) {
    var lines = "";
    for (var i = 0; i < 6; i++) {
      lines += '<line x1="0" y1="-3.4" x2="0" y2="-12.4" stroke="#FFE7C2" stroke-width="2.4" stroke-linecap="round" transform="rotate(' + i * 60 + ')"/>';
    }
    return '<g transform="translate(' + x + " " + y + ") scale(" + (s || 1) + ')">' +
      '<circle r="17" fill="#F79310"/><circle r="14" fill="#FFC46B"/>' + lines +
      '<circle r="2.6" fill="#FFE7C2"/>' +
      "</g>";
  }
  function halfOrange(x, y, rot, s) {
    var lines = "";
    for (var i = 0; i < 3; i++) {
      lines += '<line x1="0" y1="-3.4" x2="0" y2="-11.4" stroke="#FFE7C2" stroke-width="2.4" stroke-linecap="round" transform="rotate(' + (-56 + i * 56) + ')"/>';
    }
    return '<g transform="translate(' + x + " " + y + ") rotate(" + rot + ") scale(" + (s || 1) + ')">' +
      '<path d="M-16 0 A16 16 0 0 1 16 0 Z" fill="#F79310"/>' +
      '<path d="M-13 -1.4 A13 13 0 0 1 13 -1.4 L13 -1.4 Z" fill="#FFC46B" transform="translate(0 -1)"/>' +
      lines +
      '<rect x="-16" y="-1.4" width="32" height="2.8" rx="1.4" fill="#F79310"/>' +
      "</g>";
  }
  function fleck(x, y, rot, color, len) {
    return '<path d="M0 0 C1.5 -1.5 3 -2 ' + (len || 4.6) + ' -2" fill="none" stroke="' + color + '" stroke-width="1.7" stroke-linecap="round" transform="translate(' + x + " " + y + ") rotate(" + rot + ')"/>';
  }
  function dot(x, y, r, color) {
    return '<circle cx="' + x + '" cy="' + y + '" r="' + r + '" fill="' + color + '"/>';
  }

  /* the five portions per goal, drawn relative to the plate centre */
  var ART = {
    Iron: [
      leaf(14, -8, 24, 1.05, "#01911D") + leaf(31, 10, 95, 0.9, "#44BA3A"),
      leaf(-18, -14, -30, 1, "#519823", "#A6D96A") + leaf(-31, 12, -100, 0.85, "#44D238", "#9BE989"),
      leaf(2, -30, -6, 0.8, "#44BA3A") + pepita(27, -25, 40) + pepita(35, -12, 78),
      leaf(-6, 27, 172, 0.95, "#01911D") + leaf(24, 30, 135, 0.75, "#519823", "#A6D96A") + pepita(-32, -25, -35),
      tomato(-24, 27) + pepita(6, 7, 12) + pepita(-7, -1, -58),
    ],
    Protein: [
      egg(13, -7, 8, 1),
      egg(-21, 16, -14, 0.82),
      toast(-15, -27, -16, 0.95),
      toast(27, 26, 26, 0.85),
      fleck(-36, 2, -30, "#519823") + fleck(34, 6, 150, "#44BA3A") + fleck(-4, 34, 10, "#519823") +
        dot(-30, -12, 1.1, "#6B6B6B") + dot(38, -8, 1.1, "#6B6B6B") + dot(8, 30, 1.1, "#6B6B6B") + dot(-14, 38, 1.1, "#6B6B6B"),
    ],
    Energy: [
      orange(14, -6, 1),
      halfOrange(-24, 18, -28, 1),
      orange(-17, -26, 0.66),
      leaf(33, 22, 120, 0.55, "#44BA3A") + leaf(38, 32, 160, 0.45, "#01911D"),
      dot(-38, -4, 1.8, "#F79310") + dot(2, 34, 1.8, "#F79310") + dot(34, 6, 1.8, "#F79310") +
        pepita(-4, -38, 20) + pepita(24, 34, -40),
    ],
  };

  /* progress ring drawn ON the plate's lip, in the exported plates'
     own coordinate frame (viewBox 190, plate centre 95/88.2, plate r 77,
     well r 58.4) so the ring and plate can never drift apart */
  var GRADS = {
    "var(--eggplant-300)": ["#e1c3ff", "#bd53ea", "#8f3ecb"],
    "var(--kale-300)": ["#d5ff73", "#1aab56", "#0f7a3c"],
    "var(--paprika-300)": ["#ffd98a", "#f79310", "#d9730a"],
  };
  function lipRing(pct, color, track, animateIn) {
    var CX = 95, CY = 88.2, R = 67.7, STROKE = 14.5;
    var C = 2 * Math.PI * R;
    var dash = (animateIn ? 0 : pct * C).toFixed(1) + " " + C.toFixed(1);
    var g = GRADS[color];
    var id = "lr" + (++uid);
    var stroke = color;
    var defs = "";
    if (g) {
      defs = '<defs><linearGradient id="' + id + '" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="' + g[0] + '"/><stop offset="55%" stop-color="' + g[1] + '"/><stop offset="100%" stop-color="' + g[2] + '"/></linearGradient></defs>';
      stroke = "url(#" + id + ")";
    }
    return '<svg class="lip-ring" viewBox="0 0 190 190" fill="none" xmlns="http://www.w3.org/2000/svg">' + defs +
      '<circle cx="' + CX + '" cy="' + CY + '" r="' + R + '" stroke="' + track + '" stroke-width="' + STROKE + '"/>' +
      '<circle class="gl-ring__arc" data-dash="' + (pct * C).toFixed(1) + " " + C.toFixed(1) + '" cx="' + CX + '" cy="' + CY + '" r="' + R +
      '" stroke="' + stroke + '" stroke-width="' + STROKE + '" stroke-linecap="round" stroke-dasharray="' + dash +
      '" transform="rotate(-90 ' + CX + " " + CY + ')" style="transition:stroke-dasharray 1.1s cubic-bezier(.25,1,.35,1) .1s"/>' +
      "</svg>";
  }

  window.ClovePlates = {
    lipRing: lipRing,
    /* the plate illustration each goal wears (from the Figma set) */
    IMG: {
      Iron: "assets/img/goals/plate-steak.svg",
      Protein: "assets/img/goals/plate-egg.svg",
      Fibre: "assets/img/goals/plate-salad2.svg",
    },
    /* markup for one plate. label: Iron/Protein/Energy (unknown labels get
       the Iron salad). n: portions shown at rest (the rest render with
       class "off" so concept 3 can reveal them later with a transition). */
    svg: function (label, n) {
      var art = ART[label] || ART.Iron;
      var id = "pshadow" + (++uid);
      var out = '<svg class="plate-art" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">' +
        '<defs><filter id="' + id + '" x="-20%" y="-20%" width="140%" height="150%">' +
        '<feDropShadow dx="0" dy="6.8" stdDeviation="9" flood-color="#000000" flood-opacity="0.09"/>' +
        "</filter></defs>" +
        '<circle cx="100" cy="96" r="77" fill="#FFFFFF" filter="url(#' + id + ')"/>' +
        '<circle cx="100" cy="96" r="58.4" fill="#F5F5F5"/>' +
        '<g transform="translate(100 96) scale(1.2)">';
      art.forEach(function (portion, i) {
        out += '<g class="pp' + (i < n ? "" : " off") + '" data-p="' + (i + 1) + '">' + portion + "</g>";
      });
      return out + "</g></svg>";
    },
  };
})();
