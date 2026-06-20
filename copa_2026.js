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
  var scoreHTML = '<div class="copa-scoreboard-team brasil"><span class="copa-bandeira" id="copa-bandeira-casa">\u{1F1E7}\u{1F1F7}</span> BRASIL</div><div class="copa-scoreboard-score"><span class="score-value" id="score-brasil">-</span><span class="score-divider">:</span><span class="score-value" id="score-adv">-</span></div><div class="copa-scoreboard-team" id="copa-adv-name"><span class="copa-bandeira" id="copa-bandeira-fora">\u{1F3C6}</span> ADVERSARIO</div><div class="copa-scoreboard-timer" id="score-timer">CARREGANDO...</div>';
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
  // SCOREBOARD AO VIVO
  // =============================================
  var scoreTimerSeg = 0;
  var scoreTimerMin = 0;
  var scoreTimerAtivo = false;
  var ultimaBuscaJogos = 0;
  var jogosCache = null;
  var scoreAtualInterval = null;
  var ADVERSARIO_PLACEHOLDER = "ADVERSARIO";
  // bandeiras em emoji por nome do time (mais comuns)
  var bandeiras = {
    "Brasil": "\u{1F1E7}\u{1F1F7}", "Argentina": "\u{1F1E6}\u{1F1F7}", "Uruguai": "\u{1F1FA}\u{1F1FE}",
    "Paraguai": "\u{1F1F5}\u{1F1FE}", "Chile": "\u{1F1E8}\u{1F1F1}", "Colômbia": "\u{1F1E8}\u{1F1F4}",
    "Equador": "\u{1F1EA}\u{1F1E8}", "Peru": "\u{1F1F5}\u{1F1EA}", "Venezuela": "\u{1F1FB}\u{1F1EA}",
    "Bolívia": "\u{1F1E7}\u{1F1F4}", "Alemanha": "\u{1F1E9}\u{1F1EA}", "França": "\u{1F1EB}\u{1F1F7}",
    "Inglaterra": "\u{1F3F4}\u{E0067}\u{E0062}\u{E0065}\u{E006E}\u{E0067}\u{E007F}", "Espanha": "\u{1F1EA}\u{1F1F8}",
    "Portugal": "\u{1F1F5}\u{1F1F9}", "Países Baixos": "\u{1F1F3}\u{1F1F1}", "Holanda": "\u{1F1F3}\u{1F1F1}",
    "Itália": "\u{1F1EE}\u{1F1F9}", "Bélgica": "\u{1F1E7}\u{1F1EA}", "Croácia": "\u{1F1ED}\u{1F1F7}",
    "Suíça": "\u{1F1E8}\u{1F1ED}", "Dinamarca": "\u{1F1E9}\u{1F1F0}", "Suécia": "\u{1F1F8}\u{1F1EA}",
    "Polônia": "\u{1F1F5}\u{1F1F1}", "Ucrânia": "\u{1F1FA}\u{1F1E6}", "Sérvia": "\u{1F1F7}\u{1F1F8}",
    "Japão": "\u{1F1EF}\u{1F1F5}", "Coreia do Sul": "\u{1F1F0}\u{1F1F7}", "Austrália": "\u{1F1E6}\u{1F1FA}",
    "Estados Unidos": "\u{1F1FA}\u{1F1F8}", "EUA": "\u{1F1FA}\u{1F1F8}", "México": "\u{1F1F2}\u{1F1FD}",
    "Canadá": "\u{1F1E8}\u{1F1E6}", "Costa Rica": "\u{1F1E8}\u{1F1F7}", "Marrocos": "\u{1F1F2}\u{1F1E6}",
    "Senegal": "\u{1F1F8}\u{1F1F3}", "Nigéria": "\u{1F1F3}\u{1F1EC}", "Camarões": "\u{1F1E8}\u{1F1F2}",
    "Gana": "\u{1F1EC}\u{1F1ED}", "Tunísia": "\u{1F1F9}\u{1F1F3}", "Argélia": "\u{1F1E9}\u{1F1FF}",
    "Egito": "\u{1F1EA}\u{1F1EC}", "Arábia Saudita": "\u{1F1F8}\u{1F1E6}", "Irã": "\u{1F1EE}\u{1F1F7}",
    "Catar": "\u{1F1F6}\u{1F1E6}", "Emirados Árabes": "\u{1F1E6}\u{1F1EA}", "África do Sul": "\u{1F1FF}\u{1F1E6}",
    "Nova Zelândia": "\u{1F1F3}\u{1F1FF}", "Panamá": "\u{1F1F5}\u{1F1E6}", "Honduras": "\u{1F1ED}\u{1F1F3}"
  };

  function buscarJogosBrasil(callback) {
    var agora = Date.now();
    if (jogosCache && agora - ultimaBuscaJogos < 120000) {
      callback(jogosCache);
      return;
    }
    // OpenLigaDB: gratuita, sem chave, CORS aberto
    // teamId 7 = Brasil na Copa do Mundo
    fetch("https://api.openligadb.de/getmatchdata/5128/2026") // 5128 = Copa do Mundo 2026
      .then(function (r) { if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); })
      .then(function (jogos) {
        ultimaBuscaJogos = Date.now();
        // filtra só jogos do Brasil
        var brasil = [];
        for (var i = 0; i < jogos.length; i++) {
          var j = jogos[i];
          if (j.team1 && j.team2 && (j.team1.teamName === "Brasil" || j.team2.teamName === "Brasil")) {
            brasil.push(j);
          }
        }
        jogosCache = { matches: brasil };
        callback(jogosCache);
      })
      .catch(function () {
        // fallback: busca em copas anteriores
        fetch("https://api.openligadb.de/getmatchdata/5114/2026") // WC Qualifiers
          .then(function (r2) { if (!r2.ok) throw new Error(""); return r2.json(); })
          .then(function (jogos2) {
            ultimaBuscaJogos = Date.now();
            var brasil2 = [];
            for (var i2 = 0; i2 < jogos2.length; i2++) {
              var j2 = jogos2[i2];
              if (j2.team1 && j2.team2 && (j2.team1.teamName === "Brasil" || j2.team2.teamName === "Brasil")) {
                brasil2.push(j2);
              }
            }
            jogosCache = { matches: brasil2 };
            callback(jogosCache);
          })
          .catch(function () {
            ultimaBuscaJogos = Date.now();
            jogosCache = { matches: [] };
            callback(null);
          });
      });
  }

  function atualizarPlacar() {
    buscarJogosBrasil(function (data) {
      var elSB = document.getElementById("score-brasil");
      var elSA = document.getElementById("score-adv");
      var elAdv = document.getElementById("copa-adv-name");
      var elTimer = document.getElementById("score-timer");
      if (!elSB || !elSA || !elAdv || !elTimer) return;

      var jogo = null;
      if (data && data.matches && data.matches.length > 0) {
        // pega o jogo mais relevante: primeiro ao vivo, depois o mais proximo
        var aoVivo = null, proximo = null;
        for (var i = 0; i < data.matches.length; i++) {
          var m = data.matches[i];
          if (m.matchIsFinished === false && m.matchIsStarted) {
            var dInicio = new Date(m.matchDateTimeUTC).getTime();
            if (!aoVivo || Math.abs(dInicio - Date.now()) < Math.abs(new Date(aoVivo.matchDateTimeUTC).getTime() - Date.now())) {
              aoVivo = m;
            }
          }
        }
        if (!aoVivo) {
          for (var i2 = 0; i2 < data.matches.length; i2++) {
            var m2 = data.matches[i2];
            if (!m2.matchIsFinished) {
              var d2 = new Date(m2.matchDateTimeUTC).getTime();
              if (!proximo || d2 > Date.now() && d2 < new Date(proximo.matchDateTimeUTC).getTime()) {
                proximo = m2;
              }
            }
          }
        }
        jogo = aoVivo || proximo || data.matches[data.matches.length - 1];
      }

      if (!jogo) {
        elSB.textContent = "-";
        elSA.textContent = "-";
        elAdv.textContent = "\u{1F3C6} ?";
        var final2026 = new Date("2026-07-19T18:00:00-03:00");
        var faltam = Math.ceil((final2026 - Date.now()) / 86400000);
        elTimer.textContent = faltam > 0 ? "FINAL: " + faltam + "d" : "EM BREVE";
        return;
      }

      var timeCasa = jogo.team1.name || jogo.team1.teamName;
      var timeFora = jogo.team2.name || jogo.team2.teamName;
      var ehBrasilCasa = timeCasa === "Brasil";
      var adv = ehBrasilCasa ? timeFora : timeCasa;
      var bandeiraAdv = bandeiras[adv] || bandeiras[timeFora] || "\u{1F3C6}";
      elAdv.innerHTML = '<span class="copa-bandeira">' + bandeiraAdv + '</span> ' + (adv.length > 14 ? adv.substring(0, 14).toUpperCase() : adv.toUpperCase());

      if (jogo.matchIsStarted && !jogo.matchIsFinished) {
        // jogo rolando
        elSB.textContent = jogo.matchResults && jogo.matchResults.length > 0 ? jogo.matchResults[jogo.matchResults.length - 1].pointsTeam1 : 0;
        elSA.textContent = jogo.matchResults && jogo.matchResults.length > 0 ? jogo.matchResults[jogo.matchResults.length - 1].pointsTeam2 : 0;
        elTimer.textContent = "AO VIVO";
      } else if (jogo.matchIsFinished) {
        var resFinal = null;
        if (jogo.matchResults) {
          for (var ri = 0; ri < jogo.matchResults.length; ri++) {
            if (jogo.matchResults[ri].resultName === "Endergebnis") resFinal = jogo.matchResults[ri];
          }
        }
        if (resFinal) {
          elSB.textContent = ehBrasilCasa ? resFinal.pointsTeam1 : resFinal.pointsTeam2;
          elSA.textContent = ehBrasilCasa ? resFinal.pointsTeam2 : resFinal.pointsTeam1;
        } else {
          elSB.textContent = "-"; elSA.textContent = "-";
        }
        elTimer.textContent = "FINALIZADO";
      } else {
        // jogo futuro
        elSB.textContent = "-";
        elSA.textContent = "-";
        var dataJogo = new Date(jogo.matchDateTimeUTC);
        var diff = dataJogo - Date.now();
        if (diff > 0) {
          var dias = Math.floor(diff / 86400000);
          var horas = Math.floor((diff % 86400000) / 3600000);
          if (dias > 0) {
            elTimer.textContent = dias + "d " + horas + "h";
          } else if (horas > 0) {
            elTimer.textContent = horas + "h " + Math.floor((diff % 3600000) / 60000) + "min";
          } else {
            elTimer.textContent = Math.floor(diff / 60000) + "min";
          }
        } else {
          elTimer.textContent = "EM BREVE";
        }
      }
    });
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
    // atualiza a cada 30s (respeita rate limit de 10/min)
    scoreAtualInterval = setInterval(atualizarPlacar, 30000);
  }

  function removerScoreboard() {
    if (scoreAtualInterval) { clearInterval(scoreAtualInterval); scoreAtualInterval = null; }
    pararTimerPlacar();
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
