// =============================================
// 🏆 COPA 2026 - EXPERIÊNCIA COMPLETA 🏆
(function() {
  "use strict";
  var D = false;
  function l(m) { if (D) console.log("[Copa2026]", m); }
  var a = false, ci = null, atmT = null, atmA = false, si = null;
  var eHA = false, eCA = false, cA = false, gA = false;
  
  function init() {
    if (a) return; a = true; l("init");
    criarIntro(); criarCursor(); criarConfetes();
    setTimeout(criarScoreboard, 500);
    setTimeout(function() {
      document.querySelectorAll(".card").forEach(function(c) {
        c.classList.add("copa-card-3d", "copa-card-glass");
      });
    }, 200);
  }
  
  function destroy() {
    a = false; l("destroy");
    pararConfetes(); removerCursor(); removerScoreboard(); removerIntro();
    document.querySelectorAll(".card").forEach(function(c) {
      c.classList.remove("copa-card-3d", "copa-card-glass");
    });
  }
  
  window.copa2026 = { init: init, destroy: destroy, gol: golDoBrasil };
