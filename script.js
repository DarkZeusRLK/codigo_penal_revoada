document.addEventListener("DOMContentLoaded", function () {
  // =========================================================
  // 0. SISTEMA DE PATCH NOTES
  // =========================================================
  const VERSAO_ATUAL = "3.7";

  const CONTEUDO_PATCH_NOTES = `
      <h4>Novidades da Versao ${VERSAO_ATUAL}</h4>
      <ul>
          <li><strong>Visual:</strong> Ajustes no layout e refinamento dos componentes.</li>
          <li><strong>Interface:</strong> Redefinição da estilização original.</li>
          <li><strong>Player:</strong> Ajuste para nomes longos sem quebrar.</li>
          <li><strong>Alerta:</strong> Aviso fixo para crimes inafiancaveis.</li>
      </ul>
  `;

  function verificarAtualizacao() {
    const versaoSalva = localStorage.getItem("sistema_versao");
    const modalPatch = document.getElementById("modal-patch-notes");
    const contentPatch = document.getElementById("patch-notes-content");
    const btnFecharPatch = document.getElementById("btn-fechar-patch");

    // Só mostra se já tiver um usuário logado (nome definido)
    if (!document.getElementById("user-name").textContent) return;

    if (versaoSalva !== VERSAO_ATUAL) {
      if (modalPatch && contentPatch) {
        contentPatch.innerHTML = CONTEUDO_PATCH_NOTES;
        modalPatch.classList.remove("hidden");
        modalPatch.style.display = "flex";
      }
    }

    if (btnFecharPatch) {
      btnFecharPatch.addEventListener("click", function () {
        localStorage.setItem("sistema_versao", VERSAO_ATUAL);
        modalPatch.classList.add("hidden");
        modalPatch.style.display = "none";
      });
    }
  }

  // =========================================================
  // 1. WATCHDOG (PREVENÇÃO DE TELA PRETA) & LOGIN UI
  // =========================================================
  var loginScreen = document.getElementById("login-screen");
  // O container agora é a div com classe .container, mas usamos o main-content para controle
  var appContent = document.querySelector(".container");

  function mostrarApp() {
    if (loginScreen) {
      loginScreen.style.opacity = "0";
      setTimeout(() => {
        loginScreen.classList.add("hidden");
        loginScreen.style.display = "none";
      }, 500);
    }
    if (appContent) {
      appContent.classList.remove("hidden");
      appContent.style.display = "block";
    }
    setTimeout(verificarAtualizacao, 1000);
  }

  function mostrarLogin() {
    if (loginScreen) {
      loginScreen.classList.remove("hidden");
      loginScreen.style.display = "flex";
      loginScreen.style.opacity = "1";
    }
  }

  // =========================================================
  // 1.5. FOGOS DE ARTIFICIO (CANVAS)
  // =========================================================
  function setupCarnavalFireworks() {
    var canvas = document.getElementById("fireworks-canvas");
    if (!canvas) return;
    var ctx = canvas.getContext("2d");
    if (!ctx) return;

    var rockets = [];
    var particles = [];
    var lastSpawn = 0;
    var lastCornerSpawn = 0;
    var lastSideBurst = 0;
    var lastMaskBurst = 0;
    var spawnInterval = 900;
    var cornerInterval = 1800;
    var sideBurstInterval = 1200;
    var maskBurstInterval = 1600;
    var clickBurstUntil = 0;
    var colors = [
      "#00ff5f",
      "#fedf00",
      "#ff1493",
      "#0066ff",
      "#ffd700",
      "#ff6b35",
    ];

    function resizeCanvas() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }

    function getCenterPoint() {
      var container = document.querySelector(".container");
      if (container) {
        var rect = container.getBoundingClientRect();
        return {
          x: rect.left + rect.width / 2,
          y: rect.top + rect.height / 2,
        };
      }
      return { x: canvas.width / 2, y: canvas.height / 2 };
    }

    function getSidePoints() {
      var container = document.querySelector(".container");
      if (!container) {
        return [
          { x: canvas.width * 0.18, y: canvas.height * 0.5 },
          { x: canvas.width * 0.82, y: canvas.height * 0.5 },
        ];
      }
      var rect = container.getBoundingClientRect();
      return [
        { x: rect.left - 40, y: rect.top + rect.height * 0.45 },
        { x: rect.right + 40, y: rect.top + rect.height * 0.45 },
      ];
    }

    function randomTarget() {
      var w = canvas.width;
      var h = canvas.height;
      var corners = [
        { x: w * 0.12, y: h * 0.18 },
        { x: w * 0.88, y: h * 0.18 },
        { x: w * 0.12, y: h * 0.82 },
        { x: w * 0.88, y: h * 0.82 },
      ];
      var base = corners[Math.floor(Math.random() * corners.length)];
      return {
        x: base.x + (Math.random() * 60 - 30),
        y: base.y + (Math.random() * 60 - 30),
      };
    }

    function spawnRocket(origin, targetOverride) {
      var center = origin || getCenterPoint();
      var target = targetOverride || randomTarget();
      var dx = target.x - center.x;
      var dy = target.y - center.y;
      var distance = Math.sqrt(dx * dx + dy * dy);
      var speed = Math.max(6, Math.min(10, distance / 40));
      rockets.push({
        x: center.x,
        y: center.y,
        vx: (dx / distance) * speed + (Math.random() - 0.5) * 0.8,
        vy: (dy / distance) * speed + (Math.random() - 0.5) * 0.8,
        targetX: target.x,
        targetY: target.y,
        life: 0,
        maxLife: Math.max(25, Math.min(45, distance / 12)),
        color: colors[Math.floor(Math.random() * colors.length)],
      });
    }

    function explode(x, y, color) {
      var count = 70 + Math.floor(Math.random() * 25);
      for (var i = 0; i < count; i++) {
        var angle = Math.random() * Math.PI * 2;
        var speed = Math.random() * 5 + 1.5;
        particles.push({
          x: x,
          y: y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: 0,
          maxLife: 70 + Math.floor(Math.random() * 30),
          color: color,
          size: 1 + Math.random() * 2,
        });
      }
    }

    function animate(time) {
      ctx.globalCompositeOperation = "source-over";
      var fadeAlpha = time < clickBurstUntil ? 0.6 : 0.2;
      ctx.fillStyle = "rgba(5, 5, 5, " + fadeAlpha + ")";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.globalCompositeOperation = "lighter";

      if (time - lastSpawn > spawnInterval) {
        spawnRocket();
        if (Math.random() > 0.45) spawnRocket();
        lastSpawn = time;
        spawnInterval = 520 + Math.random() * 420;
      }

      if (time - lastCornerSpawn > cornerInterval) {
        var w = canvas.width;
        var h = canvas.height;
        var corners = [
          { x: w * 0.08, y: h * 0.12 },
          { x: w * 0.92, y: h * 0.12 },
          { x: w * 0.08, y: h * 0.88 },
          { x: w * 0.92, y: h * 0.88 },
        ];
        corners.forEach((corner) => {
          var origin = getCenterPoint();
          spawnRocket(origin, corner);
          if (Math.random() > 0.6)
            spawnRocket(origin, {
              x: corner.x + (Math.random() * 80 - 40),
              y: corner.y + (Math.random() * 80 - 40),
            });
        });
        lastCornerSpawn = time;
        cornerInterval = 1200 + Math.random() * 600;
      }

      if (time - lastSideBurst > sideBurstInterval) {
        var sidePoints = getSidePoints();
        sidePoints.forEach((point) => {
          explode(
            point.x,
            point.y,
            colors[Math.floor(Math.random() * colors.length)],
          );
        });
        lastSideBurst = time;
        sideBurstInterval = 900 + Math.random() * 500;
      }

      if (time - lastMaskBurst > maskBurstInterval) {
        var wMask = canvas.width;
        var hMask = canvas.height;
        var maskPoints = [
          { x: wMask * 0.12, y: hMask * 0.16 },
          { x: wMask * 0.88, y: hMask * 0.16 },
        ];
        maskPoints.forEach((point) => {
          explode(
            point.x,
            point.y,
            colors[Math.floor(Math.random() * colors.length)],
          );
        });
        lastMaskBurst = time;
        maskBurstInterval = 1400 + Math.random() * 500;
      }

      rockets = rockets.filter((r) => {
        r.x += r.vx;
        r.y += r.vy;
        r.life += 1;
        ctx.fillStyle = r.color;
        ctx.beginPath();
        ctx.arc(r.x, r.y, 2.2, 0, Math.PI * 2);
        ctx.fill();

        var nearTarget =
          Math.abs(r.x - r.targetX) < 8 && Math.abs(r.y - r.targetY) < 8;
        if (nearTarget || r.life > r.maxLife) {
          explode(r.x, r.y, r.color);
          return false;
        }
        return true;
      });

      particles = particles.filter((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.03;
        p.life += 1;
        var alpha = 1 - p.life / p.maxLife;
        if (alpha < 0) alpha = 0;
        ctx.fillStyle = p.color;
        ctx.globalAlpha = alpha;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
        return p.life < p.maxLife;
      });

      requestAnimationFrame(animate);
    }

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);
    document.addEventListener("click", function (event) {
      var container = document.querySelector(".container");
      if (!container) return;
      if (container.contains(event.target)) return;
      explode(
        event.clientX,
        event.clientY,
        colors[Math.floor(Math.random() * colors.length)],
      );
      clickBurstUntil = performance.now() + 3000;
    });
    requestAnimationFrame(animate);
  }

  // Efeitos sazonais removidos do tema padrão.

  // =========================================================
  // 2. PLAYER DE MÚSICA ESTILO SPOTIFY
  // =========================================================
  const playlist = [
    {
      title: "Riders on the Storm",
      artist: "Snoop Dogg",
      src: "Música/Snoop Dogg - Riders on the Storm (feat. The Doors) - Rebel Music Studios (youtube).mp3",
      cover: "Imagens/Album_NF.webp",
    },
    {
      title: "Feel Good Inc.",
      artist: "Gorillaz",
      src: "Música/Gorillaz - Feel Good Inc. (Official Video) - Gorillaz (youtube).mp3",
      cover: "Imagens/Album_gorillaz.webp",
    },
    {
      title: "Music Sounds Better With You",
      artist: "Stardust",
      src: "Música/Stardust - Music Sounds Better With You (Official Music Video).mp4",
      cover: "Imagens/capa_stardust.jpg",
    },
    {
      title: "Lady (Hear Me Tonight)",
      artist: "Modjo",
      src: "Música/Modjo - Lady (Hear Me Tonight) (Official Video) - ModjoOfficial (youtube).mp3",
      cover: "Imagens/lady_modjo.jpg",
    },
    {
      title: "What I've Done ",
      artist: "Linkin Park",
      src: "Música/What I've Done (Official Music Video) [4K Upgrade] - Linkin Park - Linkin Park (youtube).mp3",
      cover: "Imagens/Album_linkinpark.webp",
    },
  ];

  let currentTrackIndex = 0;

  const audioEl = document.getElementById("bg-music");
  const coverEl = document.getElementById("player-cover");
  const titleEl = document.getElementById("player-title");
  const artistEl = document.getElementById("player-artist");
  const btnPrev = document.getElementById("btn-prev");
  const btnPlayPause = document.getElementById("btn-play-pause");
  const btnNext = document.getElementById("btn-next");

  function updatePlayIcon(isPlaying) {
    if (!btnPlayPause) return;
    if (isPlaying) {
      btnPlayPause.innerHTML = '<i class="fa-solid fa-pause"></i>';
    } else {
      btnPlayPause.innerHTML = '<i class="fa-solid fa-play"></i>';
    }
  }

  function loadTrack(index) {
    if (!playlist[index] || !audioEl) return;
    const track = playlist[index];

    audioEl.src = track.src;
    audioEl.volume = 0.2;

    if (titleEl) titleEl.textContent = track.title;
    if (artistEl) artistEl.textContent = track.artist;

    if (coverEl) {
      coverEl.src = track.cover ? track.cover : "Imagens/placeholder_cover.jpg";
    }

    // Se já estava tocando ou avançou, tenta tocar
    if (!audioEl.paused && audioEl.currentTime > 0) {
      playAudio();
    }
  }

  function playAudio() {
    if (!audioEl) return;
    const playPromise = audioEl.play();
    if (playPromise !== undefined) {
      playPromise
        .then((_) => updatePlayIcon(true))
        .catch((error) => {
          console.log("Autoplay bloqueado ou erro: ", error);
          updatePlayIcon(false);
        });
    }
  }

  function pauseAudio() {
    if (!audioEl) return;
    audioEl.pause();
    updatePlayIcon(false);
  }

  function togglePlayPause() {
    if (!audioEl) return;
    if (audioEl.paused) playAudio();
    else pauseAudio();
  }

  function nextTrack() {
    currentTrackIndex++;
    if (currentTrackIndex >= playlist.length) currentTrackIndex = 0;
    loadTrack(currentTrackIndex);
    playAudio();
  }

  function prevTrack() {
    currentTrackIndex--;
    if (currentTrackIndex < 0) currentTrackIndex = playlist.length - 1;
    loadTrack(currentTrackIndex);
    playAudio();
  }

  if (audioEl && btnPlayPause) {
    loadTrack(currentTrackIndex);
    btnPlayPause.addEventListener("click", togglePlayPause);
    if (btnNext) btnNext.addEventListener("click", nextTrack);
    if (btnPrev) btnPrev.addEventListener("click", prevTrack);
    audioEl.addEventListener("ended", nextTrack);
  }

  // Funcionalidade de minimizar o player Spotify
  const spotifyPlayer = document.getElementById("spotify-player");
  const btnMinimize = document.getElementById("btn-minimize-spotify");
  const btnRestore = document.getElementById("btn-restore-spotify");

  if (spotifyPlayer) {
    localStorage.removeItem("spotify-player-position");
    spotifyPlayer.style.left = "";
    spotifyPlayer.style.top = "";
    spotifyPlayer.style.right = "";
    spotifyPlayer.style.bottom = "";

    // Botão minimizar
    if (btnMinimize) {
      btnMinimize.addEventListener("click", function (e) {
        e.stopPropagation();
        spotifyPlayer.classList.add("hidden");
        if (btnRestore) btnRestore.classList.remove("hidden");
        localStorage.setItem("spotify-player-minimized", "true");
      });
    }

    // Botão restaurar
    if (btnRestore) {
      btnRestore.addEventListener("click", function () {
        spotifyPlayer.classList.remove("hidden");
        btnRestore.classList.add("hidden");
        localStorage.setItem("spotify-player-minimized", "false");
      });

      // Verifica se estava minimizado
      if (localStorage.getItem("spotify-player-minimized") === "true") {
        spotifyPlayer.classList.add("hidden");
        btnRestore.classList.remove("hidden");
      }
    }
  }

  // =========================================================
  // 3. UTILITÁRIOS (ALERTAS)
  // =========================================================
  function mostrarAlerta(mensagem, tipo) {
    if (!tipo) tipo = "error";
    var div = document.createElement("div");
    div.className = "custom-alert " + tipo;
    var icone =
      tipo === "success" ? "fa-circle-check" : "fa-triangle-exclamation";
    div.innerHTML = `<i class="fa-solid ${icone}"></i><div class="alert-content"><span class="alert-title">${
      tipo === "success" ? "SUCESSO" : "ATENÇÃO"
    }</span><span class="alert-msg">${mensagem}</span></div>`;
    document.body.appendChild(div);
    setTimeout(() => {
      if (div.parentNode) div.parentNode.removeChild(div);
    }, 4000);
  }

  // =========================================================
  // 4. SESSÃO E LOGIN (UNIFICADO)
  // =========================================================
  const SESSION_KEY = "policia_revoada_v3_natal";
  const SESSION_DURATION = 7 * 24 * 60 * 60 * 1000;

  var userNameSpan = document.getElementById("user-name");
  var userIdHidden = document.getElementById("user-id-hidden");
  var userAvatarImg = document.getElementById("user-avatar");

  function salvarSessao(nome, avatar, id) {
    const dados = { nome, avatar, id, timestamp: new Date().getTime() };
    localStorage.setItem(SESSION_KEY, JSON.stringify(dados));
  }

  function aplicarDadosUsuario(nome, avatar, id) {
    if (userNameSpan) userNameSpan.textContent = nome;
    if (userIdHidden) userIdHidden.value = id;
    if (userAvatarImg && avatar) {
      userAvatarImg.src = avatar;
      userAvatarImg.classList.remove("hidden");
    }
  }

  function verificarSessao() {
    // Se tiver hash na URL (voltando do Discord), ignoramos o cache local para logar
    if (window.location.hash.includes("access_token")) return;

    const dadosSalvos = localStorage.getItem(SESSION_KEY);
    if (!dadosSalvos) return;

    try {
      const sessao = JSON.parse(dadosSalvos);
      if (new Date().getTime() - sessao.timestamp > SESSION_DURATION) {
        localStorage.removeItem(SESSION_KEY);
        return;
      }
      aplicarDadosUsuario(sessao.nome, sessao.avatar, sessao.id);
      mostrarApp();
    } catch (e) {
      console.error(e);
      localStorage.removeItem(SESSION_KEY);
    }
  }

  // --- BOTÃO SIMULAR ACESSO (DEV) ---
  var btnBypass = document.getElementById("btn-bypass-login");
  if (btnBypass) {
    btnBypass.addEventListener("click", function (e) {
      e.preventDefault();
      var nome = "Policial Operador";
      var id = "000000000000000000";
      var avatar = "https://cdn.discordapp.com/embed/avatars/0.png";

      salvarSessao(nome, avatar, id);
      aplicarDadosUsuario(nome, avatar, id);
      mostrarApp();
      mostrarAlerta("Modo de Teste Ativado!", "success");
    });
  }

  // --- LOGIN DISCORD (RETORNO DA API) ---
  var fragment = new URLSearchParams(window.location.hash.slice(1));
  var accessToken = fragment.get("access_token");
  var tokenType = fragment.get("token_type");

  if (accessToken) {
    // Feedback visual na tela de login
    const loginTitle = document.querySelector("#login-screen h2");
    const loginDesc = document.querySelector("#login-screen p");
    if (loginTitle) loginTitle.innerText = "AGUARDE...";
    if (loginDesc) loginDesc.innerText = "Validando credenciais...";

    window.history.replaceState({}, document.title, window.location.pathname);

    fetch("https://discord.com/api/users/@me", {
      headers: { authorization: `${tokenType} ${accessToken}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.id) {
          var nome = `${data.username}#${data.discriminator || "0000"}`;
          var avatar = data.avatar
            ? `https://cdn.discordapp.com/avatars/${data.id}/${data.avatar}.png`
            : "Imagens/image.png";

          salvarSessao(nome, avatar, data.id);
          aplicarDadosUsuario(nome, avatar, data.id);
          mostrarApp();
        } else {
          if (loginDesc)
            loginDesc.innerText = "Erro: Token inválido ou expirado.";
          mostrarAlerta("Erro ao obter dados do Discord.", "error");
        }
      })
      .catch((err) => {
        console.error(err);
        if (loginDesc) loginDesc.innerText = "Erro de conexão.";
      });
  } else {
    // Se não tem token na URL, verifica se já tem sessão salva
    verificarSessao();
  }

  // =========================================================
  // 5. PESQUISA DE OFICIAIS
  // =========================================================
  var LISTA_OFICIAIS = [{ id: "001", nome: "Comandante Geral" }];

  var searchInput = document.getElementById("search-oficial");
  var dropdownResults = document.getElementById("dropdown-oficiais");
  var selectedOficialIdInput = document.getElementById("selected-oficial-id");
  var btnAddPart = document.getElementById("btn-add-participante");
  var listaParticipantesVisual = document.getElementById(
    "lista-participantes-visual",
  );
  var participantesSelecionados = [];

  // Tenta carregar JSON externo, se falhar usa lista padrão
  async function carregarOficiaisDiscord() {
    try {
      const response = await fetch("/api/membros"); // Ajuste se tiver backend
      if (response.ok) {
        var dados = await response.json();
        if (Array.isArray(dados)) LISTA_OFICIAIS = dados;
      }
    } catch (error) {
      console.log("Usando lista manual ou erro na API.");
    }
  }
  carregarOficiaisDiscord();

  if (searchInput) {
    searchInput.addEventListener("input", function () {
      var termo = this.value.toLowerCase();
      dropdownResults.innerHTML = "";
      if (termo.length < 1) {
        dropdownResults.classList.add("hidden");
        return;
      }

      var filtrados = LISTA_OFICIAIS.filter((o) =>
        o.nome.toLowerCase().includes(termo),
      );
      if (filtrados.length === 0) {
        dropdownResults.classList.add("hidden");
        return;
      }

      dropdownResults.classList.remove("hidden");
      filtrados.forEach((oficial) => {
        var div = document.createElement("div");
        div.className = "dropdown-item";
        div.innerHTML = `<strong>${oficial.nome}</strong>`;
        div.addEventListener("click", function () {
          searchInput.value = oficial.nome;
          selectedOficialIdInput.value = oficial.id;
          dropdownResults.classList.add("hidden");
        });
        dropdownResults.appendChild(div);
      });
    });

    // Fecha dropdown ao clicar fora
    document.addEventListener("click", function (e) {
      if (e.target !== searchInput && e.target !== dropdownResults) {
        dropdownResults.classList.add("hidden");
      }
    });
  }

  if (btnAddPart) {
    btnAddPart.addEventListener("click", function () {
      var id = selectedOficialIdInput.value || "000";
      var nome = searchInput.value;

      var idLogado = userIdHidden.value;
      var nomeLogado = userNameSpan.textContent;

      if (!nome) return mostrarAlerta("Digite o nome do oficial.", "error");
      if (id === idLogado || nome === nomeLogado)
        return mostrarAlerta("Você já é o relator!", "error");
      if (participantesSelecionados.length >= 9)
        return mostrarAlerta("Limite máximo de 9 participantes!", "error");
      if (participantesSelecionados.some((p) => p.nome === nome))
        return mostrarAlerta("Oficial já adicionado.", "error");

      participantesSelecionados.push({ id, nome });
      var tag = document.createElement("div");
      tag.className = "officer-tag";
      tag.innerHTML = `<span>${nome}</span> <button onclick="removerParticipante('${nome}', this)">×</button>`;
      listaParticipantesVisual.appendChild(tag);

      searchInput.value = "";
      selectedOficialIdInput.value = "";
    });
  }

  window.removerParticipante = function (nome, btn) {
    participantesSelecionados = participantesSelecionados.filter(
      (p) => p.nome !== nome,
    );
    btn.parentElement.remove();
  };

  // =========================================================
  // 6. LÓGICA DA CALCULADORA
  // =========================================================
  var selectedCrimes = [];
  var crimeItems = document.querySelectorAll(".crime-item");
  var checkboxes = document.querySelectorAll(
    '.atenuantes input[type="checkbox"]',
  );
  var inputHpMinutos = document.getElementById("hp-minutos");
  var hpSimBtn = document.getElementById("hp-sim");
  var hpNaoBtn = document.getElementById("hp-nao");
  var inputDinheiroSujo = document.getElementById("input-dinheiro-sujo");

  var penaTotalEl = document.getElementById("pena-total");
  var multaTotalEl = document.getElementById("multa-total");
  var crimesListOutput = document.getElementById("crimes-list-output");
  var containerDinheiroSujo = document.getElementById(
    "container-dinheiro-sujo",
  );
  var containerHp = document.getElementById("container-hp-minutos");
  var alertPenaMaxima = document.getElementById("alerta-pena-maxima");
  var alertaInfiancavel = document.getElementById("alerta-inafiancavel");

  var CRIME_TIPIFICACOES = {
    "Tentativa de Homicídio":
      "Quando um indivíduo tenta matar alguém mas não consegue (pinou, a polícia chegou, e etc).",
    "Homicídio Culposo":
      "Quando um indivíduo mata alguém sem intenção (sem querer - exemplo: queria atirar em um assaltante, pinou e acertou um cidadão de bem).",
    "Homicídio Doloso": "Quando um indivíduo mata alguém de propósito.",
    "Homicídio Doloso Qualificado":
      "Quando um indivíduo mata utilizando meios cruéis (tortura/humilhação) ou que incapacitaram a vítima (algema, capuz).",
    "Omissão de Socorro":
      "Quando um indivíduo gera dano físico e foge sem prestar auxílio, empreendendo fuga ou ignorando a vítima.",
    "Lesão Corporal":
      "Quando um indivíduo gera dano físico a outro; a pessoa fica machucada, mas não morre.",
    Sequestro: "Autoexplicativo.",
    "Assédio Moral":
      "Quando um indivíduo profere atitudes, gestos, palavras ou escritos que possam ferir a integridade física ou psíquica de outra pessoa.",
    "Calúnia, Injúria ou Difamação":
      "Quando alguém acusa outra pessoa de ter cometido um crime, ofende a honra, ou divulga informações mentirosas sobre essa pessoa.",
    "Invasão de Propriedade":
      "Quando alguém invade espaços, casas sem autorização (inclusive QRU de Roubo a Residência) ou entra locais proibidos (reserva de armamento).",
    "Perturbação do Sossego Alheio":
      "Quando um indivíduo está perturbando um local com carros de som e/ou atitudes que incomodam alguém (randolagem).",
    Ameaça: "Autoexplicativo.",
    Extorsão:
      "Quando um indivíduo tenta chantagear outra pessoa com informações (falsas ou verdadeiras) a fim de obter benefício (ser solto da prisão, dinheiro, ou etc).",
    "Agressão a Funcionário Público":
      "Bater em médicos, policiais, mecânicos e/ou advogados.",
    "Falsidade Ideológica":
      'Fingir ser alguém conhecido ou fingir ser de uma profissão (falar ou usar roupas). Exemplo: "Sou o pinguim" - "Sou advogado" - Usar farda da polícia.',
    Prevaricação:
      "Não realizar as obrigações da sua profissão (exemplos: um médico ignorar um corpo desmaiado, um policial ignorar um crime em andamento e etc).",
    "Abuso de Autoridade":
      "Utilizar seus poderes de forma inadequada ou excessiva e/ou aproveitar das suas funções para obter benefício próprio.",
    "Falsa Comunicação de Crime": "Autoexplicativo.",
    "Tentativa de Suborno":
      "Oferecer dinheiro ou benefícios para que um policial descumpra seu dever (não prender alguém, fazer vista grossa em local de crime e etc).",
    Desacato:
      "Ofender um funcionário público durante suas atribuições profissionais.",
    Desobediência:
      "Desobedecer uma ordem legal (descer do veículo, se aproximar da viatura, levantar a mão).",
    "Obstrução de Justiça":
      "Quando alguém tenta atrapalhar um procedimento policial (esconder um corpo ou veículo com itens ilegais, bater na QSV, atrapalhar a revista, etc).",
    "Ocultação de Provas":
      "Quando um indivíduo esconde itens ilícitos, veículos, corpos mortos e/ou dropá-los em local impossível a fim de dificultar o procedimento policial.",
    "Resistência à Prisão":
      "Quando alguém não coopera no procedimento prisional, age de forma agressiva, tenta fugir, corre algemado, tenta se esconder e etc.",
    "Desmanche de Veículos":
      "Tentar desmanchar um veículo, desmanchá-lo e/ou levá-lo para um local que realiza esse tipo de atividade.",
    Roubo:
      "Quando um indivíduo utiliza de violência ou grave ameaça para retirar algum item ou bem móvel de alguém.",
    "Furto a Caixa Eletrônico": "Autoexplicativo.",
    Furto:
      "Quando um indivíduo tenta subtrair (retirar) algo de alguém sem utilizar de violência ou grave ameaça. Ou seja, pegar escondido, na miúda, ou sem alguém ver.",
    "Receptação de Veículos":
      "Quando um indivíduo é encontrado com um veículo que não é seu, e que ao ligar para o dono é noticiado o roubo ou furto.",
    "Roubo de Veículos":
      "Quando um indivíduo utiliza de violência ou grave ameaça para subtrair o veículo de outra pessoa.",
    "Tentativa de Furto":
      "Quando um indivíduo tenta pegar algo escondido, na miúda, ou sem alguém ver - mas é flagrado antes de conseguir.",
    "Furto de Veículos":
      "Quando um indivíduo aproveita-se de um descuido e leva o veículo de alguém sem utilizar de violência ou grave ameaça.",
    "Dano a Patrimônio Público":
      "Destruir ou danificar prédios, veículos ou bens públicos (bater em viaturas, quebrar postes de iluminação ou explodir postos de gasolina).",
    "Atentado ao Pudor":
      "Constranger, ameaçar ou praticar ato libidinoso, assediatório ou sexual (andar pelado, falar coisas pornográficas ou induzir cunhos sexualizados à algo).",
    "Formação de Quadrilha":
      "Quando 3 ou mais pessoas estão reunidas para execução de ato(s) criminoso(s) ou ilegal(is).",
    "Associação Criminosa":
      "Quando 3 ou mais pessoas estão reunidas para execução de ato(s) criminoso(s) ou ilegal(is).",
    "Apologia ao Crime":
      "Realizar venda de itens ilegais na internet, utilizar-se de roupas, músicas, frases, ou ofensas que promovam o crime e/ou criminosos.",
    "Posse de Arma em Público": "Autoexplicativo.",
    "Uso de Máscara": "Autoexplicativo.",
    "Uso de Equipamentos Restritos":
      "Posse de taser, coldre, roupa imitando colete ou outros equipamentos exclusivos da polícia (exceção: porte legalizado de taser).",
    Vadiagem: "Autoexplicativo.",
    "Tentativa de Fuga": "Autoexplicativo.",
    Vandalismo: "Autoexplicativo.",
    "Réu Reincidente":
      "Quando o indivíduo possui registro de prisões ou fianças no discord, e não possui limpeza de ficha (se tiver limpeza de ficha após é réu primário).",
    Cúmplice:
      "Quando um indivíduo não pratica um crime diretamente, mas está junto do criminoso (roubo de caixinha, sequestro, tráfico e etc).",
    "Disparo de Arma de Fogo": "Autoexplicativo.",
    "Dinheiro Sujo":
      "Autoexplicativo (qualquer quantidade é crime, R$ 1.00 ou R$ 100kk).",
    "Tráfico de Armas": "3 ou mais armas (do mesmo tipo ou diferentes).",
    "Tráfico de Itens Ilegais":
      "3 ou mais itens ilegais (do mesmo tipo ou diferentes).",
    "Tráfico de Munições":
      "101 ou mais munições (do mesmo tipo ou diferentes).",
    "Tráfico de Drogas": "101 ou mais drogas (do mesmo tipo ou diferentes).",
    "Porte de Arma Pesada": "1 ou 2 armas pesadas.",
    "Porte de Arma Leve": "1 ou 2 armas leves.",
    "Porte de Arma Branca":
      "Somente é crime se utilizado para agredir ou matar.",
    "Posse de Suprimentos de Armas": "360 ou mais (sem somar os tipos).",
    "Posse de Suprimentos de Munição": "360 ou mais (sem somar os tipos).",
    "Posse de Componentes Narcóticos": "360 ou mais (sem somar os tipos).",
    "Posse de Munição": "Até 99 munições (do mesmo tipo ou diferentes).",
    "Posse de Coletes":
      "1 ou 2 coletes (se for 3 ou mais vira tráfico de itens ilegais).",
    Aviãozinho: "De 6 a 99 drogas (do mesmo tipo ou diferentes).",
    "Posse de Drogas": "De 1 a 5 drogas (do mesmo tipo ou diferentes).",
    "Posse de Itens Ilegais":
      "1 ou 2 itens ilegais (do mesmo tipo ou diferentes).",
    "Condução Imprudente": "Autoexplicativo.",
    "Dirigir na Contra Mão": "Autoexplicativo.",
    "Alta Velocidade": "Autoexplicativo.",
    "Poluição Sonora": "Autoexplicativo.",
    "Corridas Ilegais": "Autoexplicativo.",
    "Uso Excessivo de Insufilm": "Autoexplicativo.",
    "Veículo Muito Danificado": "Autoexplicativo.",
    "Veículo Ilegalmente Estacionado": "Autoexplicativo.",
    "Não Ceder Passagem a Viaturas": "Autoexplicativo.",
    "Impedir o Fluxo do Tráfego": "Autoexplicativo.",
  };

  function extrairNomeBaseCrime(item) {
    var nameEl = item.querySelector(".crime-name");
    var rawName = "";
    if (nameEl) {
      var conditionEl = nameEl.querySelector(".crime-condition");
      if (conditionEl && nameEl.childNodes.length > 0) {
        rawName = nameEl.childNodes[0].textContent || "";
      } else {
        rawName = nameEl.textContent || "";
      }
    } else {
      rawName = item.textContent || "";
    }
    return rawName
      .replace(/^Art\.\s*\d+\s*-\s*/i, "")
      .replace(/\*\*$/g, "")
      .trim();
  }

  function aplicarTipificacoesCrimes() {
    crimeItems.forEach((item) => {
      var baseName = extrairNomeBaseCrime(item);
      var tip = CRIME_TIPIFICACOES[baseName];
      if (!tip && baseName.startsWith("Desacato")) {
        tip = CRIME_TIPIFICACOES.Desacato;
      }
      if (!tip && baseName.startsWith("Desobediência")) {
        tip = CRIME_TIPIFICACOES.Desobediência;
      }
      if (tip) {
        item.setAttribute("data-tip", tip);
      }
    });
  }

  aplicarTipificacoesCrimes();

  var dicaBox = document.getElementById("dicas-rotativas");
  if (dicaBox) {
    var dicaText = dicaBox.querySelector(".dica-text");
    var dicaClose = document.getElementById("btn-fechar-dica");
    var dicaOpen = document.getElementById("btn-abrir-dica");
    var dicasRotativas = [
      "Lembre-se de que na foto do preso ele deve estar sem acessórios no rosto e com o RG junto.",
      "Lembre-se de escrever todos os itens que foram apreendidos.",
      "Ao manter o cursor sobre um crime, a tipificação dele irá aparecer.",
      "Lembre-se de que a foto da mochila do preso deve ser de tela inteira.",
      "Lembre-se de que caso o cidadão seja novato, basta apreender os itens e tirar print do que foi apreendido.",
    ];
    var dicaIndex = 0;
    var dicaInterval = null;

    function atualizarDica() {
      if (!dicaText || !dicasRotativas.length) return;
      dicaText.classList.add("is-fading");
      setTimeout(() => {
        dicaText.textContent = dicasRotativas[dicaIndex];
        dicaText.classList.remove("is-fading");
        dicaIndex = (dicaIndex + 1) % dicasRotativas.length;
      }, 200);
    }

    function iniciarDicas() {
      if (dicaInterval) return;
      atualizarDica();
      dicaInterval = setInterval(atualizarDica, 25000);
    }

    function pararDicas() {
      if (dicaInterval) {
        clearInterval(dicaInterval);
        dicaInterval = null;
      }
    }

    if (localStorage.getItem("dicas_ocultas") === "1") {
      dicaBox.classList.add("hidden");
      if (dicaOpen) dicaOpen.classList.remove("hidden");
    } else {
      iniciarDicas();
    }

    if (dicaClose) {
      dicaClose.addEventListener("click", function () {
        dicaBox.classList.add("hidden");
        localStorage.setItem("dicas_ocultas", "1");
        if (dicaOpen) dicaOpen.classList.remove("hidden");
        pararDicas();
      });
    }

    if (dicaOpen) {
      dicaOpen.addEventListener("click", function () {
        dicaBox.classList.remove("hidden");
        dicaOpen.classList.add("hidden");
        localStorage.removeItem("dicas_ocultas");
        iniciarDicas();
      });
    }
  }

  // Trava Primário vs Reincidente
  var chkPrimario = document.getElementById("atenuante-primario");
  if (chkPrimario) {
    chkPrimario.addEventListener("change", function () {
      if (this.checked) {
        var isReincidente = selectedCrimes.some((c) => c.artigo === "163");
        if (isReincidente) {
          mostrarAlerta(
            "Conflito: Remova o crime de Reincidente antes.",
            "error",
          );
          this.checked = false;
          calculateSentence();
        }
      }
    });
  }

  function calculateSentence() {
    var totalPenaRaw = 0;
    var totalMulta = 0;
    var isInfiancavel = false;

    selectedCrimes.forEach((c) => {
      totalPenaRaw += c.pena;
      totalMulta += c.multa;
      if (c.infiancavel) isInfiancavel = true;
    });

    if (
      inputDinheiroSujo &&
      inputDinheiroSujo.value &&
      !containerDinheiroSujo.classList.contains("hidden")
    ) {
      var valorLimpo = inputDinheiroSujo.value.replace(/\D/g, "");
      var sujo = parseFloat(valorLimpo) || 0;
      totalMulta += sujo * 0.5;
    }

    // Teto de 180 meses
    var penaBaseCalculo = totalPenaRaw;
    if (totalPenaRaw > 180) {
      penaBaseCalculo = 180;
      if (alertPenaMaxima) alertPenaMaxima.classList.remove("hidden");
    } else {
      if (alertPenaMaxima) alertPenaMaxima.classList.add("hidden");
    }

    // Atenuantes
    var descontoPercent = 0;
    checkboxes.forEach((cb) => {
      if (cb.checked) descontoPercent += parseFloat(cb.dataset.percent);
    });
    var penaComDesconto = Math.max(
      0,
      penaBaseCalculo * (1 - Math.abs(descontoPercent) / 100),
    );

    // Desconto HP
    if (hpSimBtn && hpSimBtn.checked && inputHpMinutos.value) {
      penaComDesconto = Math.max(
        0,
        penaComDesconto - parseInt(inputHpMinutos.value),
      );
    }

    var penaFinal = Math.ceil(penaComDesconto);

    penaTotalEl.textContent = penaFinal + " meses";
    multaTotalEl.textContent = "R$" + totalMulta.toLocaleString("pt-BR");

    var radioFiancaSim = document.getElementById("fianca-sim");
    var radioFiancaNao = document.getElementById("fianca-nao");
    var boxDeposito = document.getElementById("box-upload-deposito");
    var fiancaOutput = document.getElementById("fianca-output");

    if (alertaInfiancavel) {
      alertaInfiancavel.classList.toggle("hidden", !isInfiancavel);
    }

    if (isInfiancavel) {
      fiancaOutput.value = "INAFIANÇÁVEL";
      if (radioFiancaSim) radioFiancaSim.disabled = true;
      if (radioFiancaNao) radioFiancaNao.checked = true;
      if (boxDeposito) boxDeposito.classList.add("hidden");
    } else {
      // Fiança: Multa x 3 (Teto 1.4kk)
      var valorMulta = totalMulta;
      var calculoFianca = valorMulta * 3;
      var valorFiancaFinal = Math.min(calculoFianca, 2500000);

      fiancaOutput.value = "R$ " + valorFiancaFinal.toLocaleString("pt-BR");

      if (radioFiancaSim) radioFiancaSim.disabled = false;

      if (radioFiancaSim && radioFiancaSim.checked) {
        if (boxDeposito) {
          boxDeposito.classList.remove("hidden");
          // Scroll automático até o campo de comprovante
          setTimeout(() => {
            boxDeposito.scrollIntoView({ behavior: "smooth", block: "center" });
            boxDeposito.style.transition = "all 0.3s";
            boxDeposito.style.boxShadow = "0 0 20px rgba(16, 185, 129, 0.5)";
            setTimeout(() => {
              boxDeposito.style.boxShadow = "";
            }, 2000);
          }, 100);
        }
      } else {
        if (boxDeposito) boxDeposito.classList.add("hidden");
      }

      var advogadoCheck = document.getElementById("atenuante-advogado");
      var fiancaBreakdown = document.getElementById("fianca-breakdown");

      if (advogadoCheck && advogadoCheck.checked && valorFiancaFinal > 0) {
        fiancaBreakdown.classList.remove("hidden");
        document.getElementById("valor-policial").textContent =
          "R$ " +
          (valorFiancaFinal * 0.3).toLocaleString("pt-BR", {
            maximumFractionDigits: 0,
          });
        document.getElementById("valor-painel").textContent =
          "R$ " +
          (valorFiancaFinal * 0.4).toLocaleString("pt-BR", {
            maximumFractionDigits: 0,
          });
        document.getElementById("valor-advogado").textContent =
          "R$ " +
          (valorFiancaFinal * 0.3).toLocaleString("pt-BR", {
            maximumFractionDigits: 0,
          });
      } else {
        fiancaBreakdown.classList.add("hidden");
      }
    }

    renderListaCrimes();
  }

  function renderListaCrimes() {
    crimesListOutput.innerHTML = "";
    if (selectedCrimes.length === 0) {
      crimesListOutput.innerHTML =
        '<div class="empty-message">Nenhum crime selecionado</div>';
      return;
    }
    selectedCrimes.forEach((c, idx) => {
      var div = document.createElement("div");
      div.className = "crime-output-item";
      div.innerHTML = `<span>${c.nome.replace(
        /\*\*/g,
        "",
      )}</span> <button onclick="removerCrime(${idx})"><i class="fa-solid fa-xmark"></i></button>`;
      crimesListOutput.appendChild(div);
    });
  }

  window.removerCrime = function (idx) {
    var c = selectedCrimes[idx];
    selectedCrimes.splice(idx, 1);
    var item = document.querySelector(`.crime-item[data-artigo="${c.artigo}"]`);
    if (item) item.classList.remove("selected");
    if (c.artigo === "139") {
      containerDinheiroSujo.classList.add("hidden");
      inputDinheiroSujo.value = "";
    }
    calculateSentence();
  };

  // Seleção de Crimes (com Travas)
  crimeItems.forEach((item) => {
    item.addEventListener("click", function () {
      var artigo = this.dataset.artigo;

      if (selectedCrimes.some((c) => c.artigo === artigo)) {
        var idx = selectedCrimes.findIndex((c) => c.artigo === artigo);
        window.removerCrime(idx);
      } else {
        // Travas de Conflito
        const HOMICIDIOS = ["104", "105", "107", "108"];
        if (
          HOMICIDIOS.includes(artigo) &&
          selectedCrimes.some((c) => HOMICIDIOS.includes(c.artigo))
        )
          return mostrarAlerta("Apenas um tipo de Homicídio por vez.", "error");

        if (
          artigo === "125" &&
          selectedCrimes.some((c) => ["127", "128"].includes(c.artigo))
        )
          return mostrarAlerta("Conflito: Tráfico vs Porte de Armas.", "error");
        if (
          ["127", "128"].includes(artigo) &&
          selectedCrimes.some((c) => c.artigo === "125")
        )
          return mostrarAlerta("Conflito: Porte vs Tráfico de Armas.", "error");

        if (
          artigo === "163" &&
          document.getElementById("atenuante-primario").checked
        )
          return mostrarAlerta(
            "Conflito: Réu não pode ser Reincidente e Primário.",
            "error",
          );
        // --- TRAVA: ITENS OBRIGATÓRIOS ---
        const ARTIGOS_COM_ITENS = [
          "121",
          "122",
          "123",
          "124",
          "125",
          "126",
          "127",
          "128",
          "129",
          "130",
          "131",
          "132",
          "133",
          "134",
          "135",
          "136",
          "137",
          "138",
          "143",
        ];

        var exigeItem = selectedCrimes.some((c) =>
          ARTIGOS_COM_ITENS.includes(c.artigo),
        );
        var textoItens = document
          .getElementById("itens-apreendidos")
          .value.trim();

        if (exigeItem && textoItens.length < 3) {
          mostrarAlerta(
            "⚠️ Para os crimes selecionados, é OBRIGATÓRIO descrever os Itens Apreendidos!",
            "error",
          );
          document.getElementById("itens-apreendidos").focus();
          return;
        }
        const MUNICOES = ["130", "131"];
        if (
          MUNICOES.includes(artigo) &&
          selectedCrimes.some((c) => MUNICOES.includes(c.artigo))
        )
          return mostrarAlerta(
            "Selecione apenas Tráfico OU Posse de Munições.",
            "error",
          );
        if (
          artigo === "126" &&
          selectedCrimes.some((c) => ["138"].includes(c.artigo))
        )
          return mostrarAlerta(
            "Conflito: Tráfico vs Posse de Itens Ilegais.",
            "error",
          );
        const ITENS_ILEGAIS = ["126 ", "138"];
        if (
          ITENS_ILEGAIS.includes(artigo) &&
          selectedCrimes.some((c) => ITENS_ILEGAIS.includes(c.artigo))
        )
          return mostrarAlerta(
            "Selecione apenas Tráfico OU Posse de Itens.",
            "error",
          );

        const DROGAS = ["134", "135", "137"];
        if (
          DROGAS.includes(artigo) &&
          selectedCrimes.some((c) => DROGAS.includes(c.artigo))
        )
          return mostrarAlerta(
            "Selecione apenas uma modalidade de Drogas.",
            "error",
          );

        // Adiciona
        var nome = this.querySelector(".crime-name").textContent;
        var pena = parseInt(this.dataset.pena);
        var multa = parseInt(this.dataset.multa);
        var infiancavel = this.dataset.infiancavel === "true";
        selectedCrimes.push({ artigo, nome, pena, multa, infiancavel });
        this.classList.add("selected");

        if (artigo === "139") {
          containerDinheiroSujo.classList.remove("hidden");
          inputDinheiroSujo.focus();
        }
        calculateSentence();
      }
    });
  });

  checkboxes.forEach((cb) => cb.addEventListener("change", calculateSentence));
  if (inputHpMinutos)
    inputHpMinutos.addEventListener("input", calculateSentence);
  if (hpSimBtn) {
    hpSimBtn.addEventListener("change", () => {
      containerHp.classList.remove("hidden");
      calculateSentence();
    });
    hpNaoBtn.addEventListener("change", () => {
      containerHp.classList.add("hidden");
      calculateSentence();
    });
  }

  // Input Dinheiro Sujo (Formatação)
  if (inputDinheiroSujo) {
    inputDinheiroSujo.addEventListener("input", function (e) {
      var value = e.target.value.replace(/\D/g, "");
      if (value) {
        var formatado = parseInt(value).toLocaleString("pt-BR");
        e.target.value = formatado;

        var textareaItens = document.getElementById("itens-apreendidos");
        if (textareaItens) {
          var textoAtual = textareaItens.value;
          var regexDinheiro = /Dinheiro Sujo \(R\$ .*\)\n?/;
          var novoTextoDinheiro = `Dinheiro Sujo (R$ ${formatado})\n`;

          if (regexDinheiro.test(textoAtual)) {
            textareaItens.value = textoAtual.replace(
              regexDinheiro,
              novoTextoDinheiro,
            );
          } else {
            textareaItens.value = novoTextoDinheiro + textoAtual;
          }
        }
      } else {
        e.target.value = "";
      }
      calculateSentence();
    });
  }

  var radioFiancaSim = document.getElementById("fianca-sim");
  var radioFiancaNao = document.getElementById("fianca-nao");
  if (radioFiancaSim) {
    radioFiancaSim.addEventListener("change", function () {
      calculateSentence();
      // Scroll automático quando marcar "sim"
      if (this.checked) {
        var boxDeposito = document.getElementById("box-upload-deposito");
        if (boxDeposito && !boxDeposito.classList.contains("hidden")) {
          setTimeout(() => {
            boxDeposito.scrollIntoView({ behavior: "smooth", block: "center" });
            boxDeposito.style.transition = "all 0.3s";
            boxDeposito.style.boxShadow = "0 0 20px rgba(16, 185, 129, 0.5)";
            setTimeout(() => {
              boxDeposito.style.boxShadow = "";
            }, 2000);
          }, 100);
        }
      }
    });
    radioFiancaNao.addEventListener("change", calculateSentence);
  }

  var btnLimpar = document.getElementById("btn-limpar");
  if (btnLimpar) {
    btnLimpar.addEventListener("click", function () {
      if (confirm("Deseja limpar todos os dados?")) location.reload();
    });
  }

  // =========================================================
  // 7. UPLOADS E PREVIEW
  // =========================================================
  var arquivoPreso = null,
    arquivoMochila = null,
    arquivoDeposito = null,
    arquivoExtra = null;

  function fileToBase64(file) {
    return new Promise((resolve, reject) => {
      if (!file) return reject(new Error("Arquivo de imagem não encontrado."));
      var reader = new FileReader();
      reader.onload = function (event) {
        var result = event.target.result || "";
        var match = String(result).match(/^data:(.*?);base64,(.*)$/);
        if (!match || !match[2]) {
          return reject(new Error("Não foi possível converter a imagem."));
        }
        resolve({
          mimeType: match[1] || "image/jpeg",
          imageBase64: match[2],
        });
      };
      reader.onerror = function () {
        reject(new Error("Erro ao ler a imagem."));
      };
      reader.readAsDataURL(file);
    });
  }

  function carregarImagem(dataUrl) {
    return new Promise((resolve, reject) => {
      var img = new Image();
      img.onload = function () {
        resolve(img);
      };
      img.onerror = function () {
        reject(new Error("Não foi possível processar a imagem."));
      };
      img.src = dataUrl;
    });
  }

  async function fileToBase64RightPanel(file) {
    var base = await fileToBase64(file);
    var dataUrl = "data:" + base.mimeType + ";base64," + base.imageBase64;
    var img = await carregarImagem(dataUrl);

    var largura = img.naturalWidth || img.width;
    var altura = img.naturalHeight || img.height;

    // Recorte focado no inventário revistado (lado direito da interface).
    var cropX = Math.max(0, Math.floor(largura * 0.57));
    var cropY = Math.max(0, Math.floor(altura * 0.14));
    var cropW = Math.min(largura - cropX, Math.floor(largura * 0.4));
    var cropH = Math.min(altura - cropY, Math.floor(altura * 0.62));

    if (cropW < 80 || cropH < 80) {
      return base;
    }

    var canvas = document.createElement("canvas");
    canvas.width = cropW;
    canvas.height = cropH;
    var ctx = canvas.getContext("2d");
    if (!ctx) return base;

    ctx.drawImage(img, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);
    var recorteDataUrl = canvas.toDataURL("image/jpeg", 0.95);
    var match = String(recorteDataUrl).match(/^data:(.*?);base64,(.*)$/);
    if (!match || !match[2]) return base;

    return {
      mimeType: match[1] || "image/jpeg",
      imageBase64: match[2],
      cropRightPanel: true,
    };
  }

  function normalizarListaItens(texto) {
    return String(texto || "")
      .replace(/```[a-z]*|```/gi, "")
      .split(/\r?\n/)
      .map((linha) => linha.trim())
      .filter(Boolean)
      .map((linha) => linha.replace(/^[-*\u2022]+\s*/, "").trim())
      .map((linha) => linha.replace(/^\d+\s*[\.\)\-:]\s*/, "").trim())
      .filter(Boolean)
      .join("\n");
  }

  function setupUpload(boxId, inputId, imgId, type) {
    var box = document.getElementById(boxId);
    var input = document.getElementById(inputId);
    var img = document.getElementById(imgId);

    if (!box || !input) return;

    // Remove o clique simples - só abre no duplo clique ou botão
    box.addEventListener("dblclick", function (e) {
      if (
        e.target !== input &&
        e.target.tagName !== "LABEL" &&
        !e.target.closest(".btn-escolher-arquivo")
      ) {
        input.click();
      }
    });

    // Botão "Escolher Arquivo"
    var btnEscolher = box.querySelector(".btn-escolher-arquivo");
    if (btnEscolher) {
      btnEscolher.addEventListener("click", function (e) {
        e.stopPropagation();
        input.click();
      });
    }

    box.addEventListener("paste", function (e) {
      if (e.clipboardData && e.clipboardData.items) {
        for (var i = 0; i < e.clipboardData.items.length; i++) {
          if (e.clipboardData.items[i].type.indexOf("image") !== -1) {
            var blob = e.clipboardData.items[i].getAsFile();
            handleFile(blob, img, type);
            e.preventDefault();
            mostrarAlerta("Imagem colada!", "success");
            break;
          }
        }
      }
    });

    input.addEventListener("change", function () {
      if (this.files && this.files[0]) handleFile(this.files[0], img, type);
    });
  }

  function handleFile(file, imgElement, type) {
    var reader = new FileReader();
    reader.onload = (e) => {
      imgElement.src = e.target.result;
      imgElement.classList.remove("hidden");
    };
    reader.readAsDataURL(file);

    if (type === "preso") arquivoPreso = file;
    if (type === "mochila") arquivoMochila = file;
    if (type === "deposito") arquivoDeposito = file;
    if (type === "extra") arquivoExtra = file;
  }

  setupUpload("box-upload-preso", "upload-preso", "img-preview-preso", "preso");
  setupUpload(
    "box-upload-mochila",
    "upload-mochila",
    "img-preview-mochila",
    "mochila",
  );
  setupUpload(
    "box-upload-deposito",
    "upload-deposito",
    "img-preview-deposito",
    "deposito",
  );
  setupUpload("box-upload-extra", "upload-extra", "img-preview-extra", "extra");

  var btnLerItensIA = document.getElementById("btn-ler-itens-ia");
  if (btnLerItensIA) {
    btnLerItensIA.addEventListener("click", async function () {
      if (!arquivoMochila) {
        return mostrarAlerta(
          "Anexe primeiro a foto da mochila para usar a leitura com I.A.",
          "error",
        );
      }

      var textareaItens = document.getElementById("itens-apreendidos");
      if (!textareaItens) return;

      if (
        textareaItens.value.trim() &&
        !confirm(
          "Já existe texto em Itens Apreendidos. Deseja substituir pelo resultado da I.A.?",
        )
      ) {
        return;
      }

      var textoOriginal = btnLerItensIA.innerHTML;
      btnLerItensIA.disabled = true;
      btnLerItensIA.classList.add("is-loading");
      btnLerItensIA.innerHTML =
        '<i class="fa-solid fa-spinner fa-spin"></i> LENDO IMAGEM...';

      try {
        var payloadImagem = await fileToBase64RightPanel(arquivoMochila);

        var resposta = await fetch("/api/ler-itens-mochila", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payloadImagem),
        });

        var data = await resposta.json().catch(() => ({}));
        if (!resposta.ok) {
          var detalhe = data.detalhe ? " Detalhe: " + data.detalhe : "";
          throw new Error(
            (data.error || "Falha ao analisar a imagem com a I.A. Tente novamente.") +
              detalhe,
          );
        }

        var itensTexto = normalizarListaItens(data.itemsText);
        if (!itensTexto) {
          throw new Error(
            "A I.A. não identificou itens ilegais com segurança nessa imagem.",
          );
        }

        textareaItens.value = itensTexto;
        textareaItens.focus();
        mostrarAlerta("Itens apreendidos preenchidos com sucesso!", "success");
      } catch (erro) {
        mostrarAlerta(erro.message || "Erro ao ler imagem com I.A.", "error");
      } finally {
        btnLerItensIA.disabled = false;
        btnLerItensIA.classList.remove("is-loading");
        btnLerItensIA.innerHTML = textoOriginal;
      }
    });
  }

  var btnShowExtra = document.getElementById("btn-show-extra");
  if (btnShowExtra) {
    btnShowExtra.addEventListener("click", function () {
      document.getElementById("box-upload-extra").classList.remove("hidden");
      this.style.display = "none";
    });
  }

  // =========================================================
  // 8. MODAL DE CONFIRMAÇÃO E ENVIO
  // =========================================================
  var btnEnviar = document.getElementById("btn-enviar");
  var modalConf = document.getElementById("modal-confirmacao");
  var btnCancelar = document.getElementById("btn-cancelar-conf");
  var btnConfirmar = document.getElementById("btn-confirmar-envio");

  if (btnEnviar) {
    btnEnviar.addEventListener("click", function () {
      var nomePreso = document.getElementById("nome").value;
      if (!nomePreso)
        return mostrarAlerta("Preencha o nome do preso!", "error");
      if (!arquivoPreso || !arquivoMochila)
        return mostrarAlerta(
          "Fotos do Preso e Inventário são obrigatórias!",
          "error",
        );
      if (selectedCrimes.length === 0)
        return mostrarAlerta("Selecione ao menos um crime!", "error");

      // Validação: Se marcou que pagou fiança, precisa ter comprovante
      var pagouFianca = document.getElementById("fianca-sim").checked;
      if (pagouFianca && !arquivoDeposito) {
        var boxDeposito = document.getElementById("box-upload-deposito");
        if (boxDeposito) {
          boxDeposito.scrollIntoView({ behavior: "smooth", block: "center" });
          boxDeposito.style.transition = "all 0.3s";
          boxDeposito.style.boxShadow = "0 0 20px rgba(211, 47, 47, 0.5)";
          setTimeout(() => {
            boxDeposito.style.boxShadow = "";
          }, 2000);
        }
        return mostrarAlerta(
          "Se houve pagamento de fiança, é obrigatório anexar o comprovante com foto!",
          "error",
        );
      }

      var temDinheiroSujo = selectedCrimes.some((c) => c.artigo === "139");
      if (
        temDinheiroSujo &&
        (!inputDinheiroSujo.value || inputDinheiroSujo.value.trim() === "")
      ) {
        inputDinheiroSujo.focus();
        return mostrarAlerta("Informe a quantidade de dinheiro sujo.", "error");
      }

      var isPrimario = document.getElementById("atenuante-primario").checked;
      var isReincidente = selectedCrimes.some((c) => c.artigo === "163");
      if (!isPrimario && !isReincidente)
        return mostrarAlerta(
          "Defina se o Réu é Primário ou Reincidente!",
          "error",
        );
      if (isPrimario && isReincidente)
        return mostrarAlerta(
          "Réu não pode ser Primário e Reincidente ao mesmo tempo!",
          "error",
        );

      // Preenche Modal
      document.getElementById("conf-oficiais").textContent =
        userNameSpan.textContent +
        (participantesSelecionados.length > 0
          ? " + " + participantesSelecionados.map((p) => p.nome).join(", ")
          : "");
      document.getElementById("conf-preso").textContent =
        nomePreso + " (RG: " + document.getElementById("rg").value + ")";

      var advogadoValue = document.getElementById("advogado").value;
      document.getElementById("conf-advogado").textContent =
        advogadoValue || "Nenhum";

      document.getElementById("conf-sentenca").textContent =
        "Pena: " + penaTotalEl.textContent;
      document.getElementById("conf-multa").textContent =
        "Multa: " + multaTotalEl.textContent;

      var pagouFianca = document.getElementById("fianca-sim").checked;
      var fiancaOutput = document.getElementById("fianca-output").value;
      document.getElementById("conf-fianca").textContent =
        fiancaOutput || "Não se aplica";

      // Crimes detalhados
      var crimesDetail = document.getElementById("conf-crimes-detail");
      crimesDetail.innerHTML = "";
      selectedCrimes.forEach((c) => {
        var div = document.createElement("div");
        div.className = "crime-item";
        div.textContent = c.nome.replace(/\*\*/g, "");
        crimesDetail.appendChild(div);
      });

      // Itens apreendidos
      var itensApreendidos = document.getElementById("itens-apreendidos").value;
      document.getElementById("conf-itens").textContent =
        itensApreendidos || "Nenhum";

      // Dinheiro sujo
      var dinheiroSujoValue = inputDinheiroSujo.value;
      var dinheiroSujoSection = document.getElementById(
        "conf-dinheiro-sujo-section",
      );
      if (dinheiroSujoValue) {
        document.getElementById("conf-dinheiro-sujo").textContent =
          "R$ " + dinheiroSujoValue;
        dinheiroSujoSection.classList.remove("hidden");
      } else {
        dinheiroSujoSection.classList.add("hidden");
      }

      // Detalhes/Atenuantes
      var ulDetalhes = document.getElementById("conf-detalhes");
      ulDetalhes.innerHTML = "";
      checkboxes.forEach((cb) => {
        if (cb.checked) {
          var li = document.createElement("li");
          li.innerHTML = `✔ ${
            document.querySelector(`label[for="${cb.id}"]`).textContent
          }`;
          ulDetalhes.appendChild(li);
        }
      });

      if (
        hpSimBtn &&
        hpSimBtn.checked &&
        inputHpMinutos &&
        inputHpMinutos.value
      ) {
        var li = document.createElement("li");
        li.innerHTML = `🏥 Reanimado no HP (-${inputHpMinutos.value}m)`;
        ulDetalhes.appendChild(li);
      }

      var liFianca = document.createElement("li");
      liFianca.innerHTML = pagouFianca
        ? `<b style="color:var(--color-success)">✅ PAGOU FIANÇA</b>`
        : `<b style="color:#ef4444">❌ NÃO PAGOU FIANÇA</b>`;
      ulDetalhes.appendChild(liFianca);

      // Imagens Modal
      if (document.getElementById("img-preview-preso").src)
        document.getElementById("conf-img-preso").src =
          document.getElementById("img-preview-preso").src;
      if (document.getElementById("img-preview-mochila").src)
        document.getElementById("conf-img-mochila").src =
          document.getElementById("img-preview-mochila").src;

      var boxConfDep = document.getElementById("box-conf-deposito");
      if (pagouFianca && document.getElementById("img-preview-deposito").src) {
        document.getElementById("conf-img-deposito").src =
          document.getElementById("img-preview-deposito").src;
        boxConfDep.classList.remove("hidden");
      } else {
        boxConfDep.classList.add("hidden");
      }

      // Foto extra
      var boxConfExtra = document.getElementById("box-conf-extra");
      if (
        document.getElementById("img-preview-extra").src &&
        !document
          .getElementById("img-preview-extra")
          .classList.contains("hidden")
      ) {
        document.getElementById("conf-img-extra").src =
          document.getElementById("img-preview-extra").src;
        boxConfExtra.classList.remove("hidden");
      } else {
        boxConfExtra.classList.add("hidden");
      }

      modalConf.classList.remove("hidden");
    });
  }

  if (btnCancelar)
    btnCancelar.addEventListener("click", () =>
      modalConf.classList.add("hidden"),
    );

  function comprimirImagemAsync(file) {
    return new Promise((resolve) => {
      if (!file) return resolve(null);
      var reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = function (e) {
        var img = new Image();
        img.src = e.target.result;
        img.onload = function () {
          var canvas = document.createElement("canvas");
          var ctx = canvas.getContext("2d");
          var scale = 1;
          if (img.width > 1280) scale = 1280 / img.width;
          canvas.width = img.width * scale;
          canvas.height = img.height * scale;
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          canvas.toBlob(resolve, "image/jpeg", 0.7);
        };
      };
    });
  }

  if (btnConfirmar) {
    btnConfirmar.addEventListener("click", async function () {
      btnConfirmar.textContent = "ENVIANDO...";
      btnConfirmar.disabled = true;

      try {
        const blobPreso = await comprimirImagemAsync(arquivoPreso);
        const blobMochila = await comprimirImagemAsync(arquivoMochila);
        const blobDeposito = await comprimirImagemAsync(arquivoDeposito);
        const blobExtra = await comprimirImagemAsync(arquivoExtra);

        var formData = new FormData();
        if (blobPreso) formData.append("file1", blobPreso, "preso.jpg");
        if (blobMochila) formData.append("file2", blobMochila, "mochila.jpg");
        if (blobDeposito)
          formData.append("file3", blobDeposito, "deposito.jpg");
        if (blobExtra) formData.append("file4", blobExtra, "extra.jpg");

        var pagouFianca = document.getElementById("fianca-sim").checked;
        var oficialNome = userNameSpan.textContent;
        var oficialId = userIdHidden.value;
        var crimesTexto = selectedCrimes
          .map((c) => c.nome.replace(/\*\*/g, ""))
          .join("\n");

        var qraString = `QRA: <@${oficialId}>`;
        participantesSelecionados.forEach((p) => {
          qraString += ` <@${p.id}>`;
        });

        var atenuantesTexto = "";
        checkboxes.forEach((cb) => {
          if (cb.checked)
            atenuantesTexto +=
              document.querySelector(`label[for="${cb.id}"]`).textContent +
              "\n";
        });
        if (atenuantesTexto === "") atenuantesTexto = "Nenhum";

        var corEmbed = pagouFianca ? 3066993 : 15158332;
        var tituloEmbed = pagouFianca
          ? "💰 RELATÓRIO DE FIANÇA"
          : "🚔 RELATÓRIO DE PRISÃO";

        var payload = {
          content: qraString,
          embeds: [
            {
              title: tituloEmbed,
              color: corEmbed,
              image: { url: "attachment://preso.jpg" },
              fields: [
                { name: "👮 Oficial", value: oficialNome, inline: true },
                {
                  name: "👥 Participantes",
                  value:
                    participantesSelecionados.length > 0
                      ? participantesSelecionados.map((p) => p.nome).join(", ")
                      : "Nenhum",
                  inline: true,
                },
                {
                  name: "👤 Preso",
                  value: `**Nome:** ${
                    document.getElementById("nome").value
                  }\n**RG:** ${document.getElementById("rg").value}`,
                  inline: false,
                },
                {
                  name: "⚖️ Sentença",
                  value: `**Pena:** ${penaTotalEl.textContent}\n**Multa:** ${multaTotalEl.textContent}`,
                  inline: false,
                },
                {
                  name: "🛡️ Advogado",
                  value: document.getElementById("advogado").value || "Nenhum",
                  inline: true,
                },
                { name: "📜 Crimes", value: "```\n" + crimesTexto + "\n```" },
                {
                  name: "📦 Itens Apreendidos",
                  value:
                    document.getElementById("itens-apreendidos").value ||
                    "Nenhum",
                  inline: false,
                },
                {
                  name: "💸 Dinheiro Sujo",
                  value: inputDinheiroSujo.value
                    ? "R$ " + inputDinheiroSujo.value
                    : "Não houve",
                  inline: true,
                },
                { name: "📝 Detalhes", value: atenuantesTexto },
                {
                  name: "🏥 Reanimação no HP",
                  value:
                    hpSimBtn &&
                    hpSimBtn.checked &&
                    inputHpMinutos &&
                    inputHpMinutos.value
                      ? `Sim - Desconto de ${inputHpMinutos.value} minutos`
                      : "Não",
                  inline: true,
                },
              ],
              footer: {
                text:
                  "Sistema Policial REVOADA • " + new Date().toLocaleString(),
              },
            },
            {
              title: "📦 INVENTÁRIO",
              color: corEmbed,
              image: { url: "attachment://mochila.jpg" },
            },
          ],
        };

        if (blobDeposito)
          payload.embeds.push({
            title: "💸 COMPROVANTE",
            color: corEmbed,
            image: { url: "attachment://deposito.jpg" },
          });
        if (blobExtra)
          payload.embeds.push({
            title: "🚗 EVIDÊNCIA EXTRA",
            color: corEmbed,
            image: { url: "attachment://extra.jpg" },
          });

        formData.append("payload_json", JSON.stringify(payload));

        // SUBSTITUA PELA URL DO SEU WEBHOOK REAL SE NÃO ESTIVER USANDO BACKEND LOCAL
        // Ex: const URL_API = "https://discord.com/api/webhooks/SEU_WEBHOOK";
        const URL_API =
          "/api/enviar?tipo=" + (pagouFianca ? "fianca" : "prisao");

        const response = await fetch(URL_API, {
          method: "POST",
          body: formData,
        });

        if (response.ok) {
          mostrarAlerta("Relatório Enviado com Sucesso!", "success");
          if (alertaInfiancavel) alertaInfiancavel.classList.add("hidden");
          setTimeout(() => location.reload(), 2000);
        } else {
          throw new Error("Erro no servidor: " + response.status);
        }
      } catch (e) {
        console.error(e);
        mostrarAlerta("Erro ao enviar: " + e.message, "error");
        btnConfirmar.disabled = false;
        btnConfirmar.textContent = "CONFIRMAR E ENVIAR";
      }
    });
  }
});
// Impede o clique com botão direito
document.addEventListener("contextmenu", (event) => event.preventDefault());

// Impede atalhos de teclado de inspeção
document.onkeydown = function (e) {
  // Bloqueia F12
  if (e.keyCode == 123) return false;

  // Bloqueia Ctrl+Shift+I (Inspeção)
  if (e.ctrlKey && e.shiftKey && e.keyCode == "I".charCodeAt(0)) return false;

  // Bloqueia Ctrl+Shift+J (Console)
  if (e.ctrlKey && e.shiftKey && e.keyCode == "J".charCodeAt(0)) return false;

  // Bloqueia Ctrl+U (Exibir código fonte)
  if (e.ctrlKey && e.keyCode == "U".charCodeAt(0)) return false;

  // Bloqueia Ctrl+S (Salvar página)
  if (e.ctrlKey && e.keyCode == "S".charCodeAt(0)) return false;
};
// Se o DevTools for aberto, o script entra em loop de debug
setInterval(function () {
  debugger;
}, 100);
