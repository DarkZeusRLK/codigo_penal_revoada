document.addEventListener("DOMContentLoaded", function () {
  // =========================================================
  // 1. SISTEMA DE SEGURANÇA (EVITA TELA PRETA)
  // =========================================================
  var loginScreen = document.getElementById("login-screen");
  var appContent = document.getElementById("app-content");

  function mostrarApp() {
    if (loginScreen) loginScreen.classList.add("hidden");
    if (appContent) {
      appContent.classList.remove("hidden");
      appContent.style.display = "block"; // Força CSS
    }
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

  // --- Watchdog: Se em 1 segundo nada aparecer, força o login ---
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
  // 2. SISTEMA DE SESSÃO
  // =========================================================
  const SESSION_KEY = "policia_session_v2"; // Mudamos a chave para resetar cache antigo
  const SESSION_DURATION = 7 * 24 * 60 * 60 * 1000;

  var userNameSpan = document.getElementById("user-name");
  var userIdHidden = document.getElementById("user-id-hidden");
  var userAvatarImg = document.getElementById("user-avatar");

  function salvarSessao(nome, avatar, id) {
    const dados = { nome, avatar, id, timestamp: new Date().getTime() };
    localStorage.setItem(SESSION_KEY, JSON.stringify(dados));
  }

  function verificarSessao() {
    // Se estiver voltando do Discord, não usa cache ainda
    if (window.location.hash.includes("access_token")) return;

    const dadosSalvos = localStorage.getItem(SESSION_KEY);
    if (!dadosSalvos) return;

    try {
      const sessao = JSON.parse(dadosSalvos);
      if (new Date().getTime() - sessao.timestamp > SESSION_DURATION) {
        localStorage.removeItem(SESSION_KEY);
        return;
      }

      // Preenche dados
      if (userNameSpan) userNameSpan.textContent = sessao.nome;
      if (userIdHidden) userIdHidden.value = sessao.id;
      if (userAvatarImg && sessao.avatar) {
        userAvatarImg.src = sessao.avatar;
        userAvatarImg.classList.remove("hidden");
      }

      console.log("Sessão válida encontrada.");
      mostrarApp(); // Entra direto
    } catch (e) {
      console.error(e);
      localStorage.removeItem(SESSION_KEY);
    }
  }

  // Executa verificação inicial
  verificarSessao();

  // =========================================================
  // 3. LOGIN DISCORD (OAuth2)
  // =========================================================
  var fragment = new URLSearchParams(window.location.hash.slice(1));
  var accessToken = fragment.get("access_token");
  var tokenType = fragment.get("token_type");

  if (accessToken) {
    // Limpa URL
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

          // Salva e Loga
          salvarSessao(nome, avatar, data.id);

          if (userNameSpan) userNameSpan.textContent = nome;
          if (userIdHidden) userIdHidden.value = data.id;
          if (userAvatarImg) userAvatarImg.src = avatar;

          mostrarApp();
        } else {
          alert("Erro ao obter dados do Discord.");
          mostrarLogin();
        }
      })
      .catch((err) => {
        console.error(err);
        alert("Erro de conexão com Discord.");
        mostrarLogin();
      });
  }

  // =========================================================
  // 4. LÓGICA DA CALCULADORA
  // =========================================================

  // Variáveis Globais de Cálculo
  var selectedCrimes = [];
  var crimeItems = document.querySelectorAll(".crime-item");
  var checkboxes = document.querySelectorAll(
    '.atenuantes input[type="checkbox"]'
  );
  var inputHpMinutos = document.getElementById("hp-minutos");
  var hpSimBtn = document.getElementById("hp-sim");
  var hpNaoBtn = document.getElementById("hp-nao");
  var inputDinheiroSujo = document.getElementById("input-dinheiro-sujo");

  // Elementos de Exibição
  var penaTotalEl = document.getElementById("pena-total");
  var multaTotalEl = document.getElementById("multa-total");
  var crimesListOutput = document.getElementById("crimes-list-output");
  var containerDinheiroSujo = document.getElementById(
    "container-dinheiro-sujo"
  );
  var containerHp = document.getElementById("container-hp-minutos");

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
      inputDinheiroSujo.value &&
      !containerDinheiroSujo.classList.contains("hidden")
    ) {
      var sujo = parseFloat(inputDinheiroSujo.value.replace(/\./g, "")) || 0;
      totalMulta += sujo * 0.5; // 50%
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

    // Teto 180
    if (penaFinal > 180) {
      penaFinal = 180;
      document.getElementById("alerta-pena-maxima").classList.remove("hidden");
    } else {
      document.getElementById("alerta-pena-maxima").classList.add("hidden");
    }

    // Renderiza
    penaTotalEl.textContent = Math.round(penaFinal) + " meses";
    multaTotalEl.textContent = "R$" + totalMulta.toLocaleString("pt-BR");

    // Controle Fiança
    var radioFiancaSim = document.getElementById("fianca-sim");
    var radioFiancaNao = document.getElementById("fianca-nao");
    var boxDeposito = document.getElementById("box-upload-deposito");
    var fiancaOutput = document.getElementById("fianca-output");

    if (isInfiancavel) {
      fiancaOutput.value = "INAFIANÇÁVEL";
      radioFiancaSim.disabled = true;
      radioFiancaNao.checked = true;
      boxDeposito.classList.add("hidden");
    } else {
      fiancaOutput.value = "R$ " + totalMulta.toLocaleString("pt-BR");
      radioFiancaSim.disabled = false;
      if (radioFiancaSim.checked) boxDeposito.classList.remove("hidden");
      else boxDeposito.classList.add("hidden");
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

  // Funcao Global para remover crime
  window.removerCrime = function (idx) {
    var c = selectedCrimes[idx];
    selectedCrimes.splice(idx, 1);
    // Remove visual selected class
    var item = document.querySelector(`.crime-item[data-artigo="${c.artigo}"]`);
    if (item) item.classList.remove("selected");

    if (c.artigo === "137") {
      containerDinheiroSujo.classList.add("hidden");
      inputDinheiroSujo.value = "";
    }
    calculateSentence();
  };

  // Listeners de Crimes
  crimeItems.forEach((item) => {
    item.addEventListener("click", function () {
      var artigo = this.dataset.artigo;
      // Se já existe, remove
      if (selectedCrimes.some((c) => c.artigo === artigo)) {
        var idx = selectedCrimes.findIndex((c) => c.artigo === artigo);
        window.removerCrime(idx);
      } else {
        // Adiciona
        var nome = this.querySelector(".crime-name").textContent;
        var pena = parseInt(this.dataset.pena);
        var multa = parseInt(this.dataset.multa);
        var infiancavel = this.dataset.infiancavel === "true";

        selectedCrimes.push({ artigo, nome, pena, multa, infiancavel });
        this.classList.add("selected");

        if (artigo === "137") containerDinheiroSujo.classList.remove("hidden");
        calculateSentence();
      }
    });
  });

  // Listeners Inputs
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
  if (inputDinheiroSujo)
    inputDinheiroSujo.addEventListener("input", calculateSentence);

  var radioFiancaSim = document.getElementById("fianca-sim");
  var radioFiancaNao = document.getElementById("fianca-nao");
  if (radioFiancaSim) {
    radioFiancaSim.addEventListener("change", calculateSentence);
    radioFiancaNao.addEventListener("change", calculateSentence);
  }

  // =========================================================
  // 5. UPLOADS E PREVIEW
  // =========================================================
  var boxPreso = document.getElementById("box-upload-preso");
  var inputPreso = document.getElementById("upload-preso");
  var imgPreviewPreso = document.getElementById("img-preview-preso");
  // (Repetir lógica para mochila e deposito se necessário, vou simplificar com função genérica)

  function setupUpload(boxId, inputId, imgId) {
    var box = document.getElementById(boxId);
    var input = document.getElementById(inputId);
    var img = document.getElementById(imgId);

    if (!box || !input) return;

    box.addEventListener("click", () => input.click());
    input.addEventListener("change", function () {
      if (this.files && this.files[0]) {
        var reader = new FileReader();
        reader.onload = (e) => {
          img.src = e.target.result;
          img.classList.remove("hidden");
        };
        reader.readAsDataURL(this.files[0]);
      }
    });
  }

  setupUpload("box-upload-preso", "upload-preso", "img-preview-preso");
  setupUpload("box-upload-mochila", "upload-mochila", "img-preview-mochila");
  setupUpload("box-upload-deposito", "upload-deposito", "img-preview-deposito");

  // =========================================================
  // 6. MODAL E ENVIO
  // =========================================================
  var btnEnviar = document.getElementById("btn-enviar");
  var modalConf = document.getElementById("modal-confirmacao");
  var btnCancelar = document.getElementById("btn-cancelar-conf");
  var btnConfirmar = document.getElementById("btn-confirmar-envio");

  if (btnEnviar) {
    btnEnviar.addEventListener("click", function () {
      // Validações básicas
      var nome = document.getElementById("nome").value;
      if (!nome) {
        alert("Preencha o nome do preso!");
        return;
      }

      // Abre modal
      document.getElementById("conf-preso").textContent = nome;
      document.getElementById("conf-sentenca").textContent =
        penaTotalEl.textContent;
      document.getElementById("conf-multa").textContent =
        multaTotalEl.textContent;

      // Copia imagens para modal
      var imgP = document.getElementById("img-preview-preso");
      if (imgP.src) document.getElementById("conf-img-preso").src = imgP.src;

      modalConf.classList.remove("hidden");
    });
  }

  if (btnCancelar)
    btnCancelar.addEventListener("click", () =>
      modalConf.classList.add("hidden")
    );

  if (btnConfirmar) {
    btnConfirmar.addEventListener("click", function () {
      btnConfirmar.textContent = "ENVIANDO...";
      btnConfirmar.disabled = true;

      // Simulação de envio (Adapte para seu fetch real)
      setTimeout(() => {
        alert("Relatório Enviado (Simulação)");
        location.reload();
      }, 1500);
    });
  }
});
