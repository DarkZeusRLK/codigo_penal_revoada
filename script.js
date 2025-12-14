document.addEventListener("DOMContentLoaded", function () {
  // ============================================================
  // 1. REFERÊNCIAS GLOBAIS E UTILITÁRIOS DE TELA
  // ============================================================

  var loginScreen = document.getElementById("login-screen");
  var appContent = document.getElementById("app-content");
  var userNameSpan = document.getElementById("user-name");
  var userIdHidden = document.getElementById("user-id-hidden");
  var userAvatarImg = document.getElementById("user-avatar");

  // --- FUNÇÃO PARA FORÇAR A EXIBIÇÃO DO PAINEL (CORREÇÃO TELA PRETA) ---
  function mostrarPainelPrincipal() {
    console.log("Executando troca de tela...");

    // 1. Esconde Login
    if (loginScreen) {
      loginScreen.style.display = "none";
      loginScreen.classList.add("hidden");
    }

    // 2. Mostra Painel (Força Bruta no CSS)
    if (appContent) {
      appContent.classList.remove("hidden");
      appContent.style.display = "block"; // Essencial para evitar tela preta
      console.log("Painel exibido.");
    } else {
      console.error("ERRO CRÍTICO: Div id='app-content' não encontrada.");
      alert("Erro no HTML: Falta id='app-content' na div principal.");
    }
  }

  // --- MÚSICA DE FUNDO ---
  var bgMusic = document.getElementById("bg-music");
  var btnMusic = document.getElementById("btn-music-toggle");
  if (bgMusic) bgMusic.volume = 0.1;
  if (btnMusic && bgMusic) {
    btnMusic.addEventListener("click", function () {
      if (bgMusic.paused) {
        bgMusic.play();
        btnMusic.classList.remove("paused");
        btnMusic.innerHTML = '<i class="fa-solid fa-volume-high"></i>';
      } else {
        bgMusic.pause();
        btnMusic.classList.add("paused");
        btnMusic.innerHTML = '<i class="fa-solid fa-volume-xmark"></i>';
      }
    });
  }

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

  // ============================================================
  // 2. SISTEMA DE SESSÃO E LOGIN
  // ============================================================

  const SESSION_KEY = "policia_session_v1";
  const SESSION_DURATION = 7 * 24 * 60 * 60 * 1000; // 1 semana

  function salvarSessao(nome, avatar, id) {
    const dados = {
      nome: nome,
      avatar: avatar,
      id: id,
      timestamp: new Date().getTime(),
    };
    localStorage.setItem(SESSION_KEY, JSON.stringify(dados));
  }

  function verificarSessao() {
    // Se estiver no processo de login do Discord (URL com hash), ignora o cache
    if (window.location.hash.includes("access_token")) return;

    const dadosSalvos = localStorage.getItem(SESSION_KEY);
    if (!dadosSalvos) return;

    try {
      const sessao = JSON.parse(dadosSalvos);
      const agora = new Date().getTime();

      // Validação de Integridade (Anti-Bug do ID virar Link)
      if (
        !sessao.id ||
        sessao.id.toString().includes("http") ||
        sessao.id.length < 5
      ) {
        console.warn("Cache corrompido (ID inválido). Limpando...");
        localStorage.removeItem(SESSION_KEY);
        return;
      }

      // Validação de Tempo
      if (agora - sessao.timestamp > SESSION_DURATION) {
        console.warn("Sessão expirada.");
        localStorage.removeItem(SESSION_KEY);
        return;
      }

      // Restaura Sessão
      if (userNameSpan) userNameSpan.textContent = sessao.nome;
      if (userIdHidden) userIdHidden.value = sessao.id;
      if (userAvatarImg && sessao.avatar) {
        userAvatarImg.src = sessao.avatar;
        userAvatarImg.classList.remove("hidden");
      }

      console.log("Logado via cache: " + sessao.nome);
      mostrarPainelPrincipal(); // Troca a tela
    } catch (e) {
      console.error("Erro ao ler sessão", e);
      localStorage.removeItem(SESSION_KEY);
    }
  }

  function doLogin(username, avatarUrl, userId) {
    salvarSessao(username, avatarUrl, userId);

    if (userNameSpan) userNameSpan.textContent = username;
    if (userIdHidden) userIdHidden.value = userId;
    if (avatarUrl && userAvatarImg) {
      userAvatarImg.src = avatarUrl;
      userAvatarImg.classList.remove("hidden");
    }

    if (bgMusic) bgMusic.play().catch((e) => console.log("Audio block"));
    carregarOficiaisDiscord();
    mostrarPainelPrincipal();
  }

  // --- INICIALIZAÇÃO ---
  verificarSessao();

  // Verifica retorno do Discord
  var fragment = new URLSearchParams(window.location.hash.slice(1));
  var accessToken = fragment.get("access_token");
  if (accessToken) {
    var h2Login = document.querySelector(".login-box h2");
    if (h2Login) h2Login.innerText = "VERIFICANDO...";

    fetch("/api/auth", { headers: { Authorization: `Bearer ${accessToken}` } })
      .then(async (response) => {
        const data = await response.json();
        if (response.status === 200 && data.authorized) {
          var avatar = data.avatar
            ? `https://cdn.discordapp.com/avatars/${data.id}/${data.avatar}.png`
            : "Imagens/image.png";
          doLogin(data.username, avatar, data.id);
          // Limpa a URL
          history.pushState("", document.title, window.location.pathname);
        } else {
          mostrarAlerta(data.error || "Acesso negado.", "error");
          if (h2Login) h2Login.innerText = "ACESSO NEGADO";
          setTimeout(() => {
            location.href = "/";
          }, 2000);
        }
      })
      .catch((err) => {
        console.error(err);
        mostrarAlerta("Erro de conexão.", "error");
      });
  }

  // ============================================================
  // 3. LÓGICA DA CALCULADORA E UPLOADS
  // ============================================================

  var PORCENTAGEM_MULTA_SUJO = 0.5;
  var PENA_MAXIMA_SERVER = 180;

  // GRUPOS DE CRIMES MUTUAMENTE EXCLUSIVOS
  var GRUPOS_CONFLITO = [
    ["132", "133", "135"], // Drogas
    ["128", "129"], // Munições
  ];

  // Carregar Oficiais
  var LISTA_OFICIAIS = [];
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
        LISTA_OFICIAIS = await response.json();
      }
    } catch (error) {
      console.error("Erro oficiais:", error);
    }
  }

  // Auto-complete Oficiais
  if (searchInput) {
    searchInput.addEventListener("input", function () {
      var termo = this.value.toLowerCase();
      dropdownResults.innerHTML = "";
      if (termo.length < 1) {
        dropdownResults.classList.add("hidden");
        return;
      }

      var filtrados = LISTA_OFICIAIS.filter(
        (o) => o.nome.toLowerCase().includes(termo) || o.id.includes(termo)
      );
      if (filtrados.length === 0) {
        dropdownResults.classList.add("hidden");
        return;
      }

      dropdownResults.classList.remove("hidden");
      filtrados.forEach((oficial) => {
        var div = document.createElement("div");
        div.className = "dropdown-item";
        div.innerHTML = `<strong>${oficial.nome}</strong><small>ID: ${oficial.id}</small>`;
        div.addEventListener("click", function () {
          searchInput.value = oficial.nome;
          selectedOficialIdInput.value = oficial.id;
          dropdownResults.classList.add("hidden");
        });
        dropdownResults.appendChild(div);
      });
    });
  }

  if (btnAddPart) {
    btnAddPart.addEventListener("click", function () {
      var id = selectedOficialIdInput.value;
      var nome = searchInput.value;
      var myId = userIdHidden.value;
      if (!id || !nome) return mostrarAlerta("Selecione um oficial.", "error");
      if (id === myId) return mostrarAlerta("Você já é o relator!", "error");
      if (participantesSelecionados.some((p) => p.id === id))
        return mostrarAlerta("Já adicionado.", "error");

      participantesSelecionados.push({ id, nome });
      var tag = document.createElement("div");
      tag.className = "officer-tag";
      tag.innerHTML = `<span>${nome}</span> <button onclick="removerParticipante('${id}', this)">×</button>`;
      listaParticipantesVisual.appendChild(tag);
      searchInput.value = "";
      selectedOficialIdInput.value = "";
    });
  }

  window.removerParticipante = function (id, btn) {
    participantesSelecionados = participantesSelecionados.filter(
      (p) => p.id !== id
    );
    btn.parentElement.remove();
  };

  // Upload Logic
  var boxPreso = document.getElementById("box-upload-preso");
  var inputPreso = document.getElementById("upload-preso");
  var imgPreviewPreso = document.getElementById("img-preview-preso");

  var boxMochila = document.getElementById("box-upload-mochila");
  var inputMochila = document.getElementById("upload-mochila");
  var imgPreviewMochila = document.getElementById("img-preview-mochila");

  var boxDeposito = document.getElementById("box-upload-deposito");
  var inputDeposito = document.getElementById("upload-deposito");
  var imgPreviewDeposito = document.getElementById("img-preview-deposito");

  var arquivoPreso = null;
  var arquivoMochila = null;
  var arquivoDeposito = null;
  var activeUploadBox = null;

  function setFile(type, file) {
    var reader = new FileReader();
    reader.onload = function (e) {
      if (type === "preso") {
        arquivoPreso = file;
        imgPreviewPreso.src = e.target.result;
        imgPreviewPreso.classList.remove("hidden");
      } else if (type === "mochila") {
        arquivoMochila = file;
        imgPreviewMochila.src = e.target.result;
        imgPreviewMochila.classList.remove("hidden");
      } else if (type === "deposito") {
        arquivoDeposito = file;
        imgPreviewDeposito.src = e.target.result;
        imgPreviewDeposito.classList.remove("hidden");
      }
    };
    reader.readAsDataURL(file);
  }

  if (inputPreso)
    inputPreso.addEventListener("change", function () {
      if (this.files[0]) setFile("preso", this.files[0]);
    });
  if (inputMochila)
    inputMochila.addEventListener("change", function () {
      if (this.files[0]) setFile("mochila", this.files[0]);
    });
  if (inputDeposito)
    inputDeposito.addEventListener("change", function () {
      if (this.files[0]) setFile("deposito", this.files[0]);
    });

  if (boxPreso)
    boxPreso.addEventListener("click", () => {
      activeUploadBox = "preso";
      destacarBox(boxPreso);
    });
  if (boxMochila)
    boxMochila.addEventListener("click", () => {
      activeUploadBox = "mochila";
      destacarBox(boxMochila);
    });
  if (boxDeposito)
    boxDeposito.addEventListener("click", () => {
      activeUploadBox = "deposito";
      destacarBox(boxDeposito);
    });

  function destacarBox(box) {
    [boxPreso, boxMochila, boxDeposito].forEach((b) =>
      b.classList.remove("active-box")
    );
    box.classList.add("active-box");
  }

  document.addEventListener("paste", function (e) {
    if (!activeUploadBox) return;
    if (
      activeUploadBox === "deposito" &&
      boxDeposito.classList.contains("hidden")
    )
      return;
    if (e.clipboardData && e.clipboardData.items) {
      for (var i = 0; i < e.clipboardData.items.length; i++) {
        if (e.clipboardData.items[i].type.indexOf("image") !== -1) {
          setFile(activeUploadBox, e.clipboardData.items[i].getAsFile());
          mostrarAlerta("Imagem colada!", "success");
          break;
        }
      }
    }
  });

  // ============================================================
  // 4. LÓGICA DE CRIMES E CÁLCULO
  // ============================================================

  var selectedCrimes = [];
  var crimeItems = document.querySelectorAll(".crime-item");
  var checkboxes = document.querySelectorAll(
    '.atenuantes input[type="checkbox"]'
  );

  var nomeInput = document.getElementById("nome");
  var rgInput = document.getElementById("rg");
  var advogadoInput = document.getElementById("advogado");
  var itensApreendidosInput = document.querySelector(
    ".itens-apreendidos textarea"
  );

  var containerDinheiroSujo = document.getElementById(
    "container-dinheiro-sujo"
  );
  var inputDinheiroSujo = document.getElementById("input-dinheiro-sujo");

  var penaTotalEl = document.getElementById("pena-total");
  var multaTotalEl = document.getElementById("multa-total");
  var crimesListOutput = document.getElementById("crimes-list-output");
  var checkPrimario = document.getElementById("atenuante-primario");
  var checkboxAdvogado = document.getElementById("atenuante-advogado");

  var radiosFianca = document.getElementsByName("pagou-fianca");
  var radioFiancaSim = document.getElementById("fianca-sim");
  var radioFiancaNao = document.getElementById("fianca-nao");
  var radiosPorte = document.getElementsByName("porte-arma");

  var hpSimBtn = document.getElementById("hp-sim");
  var hpNaoBtn = document.getElementById("hp-nao");
  var containerHpMinutos = document.getElementById("container-hp-minutos");
  var inputHpMinutos = document.getElementById("hp-minutos");

  var fiancaBreakdown = document.getElementById("fianca-breakdown");
  var alertaPenaMaxima = document.getElementById("alerta-pena-maxima");

  // Listener Crimes
  crimeItems.forEach((item) => {
    item.addEventListener("click", function () {
      var artigo = this.dataset.artigo;
      var nome = this.querySelector(".crime-name").innerText.trim();
      var pena = parseInt(this.dataset.pena);
      var multa = parseInt(this.dataset.multa);
      var infiancavel = this.dataset.infiancavel === "true";

      // Verifica se já existe
      var existeIndex = selectedCrimes.findIndex((c) => c.artigo === artigo);

      if (existeIndex === -1) {
        // Validações de conflito
        if (artigo === "161" && checkPrimario.checked)
          return mostrarAlerta("Desmarque 'Réu Primário' antes.", "error");

        // Verifica Grupos de Conflito
        var grupo = GRUPOS_CONFLITO.find((g) => g.includes(artigo));
        if (grupo && selectedCrimes.some((c) => grupo.includes(c.artigo))) {
          return mostrarAlerta(
            "Você já selecionou um crime incompatível deste grupo.",
            "error"
          );
        }

        selectedCrimes.push({ artigo, nome, pena, multa, infiancavel });
        this.classList.add("selected");
        if (artigo === "137") containerDinheiroSujo.classList.remove("hidden");
      } else {
        selectedCrimes.splice(existeIndex, 1);
        this.classList.remove("selected");
        if (artigo === "137") {
          containerDinheiroSujo.classList.add("hidden");
          inputDinheiroSujo.value = "";
        }
      }
      calculateSentence();
    });
  });

  // Listener Checkboxes
  checkboxes.forEach((cb) => {
    cb.addEventListener("change", function () {
      if (
        this.id === "atenuante-primario" &&
        this.checked &&
        selectedCrimes.some((c) => c.artigo === "161")
      ) {
        this.checked = false;
        return mostrarAlerta("Crime de Reincidente está marcado!", "error");
      }
      calculateSentence();
    });
  });

  // HP e Dinheiro Sujo
  function toggleHpInput() {
    if (hpSimBtn.checked) {
      containerHpMinutos.classList.remove("hidden");
      inputHpMinutos.focus();
    } else {
      containerHpMinutos.classList.add("hidden");
      inputHpMinutos.value = "";
    }
    calculateSentence();
  }
  if (hpSimBtn) {
    hpSimBtn.addEventListener("change", toggleHpInput);
    hpNaoBtn.addEventListener("change", toggleHpInput);
  }
  if (inputHpMinutos)
    inputHpMinutos.addEventListener("input", calculateSentence);

  if (inputDinheiroSujo)
    inputDinheiroSujo.addEventListener("input", function (e) {
      var val = e.target.value
        .replace(/\D/g, "")
        .replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1.");
      e.target.value = val;
      calculateSentence();
    });

  // Fiança Toggle
  if (radioFiancaSim) {
    var checkFianca = () => {
      if (radioFiancaSim.checked) boxDeposito.classList.remove("hidden");
      else {
        boxDeposito.classList.add("hidden");
        arquivoDeposito = null;
        imgPreviewDeposito.src = "";
        imgPreviewDeposito.classList.add("hidden");
      }
    };
    radioFiancaSim.addEventListener("change", checkFianca);
    radioFiancaNao.addEventListener("change", checkFianca);
  }

  // --- FUNÇÃO PRINCIPAL DE CÁLCULO ---
  function calculateSentence() {
    var totalPena = 0;
    var totalMulta = 0;
    var isInfiancavel = false;

    selectedCrimes.forEach((c) => {
      totalPena += c.pena;
      totalMulta += c.multa;
      if (c.infiancavel) isInfiancavel = true;
    });

    // Dinheiro Sujo
    if (
      inputDinheiroSujo &&
      !containerDinheiroSujo.classList.contains("hidden")
    ) {
      var sujo = parseFloat(inputDinheiroSujo.value.replace(/\./g, "")) || 0;
      totalMulta += sujo * PORCENTAGEM_MULTA_SUJO;
    }

    // Atenuantes
    var desconto = 0;
    checkboxes.forEach((cb) => {
      if (cb.checked) desconto += parseFloat(cb.dataset.percent);
    });
    var penaFinal = Math.max(0, totalPena * (1 - Math.abs(desconto) / 100));

    // HP
    if (hpSimBtn && hpSimBtn.checked && inputHpMinutos.value) {
      penaFinal = Math.max(0, penaFinal - parseInt(inputHpMinutos.value));
    }

    // Teto
    if (penaFinal > PENA_MAXIMA_SERVER) {
      penaFinal = PENA_MAXIMA_SERVER;
      alertaPenaMaxima.classList.remove("hidden");
    } else {
      alertaPenaMaxima.classList.add("hidden");
    }

    // Display
    penaTotalEl.textContent = Math.round(penaFinal) + " meses";
    multaTotalEl.textContent = "R$" + totalMulta.toLocaleString("pt-BR");

    // Lógica Inafiançável
    if (isInfiancavel) {
      radioFiancaSim.disabled = true;
      radioFiancaNao.checked = true;
      if (radioFiancaSim.checked) {
        boxDeposito.classList.add("hidden");
      }
    } else {
      radioFiancaSim.disabled = false;
    }

    // Breakdown Fiança
    if (!isInfiancavel && checkboxAdvogado.checked && totalMulta > 0) {
      fiancaBreakdown.classList.remove("hidden");
      document.getElementById("valor-policial").textContent =
        "R$ " +
        (totalMulta * 0.35).toLocaleString("pt-BR", {
          maximumFractionDigits: 0,
        });
      document.getElementById("valor-painel").textContent =
        "R$ " +
        (totalMulta * 0.35).toLocaleString("pt-BR", {
          maximumFractionDigits: 0,
        });
      document.getElementById("valor-advogado").textContent =
        "R$ " +
        (totalMulta * 0.3).toLocaleString("pt-BR", {
          maximumFractionDigits: 0,
        });
    } else {
      fiancaBreakdown.classList.add("hidden");
    }

    updateCrimesOutput();
  }

  function updateCrimesOutput() {
    crimesListOutput.innerHTML = "";
    if (selectedCrimes.length === 0) {
      crimesListOutput.innerHTML =
        '<div class="empty-message">Nenhum crime selecionado</div>';
      return;
    }
    selectedCrimes.forEach((c, idx) => {
      var div = document.createElement("div");
      div.className = "crime-output-item";
      div.innerHTML = `<span>${c.nome.replace(/\*\*/g, "")} ${
        c.infiancavel ? "(INF)" : ""
      }</span> <button onclick="removerCrimeList(${idx})"><i class="fa-solid fa-xmark"></i></button>`;
      crimesListOutput.appendChild(div);
    });
  }

  window.removerCrimeList = function (idx) {
    var crime = selectedCrimes[idx];
    selectedCrimes.splice(idx, 1);
    document
      .querySelector(`.crime-item[data-artigo="${crime.artigo}"]`)
      .classList.remove("selected");
    if (crime.artigo === "137") {
      containerDinheiroSujo.classList.add("hidden");
      inputDinheiroSujo.value = "";
    }
    calculateSentence();
  };

  var btnLimpar = document.getElementById("btn-limpar");
  if (btnLimpar)
    btnLimpar.addEventListener("click", () => {
      if (confirm("Limpar tudo?")) location.reload();
    });

  // ============================================================
  // 5. ENVIO E MODAL (A PARTE QUE FALTAVA)
  // ============================================================

  var btnEnviar = document.getElementById("btn-enviar");
  var modalConfirmacao = document.getElementById("modal-confirmacao");
  var btnCancelarConf = document.getElementById("btn-cancelar-conf");
  var btnConfirmarEnvio = document.getElementById("btn-confirmar-envio");

  function abrirModalConfirmacao() {
    // 1. Oficiais
    var lista = [userNameSpan.textContent];
    participantesSelecionados.forEach((p) => lista.push(p.nome));
    document.getElementById("conf-oficiais").textContent = lista.join(", ");

    // 2. Preso
    document.getElementById("conf-preso").textContent =
      nomeInput.value + " (RG: " + rgInput.value + ")";
    document.getElementById("conf-advogado").textContent =
      advogadoInput.value || "Nenhum";

    // 3. Valores
    document.getElementById("conf-sentenca").textContent =
      penaTotalEl.textContent;
    document.getElementById("conf-multa").textContent =
      multaTotalEl.textContent;

    // 4. Crimes
    var listaCrimes = document.getElementById("conf-crimes");
    listaCrimes.innerHTML = "";
    selectedCrimes.forEach((c) => {
      var li = document.createElement("li");
      li.textContent =
        c.nome.replace(/\*\*/g, "") + (c.infiancavel ? " (INF)" : "");
      listaCrimes.appendChild(li);
    });

    // 5. Imagens
    document.getElementById("conf-img-preso").src = imgPreviewPreso.src;
    document.getElementById("conf-img-mochila").src = imgPreviewMochila.src;
    var boxConfDep = document.getElementById("box-conf-deposito");

    var pagou = false;
    for (var i = 0; i < radiosFianca.length; i++)
      if (radiosFianca[i].checked && radiosFianca[i].value === "sim")
        pagou = true;

    if (pagou && imgPreviewDeposito.src) {
      boxConfDep.classList.remove("hidden");
      document.getElementById("conf-img-deposito").src = imgPreviewDeposito.src;
    } else {
      boxConfDep.classList.add("hidden");
    }

    modalConfirmacao.classList.remove("hidden");
  }

  if (btnCancelarConf)
    btnCancelarConf.addEventListener("click", () =>
      modalConfirmacao.classList.add("hidden")
    );

  // Clique no botão "ENVIAR RELATÓRIO" (Validação)
  if (btnEnviar) {
    btnEnviar.addEventListener("click", function (e) {
      e.preventDefault();

      if (!nomeInput.value.trim() || !rgInput.value.trim())
        return mostrarAlerta("Preencha Nome e RG.", "error");
      if (!arquivoPreso || !arquivoMochila)
        return mostrarAlerta("Fotos obrigatórias faltando.", "error");

      var isPrimario = checkPrimario.checked;
      var isReincidente = selectedCrimes.some((c) => c.artigo === "161");
      if (!isPrimario && !isReincidente)
        return mostrarAlerta("Selecione Primário ou Reincidente.", "error");
      if (isPrimario && isReincidente)
        return mostrarAlerta("Réu não pode ser os dois!", "error");

      abrirModalConfirmacao();
    });
  }

  // Clique no botão "CONFIRMAR E ENVIAR" (Dentro do Modal)
  if (btnConfirmarEnvio) {
    btnConfirmarEnvio.addEventListener("click", function () {
      btnConfirmarEnvio.disabled = true;
      btnConfirmarEnvio.textContent = "ENVIANDO...";

      // Função interna de compressão
      function comprimir(file, cb) {
        var reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = function (e) {
          var img = new Image();
          img.src = e.target.result;
          img.onload = function () {
            var cvs = document.createElement("canvas");
            var ctx = cvs.getContext("2d");
            var scale = 1;
            if (img.width > 1280) scale = 1280 / img.width;
            cvs.width = img.width * scale;
            cvs.height = img.height * scale;
            ctx.drawImage(img, 0, 0, cvs.width, cvs.height);
            cvs.toBlob(cb, "image/jpeg", 0.7);
          };
        };
      }

      comprimir(arquivoPreso, function (presoBlob) {
        comprimir(arquivoMochila, function (mochilaBlob) {
          var finalizar = function (depositoBlob) {
            var formData = new FormData();
            formData.append("file1", presoBlob, "preso.jpg");
            formData.append("file2", mochilaBlob, "mochila.jpg");
            if (depositoBlob)
              formData.append("file3", depositoBlob, "deposito.jpg");

            var pagou = false;
            for (var i = 0; i < radiosFianca.length; i++)
              if (radiosFianca[i].checked && radiosFianca[i].value === "sim")
                pagou = true;

            var parts = "";
            participantesSelecionados.forEach((p) => (parts += `<@${p.id}> `));

            var officerId = userIdHidden.value;
            if (officerId && officerId.includes("http")) officerId = ""; // Proteção Link

            var crimesText = selectedCrimes
              .map(
                (c) =>
                  c.nome.replace(/\*\*/g, "") +
                  (c.infiancavel ? " **(INF)**" : "")
              )
              .join("\n");
            var penaStr = penaTotalEl.textContent;
            var multaStr = multaTotalEl.textContent;
            var oficialNome = userNameSpan.textContent;

            // Criação do JSON
            var embeds = [
              {
                title: pagou
                  ? "💰 RELATÓRIO DE FIANÇA"
                  : "🚔 RELATÓRIO DE PRISÃO",
                color: pagou ? 3066993 : 15158332,
                image: { url: "attachment://preso.jpg" },
                fields: [
                  {
                    name: "👮 OFICIAL",
                    value:
                      oficialNome + (officerId ? ` (<@${officerId}>)` : ""),
                    inline: false,
                  },
                  {
                    name: "👥 PARTICIPANTES",
                    value: parts || "Nenhum",
                    inline: false,
                  },
                  {
                    name: "👤 PRESO",
                    value: `**Nome:** ${nomeInput.value}\n**RG:** ${rgInput.value}`,
                    inline: true,
                  },
                  {
                    name: "⚖️ SENTENÇA",
                    value: `**Pena:** ${penaStr}\n**Multa:** ${multaStr}`,
                    inline: true,
                  },
                  {
                    name: "🛡️ ADVOGADO",
                    value: advogadoInput.value || "Nenhum",
                    inline: true,
                  },
                  {
                    name: "📜 CRIMES",
                    value: "```\n" + (crimesText || "Nenhum") + "\n```",
                  },
                ],
                footer: {
                  text:
                    "Sistema Policial • " + new Date().toLocaleString("pt-BR"),
                },
              },
              {
                title: "📦 INVENTÁRIO",
                color: pagou ? 3066993 : 15158332,
                image: { url: "attachment://mochila.jpg" },
              },
            ];

            if (depositoBlob) {
              embeds.push({
                title: "💸 COMPROVANTE",
                color: 3066993,
                image: { url: "attachment://deposito.jpg" },
              });
            }

            var mentionString = officerId ? `<@${officerId}> ` : "";
            mentionString += parts;

            var payload = {
              content: "|| " + mentionString + " ||",
              embeds: embeds,
              allowed_mentions: { parse: ["users"] },
            };

            formData.append("payload_json", JSON.stringify(payload));

            fetch("/api/enviar?tipo=" + (pagou ? "fianca" : "prisao"), {
              method: "POST",
              body: formData,
            })
              .then((res) => {
                if (res.ok) {
                  mostrarAlerta("Relatório Enviado!", "success");
                  setTimeout(() => location.reload(), 2000);
                } else {
                  throw new Error("Erro status " + res.status);
                }
              })
              .catch((err) => {
                console.error(err);
                mostrarAlerta("Erro ao enviar.", "error");
                btnConfirmarEnvio.disabled = false;
                btnConfirmarEnvio.textContent = "CONFIRMAR E ENVIAR";
              });
          };

          if (arquivoDeposito) comprimir(arquivoDeposito, finalizar);
          else finalizar(null);
        });
      });
    });
  }
}); // Fim do DOMContentLoaded
