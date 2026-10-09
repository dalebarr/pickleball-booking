// Applies the saved appearance before first paint so the page never flashes the wrong theme.
(function () {
  try {
    var pref = JSON.parse(localStorage.getItem('pb.appearance'));
    if (pref === 'light' || pref === 'dark') document.documentElement.setAttribute('data-theme', pref);
  } catch (e) { /* storage unavailable: follow the system setting */ }
})();
