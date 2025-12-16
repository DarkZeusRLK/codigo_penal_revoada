document.addEventListener("DOMContentLoaded", function () {
  // =========================================================
  // 0. SISTEMA DE PATCH NOTES (NOVIDADE)
  // =========================================================

  // CONFIGURE AQUI SEMPRE QUE ATUALIZAR O CÓDIGO:
  const VERSAO_ATUAL = "3.2"; // Mude esse número para o popup aparecer para todos

  const CONTEUDO_PATCH_NOTES = `
      <h4>🚀 Novidades da Versão ${VERSAO_ATUAL}</h4>
      <ul>
          <li><strong>📸 Foto Extra:</strong> Adicionado botão para incluir foto do porta-malas ou evidência extra.</li>
          <li><strong>💰 Fiança Ajustada:</strong> O valor da fiança agora é calculado automaticamente como <strong>3x o valor da multa</strong>.</li>
          <li><strong>🛑 Teto de Fiança:</strong> Adicionado limitador automático. A fiança máxima agora é <strong>R$ 1.400.000</strong>, mesmo que o cálculo ultrapasse.</li>
          <li><strong>📊 Divisão de Valores:</strong> O cálculo de repasse (Advogado/Policia/Painel) foi atualizado para refletir o novo valor da fiança.</li>
          <li><strong>🔫 Porte de Arma:</strong> O status do porte agora aparece no relatório do Discord.</li>
      </ul>
      
      <h4>🐛 Correções</h4>
      <ul>
          <li>Correção na verificação de logins expirados.</li>
          <li>Melhoria na estabilidade do upload de imagens.</li>
      </ul>
  `;

  function verificarAtualizacao() {
    const versaoSalva = localStorage.getItem("sistema_versao");
    const modalPatch = document.getElementById("modal-patch-notes");
    const contentPatch = document.getElementById("patch-notes-content");
    const btnFecharPatch = document.getElementById("btn-fechar-patch");

    // Só mostra se estiver logado (verificamos se tem nome de usuário na tela)
    if (!userNameSpan.textContent) return;

    if (versaoSalva !== VERSAO_ATUAL) {
      if (modalPatch && contentPatch) {
        contentPatch.innerHTML = CONTEUDO_PATCH_NOTES;
        modalPatch.classList.remove("hidden");
        modalPatch.style.display = "flex";

        // Toca um som de notificação se quiser (opcional)
        // var audio = new Audio('sounds/notification.mp3'); audio.play();
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

  // IMPORTANTE: Chame essa função DEPOIS que o usuário for confirmado como logado.
  // Vou sugerir colocar a chamada dela dentro da função `mostrarApp()` ou logo após `verificarSessao()`.
  // =========================================================
  // 1. WATCHDOG (PREVENÇÃO DE TELA PRETA)
  // =========================================================
  var loginScreen = document.getElementById("login-screen");
  var appContent = document.getElementById("app-content");

  function mostrarApp() {
    if (loginScreen) {
      loginScreen.style.display = "none";
      loginScreen.classList.add("hidden");
    }
    if (appContent) {
      appContent.classList.remove("hidden");
      appContent.style.display = "block";
    }
    setTimeout(verificarAtualizacao, 1000); // Espera 1 segundinho para aparecer chique
  }

  function mostrarLogin() {
    if (appContent) {
      appContent.classList.add("hidden");
      appContent.style.display = "none";
    }
    if (loginScreen) {
      loginScreen.classList.remove("hidden");
      loginScreen.style.display = "flex";
    }
  }

  setTimeout(function () {
    var loginVisible =
      loginScreen &&
      !loginScreen.classList.contains("hidden") &&
      loginScreen.style.display !== "none";
    var appVisible = appContent && !appContent.classList.contains("hidden");

    if (!loginVisible && !appVisible) {
      console.warn("Watchdog: Tela preta detectada! Forçando login...");
      mostrarLogin();
    }
  }, 1000);

  // =========================================================
  // 2. MÚSICA DE FUNDO
  // =========================================================
  var bgMusic = document.getElementById("bg-music");
  var btnMusic = document.getElementById("btn-music-toggle");

  if (bgMusic && btnMusic) {
    bgMusic.volume = 0.15;
    btnMusic.addEventListener("click", function () {
      if (bgMusic.paused) {
        bgMusic.play().catch((e) => console.log("Interação necessária"));
        btnMusic.innerHTML = '<i class="fa-solid fa-volume-high"></i>';
      } else {
        bgMusic.pause();
        btnMusic.innerHTML = '<i class="fa-solid fa-volume-xmark"></i>';
      }
    });
  }
  // =========================================================
  // 2. PLAYER DE MÚSICA ESTILO SPOTIFY (CORRIGIDO)
  // =========================================================

  // --- CONFIGURAÇÃO DA PLAYLIST ---
  // VERIFIQUE SE O NOME DA PASTA E DOS ARQUIVOS ESTÃO EXATAMENTE IGUAIS
  // const playlist = [
  // {
  //   title: "All I Want For Christmas Is You ",
  //  artist: "Mariah Carey",
  //  src: "Música/Mariah Carey - All I Want For Christmas Is You (Lyrics).mp4", // <--- CONFIRA ESSE CAMINHO
  //  cover: "Imagens/Capa_mariah.jpg", // <--- CONFIRA ESSE CAMINHO
  // },
  // {
  //   title: "Rockin' Around The Christmas Tree",
  //   artist: "Brenda Lee",
  //   src: "Música/videoplayback.mp4",
  //   cover: "Imagens/Capa_brenda.jpg",
  //  },
  // ];

  // let currentTrackIndex = 0;

  // Elementos do DOM
  //  const audioEl = document.getElementById("bg-music");
  // const coverEl = document.getElementById("player-cover");
  // const titleEl = document.getElementById("player-title");
  // const artistEl = document.getElementById("player-artist");
  // const btnPrev = document.getElementById("btn-prev");
  // const btnPlayPause = document.getElementById("btn-play-pause");
  // const btnNext = document.getElementById("btn-next");

  // Função auxiliar para atualizar o ícone
  // function updatePlayIcon(isPlaying) {
  //  if (isPlaying) {
  //    btnPlayPause.innerHTML = '<i class="fa-solid fa-pause"></i>';
  //  } else {
  //   btnPlayPause.innerHTML = '<i class="fa-solid fa-play"></i>';
  // }
  // }

  // Função para carregar uma música
  // function loadTrack(index) {
  // if (!playlist[index]) return;

  // const track = playlist[index];

  // Define a fonte do áudio
  // audioEl.src = track.src;
  //  audioEl.load(); // Força o navegador a carregar o novo arquivo
  // audioEl.volume = 0.2; // 20% de volume

  // Atualiza visual
  // titleEl.textContent = track.title;
  // artistEl.textContent = track.artist;

  // if (track.cover) {
  //   coverEl.src = track.cover;
  // } else {
  //   coverEl.src = "https://via.placeholder.com/60x60/000000/FFFFFF/?text=MP3";
  //  }

  // IMPORTANTE: Se o player já estava rodando, tenta tocar a próxima
  // Verifica se não está pausado e se tem duração (já tocou algo antes)
  // if (!audioEl.paused && audioEl.currentTime > 0) {
  //   playAudio();
  // }
  // }

  // Função robusta para TOCAR
  // function playAudio() {
  // const playPromise = audioEl.play();

  // if (playPromise !== undefined) {
  //  playPromise
  //    .then((_) => {
  // Tocou com sucesso
  //   updatePlayIcon(true);
  // })
  //  .catch((error) => {
  //   console.error("ERRO AO TOCAR: ", error);
  // Geralmente erro de caminho ou bloqueio do navegador
  //  if (
  //   error.name === "NotSupportedError" ||
  //   error.message.includes("404")
  //  ) {
  //   alert(
  //     "Erro: Arquivo de áudio não encontrado! Verifique a pasta 'sounds'."
  //    );
  // }
  //  updatePlayIcon(false);
  //  });
  // }
  // }

  // Função robusta para PAUSAR
  // function pauseAudio() {
  //  audioEl.pause();
  //  updatePlayIcon(false);
  // }

  // Botão Play/Pause (Lógica Central)
  // function togglePlayPause() {
  //  if (audioEl.paused) {
  //    playAudio();
  //  } else {
  //    pauseAudio();
  //  }
  // }

  // Próxima Faixa
  // function nextTrack() {
  //  currentTrackIndex++;
  //  if (currentTrackIndex >= playlist.length) {
  //    currentTrackIndex = 0;
  //  }
  // Carrega e força o play se o usuário clicou em avançar
  //  loadTrack(currentTrackIndex);
  //  playAudio();
  // }

  // Faixa Anterior
  // function prevTrack() {
  //  currentTrackIndex--;
  //  if (currentTrackIndex < 0) {
  //   currentTrackIndex = playlist.length - 1;
  // }
  // loadTrack(currentTrackIndex);
  //  playAudio();
  //  }

  // --- INICIALIZAÇÃO ---
  // if (audioEl && btnPlayPause) {
  // 1. Carrega a primeira música (sem tocar)
  // loadTrack(currentTrackIndex);

  // 2. Event Listeners
  // btnPlayPause.addEventListener("click", togglePlayPause);

  // btnNext.addEventListener("click", () => {
  //   nextTrack();
  // });

  // btnPrev.addEventListener("click", () => {
  //    prevTrack();
  //  });

  // 3. Auto-play próxima música quando acabar
  //  audioEl.addEventListener("ended", () => {
  //   nextTrack();
  // });

  // 4. Tratamento de Erro no carregamento do arquivo
  // audioEl.addEventListener("error", function (e) {
  //  console.error("Erro no arquivo de áudio:", e);
  //  titleEl.textContent = "Erro no Arquivo";
  // artistEl.textContent = "Verifique a pasta sounds";
  // });
  // }
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
    setTimeout(function () {
      if (div.parentNode) div.parentNode.removeChild(div);
    }, 4000);
  }

  // =========================================================
  // 4. SESSÃO E LOGIN (DISCORD)
  // =========================================================
  const SESSION_KEY = "policia_revoada_v3";
  const SESSION_DURATION = 7 * 24 * 60 * 60 * 1000;

  var userNameSpan = document.getElementById("user-name");
  var userIdHidden = document.getElementById("user-id-hidden");
  var userAvatarImg = document.getElementById("user-avatar");

  function salvarSessao(nome, avatar, id) {
    const dados = { nome, avatar, id, timestamp: new Date().getTime() };
    localStorage.setItem(SESSION_KEY, JSON.stringify(dados));
  }

  function verificarSessao() {
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

  function aplicarDadosUsuario(nome, avatar, id) {
    if (userNameSpan) userNameSpan.textContent = nome;
    if (userIdHidden) userIdHidden.value = id;
    if (userAvatarImg && avatar) {
      userAvatarImg.src = avatar;
      userAvatarImg.classList.remove("hidden");
    }
  }
  // --- BOTÃO SIMULAR ACESSO (DEV) ---
  var btnBypass = document.getElementById("btn-bypass-login");
  if (btnBypass) {
    btnBypass.addEventListener("click", function () {
      var nome = "Oficial Teste";
      var id = "000000000000000000";
      var avatar = "https://cdn.discordapp.com/embed/avatars/0.png"; // Avatar padrão

      salvarSessao(nome, avatar, id);
      aplicarDadosUsuario(nome, avatar, id);
      mostrarApp();
      mostrarAlerta("Modo de Teste Ativado!", "success");
    });
  }
  verificarSessao();

  var fragment = new URLSearchParams(window.location.hash.slice(1));
  var accessToken = fragment.get("access_token");
  var tokenType = fragment.get("token_type");

  if (accessToken) {
    window.history.replaceState({}, document.title, window.location.pathname);
    var h2Login = document.querySelector(".login-box h2");
    if (h2Login) h2Login.textContent = "VERIFICANDO...";

    fetch("https://discord.com/api/users/@me", {
      headers: { authorization: `${tokenType} ${accessToken}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.id) {
          var nome = data.global_name || data.username;
          var avatar = data.avatar
            ? `https://cdn.discordapp.com/avatars/${data.id}/${data.avatar}.png`
            : "Imagens/image.png";

          salvarSessao(nome, avatar, data.id);
          aplicarDadosUsuario(nome, avatar, data.id);
          mostrarApp();
        } else {
          mostrarAlerta("Erro ao obter dados do Discord.", "error");
          mostrarLogin();
        }
      })
      .catch((err) => {
        console.error(err);
        mostrarLogin();
      });
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

  async function carregarOficiaisDiscord() {
    try {
      const response = await fetch("/api/membros");
      if (response.ok) {
        var dados = await response.json();
        if (Array.isArray(dados)) LISTA_OFICIAIS = dados;
      }
    } catch (error) {
      console.log("Usando lista manual.");
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

    document.addEventListener("click", function (e) {
      if (e.target !== searchInput && e.target !== dropdownResults) {
        dropdownResults.classList.add("hidden");
      }
    });
  }

  // --- TRAVAS DE SEGURANÇA E ADIÇÃO DE OFICIAIS ---
  if (btnAddPart) {
    btnAddPart.addEventListener("click", function () {
      var id = selectedOficialIdInput.value || "000";
      var nome = searchInput.value;

      var idLogado = userIdHidden.value;
      var nomeLogado = userNameSpan.textContent;

      if (!nome) return mostrarAlerta("Digite o nome do oficial.", "error");

      if (id === idLogado || nome === nomeLogado) {
        return mostrarAlerta(
          "Você já é o relator, não pode se adicionar!",
          "error"
        );
      }

      if (participantesSelecionados.length >= 8) {
        return mostrarAlerta(
          "Limite máximo de 8 participantes atingido!",
          "error"
        );
      }

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

  // --- TRAVA DE CHECKBOX (PRIMÁRIO vs REINCIDENTE) ---
  var chkPrimario = document.getElementById("atenuante-primario");
  if (chkPrimario) {
    chkPrimario.addEventListener("change", function () {
      if (this.checked) {
        var isReincidente = selectedCrimes.some((c) => c.artigo === "161");
        if (isReincidente) {
          mostrarAlerta(
            "Conflito: Remova o crime de Reincidente antes de marcar Primário.",
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

    // TETO DE 180 ANTES DO DESCONTO
    var penaBaseCalculo = totalPenaRaw;
    if (totalPenaRaw > 180) {
      penaBaseCalculo = 180;
      if (alertPenaMaxima) alertPenaMaxima.classList.remove("hidden");
    } else {
      if (alertPenaMaxima) alertPenaMaxima.classList.add("hidden");
    }

    var descontoPercent = 0;
    checkboxes.forEach((cb) => {
      if (cb.checked) descontoPercent += parseFloat(cb.dataset.percent);
    });
    var penaComDesconto = Math.max(
      0,
      penaBaseCalculo * (1 - Math.abs(descontoPercent) / 100)
    );

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
      // 1. Calcula o valor base (ex: 3x a multa)
      var valorBaseFianca = totalMulta * 3;

      // 2. Aplica o LIMITADOR (Teto de 1.400.000)
      // O Math.min escolhe o menor valor entre o calculado e o limite.
      var valorFiancaFinal = Math.min(valorBaseFianca, 1400000);

      // Exibe o valor final
      fiancaOutput.value = "R$ " + valorFiancaFinal.toLocaleString("pt-BR");

      if (radioFiancaSim) radioFiancaSim.disabled = false;

      // Lógica de mostrar/esconder o upload do comprovante
      if (radioFiancaSim && radioFiancaSim.checked) {
        if (boxDeposito) boxDeposito.classList.remove("hidden");
      } else {
        if (boxDeposito) boxDeposito.classList.add("hidden");
      }

      // Lógica da Divisão de Valores (Breakdown) usando o valor COM O LIMITADOR
      var advogadoCheck = document.getElementById("atenuante-advogado");
      var fiancaBreakdown = document.getElementById("fianca-breakdown");

      if (advogadoCheck && advogadoCheck.checked && valorFiancaFinal > 0) {
        fiancaBreakdown.classList.remove("hidden");

        // Aqui usamos 'valorFiancaFinal' para calcular as fatias corretamente
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
      )}</span> <button onclick="removerCrime(${idx})" style="background:none;border:none;color:#d32f2f;cursor:pointer;"><i class="fa-solid fa-xmark"></i></button>`;
      crimesListOutput.appendChild(div);
    });
  }

  window.removerCrime = function (idx) {
    var c = selectedCrimes[idx];
    selectedCrimes.splice(idx, 1);
    var item = document.querySelector(`.crime-item[data-artigo="${c.artigo}"]`);
    if (item) item.classList.remove("selected");
    if (c.artigo === "137") {
      containerDinheiroSujo.classList.add("hidden");
      inputDinheiroSujo.value = "";
    }
    calculateSentence();
  };

  // --- TRAVAS DE CRIMES (LÓGICA DE EXCLUSÃO MÚTUA) ---
  crimeItems.forEach((item) => {
    item.addEventListener("click", function () {
      var artigo = this.dataset.artigo;

      if (selectedCrimes.some((c) => c.artigo === artigo)) {
        var idx = selectedCrimes.findIndex((c) => c.artigo === artigo);
        window.removerCrime(idx);
      } else {
        // 1. TRAVA DE HOMICÍDIOS
        const HOMICIDIOS_CONFLITANTES = ["104", "105", "107", "108"];
        if (HOMICIDIOS_CONFLITANTES.includes(artigo)) {
          if (
            selectedCrimes.some((c) =>
              HOMICIDIOS_CONFLITANTES.includes(c.artigo)
            )
          ) {
            return mostrarAlerta(
              "Conflito: Não é possível marcar múltiplos homicídios consumados.",
              "error"
            );
          }
        }

        // 2. TRAVA DE ARMAS
        if (artigo === "123") {
          if (
            selectedCrimes.some((c) => c.artigo === "125" || c.artigo === "126")
          ) {
            return mostrarAlerta(
              "Conflito: Tráfico de Armas não pode ser marcado junto com Porte.",
              "error"
            );
          }
        }
        if (artigo === "125" || artigo === "126") {
          if (selectedCrimes.some((c) => c.artigo === "123")) {
            return mostrarAlerta(
              "Conflito: Porte de Armas não pode ser marcado junto com Tráfico.",
              "error"
            );
          }
        }

        // 3. TRAVA: REINCIDENTE VS PRIMÁRIO
        if (artigo === "161") {
          var chkPrim = document.getElementById("atenuante-primario");
          if (chkPrim && chkPrim.checked) {
            return mostrarAlerta(
              "Conflito: Réu não pode ser Reincidente e Primário ao mesmo tempo.",
              "error"
            );
          }
        }

        // 4. TRAVA: MUNIÇÕES
        const MUNICOES_CONFLITANTES = ["128", "129"];
        if (MUNICOES_CONFLITANTES.includes(artigo)) {
          if (
            selectedCrimes.some((c) => MUNICOES_CONFLITANTES.includes(c.artigo))
          ) {
            return mostrarAlerta(
              "Conflito: Selecione apenas Tráfico OU Posse de Munições.",
              "error"
            );
          }
        }

        // 5. TRAVA: ITENS ILEGAIS
        const ITENS_CONFLITANTES = ["124", "136"];
        if (ITENS_CONFLITANTES.includes(artigo)) {
          if (
            selectedCrimes.some((c) => ITENS_CONFLITANTES.includes(c.artigo))
          ) {
            return mostrarAlerta(
              "Conflito: Selecione apenas Tráfico OU Posse de Itens Ilegais.",
              "error"
            );
          }
        }

        // 6. TRAVA: DROGAS
        const DROGAS_CONFLITANTES = ["132", "133", "135"];
        if (DROGAS_CONFLITANTES.includes(artigo)) {
          if (
            selectedCrimes.some((c) => DROGAS_CONFLITANTES.includes(c.artigo))
          ) {
            return mostrarAlerta(
              "Conflito: Selecione apenas uma modalidade de Drogas (Posse, Aviãozinho ou Tráfico).",
              "error"
            );
          }
        }

        // ADICIONA O CRIME
        var nome = this.querySelector(".crime-name").textContent;
        var pena = parseInt(this.dataset.pena);
        var multa = parseInt(this.dataset.multa);
        var infiancavel = this.dataset.infiancavel === "true";
        selectedCrimes.push({ artigo, nome, pena, multa, infiancavel });
        this.classList.add("selected");
        if (artigo === "137") {
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

  // --- FORMATAÇÃO DINHEIRO SUJO E CÓPIA AUTOMÁTICA ---
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
      if (confirm("Deseja limpar todos os dados?")) {
        location.reload();
      }
    });
  }

  // =========================================================
  // 7. UPLOADS E PREVIEW
  // =========================================================
  var arquivoPreso = null;
  var arquivoMochila = null;
  var arquivoDeposito = null;
  var arquivoExtra = null; // Variável para a foto extra

  function setupUpload(boxId, inputId, imgId, type) {
    var box = document.getElementById(boxId);
    var input = document.getElementById(inputId);
    var img = document.getElementById(imgId);

    if (!box || !input) return;

    box.addEventListener("click", function (e) {
      if (e.target !== input && e.target.tagName !== "LABEL") {
        input.click();
      }
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
      if (this.files && this.files[0]) {
        handleFile(this.files[0], img, type);
      }
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

  document.querySelectorAll(".upload-box").forEach((box) => {
    box.setAttribute("tabindex", "0");
  });

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

  // Lógica do botão "+ Foto Extra"
  var btnShowExtra = document.getElementById("btn-show-extra");
  if (btnShowExtra) {
    btnShowExtra.addEventListener("click", function () {
      var boxExtra = document.getElementById("box-upload-extra");
      boxExtra.classList.remove("hidden");
      this.style.display = "none"; // Esconde o botão após clicar
    });
  }

  // =========================================================
  // 8. MODAL E ENVIO
  // =========================================================
  var btnEnviar = document.getElementById("btn-enviar");
  var modalConf = document.getElementById("modal-confirmacao");
  var btnCancelar = document.getElementById("btn-cancelar-conf");
  var btnConfirmar = document.getElementById("btn-confirmar-envio");

  if (btnEnviar) {
    btnEnviar.addEventListener("click", function () {
      var nomePreso = document.getElementById("nome").value;
      if (!nomePreso) {
        mostrarAlerta("Preencha o nome do preso!", "error");
        return;
      }
      if (!arquivoPreso || !arquivoMochila) {
        mostrarAlerta("Fotos do Preso e Inventário são obrigatórias!", "error");
        return;
      }
      if (selectedCrimes.length === 0) {
        mostrarAlerta("Selecione ao menos um crime!", "error");
        return;
      }

      // TRAVA: DINHEIRO SUJO
      var temDinheiroSujo = selectedCrimes.some((c) => c.artigo === "137");
      if (
        temDinheiroSujo &&
        (!inputDinheiroSujo.value || inputDinheiroSujo.value.trim() === "")
      ) {
        mostrarAlerta(
          "⚠️ Você marcou Dinheiro Sujo! Informe a quantidade.",
          "error"
        );
        inputDinheiroSujo.focus();
        return;
      }

      // TRAVA: STATUS DO RÉU (PRIMÁRIO/REINCIDENTE)
      var isPrimario = document.getElementById("atenuante-primario").checked;
      var isReincidente = selectedCrimes.some((c) => c.artigo === "161");

      if (!isPrimario && !isReincidente) {
        mostrarAlerta("⚠️ Defina se o Réu é Primário ou Reincidente!", "error");
        return;
      }
      if (isPrimario && isReincidente) {
        mostrarAlerta(
          "⚠️ Réu não pode ser Primário e Reincidente ao mesmo tempo!",
          "error"
        );
        return;
      }

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
        "132",
        "133",
        "134",
        "135",
        "136",
        "141",
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

      // Preenche modal
      document.getElementById("conf-oficiais").textContent =
        userNameSpan.textContent +
        (participantesSelecionados.length > 0
          ? " + " + participantesSelecionados.map((p) => p.nome).join(", ")
          : "");
      document.getElementById("conf-preso").textContent =
        nomePreso + " (RG: " + document.getElementById("rg").value + ")";
      document.getElementById("conf-sentenca").textContent =
        "Pena: " + penaTotalEl.textContent;
      document.getElementById("conf-multa").textContent =
        "Multa: " + multaTotalEl.textContent;

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
          var label = document.querySelector(
            `label[for="${cb.id}"]`
          ).textContent;
          li.innerHTML = `<span style="color:var(--color-success)">✔</span> ${label}`;
          ulDetalhes.appendChild(li);
        }
      });

      if (hpSimBtn.checked) {
        var li = document.createElement("li");
        li.innerHTML = `🏥 Reanimado no HP (-${inputHpMinutos.value}m)`;
        ulDetalhes.appendChild(li);
      }

      if (
        inputDinheiroSujo.value &&
        !containerDinheiroSujo.classList.contains("hidden")
      ) {
        var li = document.createElement("li");
        li.innerHTML = `💸 Dinheiro Sujo: R$ ${inputDinheiroSujo.value}`;
        ulDetalhes.appendChild(li);
      }

      var pagouFianca = document.getElementById("fianca-sim").checked;
      var liFianca = document.createElement("li");
      liFianca.innerHTML = pagouFianca
        ? `<b style="color:var(--color-success)">PAGOU FIANÇA</b>`
        : `<b>NÃO PAGOU FIANÇA</b>`;
      ulDetalhes.appendChild(liFianca);

      var imgP = document.getElementById("img-preview-preso");
      var imgM = document.getElementById("img-preview-mochila");
      var imgD = document.getElementById("img-preview-deposito");
      if (imgP.src) document.getElementById("conf-img-preso").src = imgP.src;
      if (imgM.src) document.getElementById("conf-img-mochila").src = imgM.src;

      var boxConfDep = document.getElementById("box-conf-deposito");
      if (pagouFianca && imgD.src && !imgD.classList.contains("hidden")) {
        document.getElementById("conf-img-deposito").src = imgD.src;
        boxConfDep.classList.remove("hidden");
      } else {
        boxConfDep.classList.add("hidden");
      }

      modalConf.classList.remove("hidden");
    });
  }

  if (btnCancelar) {
    btnCancelar.addEventListener("click", () =>
      modalConf.classList.add("hidden")
    );
  }

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
          canvas.toBlob(
            function (blob) {
              resolve(blob);
            },
            "image/jpeg",
            0.7
          );
        };
      };
    });
  }

  if (btnConfirmar) {
    btnConfirmar.addEventListener("click", async function () {
      btnConfirmar.textContent = "PROCESSANDO...";
      btnConfirmar.disabled = true;
      document.getElementById("btn-cancelar-conf").style.display = "none";

      var elItens = document.getElementById("itens-apreendidos");
      if (!elItens) {
        console.error(
          "ERRO CRÍTICO: Textarea 'itens-apreendidos' não encontrada."
        );
        mostrarAlerta("Erro interno no formulário.", "error");
        return;
      }

      try {
        const blobPreso = await comprimirImagemAsync(arquivoPreso);
        const blobMochila = await comprimirImagemAsync(arquivoMochila);
        const blobDeposito = await comprimirImagemAsync(arquivoDeposito);
        const blobExtra = await comprimirImagemAsync(arquivoExtra); // Comprime a nova foto

        var formData = new FormData();
        if (blobPreso) formData.append("file1", blobPreso, "preso.jpg");
        if (blobMochila) formData.append("file2", blobMochila, "mochila.jpg");
        if (blobDeposito)
          formData.append("file3", blobDeposito, "deposito.jpg");
        if (blobExtra) formData.append("file4", blobExtra, "extra.jpg");

        var pagouFianca = document.getElementById("fianca-sim").checked;
        var nomePreso = document.getElementById("nome").value;
        var rgPreso = document.getElementById("rg").value;
        var advogado = document.getElementById("advogado").value || "Nenhum";
        var oficialNome = userNameSpan.textContent;
        var oficialId = userIdHidden.value;

        var crimesTexto = selectedCrimes
          .map((c) => c.nome.replace(/\*\*/g, ""))
          .join("\n");

        var qraString = `QRA: <@${oficialId}>`;
        if (participantesSelecionados.length > 0) {
          participantesSelecionados.forEach((p) => {
            qraString += ` <@${p.id}>`;
          });
        }

        var atenuantesTexto = "";
        checkboxes.forEach((cb) => {
          if (cb.checked)
            atenuantesTexto +=
              document.querySelector(`label[for="${cb.id}"]`).textContent +
              "\n";
        });
        if (atenuantesTexto === "") atenuantesTexto = "Nenhum";

        var itensApreendidos = elItens.value || "Nenhum";
        var dinheiroSujoDisplay = "Não informado";
        if (
          !containerDinheiroSujo.classList.contains("hidden") &&
          inputDinheiroSujo.value
        ) {
          dinheiroSujoDisplay = "R$ " + inputDinheiroSujo.value;
        } else {
          dinheiroSujoDisplay = "Não houve";
        }

        // CAPTURA DO PORTE
        var porteArmaInput = document.querySelector(
          'input[name="porte-arma"]:checked'
        );
        var porteArmaTexto =
          porteArmaInput && porteArmaInput.value === "sim" ? "Sim" : "Não";

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
                  value: `**Nome:** ${nomePreso}\n**RG:** ${rgPreso}`,
                  inline: false,
                },
                {
                  name: "⚖️ Sentença",
                  value: `**Pena:** ${penaTotalEl.textContent}\n**Multa:** ${multaTotalEl.textContent}`,
                  inline: false,
                },
                { name: "🛡️ Advogado", value: advogado, inline: true },
                {
                  name: "🔫 Porte de Arma",
                  value: porteArmaTexto,
                  inline: true,
                },
                { name: "📜 Crimes", value: "```\n" + crimesTexto + "\n```" },
                {
                  name: "📦 Itens Apreendidos",
                  value: itensApreendidos,
                  inline: false,
                },
                {
                  name: "💸 Dinheiro Sujo",
                  value: dinheiroSujoDisplay,
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

        if (blobDeposito) {
          payload.embeds.push({
            title: "💸 COMPROVANTE",
            color: corEmbed,
            image: { url: "attachment://deposito.jpg" },
          });
        }

        // ADICIONA EMBED DA FOTO EXTRA
        if (blobExtra) {
          payload.embeds.push({
            title: "🚗 EVIDÊNCIA EXTRA / PORTA-MALAS",
            color: corEmbed,
            image: { url: "attachment://extra.jpg" },
          });
        }

        formData.append("payload_json", JSON.stringify(payload));

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
        document.getElementById("btn-cancelar-conf").style.display =
          "inline-block";
      }
    });
  }
});
