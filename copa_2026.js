// =============================================
// 🏆 COPA 2026 - EXPERIÊNCIA COMPLETA 🏆
// =============================================
(function () {
  "use strict";

  var ativo = false;
  var confeteInterval = null;
  var atmosferaTimer = null;
  var scoreInterval = null;
  var golActive = false;
  var cursorOn = false;
  var ehexa = false;
  var ecamp = false;
  var hexaKeys = [];
  var brasilKeys = [];

  // =============================================
  // INIT / DESTROY
  // =============================================
  function init() {
    if (ativo) return;
    ativo = true;
    criarIntro();
    criarScoreboard();
    criarCountdown();
    setTimeout(function () {
      document.querySelectorAll(".card").forEach(function (c) {
        c.classList.add("copa-card-3d", "copa-card-glass");
      });
      cardTilt();
    }, 200);
    criarCursor();
    iniciarConfetes();
    iniciarAtmosfera();
    easterEggs();
  }

  function destroy() {
    ativo = false;
    pararConfetes();
    removerCursor();
    removerScoreboard();
    removerCountdown();
    pararAtmosfera();
    document.querySelectorAll(".card").forEach(function (c) {
      c.classList.remove("copa-card-3d", "copa-card-glass");
    });
    document.body.classList.remove("copa-atmosphere-mode", "copa-campeao-mode");
    document.querySelectorAll(".copa-hexa-rain").forEach(function (e) { e.remove(); });
    var intro = document.getElementById("copa2026-intro");
    if (intro) intro.remove();
  }

  window.copa2026 = { init: init, destroy: destroy, gol: golDoBrasil };

  // =============================================
  // INTRO
  // =============================================
  function criarIntro() {
    if (document.getElementById("copa2026-intro")) return;
    if (localStorage.getItem("copa2026_intro_pulou") === "sim") return;
    var ov = document.createElement("div");
    ov.id = "copa2026-intro";
    ov.className = "copa2026-intro-overlay";
    ov.innerHTML =
      '<div class="copa2026-intro-stage">' +
      '<div class="copa2026-intro-spotlight"></div>'.repeat(4) +
      '<div class="copa2026-intro-bandeira"></div>' +
      '<div class="copa2026-intro-text">RUMO AO HEXA</div>' +
      '<div class="copa2026-intro-year">2026</div>' +
      '<button class="copa2026-intro-skip">PULAR</button></div>';
    document.body.appendChild(ov);
    ov.querySelector(".copa2026-intro-skip").addEventListener("click", function (e) {
      e.preventDefault();
      localStorage.setItem("copa2026_intro_pulou", "sim");
      fadeIntro(ov);
    });
    setTimeout(function () { fadeIntro(ov); }, 4500);
  }

  function fadeIntro(ov) {
    if (!ov || !ov.parentNode) return;
    ov.classList.add("fade-out");
    setTimeout(function () { if (ov.parentNode) ov.parentNode.removeChild(ov); }, 1200);
  }

  // =============================================
  // CONFETES
  // =============================================
  var coresC = ["#009c3b", "#ffdf00", "#002776", "#ffffff", "#00c44a", "#ffe866"];
  var tiposC = ["flag", "star", "ball", "ribbon"];

  function iniciarConfetes() {
    pararConfetes();
    confeteInterval = setInterval(function () {
      if (!document.body.classList.contains("theme-copa")) { pararConfetes(); return; }
      for (var i = 0; i < 3; i++) {
        var el = document.createElement("div");
        var tipo = tiposC[Math.floor(Math.random() * tiposC.length)];
        el.className = "copa2026-confete " + tipo;
        el.style.left = Math.random() * 100 + "%";
        el.style.animationDuration = (Math.random() * 4 + 5) + "s";
        el.style.animationDelay = (Math.random() * 3) + "s";
        if (tipo === "ribbon") el.style.background = coresC[Math.floor(Math.random() * coresC.length)];
        document.body.appendChild(el);
        setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 10000);
      }
    }, 500);
  }

  function pararConfetes() {
    if (confeteInterval) { clearInterval(confeteInterval); confeteInterval = null; }
    document.querySelectorAll(".copa2026-confete").forEach(function (e) { e.remove(); });
  }

  // =============================================
  // SCOREBOARD
  // =============================================
  function criarScoreboard() {
    if (document.getElementById("copa-scoreboard")) return;
    var sb = document.createElement("div");
    sb.id = "copa-scoreboard";
    sb.className = "copa-scoreboard";
    sb.innerHTML =
      '<div class="copa-scoreboard-team brasil">\u{1F1E7}\u{1F1F7} BRASIL</div>' +
      '<div class="copa-scoreboard-score">' +
      '<span class="score-value" id="score-brasil">1</span>' +
      '<span class="score-divider">:</span>' +
      '<span class="score-value" id="score-adv">0</span></div>' +
      '<div class="copa-scoreboard-team">\u{1F3C6} ADVERSARIO</div>' +
      '<div class="copa-scoreboard-timer" id="score-timer">00:00</div>';
    document.body.appendChild(sb);
    sb.style.display = "flex";
    var min = 0, seg = 0;
    if (scoreInterval) clearInterval(scoreInterval);
    scoreInterval = setInterval(function () {
      seg++;
      if (seg >= 60) { seg = 0; min++; }
      var t = document.getElementById("score-timer");
      if (t) t.textContent = String(min).padStart(2, "0") + ":" + String(seg).padStart(2, "0");
    }, 1000);
  }

  function removerScoreboard() {
    if (scoreInterval) { clearInterval(scoreInterval); scoreInterval = null; }
    var el = document.getElementById("copa-scoreboard");
    if (el) el.remove();
  }

  // =============================================
  // COUNTDOWN
  // =============================================
  var cdInterval = null;

  function criarCountdown() {
    if (document.getElementById("copa-countdown")) return;
    var cd = document.createElement("div");
    cd.id = "copa-countdown";
    cd.className = "copa-countdown";
    cd.innerHTML =
      '<div class="copa-countdown-label">FINAL DA COPA 2026</div>' +
      '<div class="copa-countdown-digits">' +
      '<div><div class="copa-countdown-digit" id="cd-dias">00</div><div class="copa-countdown-unit">Dias</div></div><span class="copa-countdown-sep">:</span>' +
      '<div><div class="copa-countdown-digit" id="cd-horas">00</div><div class="copa-countdown-unit">Horas</div></div><span class="copa-countdown-sep">:</span>' +
      '<div><div class="copa-countdown-digit" id="cd-min">00</div><div class="copa-countdown-unit">Min</div></div><span class="copa-countdown-sep">:</span>' +
      '<div><div class="copa-countdown-digit" id="cd-seg">00</div><div class="copa-countdown-unit">Seg</div></div></div>';
    document.body.appendChild(cd);
    cd.style.display = "flex";
    updateCD();
    cdInterval = setInterval(updateCD, 1000);
  }

  function removerCountdown() {
    if (cdInterval) { clearInterval(cdInterval); cdInterval = null; }
    var el = document.getElementById("copa-countdown");
    if (el) el.remove();
  }

  function updateCD() {
    var f = new Date("2026-07-19T18:00:00-03:00");
    var d = Math.max(0, f.getTime() - Date.now());
    setDig("cd-dias", String(Math.floor(d / 86400000)).padStart(2, "0"));
    setDig("cd-horas", String(Math.floor((d % 86400000) / 3600000)).padStart(2, "0"));
    setDig("cd-min", String(Math.floor((d % 3600000) / 60000)).padStart(2, "0"));
    setDig("cd-seg", String(Math.floor((d % 60000) / 1000)).padStart(2, "0"));
  }

  function setDig(id, val) {
    var el = document.getElementById(id);
    if (el && el.textContent !== val) {
      el.classList.remove("flip");
      void el.offsetWidth;
      el.textContent = val;
      el.classList.add("flip");
    }
  }

  // =============================================
  // GOL
  // =============================================
  function golDoBrasil() {
    if (golActive) return;
    golActive = true;
    if (!document.body.classList.contains("theme-copa")) { golActive = false; return; }
    var sb = document.getElementById("score-brasil");
    if (sb) sb.textContent = parseInt(sb.textContent) + 1;
    var gol = document.createElement("div");
    gol.className = "copa-gol-overlay";
    gol.style.display = "flex";
    gol.innerHTML = '<span class="copa-gol-flag left">\u{1F1E7}\u{1F1F7}</span><div class="copa-gol-text">GOOOOOOOOOOL</div><span class="copa-gol-flag right">\u{1F1E7}\u{1F1F7}</span>';
    document.body.appendChild(gol);
    for (var i = 0; i < 5; i++) (function (n) {
      setTimeout(function () { firework(Math.random() * innerWidth, Math.random() * innerHeight * 0.5); }, n * 200);
    })(i);
    for (var c = 0; c < 40; c++) (function (d) {
      setTimeout(function () {
        var el = document.createElement("div");
        el.className = "copa2026-confete flag";
        el.style.left = Math.random() * 100 + "%";
        el.style.animationDuration = (Math.random() * 2 + 3) + "s";
        el.style.top = "-10px";
        document.body.appendChild(el);
        setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 6000);
      }, d * 60);
    })(c);
    setTimeout(function () {
      gol.style.opacity = "0";
      gol.style.transition = "opacity 0.5s";
      setTimeout(function () { if (gol.parentNode) gol.parentNode.removeChild(gol); golActive = false; }, 600);
    }, 4000);
  }
  window.golDoBrasil = golDoBrasil;

  // =============================================
  // FIREWORKS
  // =============================================
  function firework(x, y) {
    var cor = ["#009c3b", "#ffdf00", "#002776", "#ffffff", "#ff6b35"][Math.floor(Math.random() * 5)];
    for (var i = 0; i < 20; i++) {
      var p = document.createElement("div");
      p.className = "copa-firework-particle";
      var ang = Math.random() * Math.PI * 2;
      var dist = 40 + Math.random() * 100;
      p.style.cssText = "left:" + x + "px;top:" + y + "px;width:" + (2 + Math.random() * 3) + "px;height:" + (2 + Math.random() * 3) + "px;background:" + cor + ";";
      p.style.setProperty("--fw-x", Math.cos(ang) * dist + "px");
      p.style.setProperty("--fw-y", Math.sin(ang) * dist + "px");
      p.style.animationDuration = (0.6 + Math.random() * 0.6) + "s";
      document.body.appendChild(p);
      setTimeout(function () { if (p.parentNode) p.parentNode.removeChild(p); }, 1500);
    }
  }

  function fogos() {
    for (var i = 0; i < 5; i++) (function (n) {
      setTimeout(function () { firework(Math.random() * innerWidth, Math.random() * innerHeight * 0.4); }, n * 400);
    })(i);
  }

  // =============================================
  // ATMOSFERA
  // =============================================
  function iniciarAtmosfera() {
    pararAtmosfera();
    var idle = 0;
    atmosferaTimer = setInterval(function () {
      idle++;
      if (idle >= 20 && !document.body.classList.contains("copa-atmosphere-mode")) {
        document.body.classList.add("copa-atmosphere-mode");
        fogos();
      }
    }, 1000);
    document.addEventListener("mousemove", function () {
      idle = 0;
      document.body.classList.remove("copa-atmosphere-mode");
    });
  }

  function pararAtmosfera() {
    if (atmosferaTimer) { clearInterval(atmosferaTimer); atmosferaTimer = null; }
    document.body.classList.remove("copa-atmosphere-mode");
  }

  // =============================================
  // EASTER EGGS
  // =============================================
  function easterEggs() {
    document.addEventListener("keydown", function (e) {
      var k = e.key.toUpperCase();
      hexaKeys.push(k); if (hexaKeys.length > 4) hexaKeys.shift();
      if (hexaKeys.join("") === "HEXA" && !ehexa) { ehexa = true; ativarHEXA(); }
      brasilKeys.push(k); if (brasilKeys.length > 6) brasilKeys.shift();
      if (brasilKeys.join("") === "BRASIL" && !ecamp) { ecamp = true; ativarCampeao(); }
    });
  }

  function ativarHEXA() {
    ehexa = true;
    var con = document.createElement("div");
    con.className = "copa-hexa-rain";
    document.body.appendChild(con);
    for (var i = 0; i < 40; i++) (function (d) {
      setTimeout(function () {
        if (!ehexa) return;
        var f = document.createElement("div");
        f.className = "copa-hexa-flag";
        f.textContent = ["\u{1F1E7}\u{1F1F7}", "⭐", "\u{1F3C6}", "⚽", "\u{1F389}"][Math.floor(Math.random() * 5)];
        f.style.left = Math.random() * 100 + "%";
        f.style.animationDuration = (4 + Math.random() * 4) + "s";
        con.appendChild(f);
        setTimeout(function () { if (f.parentNode) f.parentNode.removeChild(f); }, 10000);
      }, d * 100);
    })(i);
    for (var f2 = 0; f2 < 5; f2++) (function (n) {
      setTimeout(function () { firework(Math.random() * innerWidth, Math.random() * innerHeight * 0.3); }, n * 400);
    })(f2);
    setTimeout(function () { ehexa = false; }, 15000);
  }

  function ativarCampeao() {
    ecamp = true;
    document.body.classList.add("copa-campeao-mode");
    for (var f2 = 0; f2 < 8; f2++) (function (n) {
      setTimeout(function () { firework(Math.random() * innerWidth, Math.random() * innerHeight * 0.3); }, n * 300);
    })(f2);
    for (var c = 0; c < 50; c++) (function (d) {
      setTimeout(function () {
        var el = document.createElement("div");
        el.className = "copa2026-confete flag";
        el.style.left = Math.random() * 100 + "%";
        el.style.animationDuration = (2 + Math.random() * 3) + "s";
        el.style.top = "-10px";
        document.body.appendChild(el);
        setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 5000);
      }, d * 50);
    })(c);
    setTimeout(function () { document.body.classList.remove("copa-campeao-mode"); ecamp = false; }, 20000);
  }

  // =============================================
  // CURSOR
  // =============================================
  function criarCursor() {
    if (cursorOn) return;
    cursorOn = true;
    var s = document.createElement("style");
    s.id = "copa-cs";
    s.textContent = "body.theme-copa * { cursor: none !important; }";
    document.head.appendChild(s);
    var d = document.createElement("div");
    d.id = "copa-cd";
    d.className = "copa-cursor-dot";
    document.body.appendChild(d);
    for (var i = 0; i < 8; i++) {
      var t = document.createElement("div");
      t.className = "copa-cursor-trail";
      t.id = "copa-ct-" + i;
      document.body.appendChild(t);
    }
    var trail = [];
    document.addEventListener("mousemove", function (e) {
      var dot = document.getElementById("copa-cd");
      if (dot) { dot.style.left = (e.clientX - 3) + "px"; dot.style.top = (e.clientY - 3) + "px"; }
      trail.push({ x: e.clientX, y: e.clientY });
      if (trail.length > 20) trail.shift();
      for (var j = 0; j < 8; j++) {
        var idx = Math.max(0, trail.length - 1 - j * 2);
        var p = trail[idx];
        var tel = document.getElementById("copa-ct-" + j);
        if (tel && p) {
          tel.style.left = (p.x - 2) + "px";
          tel.style.top = (p.y - 2) + "px";
          var op = Math.max(0, 0.25 - j * 0.03);
          tel.style.background = "rgba(255,223,0," + op + ")";
          tel.style.boxShadow = "0 0 " + (6 - j) + "px rgba(255,223,0," + op + ")";
        }
      }
    });
    document.addEventListener("click", function (e) {
      for (var r = 0; r < 8; r++) (function () {
        var sp = document.createElement("div");
        sp.style.cssText = "position:fixed;pointer-events:none;z-index:99998;width:4px;height:4px;border-radius:50%;background:#ffdf00;left:" + e.clientX + "px;top:" + e.clientY + "px;box-shadow:0 0 6px rgba(255,223,0,0.8);";
        var ang = (r / 8) * Math.PI * 2;
        var dist = 20 + Math.random() * 20;
        document.body.appendChild(sp);
        requestAnimationFrame(function () {
          sp.style.transition = "all 0.5s ease-out";
          sp.style.transform = "translate(" + (Math.cos(ang) * dist) + "px," + (Math.sin(ang) * dist) + "px)";
          sp.style.opacity = "0";
        });
        setTimeout(function () { if (sp.parentNode) sp.parentNode.removeChild(sp); }, 600);
      })();
    });
  }

  function removerCursor() {
    cursorOn = false;
    var s = document.getElementById("copa-cs"); if (s) s.remove();
    var d = document.getElementById("copa-cd"); if (d) d.remove();
    for (var i = 0; i < 8; i++) { var t = document.getElementById("copa-ct-" + i); if (t) t.remove(); }
  }

  // =============================================
  // CARD TILT
  // =============================================
  function cardTilt() {
    document.querySelectorAll(".card").forEach(function (card) {
      card.addEventListener("mousemove", function (e) {
        var rect = card.getBoundingClientRect();
        var x = e.clientX - rect.left, y = e.clientY - rect.top;
        var rx = (y - rect.height / 2) / (rect.height / 2) * -5;
        var ry = (x - rect.width / 2) / (rect.width / 2) * 5;
        card.style.transform = "perspective(1000px) rotateX(" + rx + "deg) rotateY(" + ry + "deg) scale3d(1.02,1.02,1.02)";
      });
      card.addEventListener("mouseleave", function () {
        card.style.transform = "perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1,1,1)";
      });
    });
  }

  // =============================================
  // AUTO-INIT (observa a classe theme-copa)
  // =============================================
  var _watchInterval = null;

  function startWatching() {
    if (_watchInterval) return;
    // check now
    if (document.body.classList.contains("theme-copa")) {
      setTimeout(init, 300);
    }
    // observe for changes
    _watchInterval = setInterval(function () {
      if (document.body.classList.contains("theme-copa") && !ativo) {
        init();
      } else if (!document.body.classList.contains("theme-copa") && ativo) {
        destroy();
      }
    }, 500);
  }

  startWatching();

})();
