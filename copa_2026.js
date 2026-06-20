// =============================================
// COPA 2026 - OTIMIZADO
// =============================================
(function () {
  "use strict";

  // estado
  var ativo = false;
  var confeteInterval = null;
  var atmosferaTimer = null;
  var scoreInterval = null;
  var cdInterval = null;
  var bolasInterval = null;
  var golActive = false;
  var cursorOn = false;
  var ehexa = false;
  var ecamp = false;
  var hexaKeys = [];
  var brasilKeys = [];

  // refs cacheadas para cursor
  var cursorDot = null;
  var cursorTrails = [];
  var trailData = [];

  // observer em vez de polling
  var mo = null;

  // cores e tipos compartilhados
  var coresC = ["#009c3b","#ffdf00","#002776","#ffffff","#00c44a","#ffe866"];
  var tiposC = ["flag","star","ball","ribbon"];

  // templates de innerHTML (montados 1x)
  var bandeiraBrasilSVG = '<svg viewBox="0 0 40 28" style="width:22px;height:15px;border-radius:2px;vertical-align:middle"><rect width="40" height="28" fill="#009c3b"/><polygon points="20,2 36,14 20,26 4,14" fill="#ffdf00"/><circle cx="20" cy="14" r="5" fill="#002776"/><polygon points="20,11 21.5,13.5 24,14 21.5,14.5 20,17 18.5,14.5 16,14 18.5,13.5" fill="#fff"/></svg>';
  var scoreHTML = '<div class="copa-scoreboard-team brasil">' + bandeiraBrasilSVG + ' BRASIL</div><div class="copa-scoreboard-score"><span class="score-value" id="score-brasil">-</span><span class="score-divider">:</span><span class="score-value" id="score-adv">-</span></div><div class="copa-scoreboard-team" id="copa-adv-name"><span class="copa-bandeira">⚽</span> ADVERSARIO</div><div class="copa-scoreboard-timer" id="score-timer">CARREGANDO...</div>';
  var cdHTML = '<div class="copa-countdown-label">FINAL DA COPA 2026</div><div class="copa-countdown-digits"><div><div class="copa-countdown-digit" id="cd-dias">00</div><div class="copa-countdown-unit">Dias</div></div><span class="copa-countdown-sep">:</span><div><div class="copa-countdown-digit" id="cd-horas">00</div><div class="copa-countdown-unit">Horas</div></div><span class="copa-countdown-sep">:</span><div><div class="copa-countdown-digit" id="cd-min">00</div><div class="copa-countdown-unit">Min</div></div><span class="copa-countdown-sep">:</span><div><div class="copa-countdown-digit" id="cd-seg">00</div><div class="copa-countdown-unit">Seg</div></div></div>';
  var golHTML = '<span class="copa-gol-flag left">\u{1F1E7}\u{1F1F7}</span><div class="copa-gol-text">GOOOOOOOOOOL</div><span class="copa-gol-flag right">\u{1F1E7}\u{1F1F7}</span>';
  var introHTML = '<div class="copa2026-intro-stage"><div class="copa2026-intro-spotlight"></div><div class="copa2026-intro-spotlight"></div><div class="copa2026-intro-spotlight"></div><div class="copa2026-intro-spotlight"></div><div class="copa2026-intro-bandeira"></div><div class="copa2026-intro-text">RUMO AO HEXA</div><div class="copa2026-intro-year">2026</div><button class="copa2026-intro-skip">PULAR</button></div>';
  var campoLinhasHTML = '<div class="copa-campo-meio"></div><div class="copa-campo-circulo"></div>';
  var golHTMLstrut = '<div class="copa-gol-trave"></div><div class="copa-gol-rede"></div>';

  // =============================================
  // INIT / DESTROY
  // =============================================
  function init() {
    if (ativo) return;
    ativo = true;
    criarIntro();
    criarScoreboard();
    criarCountdown();
    criarCampo();
    criarBolasCaindo();
    // cards: adia para garantir que existam
    requestAnimationFrame(function () {
      var cards = document.querySelectorAll(".card");
      for (var ci = 0; ci < cards.length; ci++) {
        cards[ci].classList.add("copa-card-glass");
      }
      // card tilt removido
    });
    criarCursor();
    iniciarConfetes();
    iniciarAtmosfera();
    easterEggs();
  }

  function destroy() {
    ativo = false;
    pararConfetes();
    removerCursor();
    removerCampo();
    pararBolasCaindo();
    removerScoreboard();
    removerCountdown();
    pararAtmosfera();
    var cards = document.querySelectorAll(".card");
    for (var ci = 0; ci < cards.length; ci++) {
      cards[ci].classList.remove("copa-card-glass");
    }
    document.body.classList.remove("copa-atmosphere-mode","copa-campeao-mode");
    var hr = document.querySelectorAll(".copa-hexa-rain");
    for (var hi = 0; hi < hr.length; hi++) hr[hi].remove();
    var intro = document.getElementById("copa2026-intro");
    if (intro) intro.remove();
  }

  window.copa2026 = { init: init, destroy: destroy, gol: golDoBrasil };

  // =============================================
  // INTRO (só 1x/dia, só logado)
  // =============================================
  function estaLogado() {
    try {
      var s = localStorage.getItem("policia_revoada_v3_natal");
      if (!s) return false;
      var d = JSON.parse(s);
      return d && d.nome && d.id && d.timestamp;
    } catch (_) { return false; }
  }

  function criarIntro() {
    if (!estaLogado()) return;
    if (document.getElementById("copa2026-intro")) return;
    var hoje = new Date().toDateString();
    if (localStorage.getItem("copa2026_intro_visto") === hoje) return;
    localStorage.setItem("copa2026_intro_visto", hoje);
    var ov = document.createElement("div");
    ov.id = "copa2026-intro";
    ov.className = "copa2026-intro-overlay";
    ov.innerHTML = introHTML;
    document.body.appendChild(ov);
    ov.querySelector(".copa2026-intro-skip").addEventListener("click", function (e) {
      e.preventDefault();
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
  // CONFETES (reduzido: 1 por vez a cada 700ms)
  // =============================================
  function iniciarConfetes() {
    pararConfetes();
    confeteInterval = setInterval(function () {
      if (!document.body.classList.contains("theme-copa")) { pararConfetes(); return; }
      var el = document.createElement("div");
      var tipo = tiposC[Math.floor(Math.random() * tiposC.length)];
      el.className = "copa2026-confete " + tipo;
      el.style.left = Math.random() * 100 + "%";
      el.style.animationDuration = (Math.random() * 4 + 5) + "s";
      el.style.animationDelay = (Math.random() * 3) + "s";
      if (tipo === "ribbon") el.style.background = coresC[Math.floor(Math.random() * coresC.length)];
      document.body.appendChild(el);
      setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 10000);
    }, 1200);
  }

  function pararConfetes() {
    if (confeteInterval) { clearInterval(confeteInterval); confeteInterval = null; }
    var els = document.querySelectorAll(".copa2026-confete");
    for (var i = 0; i < els.length; i++) els[i].remove();
  }

  // =============================================
  // SCOREBOARD VIA API PRÓPRIA (Vercel)
  // =============================================
  var scoreAtualInterval = null;

  function atualizarPlacar() {
    var elSB = document.getElementById("score-brasil");
    var elSA = document.getElementById("score-adv");
    var elAdv = document.getElementById("copa-adv-name");
    var elTimer = document.getElementById("score-timer");
    if (!elSB || !elSA || !elAdv || !elTimer) return;

    fetch("/api/brasil-jogo")
      .then(function (r) { return r.json(); })
      .then(function (data) {
        if (!data || !data.matches || data.matches.length === 0) {
          mostrarSemJogo(elSB, elSA, elAdv, elTimer);
          return;
        }

        var aoVivo = null, proximo = null;
        for (var i = 0; i < data.matches.length; i++) {
          var m = data.matches[i];
          if (!m) continue;
          var st = m.status || "";
          if (st === "IN_PLAY" || st === "PAUSED") { aoVivo = m; break; }
        }
        if (!aoVivo) {
          for (var i2 = 0; i2 < data.matches.length; i2++) {
            var m2 = data.matches[i2];
            if (!m2) continue;
            var st2 = m2.status || "";
            if (st2 === "SCHEDULED" || st2 === "TIMED") {
              if (!proximo || new Date(m2.utcDate).getTime() < new Date(proximo.utcDate).getTime()) {
                proximo = m2;
              }
            }
          }
        }
        var jogo = aoVivo || proximo;

        if (!jogo) {
          mostrarSemJogo(elSB, elSA, elAdv, elTimer);
          return;
        }

        var ehCasa = jogo.homeTeam && jogo.homeTeam.id === 764;
        var nomeAdv = ehCasa
          ? (jogo.awayTeam.shortName || jogo.awayTeam.name)
          : (jogo.homeTeam.shortName || jogo.homeTeam.name);
        elAdv.innerHTML = '<span class="copa-bandeira">⚽</span> ' + (nomeAdv.length > 14 ? nomeAdv.substring(0, 14).toUpperCase() : nomeAdv.toUpperCase());

        if (jogo.status === "IN_PLAY" || jogo.status === "PAUSED") {
          var gB = ehCasa
            ? (jogo.score.fullTime.home ?? jogo.score.halfTime.home ?? 0)
            : (jogo.score.fullTime.away ?? jogo.score.halfTime.away ?? 0);
          var gA = ehCasa
            ? (jogo.score.fullTime.away ?? jogo.score.halfTime.away ?? 0)
            : (jogo.score.fullTime.home ?? jogo.score.halfTime.home ?? 0);
          elSB.textContent = gB;
          elSA.textContent = gA;
          elTimer.textContent = "AO VIVO";
        } else {
          elSB.textContent = "-";
          elSA.textContent = "-";
          var diff = new Date(jogo.utcDate).getTime() - Date.now();
          if (diff > 0) {
            var dias = Math.floor(diff / 86400000);
            if (dias > 0) {
              elTimer.textContent = dias + "d " + Math.floor((diff % 86400000) / 3600000) + "h";
            } else {
              elTimer.textContent = Math.floor(diff / 3600000) + "h " + Math.floor((diff % 3600000) / 60000) + "min";
            }
          } else {
            elTimer.textContent = "EM BREVE";
          }
        }
      })
      .catch(function () {
        mostrarSemJogo(elSB, elSA, elAdv, elTimer);
      });
  }

  function mostrarSemJogo(elSB, elSA, elAdv, elTimer) {
    elSB.textContent = "-";
    elSA.textContent = "-";
    elAdv.innerHTML = '<span class="copa-bandeira">⚽</span> ?';
    var faltam = Math.ceil((new Date("2026-07-19T18:00:00-03:00") - Date.now()) / 86400000);
    elTimer.textContent = faltam > 0 ? "FINAL: " + faltam + "d" : "EM BREVE";
  }

  function criarScoreboard() {
    if (document.getElementById("copa-scoreboard")) return;
    var sb = document.createElement("div");
    sb.id = "copa-scoreboard";
    sb.className = "copa-scoreboard";
    sb.innerHTML = scoreHTML;
    document.body.appendChild(sb);
    sb.style.display = "flex";
    atualizarPlacar();
    if (scoreAtualInterval) clearInterval(scoreAtualInterval);
    scoreAtualInterval = setInterval(atualizarPlacar, 60000);
  }

  function removerScoreboard() {
    if (scoreAtualInterval) { clearInterval(scoreAtualInterval); scoreAtualInterval = null; }
    var el = document.getElementById("copa-scoreboard");
    if (el) el.remove();
  }

  // =============================================
  // COUNTDOWN
  // =============================================
  function criarCountdown() {
    if (document.getElementById("copa-countdown")) return;
    var cd = document.createElement("div");
    cd.id = "copa-countdown";
    cd.className = "copa-countdown";
    cd.innerHTML = cdHTML;
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
    if (sb) sb.textContent = parseInt(sb.textContent, 10) + 1;
    var gol = document.createElement("div");
    gol.className = "copa-gol-overlay";
    gol.style.display = "flex";
    gol.innerHTML = golHTML;
    document.body.appendChild(gol);
    // 3 fogos em vez de 5
    for (var i = 0; i < 3; i++) (function (n) {
      setTimeout(function () { firework(Math.random() * innerWidth, Math.random() * innerHeight * 0.5); }, n * 300);
    })(i);
    // 20 confetes em vez de 40
    for (var c = 0; c < 20; c++) (function (d) {
      setTimeout(function () {
        var el = document.createElement("div");
        el.className = "copa2026-confete flag";
        el.style.left = Math.random() * 100 + "%";
        el.style.animationDuration = (Math.random() * 2 + 3) + "s";
        el.style.top = "-10px";
        document.body.appendChild(el);
        setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 6000);
      }, d * 80);
    })(c);
    setTimeout(function () {
      gol.style.opacity = "0";
      gol.style.transition = "opacity 0.5s";
      setTimeout(function () { if (gol.parentNode) gol.parentNode.removeChild(gol); golActive = false; }, 600);
    }, 4000);
  }
  window.golDoBrasil = golDoBrasil;

  // =============================================
  // FIREWORKS (reduzido: 12 partículas em vez de 20)
  // =============================================
  function firework(x, y) {
    var cor = coresC[Math.floor(Math.random() * coresC.length)];
    for (var i = 0; i < 8; i++) {
      var p = document.createElement("div");
      p.className = "copa-firework-particle";
      var ang = Math.random() * Math.PI * 2;
      var dist = 30 + Math.random() * 60;
      p.style.cssText = "left:" + x + "px;top:" + y + "px;width:" + (2 + Math.random() * 3) + "px;height:" + (2 + Math.random() * 3) + "px;background:" + cor + ";";
      p.style.setProperty("--fw-x", Math.cos(ang) * dist + "px");
      p.style.setProperty("--fw-y", Math.sin(ang) * dist + "px");
      p.style.animationDuration = (0.5 + Math.random() * 0.5) + "s";
      document.body.appendChild(p);
      setTimeout(function () { if (p.parentNode) p.parentNode.removeChild(p); }, 1200);
    }
  }

  function fogos() {
    for (var i = 0; i < 3; i++) (function (n) {
      setTimeout(function () { firework(Math.random() * innerWidth, Math.random() * innerHeight * 0.4); }, n * 500);
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
    document.addEventListener("mousemove", function atmReset() {
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
    for (var i = 0; i < 20; i++) (function (d) {
      setTimeout(function () {
        if (!ehexa) return;
        var f = document.createElement("div");
        f.className = "copa-hexa-flag";
        f.textContent = ["\u{1F1E7}\u{1F1F7}","\u{2B50}","\u{1F3C6}","⚽","\u{1F389}"][Math.floor(Math.random()*5)];
        f.style.left = Math.random() * 100 + "%";
        f.style.animationDuration = (4 + Math.random() * 4) + "s";
        con.appendChild(f);
        setTimeout(function () { if (f.parentNode) f.parentNode.removeChild(f); }, 10000);
      }, d * 150);
    })(i);
    for (var f2 = 0; f2 < 3; f2++) (function (n) {
      setTimeout(function () { firework(Math.random() * innerWidth, Math.random() * innerHeight * 0.3); }, n * 500);
    })(f2);
    setTimeout(function () { ehexa = false; }, 15000);
  }

  function ativarCampeao() {
    ecamp = true;
    document.body.classList.add("copa-campeao-mode");
    for (var f2 = 0; f2 < 5; f2++) (function (n) {
      setTimeout(function () { firework(Math.random() * innerWidth, Math.random() * innerHeight * 0.3); }, n * 400);
    })(f2);
    for (var c = 0; c < 30; c++) (function (d) {
      setTimeout(function () {
        var el = document.createElement("div");
        el.className = "copa2026-confete flag";
        el.style.left = Math.random() * 100 + "%";
        el.style.animationDuration = (2 + Math.random() * 3) + "s";
        el.style.top = "-10px";
        document.body.appendChild(el);
        setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 5000);
      }, d * 70);
    })(c);
    setTimeout(function () { document.body.classList.remove("copa-campeao-mode"); ecamp = false; }, 20000);
  }

  // =============================================
  // CURSOR (throttled: ~25fps)
  // =============================================
  function criarCursor() {
    if (cursorOn) return;
    if (window.matchMedia("(pointer: coarse)").matches) return; // sem cursor em touch
    cursorOn = true;
    var s = document.createElement("style");
    s.id = "copa-cs";
    s.textContent = "body.theme-copa *{cursor:none!important}";
    document.head.appendChild(s);
    cursorDot = document.createElement("div");
    cursorDot.id = "copa-cd";
    cursorDot.className = "copa-cursor-dot";
    document.body.appendChild(cursorDot);
    for (var i = 0; i < 3; i++) {
      var t = document.createElement("div");
      t.className = "copa-cursor-trail";
      t.id = "copa-ct-" + i;
      document.body.appendChild(t);
      cursorTrails[i] = t;
    }
    var ticking = false;
    document.addEventListener("mousemove", function (e) {
      trailData.push({ x: e.clientX, y: e.clientY });
      if (trailData.length > 10) trailData.shift();
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(function () {
          ticking = false;
          if (cursorDot) {
            cursorDot.style.left = (e.clientX - 3) + "px";
            cursorDot.style.top = (e.clientY - 3) + "px";
          }
          for (var j = 0; j < cursorTrails.length; j++) {
            var idx = Math.max(0, trailData.length - 1 - j * 2);
            var p = trailData[idx];
            if (cursorTrails[j] && p) {
              cursorTrails[j].style.left = (p.x - 2) + "px";
              cursorTrails[j].style.top = (p.y - 2) + "px";
            }
          }
        });
      }
    });
  }

  function removerCursor() {
    cursorOn = false;
    cursorDot = null;
    cursorTrails = [];
    trailData = [];
    var s = document.getElementById("copa-cs"); if (s) s.remove();
    var d = document.getElementById("copa-cd"); if (d) d.remove();
    for (var i = 0; i < 5; i++) { var t = document.getElementById("copa-ct-" + i); if (t) t.remove(); }
  }

  // =============================================
  // CAMPO
  // =============================================
  function criarCampo() {
    if (document.getElementById("copa-campo")) return;
    var campo = document.createElement("div");
    campo.id = "copa-campo";
    campo.className = "copa-campo-bg";
    var linhas = document.createElement("div");
    linhas.className = "copa-campo-linhas";
    linhas.innerHTML = campoLinhasHTML;
    var golesq = document.createElement("div");
    golesq.className = "copa-gol";
    golesq.id = "copa-gol-esq";
    golesq.innerHTML = golHTMLstrut;
    var goldir = document.createElement("div");
    goldir.className = "copa-gol";
    goldir.id = "copa-gol-dir";
    goldir.innerHTML = golHTMLstrut;
    campo.appendChild(linhas);
    campo.appendChild(golesq);
    campo.appendChild(goldir);
    document.body.appendChild(campo);
  }

  function removerCampo() {
    var el = document.getElementById("copa-campo");
    if (el) el.remove();
  }

  // =============================================
  // BOLAS CAINDO (reduzido: 1 a cada 1.2s)
  // =============================================
  function criarBolasCaindo() {
    pararBolasCaindo();
    bolasInterval = setInterval(function () {
      if (!document.body.classList.contains("theme-copa")) { pararBolasCaindo(); return; }
      var b = document.createElement("div");
      b.className = "copa-bola-caindo";
      b.textContent = "⚽";
      b.style.left = (5 + Math.random() * 90) + "%";
      b.style.fontSize = (14 + Math.random() * 14) + "px";
      b.style.animationDuration = (8 + Math.random() * 6) + "s";
      b.style.opacity = (0.3 + Math.random() * 0.3).toFixed(2);
      document.body.appendChild(b);
      setTimeout(function () { if (b.parentNode) b.parentNode.removeChild(b); }, 16000);
    }, 2500);
  }

  function pararBolasCaindo() {
    if (bolasInterval) { clearInterval(bolasInterval); bolasInterval = null; }
    var els = document.querySelectorAll(".copa-bola-caindo");
    for (var i = 0; i < els.length; i++) els[i].remove();
  }

  // =============================================
  // AUTO-INIT (MutationObserver em vez de polling)
  // =============================================
  function startWatching() {
    if (mo) return;
    if (document.body.classList.contains("theme-copa")) {
      setTimeout(init, 300);
    }
    mo = new MutationObserver(function () {
      var tem = document.body.classList.contains("theme-copa");
      if (tem && !ativo) init();
      else if (!tem && ativo) destroy();
    });
    mo.observe(document.body, { attributes: true, attributeFilter: ["class"] });
  }

  startWatching();

})();
