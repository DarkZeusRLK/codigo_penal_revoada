document.addEventListener("DOMContentLoaded", function () {
  // =========================================================
  // 0. SISTEMA DE PATCH NOTES
  // =========================================================
  const VERSAO_ATUAL = "3.5";

  const CONTEUDO_PATCH_NOTES = `
      <h4>🚀 Novidades da Versão ${VERSAO_ATUAL}</h4>
      <ul>
          <li><strong>🎅 Natal:</strong> Tema natalino adicionado.</li>
          <li><strong>⚖️ Novo Crime:</strong> Posse de Suprimentos de Desmanche adicionado (Art. 123).</li>
          <li><strong>🎵 Player de Música:</strong> Agora estilo Spotify com 3 músicas natalinas.</li>
          <li><strong>👮 Limite de QRA:</strong> Limitado a 9 policiais por relatório.</li>
      </ul>
      <h4>🐛 Correções</h4>
      <ul>
          <li>Corrigida lista de QRA de participantes.</li>
          <li>Corrigidos erros de envio ao Discord.</li>
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
  // 2. PLAYER DE MÚSICA ESTILO SPOTIFY
  // =========================================================
  const playlist = [
    {
      title: "Rockin' Around The Christmas Tree",
      artist: "Brenda Lee",
      src: "Música/videoplayback.mp4",
      cover: "Imagens/Capa_brenda.jpg",
    },
    {
      title: "All I Want for Christmas",
      artist: "Mariah Carey",
      src: "Música/Mariah Carey - All I Want For Christmas Is You (Lyrics).mp4",
      cover: "Imagens/Capa_mariah.jpg",
    },
    {
      title: "Jingle Bell",
      artist: "MC TETEU",
      src: "Música/Jingle Bell.mp4",
      cover: "Imagens/Jingle_bell.jpg",
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
    "lista-participantes-visual"
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
        o.nome.toLowerCase().includes(termo)
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
      (p) => p.nome !== nome
    );
    btn.parentElement.remove();
  };

  // =========================================================
  // 6. LÓGICA DA CALCULADORA
  // =========================================================
  var selectedCrimes = [];
  var crimeItems = document.querySelectorAll(".crime-item");
  var checkboxes = document.querySelectorAll(
    '.atenuantes input[type="checkbox"]'
  );
  var inputHpMinutos = document.getElementById("hp-minutos");
  var hpSimBtn = document.getElementById("hp-sim");
  var hpNaoBtn = document.getElementById("hp-nao");
  var inputDinheiroSujo = document.getElementById("input-dinheiro-sujo");

  var penaTotalEl = document.getElementById("pena-total");
  var multaTotalEl = document.getElementById("multa-total");
  var crimesListOutput = document.getElementById("crimes-list-output");
  var containerDinheiroSujo = document.getElementById(
    "container-dinheiro-sujo"
  );
  var containerHp = document.getElementById("container-hp-minutos");
  var alertPenaMaxima = document.getElementById("alerta-pena-maxima");

  // Trava Primário vs Reincidente
  var chkPrimario = document.getElementById("atenuante-primario");
  if (chkPrimario) {
    chkPrimario.addEventListener("change", function () {
      if (this.checked) {
        var isReincidente = selectedCrimes.some((c) => c.artigo === "162");
        if (isReincidente) {
          mostrarAlerta(
            "Conflito: Remova o crime de Reincidente antes.",
            "error"
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
      penaBaseCalculo * (1 - Math.abs(descontoPercent) / 100)
    );

    // Desconto HP
    if (hpSimBtn && hpSimBtn.checked && inputHpMinutos.value) {
      penaComDesconto = Math.max(
        0,
        penaComDesconto - parseInt(inputHpMinutos.value)
      );
    }

    var penaFinal = Math.ceil(penaComDesconto);

    penaTotalEl.textContent = penaFinal + " meses";
    multaTotalEl.textContent = "R$" + totalMulta.toLocaleString("pt-BR");

    var radioFiancaSim = document.getElementById("fianca-sim");
    var radioFiancaNao = document.getElementById("fianca-nao");
    var boxDeposito = document.getElementById("box-upload-deposito");
    var fiancaOutput = document.getElementById("fianca-output");

    if (isInfiancavel) {
      fiancaOutput.value = "INAFIANÇÁVEL";
      if (radioFiancaSim) radioFiancaSim.disabled = true;
      if (radioFiancaNao) radioFiancaNao.checked = true;
      if (boxDeposito) boxDeposito.classList.add("hidden");
    } else {
      // Fiança: Multa x 3 (Teto 1.4kk)
      var valorMulta = totalMulta;
      var calculoFianca = valorMulta * 3;
      var valorFiancaFinal = Math.min(calculoFianca, 1400000);

      fiancaOutput.value = "R$ " + valorFiancaFinal.toLocaleString("pt-BR");

      if (radioFiancaSim) radioFiancaSim.disabled = false;

      if (radioFiancaSim && radioFiancaSim.checked) {
        if (boxDeposito) boxDeposito.classList.remove("hidden");
      } else {
        if (boxDeposito) boxDeposito.classList.add("hidden");
      }

      var advogadoCheck = document.getElementById("atenuante-advogado");
      var fiancaBreakdown = document.getElementById("fianca-breakdown");

      if (advogadoCheck && advogadoCheck.checked && valorFiancaFinal > 0) {
        fiancaBreakdown.classList.remove("hidden");
        document.getElementById("valor-policial").textContent =
          "R$ " +
          (valorFiancaFinal * 0.35).toLocaleString("pt-BR", {
            maximumFractionDigits: 0,
          });
        document.getElementById("valor-painel").textContent =
          "R$ " +
          (valorFiancaFinal * 0.35).toLocaleString("pt-BR", {
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
        ""
      )}</span> <button onclick="removerCrime(${idx})"><i class="fa-solid fa-xmark"></i></button>`;
      crimesListOutput.appendChild(div);
    });
  }

  window.removerCrime = function (idx) {
    var c = selectedCrimes[idx];
    selectedCrimes.splice(idx, 1);
    var item = document.querySelector(`.crime-item[data-artigo="${c.artigo}"]`);
    if (item) item.classList.remove("selected");
    if (c.artigo === "138") {
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
          artigo === "124" &&
          selectedCrimes.some((c) => ["126", "127"].includes(c.artigo))
        )
          return mostrarAlerta("Conflito: Tráfico vs Porte de Armas.", "error");
        if (
          ["126", "127"].includes(artigo) &&
          selectedCrimes.some((c) => c.artigo === "124")
        )
          return mostrarAlerta("Conflito: Porte vs Tráfico de Armas.", "error");

        if (
          artigo === "162" &&
          document.getElementById("atenuante-primario").checked
        )
          return mostrarAlerta(
            "Conflito: Réu não pode ser Reincidente e Primário.",
            "error"
          );
        // --- TRAVA: ITENS OBRIGATÓRIOS ---
        const ARTIGOS_COM_ITENS = [
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
          "142",
        ];

        var exigeItem = selectedCrimes.some((c) =>
          ARTIGOS_COM_ITENS.includes(c.artigo)
        );
        var textoItens = document
          .getElementById("itens-apreendidos")
          .value.trim();

        if (exigeItem && textoItens.length < 3) {
          mostrarAlerta(
            "⚠️ Para os crimes selecionados, é OBRIGATÓRIO descrever os Itens Apreendidos!",
            "error"
          );
          document.getElementById("itens-apreendidos").focus();
          return;
        }
        const MUNICOES = ["129", "130"];
        if (
          MUNICOES.includes(artigo) &&
          selectedCrimes.some((c) => MUNICOES.includes(c.artigo))
        )
          return mostrarAlerta(
            "Selecione apenas Tráfico OU Posse de Munições.",
            "error"
          );

        const ITENS_ILEGAIS = ["125", "137"];
        if (
          ITENS_ILEGAIS.includes(artigo) &&
          selectedCrimes.some((c) => ITENS_ILEGAIS.includes(c.artigo))
        )
          return mostrarAlerta(
            "Selecione apenas Tráfico OU Posse de Itens.",
            "error"
          );

        const DROGAS = ["133", "134", "136"];
        if (
          DROGAS.includes(artigo) &&
          selectedCrimes.some((c) => DROGAS.includes(c.artigo))
        )
          return mostrarAlerta(
            "Selecione apenas uma modalidade de Drogas.",
            "error"
          );

        // Adiciona
        var nome = this.querySelector(".crime-name").textContent;
        var pena = parseInt(this.dataset.pena);
        var multa = parseInt(this.dataset.multa);
        var infiancavel = this.dataset.infiancavel === "true";
        selectedCrimes.push({ artigo, nome, pena, multa, infiancavel });
        this.classList.add("selected");

        if (artigo === "138") {
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
              novoTextoDinheiro
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
    radioFiancaSim.addEventListener("change", calculateSentence);
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

  function setupUpload(boxId, inputId, imgId, type) {
    var box = document.getElementById(boxId);
    var input = document.getElementById(inputId);
    var img = document.getElementById(imgId);

    if (!box || !input) return;

    box.addEventListener("click", function (e) {
      if (e.target !== input && e.target.tagName !== "LABEL") input.click();
    });

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
    "mochila"
  );
  setupUpload(
    "box-upload-deposito",
    "upload-deposito",
    "img-preview-deposito",
    "deposito"
  );
  setupUpload("box-upload-extra", "upload-extra", "img-preview-extra", "extra");

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
          "error"
        );
      if (selectedCrimes.length === 0)
        return mostrarAlerta("Selecione ao menos um crime!", "error");

      var temDinheiroSujo = selectedCrimes.some((c) => c.artigo === "138");
      if (
        temDinheiroSujo &&
        (!inputDinheiroSujo.value || inputDinheiroSujo.value.trim() === "")
      ) {
        inputDinheiroSujo.focus();
        return mostrarAlerta("Informe a quantidade de dinheiro sujo.", "error");
      }

      var isPrimario = document.getElementById("atenuante-primario").checked;
      var isReincidente = selectedCrimes.some((c) => c.artigo === "162");
      if (!isPrimario && !isReincidente)
        return mostrarAlerta(
          "Defina se o Réu é Primário ou Reincidente!",
          "error"
        );
      if (isPrimario && isReincidente)
        return mostrarAlerta(
          "Réu não pode ser Primário e Reincidente ao mesmo tempo!",
          "error"
        );

      // Preenche Modal
      document.getElementById("conf-oficiais").textContent =
        userNameSpan.textContent +
        (participantesSelecionados.length > 0
          ? " + " + participantesSelecionados.map((p) => p.nome).join(", ")
          : "");
      document.getElementById("conf-preso").textContent =
        nomePreso + " (RG: " + document.getElementById("rg").value + ")";
      document.getElementById("conf-sentenca").textContent =
        penaTotalEl.textContent;
      document.getElementById("conf-multa").textContent =
        multaTotalEl.textContent;

      var pagouFianca = document.getElementById("fianca-sim").checked;
      var ulCrimes = document.getElementById("conf-crimes");
      ulCrimes.innerHTML = "";
      selectedCrimes.forEach((c) => {
        var li = document.createElement("li");
        li.textContent = c.nome;
        ulCrimes.appendChild(li);
      });

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

      if (hpSimBtn.checked) {
        var li = document.createElement("li");
        li.innerHTML = `🏥 Reanimado no HP (-${inputHpMinutos.value}m)`;
        ulDetalhes.appendChild(li);
      }

      var liFianca = document.createElement("li");
      liFianca.innerHTML = pagouFianca
        ? `<b style="color:var(--color-success)">PAGOU FIANÇA</b>`
        : `<b style="color:#ef4444">NÃO PAGOU FIANÇA</b>`;
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

      modalConf.classList.remove("hidden");
    });
  }

  if (btnCancelar)
    btnCancelar.addEventListener("click", () =>
      modalConf.classList.add("hidden")
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
