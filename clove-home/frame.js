/* Presenter frame boot: runs in <head>, before first paint, so a page
   never flashes square corners when the rounded frame is on. Skipped
   inside the feature-demo iframes: the demo stage does its own framing. */
if (window.self === window.top && localStorage.getItem("clovePanelRound") === "1") {
  document.documentElement.classList.add("frame-rounded");
}
