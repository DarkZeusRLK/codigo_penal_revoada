// =============================================
// 🏆 COPA 2026 - EXPERIÊNCIA COMPLETA 🏆
// =============================================
(function() {
  "use strict";
  var D = false;
  function l(m) { if (D) console.log("[Copa2026]", m); }
  var a = false, ci = null, atmT = null, si = null, gA = false;
  var eHA = false, eCA = false, eHEXAA = false, eCAMPA = false;

  function init() {
    if (a) return; a = true; l("init");
    criarEstadioBg();
    criarSilhuetas();
    criarIntro();
    criarScoreboard();
    criarCountdown();
    setTimeout(function() {
      document.querySelectorAll(".card").forEach(function(c) {
        c.classList.add("copa-card-3d", "copa-card-glass");
      });
      iniciarCardTilt();
    }, 200);
    criarCursor();
    criarConfetes();
    iniciarAtmosferaTimer();
  }

  function destroy() {
    a = false; l("destroy");
    removerCursor();
    pararConfetes();
    removerScoreboard();
    removerIntro();
    cancelarAtmosferaTimer();
    removerEstadioBg();
    removerSilhuetas();
    removerCountdown();
    document.querySelectorAll(".card").forEach(function(c) {
      c.classList.remove("copa-card-3d", "copa-card-glass");
    });
    document.body.classList.remove("copa-atmosphere-mode", "copa-campeao-mode");
    document.querySelectorAll(".copa-hexa-rain").forEach(function(e) { e.remove(); });
  }

  window.copa2026 = { init: init, destroy: destroy, gol: golDoBrasil };

// =============================================
// INTRO
// =============================================
function criarIntro() {
  if (document.getElementById("copa2026-intro")) return;
  if (localStorage.getItem("copa2026_intro_pulou") === "sim") return;
  if (!document.body.classList.contains("theme-copa")) return;
  var ov = document.createElement("div");
  ov.id = "copa2026-intro";
  ov.className = "copa2026-intro-overlay";
  ov.innerHTML = '<div class="copa2026-intro-stage">' +
    '<div class="copa2026-intro-spotlight"></div>' +
    '<div class="copa2026-intro-spotlight"></div>' +
    '<div class="copa2026-intro-spotlight"></div>' +
    '<div class="copa2026-intro-spotlight"></div>' +
    '<div class="copa2026-intro-bandeira"></div>' +
    '<div class="copa2026-intro-text">RUMO AO HEXA</div>' +
    '<div class="copa2026-intro-year">2026</div>' +
    '<button class="copa2026-intro-skip">PULAR</button></div>';
  document.body.appendChild(ov);
  ov.querySelector(".copa2026-intro-skip").addEventListener("click", function(e) {
    e.preventDefault();
    localStorage.setItem("copa2026_intro_pulou", "sim");
    fecharIntro(ov);
  });
  setTimeout(function() { fecharIntro(ov); }, 4500);
}

function fecharIntro(ov) {
  if (!ov || !ov.parentNode) return;
  ov.classList.add("fade-out");
  setTimeout(function() { if (ov.parentNode) ov.parentNode.removeChild(ov); }, 1200);
}

function removerIntro() {
  var el = document.getElementById("copa2026-intro");
  if (el) el.remove();
}

// =============================================
// CONFETES
// =============================================
var CONF_CORES = ["#009c3b","#ffdf00","#002776","#ffffff","#00c44a","#ffe866"];
var CONF_TIPOS = ["flag","star","ball","ribbon"];

function criarConfetes() {
  pararConfetes();
  ci = setInterval(function() {
    if (!document.body.classList.contains("theme-copa")) { pararConfetes(); return; }
    for (var i = 0; i < 5; i++) {
      var el = document.createElement("div");
      var tipo = CONF_TIPOS[Math.floor(Math.random() * CONF_TIPOS.length)];
      el.className = "copa2026-confete " + tipo;
      el.style.left = Math.random() * 100 + "%";
      el.style.animationDuration = (Math.random() * 4 + 5) + "s";
      el.style.animationDelay = (Math.random() * 3) + "s";
      if (tipo === "ribbon") el.style.background = CONF_CORES[Math.floor(Math.random() * CONF_CORES.length)];
      document.body.appendChild(el);
      setTimeout(function() { if (el.parentNode) el.parentNode.removeChild(el); }, 10000);
    }
  }, 400);
}

function pararConfetes() {
  if (ci) { clearInterval(ci); ci = null; }
  document.querySelectorAll(".copa2026-confete").forEach(function(e) { e.remove(); });
}

// =============================================
// SCOREBOARD
// =============================================
function criarScoreboard() {
  if (document.getElementById("copa-scoreboard")) return;
  var sb = document.createElement("div");
  sb.id = "copa-scoreboard";
  sb.className = "copa-scoreboard";
  sb.style.display = "none";
  sb.innerHTML = '<div class="copa-scoreboard-team brasil">\u{1F1E7}\u{1F1F7} BRASIL</div>' +
    '<div class="copa-scoreboard-score">' +
    '<span class="score-value" id="score-brasil">1</span>' +
    '<span class="score-divider">:</span>' +
    '<span class="score-value" id="score-adv">0</span></div>' +
    '<div class="copa-scoreboard-team">\u{1F3C6} ADVERSARIO</div>' +
    '<div class="copa-scoreboard-timer" id="score-timer">00:00</div>';
  document.body.appendChild(sb);
  sb.style.display = "flex";
  var min = 0, seg = 0;
  if (si) clearInterval(si);
  si = setInterval(function() {
    seg++;
    if (seg >= 60) { seg = 0; min++; }
    var t = document.getElementById("score-timer");
    if (t) t.textContent = String(min).padStart(2,"0") + ":" + String(seg).padStart(2,"0");
  }, 1000);
}

function removerScoreboard() {
  if (si) { clearInterval(si); si = null; }
  var el = document.getElementById("copa-scoreboard");
  if (el) el.remove();
}

// =============================================
// GOL DO BRASIL
// =============================================
function golDoBrasil() {
  if (gA) return; gA = true;
  if (!document.body.classList.contains("theme-copa")) { gA = false; return; }
  var sb = document.getElementById("score-brasil");
  if (sb) { var g = parseInt(sb.textContent) + 1; sb.textContent = g; }
  var gol = document.createElement("div");
  gol.className = "copa-gol-overlay";
  gol.style.display = "flex";
  gol.innerHTML = '<span class="copa-gol-flag left">\u{1F1E7}\u{1F1F7}</span>' +
    '<div class="copa-gol-text">GOOOOOOOOOOL</div>' +
    '<span class="copa-gol-flag right">\u{1F1E7}\u{1F1F7}</span>';
  document.body.appendChild(gol);
  for (var i = 0; i < 5; i++) {
    (function(n) { setTimeout(function() {
      fireworkBurst(Math.random() * window.innerWidth, Math.random() * window.innerHeight * 0.5);
    }, n * 200); })(i);
  }
  for (var c = 0; c < 40; c++) {
    (function(d) { setTimeout(function() {
      var el = document.createElement("div");
      el.className = "copa2026-confete flag";
      el.style.left = Math.random() * 100 + "%";
      el.style.animationDuration = (Math.random() * 2 + 3) + "s";
      el.style.top = "-10px";
      document.body.appendChild(el);
      setTimeout(function() { if (el.parentNode) el.parentNode.removeChild(el); }, 6000);
    }, d * 60); })(c);
  }
  setTimeout(function() {
    gol.style.opacity = "0"; gol.style.transition = "opacity 0.5s";
    setTimeout(function() { if (gol.parentNode) gol.parentNode.removeChild(gol); gA = false; }, 600);
  }, 4000);
}
window.golDoBrasil = golDoBrasil;

// =============================================
// FIREWORKS
// =============================================
function fireworkBurst(x, y) {
  var cores = ["#009c3b","#ffdf00","#002776","#ffffff","#ff6b35"];
  var cor = cores[Math.floor(Math.random() * cores.length)];
  for (var i = 0; i < 20; i++) {
    var p = document.createElement("div");
    p.className = "copa-firework-particle";
    var ang = Math.random() * Math.PI * 2;
    var dist = 40 + Math.random() * 100;
    var dx = Math.cos(ang) * dist;
    var dy = Math.sin(ang) * dist;
    p.style.cssText = "left:" + x + "px;top:" + y + "px;width:" + (2+Math.random()*3) + "px;height:" + (2+Math.random()*3) + "px;background:" + cor + ";";
    p.style.setProperty("--fw-x", dx + "px");
    p.style.setProperty("--fw-y", dy + "px");
    p.style.animationDuration = (0.6 + Math.random() * 0.6) + "s";
    document.body.appendChild(p);
    setTimeout(function() { if (p.parentNode) p.parentNode.removeChild(p); }, 1500);
  }
}

function dispararFogos() {
  for (var i = 0; i < 5; i++) {
    (function(n) { setTimeout(function() {
      fireworkBurst(Math.random() * window.innerWidth, Math.random() * window.innerHeight * 0.4);
    }, n * 400); })(i);
  }
}

// =============================================
// ATMOSPHERE TIMER
// =============================================
function iniciarAtmosferaTimer() {
  cancelarAtmosferaTimer();
  var idle = 0;
  atmT = setInterval(function() {
    idle++;
    if (idle >= 20 && !document.body.classList.contains("copa-atmosphere-mode")) {
      document.body.classList.add("copa-atmosphere-mode");
      dispararFogos();
    }
  }, 1000);
  document.addEventListener("mousemove", function() {
    idle = 0;
    document.body.classList.remove("copa-atmosphere-mode");
  });
}

function cancelarAtmosferaTimer() {
  if (atmT) { clearInterval(atmT); atmT = null; }
  document.body.classList.remove("copa-atmosphere-mode");
}

// =============================================
// EASTER EGGS
// =============================================
var _hexaKeys = [];
var _brasilKeys = [];

function configurarEasterEggs() {
  document.addEventListener("keydown", function(e) {
    var k = e.key.toUpperCase();
    _hexaKeys.push(k);
    if (_hexaKeys.length > 4) _hexaKeys.shift();
    if (_hexaKeys.join("") === "HEXA" && !eHEXAA) {
      eHEXAA = true; ativarHEXA();
    }
    _brasilKeys.push(k);
    if (_brasilKeys.length > 6) _brasilKeys.shift();
    if (_brasilKeys.join("") === "BRASIL" && !eCAMPA) {
      eCAMPA = true; ativarCampeao();
    }
  });
}

function ativarHEXA() {
  eHEXAA = true;
  var con = document.createElement("div");
  con.className = "copa-hexa-rain";
  document.body.appendChild(con);
  for (var i = 0; i < 40; i++) {
    (function(d) { setTimeout(function() {
      if (!eHEXAA) return;
      var f = document.createElement("div");
      f.className = "copa-hexa-flag";
      f.textContent = ["\u{1F1E7}\u{1F1F7}","⭐","\u{1F3C6}","⚽","\u{1F389}"][Math.floor(Math.random()*5)];
      f.style.left = Math.random() * 100 + "%";
      f.style.animationDuration = (4 + Math.random() * 4) + "s";
      con.appendChild(f);
      setTimeout(function() { if (f.parentNode) f.parentNode.removeChild(f); }, 10000);
    }, d * 100); })(i);
  }
  for (var f = 0; f < 5; f++) {
    (function(n) { setTimeout(function() {
      fireworkBurst(Math.random() * window.innerWidth, Math.random() * window.innerHeight * 0.3);
    }, n * 400); })(f);
  }
  setTimeout(function() { eHEXAA = false; }, 15000);
}

function ativarCampeao() {
  eCAMPA = true;
  document.body.classList.add("copa-campeao-mode");
  for (var f = 0; f < 8; f++) {
    (function(n) { setTimeout(function() {
      fireworkBurst(Math.random() * window.innerWidth, Math.random() * window.innerHeight * 0.3);
    }, n * 300); })(f);
  }
  for (var c = 0; c < 50; c++) {
    (function(d) { setTimeout(function() {
      var el = document.createElement("div");
      el.className = "copa2026-confete flag";
      el.style.left = Math.random() * 100 + "%";
      el.style.animationDuration = (2 + Math.random() * 3) + "s";
      el.style.top = "-10px";
      document.body.appendChild(el);
      setTimeout(function() { if (el.parentNode) el.parentNode.removeChild(el); }, 5000);
    }, d * 50); })(c);
  }
  setTimeout(function() {
    document.body.classList.remove("copa-campeao-mode");
    eCAMPA = false;
  }, 20000);
}

// =============================================
// AUTO-INIT ON THEME
// =============================================
// Globals for script.js deferred calls
window.copa2026Init = function() {
  if (window.copa2026) window.copa2026.init();
};
window.copa2026Destroy = function() {
  if (window.copa2026) window.copa2026.destroy();
};

// Patch into existing theme system
if (window.aplicarTemaCopa) {
  var _origApply = window.aplicarTemaCopa;
  window.aplicarTemaCopa = function(ativo) {
    if (ativo) {
      _origApply(true);
      setTimeout(function() { window.copa2026.init(); }, 300);
    } else {
      window.copa2026.destroy();
      _origApply(false);
    }
  };
}

// Auto-init if theme already active
(function() {
  if (document.body.classList.contains("theme-copa")) {
    setTimeout(function() { window.copa2026.init(); }, 500);
  }
  configurarEasterEggs();
})();

})();

// =============================================
// CONTADOR REGRESSIVO
// =============================================
function criarCountdown() {
  if (document.getElementById("copa-countdown")) return;
  var cd = document.createElement("div");
  cd.id = "copa-countdown";
  cd.className = "copa-countdown";
  cd.innerHTML = '<div class="copa-countdown-label">FINAL DA COPA 2026</div>' +
    '<div class="copa-countdown-digits">' +
    '<div><div class="copa-countdown-digit" id="cd-dias">00</div><div class="copa-countdown-unit">Dias</div></div>' +
    '<span class="copa-countdown-sep">:</span>' +
    '<div><div class="copa-countdown-digit" id="cd-horas">00</div><div class="copa-countdown-unit">Horas</div></div>' +
    '<span class="copa-countdown-sep">:</span>' +
    '<div><div class="copa-countdown-digit" id="cd-min">00</div><div class="copa-countdown-unit">Min</div></div>' +
    '<span class="copa-countdown-sep">:</span>' +
    '<div><div class="copa-countdown-digit" id="cd-seg">00</div><div class="copa-countdown-unit">Seg</div></div></div>';
  document.body.appendChild(cd);
  cd.style.display = "flex";
  atualizarCD();
  setInterval(atualizarCD, 1000);
}

function removerCountdown() {
  var el = document.getElementById("copa-countdown");
  if (el) el.remove();
}

function atualizarCD() {
  var final = new Date("2026-07-19T18:00:00-03:00");
  var agora = new Date();
  var diff = Math.max(0, final.getTime() - agora.getTime());
  var dias = Math.floor(diff / 86400000);
  var horas = Math.floor((diff % 86400000) / 3600000);
  var min = Math.floor((diff % 3600000) / 60000);
  var seg = Math.floor((diff % 60000) / 1000);
  setDig("cd-dias", String(dias).padStart(2,"0"));
  setDig("cd-horas", String(horas).padStart(2,"0"));
  setDig("cd-min", String(min).padStart(2,"0"));
  setDig("cd-seg", String(seg).padStart(2,"0"));
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
// CURSOR PERSONALIZADO
// =============================================
var _cursorAtivo = false;

function criarCursor() {
  if (_cursorAtivo) return; _cursorAtivo = true;
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
  document.addEventListener("mousemove", function(e) {
    var dot = document.getElementById("copa-cd");
    if (dot) { dot.style.left = (e.clientX - 3) + "px"; dot.style.top = (e.clientY - 3) + "px"; }
    trail.push({x:e.clientX, y:e.clientY});
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
  document.addEventListener("click", function(e) {
    for (var r = 0; r < 8; r++) {
      (function() {
        var sp = document.createElement("div");
        sp.style.cssText = "position:fixed;pointer-events:none;z-index:99998;width:4px;height:4px;border-radius:50%;background:#ffdf00;left:" + e.clientX + "px;top:" + e.clientY + "px;box-shadow:0 0 6px rgba(255,223,0,0.8);";
        var ang = (r / 8) * Math.PI * 2;
        var dist = 20 + Math.random() * 20;
        document.body.appendChild(sp);
        requestAnimationFrame(function() {
          sp.style.transition = "all 0.5s ease-out";
          sp.style.transform = "translate(" + (Math.cos(ang) * dist) + "px," + (Math.sin(ang) * dist) + "px)";
          sp.style.opacity = "0";
        });
        setTimeout(function() { if (sp.parentNode) sp.parentNode.removeChild(sp); }, 600);
      })();
    }
  });
}

function removerCursor() {
  _cursorAtivo = false;
  var s = document.getElementById("copa-cs");
  if (s) s.remove();
  var d = document.getElementById("copa-cd");
  if (d) d.remove();
  for (var i = 0; i < 8; i++) {
    var t = document.getElementById("copa-ct-" + i);
    if (t) t.remove();
  }
}

// =============================================
// CROSS LIGHT (added to stadium)
// =============================================
function criarCrossLights() {
  if (document.getElementById("copa-cross-light")) return;
  var cl = document.createElement("div");
  cl.id = "copa-cross-light";
  cl.className = "copa-cross-light";
  cl.innerHTML = '<div class="copa-cross-beam"></div>'.repeat(2);
  document.body.appendChild(cl);
}
