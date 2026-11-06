// Runs right after the loading screen markup in index.html. Kept as a separate file (not inline)
// so the site can ship a strict Content-Security-Policy without 'unsafe-inline' for scripts.
window.__bootStart = performance.now();
try {
  var splash = document.getElementById("boot-splash");
  if (splash && sessionStorage.getItem("jp-splash-seen")) splash.classList.add("is-quick");
  sessionStorage.setItem("jp-splash-seen", "1");
} catch (e) {
  /* storage blocked: show the full animation every time */
}
// failsafe: never leave the loading screen up if the app fails to start
setTimeout(function () {
  var el = document.getElementById("boot-splash");
  if (el) el.classList.add("is-done");
}, 10000);
