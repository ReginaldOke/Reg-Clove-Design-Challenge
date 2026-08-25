/* Ask Clove overlay, the tab-bar clove button expands into the chat sheet */
(function () {
  var btn = document.querySelector(".chat-button");
  if (!btn) return;

  var PROMPTS = [
    ["🍣", "Recipe inspiration prompt"],
    ["😵‍💫", "Recipe inspiration prompt"],
    ["💪", "Protein snack plate"],
    ["🧈", "Butter board (pls help)"],
    ["👩‍🍳", "“Chef-y” but easy"],
    ["🛒", "Trader Joe’s copycat"],
    ["🍳", "Crispy chili oil eggs"],
    ["💍", "Marry me chicken (easy)"],
    ["🍝", "Spicy vodka rigatoni"],
    ["🍚", "Kimchi fried rice"],
    ["🥜", "PB&J overnight oats"],
  ];

  var overlay = document.createElement("div");
  overlay.className = "chat-overlay";
  overlay.innerHTML =
    '<div class="chat-overlay__scrim"></div>' +
    '<div class="chat-kb"><img src="assets/img/ios-keyboard.png" alt="" /></div>' +
    '<div class="chat-sheet">' +
    '  <div class="chat-sheet__inner">' +
    '    <p class="chat-sheet__q">What can I help with?</p>' +
    '    <div class="chat-sheet__composer">' +
    '      <div class="chat-prompts rail"><div class="chat-prompts__strip">' +
    PROMPTS.map(function (p) {
      return '<button class="chat-prompt"><span>' + p[0] + "</span><span>" + p[1] + "</span></button>";
    }).join("") +
    "      </div></div>" +
    '      <div class="chat-input">' +
    '        <input type="text" placeholder="Ask Clove" aria-label="Ask Clove" />' +
    '        <span class="mic-wrap"><button class="mic" aria-label="Voice">' +
    '          <span class="ico ico-20"><img src="assets/icons/audio-lines.svg" alt="" /></span>' +
    "        </button></span>" +
    "      </div>" +
    "    </div>" +
    "  </div>" +
    '  <div class="chat-disc"><img src="assets/icons/clove-white.svg" alt="" /></div>' +
    "</div>";
  document.body.appendChild(overlay);

  var sheet = overlay.querySelector(".chat-sheet");
  var disc = overlay.querySelector(".chat-disc");
  var scrim = overlay.querySelector(".chat-overlay__scrim");
  var input = overlay.querySelector(".chat-input input");
  var isOpen = false;
  var SPRING = "cubic-bezier(0.24, 1.1, 0.32, 1)";

  function rects() {
    var b = btn.getBoundingClientRect();
    var s = sheet.getBoundingClientRect();
    var o = overlay.getBoundingClientRect();
    return {
      scale: b.width / s.width,
      dx: b.left + b.width / 2 - (s.left + s.width / 2),
      dy: b.top + b.height / 2 - (s.top + s.height / 2),
      discX: b.left - o.left,
      discY: b.top - o.top,
    };
  }

  // a nudge the user swiped away becomes the first pill in the sheet;
  // tapping it re-runs the flow the nudge would have started
  function syncNudgePill() {
    var strip = overlay.querySelector(".chat-prompts__strip");
    var old = strip.querySelector(".chat-prompt--nudge");
    if (old) old.remove();
    var cfg = window.CloveAsk && CloveAsk._dismissed;
    if (!cfg) return;
    var p = document.createElement("button");
    p.className = "chat-prompt chat-prompt--nudge";
    p.innerHTML = "<span>✨</span><span>" + (cfg.compact || cfg.title) + "</span>";
    p.addEventListener("click", function () {
      CloveAsk._dismissed = null;
      p.remove();
      closeChat();
      setTimeout(function () {
        var c = CloveAsk.show(cfg);
        setTimeout(function () { c.expand(); }, 480);
      }, 380);
    });
    strip.insertBefore(p, strip.firstChild);
  }

  function openChat() {
    if (isOpen) return;
    isOpen = true;
    syncNudgePill();
    overlay.classList.add("open");
    btn.style.transition = "opacity 150ms ease";
    btn.style.opacity = "0";

    var r = rects();
    // the sheet grows out of the button
    sheet.animate(
      [
        { transform: "translate(" + r.dx + "px," + r.dy + "px) scale(" + r.scale + ")", borderRadius: "220px" },
        { transform: "none", borderRadius: "32px" },
      ],
      { duration: 480, easing: SPRING }
    );
    // the clove disc rides along, then dissolves
    disc.style.left = "0px";
    disc.style.top = "0px";
    disc.style.display = "flex";
    var sheetBox = sheet.getBoundingClientRect();
    var startX = r.dx + sheetBox.width / 2 - 28;
    var startY = r.dy + sheetBox.height / 2 - 28;
    disc.animate(
      [
        { transform: "translate(" + startX + "px," + startY + "px) scale(1)", opacity: 1 },
        { transform: "translate(" + startX * 0.4 + "px," + startY * 0.4 + "px) scale(2.2)", opacity: 0 },
      ],
      { duration: 380, easing: "ease-out" }
    ).onfinish = function () { disc.style.display = "none"; };

    setTimeout(function () { input.focus({ preventScroll: true }); }, 500);
  }

  function closeChat() {
    if (!isOpen) return;
    isOpen = false;
    input.blur();
    var r = rects();
    sheet
      .animate(
        [
          { transform: "none", borderRadius: "32px" },
          { transform: "translate(" + r.dx + "px," + r.dy + "px) scale(" + r.scale + ")", borderRadius: "220px", opacity: 0.6 },
        ],
        { duration: 340, easing: "cubic-bezier(0.4, 0, 0.6, 1)" }
      )
      .onfinish = function () {
        overlay.classList.remove("open");
        btn.style.opacity = "";
      };
    overlay.classList.remove("open"); // scrim + keyboard leave immediately
    overlay.classList.add("closing");
    setTimeout(function () { overlay.classList.remove("closing"); }, 360);
  }

  btn.addEventListener("click", function (e) {
    e.preventDefault();
    openChat();
  });
  scrim.addEventListener("click", closeChat);
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") closeChat();
  });
  overlay.querySelectorAll(".chat-prompt").forEach(function (p) {
    p.addEventListener("click", function () {
      input.value = p.textContent.trim().replace(/^\S+\s*/, "");
      input.focus({ preventScroll: true });
    });
  });
})();
