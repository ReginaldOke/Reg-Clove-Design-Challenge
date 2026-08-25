/* Presenter frame boot: runs in <head>, before first paint, so a page
   never flashes square corners when the rounded frame is on. Skipped
   inside the feature-demo iframes: the demo stage does its own framing. */
if (window.self === window.top) {
  /* Front door: the FIRST page a visitor opens in this tab. If that is the
     Home page, send them to the TikTok step with the controls open instead;
     once inside the app, Home works normally (the flag marks the tab). */
  (function () {
    var fresh = false;
    try {
      fresh = !sessionStorage.getItem("cloveEntered");
      sessionStorage.setItem("cloveEntered", "1");
    } catch (e) {}
    var page = location.pathname.split("/").pop();
    if (fresh && (page === "" || page === "index.html") && !location.search) {
      location.replace("tiktok.html?start=1");
    }
  })();
  if (localStorage.getItem("clovePanelRound") === "1") {
    document.documentElement.classList.add("frame-rounded");
  }
}
