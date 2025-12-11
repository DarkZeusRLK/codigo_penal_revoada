document.addEventListener("DOMContentLoaded", function () {
  // --- 1. CONFIGURAÇÕES ---
  var PORCENTAGEM_MULTA_SUJO = 0.5; // 50%
  var PENA_MAXIMA_SERVER = 150;

  // COLOQUE SEU WEBHOOK AQUI PARA NÃO PRECISAR COLAR TODA VEZ
  var WEBHOOK_URL_FIXA = "";

  var ARTIGOS_COM_ITENS = [
    "121",
    "122",
    "123",
    "124",
    "125",
    "126",
    "128",
    "129",
    "130",
    "131",
    "132",
    "133",
    "134",
    "135",
    "136",
  ];

  // --- 2. SELETORES GERAIS ---
  var loginScreen = document.getElementById("login-screen");
  var btnLoginSimulado = document.getElementById("btn-login-simulado");
  var appContent = document.getElementById("app-content");
  var userNameSpan = document.getElementById("user-name");
  var userAvatarImg = document.getElementById("user-avatar");

  // --- LÓGICA DE LOGIN (CORRIGIDA) ---

  // Função que libera a tela
  function liberarAcesso(username, avatarUrl) {
    if (loginScreen) loginScreen.style.display = "none";
    if (appContent) appContent.classList.remove("hidden");

    if (userNameSpan) userNameSpan.textContent = username;
    if (avatarUrl && userAvatarImg) {
      userAvatarImg.src = avatarUrl;
      userAvatarImg.classList.remove("hidden");
    }
  }

  // 1. Verifica se o usuário voltou do Discord com o Token na URL
  // O Discord retorna algo como: site.com/#access_token=...
  var urlHash = window.location.hash;
  if (urlHash.includes("access_token")) {
    // Extrai o token da URL
    var params = new URLSearchParams(urlHash.substring(1));
    var accessToken = params.get("access_token");

    if (accessToken) {
      // Busca os dados do usuário no Discord
      fetch("https://discord.com/api/users/@me", {
        headers: { authorization: `Bearer ${accessToken}` },
      })
        .then((result) => result.json())
        .then((response) => {
          // Monta a URL do Avatar
          var avatar = null;
          if (response.avatar) {
            avatar = `https://cdn.discordapp.com/avatars/${response.id}/${response.avatar}.png`;
          }
          // Libera o acesso
          liberarAcesso(response.username, avatar);

          // (Opcional) Limpa a URL para não ficar aquele monte de código
          history.pushState(
            "",
            document.title,
            window.location.pathname + window.location.search
          );
        })
        .catch((err) => {
          console.error("Erro ao pegar dados do Discord:", err);
          alert("Erro ao validar login. Tente novamente.");
        });
    }
  }

  // 2. Botão de Login Simulado (Para testes sem Discord)
  if (btnLoginSimulado) {
    btnLoginSimulado.addEventListener("click", function () {
      liberarAcesso("Oficial. Padrao", "Imagens/image.png");
    });
  }

  // --- RESTANTE DO CÓDIGO DA CALCULADORA ---

  var crimeItems = document.querySelectorAll(".crime-item");
  var checkboxes = document.querySelectorAll(
    '.atenuantes input[type="checkbox"]'
  );

  var btnLimpar = document.getElementById("btn-limpar");
  var btnEnviar = document.getElementById("btn-enviar"); // Botão de Enviar Webhook

  var webhookInput = document.getElementById("webhook-url");
  if (WEBHOOK_URL_FIXA && webhookInput) webhookInput.value = WEBHOOK_URL_FIXA;

  var nomeInput = document.getElementById("nome");
  var rgInput = document.getElementById("rg");
  var advogadoInput = document.getElementById("advogado");
  var checkboxAdvogado = document.getElementById("atenuante-advogado");
  var itensApreendidosInput = document.querySelector(
    ".itens-apreendidos textarea"
  );

  // UPLOAD DE FOTO (Arquivo local)
  var fileInput = document.getElementById("preso-foto-upload"); // Input type="file" que criamos no HTML anterior
  var fileNameDisplay = document.getElementById("file-name-display");

  // PARTICIPANTES
  var btnAddPart = document.getElementById("btn-add-participante");
  var partContainer = document.getElementById("participantes-container");

  // DINAMICOS
  var hpSimBtn = document.getElementById("hp-sim");
  var hpNaoBtn = document.getElementById("hp-nao");
  var containerHpMinutos = document.getElementById("container-hp-minutos");
  var inputHpMinutos = document.getElementById("hp-minutos");
  var radiosPorte = document.getElementsByName("porte-arma");

  var containerDinheiroSujo = document.getElementById(
    "container-dinheiro-sujo"
  );
  var inputDinheiroSujo = document.getElementById("input-dinheiro-sujo");

  var crimesListOutput = document.getElementById("crimes-list-output");
  var penaTotalEl = document.getElementById("pena-total");
  var multaTotalEl = document.getElementById("multa-total");
  var fiancaOutputEl = document.getElementById("fianca-output");
  var alertaPenaMaxima = document.getElementById("alerta-pena-maxima");

  var fiancaBreakdown = document.getElementById("fianca-breakdown");
  var valPolicial = document.getElementById("valor-policial");
  var valPainel = document.getElementById("valor-painel");
  var valAdvogado = document.getElementById("valor-advogado");

  var selectedCrimes = [];

  // --- FUNÇÃO ALERTA ---
  function mostrarAlerta(mensagem, tipo) {
    if (!tipo) tipo = "error";
    var div = document.createElement("div");
    div.className = "custom-alert " + tipo;
    var icone =
      tipo === "success" ? "fa-circle-check" : "fa-triangle-exclamation";
    var titulo = tipo === "success" ? "SUCESSO" : "ATENÇÃO";
    div.innerHTML = `<i class="fa-solid ${icone}"></i><div class="alert-content"><span class="alert-title">${titulo}</span><span class="alert-msg">${mensagem}</span></div>`;
    document.body.appendChild(div);
    setTimeout(function () {
      if (div.parentNode) div.parentNode.removeChild(div);
    }, 4000);
  }

  // --- LOGICA PARTICIPANTES ---
  if (btnAddPart) {
    btnAddPart.addEventListener("click", function () {
      var div = document.createElement("div");
      div.className = "participante-row";
      div.innerHTML = `
            <input type="text" placeholder="ID do Oficial" class="part-id" style="width: 150px;">
            <button class="btn-remove-part"><i class="fa-solid fa-minus"></i></button>
          `;
      partContainer.appendChild(div);

      div
        .querySelector(".btn-remove-part")
        .addEventListener("click", function () {
          div.remove();
        });
    });
  }

  // --- LOGICA UPLOAD FOTO (Visualização do nome) ---
  // No HTML anterior, eu sugeri usar <input type="file" id="preso-foto-upload">
  // Se você ainda não tem esse input no HTML, o JS não vai achar, mas não vai quebrar.
  if (fileInput) {
    fileInput.addEventListener("change", function () {
      if (this.files && this.files[0]) {
        if (fileNameDisplay)
          fileNameDisplay.textContent =
            "Imagem selecionada: " + this.files[0].name;
      } else {
        if (fileNameDisplay) fileNameDisplay.textContent = "";
      }
    });
  }

  // --- LÓGICA HP ---
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
  if (hpSimBtn && hpNaoBtn) {
    hpSimBtn.addEventListener("change", toggleHpInput);
    hpNaoBtn.addEventListener("change", toggleHpInput);
  }
  if (inputHpMinutos) {
    inputHpMinutos.addEventListener("input", calculateSentence);
    inputHpMinutos.addEventListener("keyup", calculateSentence);
  }

  // --- CÁLCULO ---
  function calculateSentence() {
    var totalPenaRaw = 0;
    var totalMulta = 0;

    for (var i = 0; i < selectedCrimes.length; i++) {
      totalPenaRaw += selectedCrimes[i].pena;
      totalMulta += selectedCrimes[i].multa;
    }

    var valorSujo = 0;
    if (
      inputDinheiroSujo &&
      containerDinheiroSujo &&
      !containerDinheiroSujo.classList.contains("hidden")
    ) {
      var valorSujoString = inputDinheiroSujo.value.replace(/\./g, "");
      valorSujo = parseFloat(valorSujoString) || 0;
      totalMulta += valorSujo * PORCENTAGEM_MULTA_SUJO;
    }

    var penaBaseCalculo = totalPenaRaw;
    if (penaBaseCalculo > PENA_MAXIMA_SERVER) {
      penaBaseCalculo = PENA_MAXIMA_SERVER;
      if (alertaPenaMaxima) alertaPenaMaxima.classList.remove("hidden");
    } else {
      if (alertaPenaMaxima) alertaPenaMaxima.classList.add("hidden");
    }

    var totalDiscountPercent = 0;
    var isInfiancavel = false;
    for (var j = 0; j < selectedCrimes.length; j++) {
      if (selectedCrimes[j].infiancavel) isInfiancavel = true;
    }
    for (var k = 0; k < checkboxes.length; k++) {
      if (checkboxes[k].checked) {
        totalDiscountPercent += parseFloat(checkboxes[k].dataset.percent);
      }
    }

    var descontoDecimal = Math.abs(totalDiscountPercent) / 100;
    var totalPenaFinal = Math.max(0, penaBaseCalculo * (1 - descontoDecimal));

    var hpReduction = 0;
    var hpMarcado = hpSimBtn && hpSimBtn.checked;
    if (hpMarcado && inputHpMinutos) {
      var val = parseInt(inputHpMinutos.value);
      if (!isNaN(val)) hpReduction = val;
    }
    totalPenaFinal = Math.max(0, totalPenaFinal - hpReduction);

    var fianca = 0;
    if (!isInfiancavel) {
      fianca = totalMulta;
    }

    if (checkboxAdvogado && checkboxAdvogado.checked && fianca > 0) {
      if (fiancaBreakdown) fiancaBreakdown.classList.remove("hidden");
      var partePolicial = fianca * 0.35;
      var partePainel = fianca * 0.35;
      var parteAdvogado = fianca * 0.3;
      if (valPolicial)
        valPolicial.textContent =
          "R$ " +
          partePolicial.toLocaleString("pt-BR", { maximumFractionDigits: 0 });
      if (valPainel)
        valPainel.textContent =
          "R$ " +
          partePainel.toLocaleString("pt-BR", { maximumFractionDigits: 0 });
      if (valAdvogado)
        valAdvogado.textContent =
          "R$ " +
          parteAdvogado.toLocaleString("pt-BR", { maximumFractionDigits: 0 });
    } else {
      if (fiancaBreakdown) fiancaBreakdown.classList.add("hidden");
    }

    if (penaTotalEl)
      penaTotalEl.textContent = Math.round(totalPenaFinal) + " meses";
    if (multaTotalEl)
      multaTotalEl.textContent = "R$" + totalMulta.toLocaleString("pt-BR");
    if (fiancaOutputEl)
      fiancaOutputEl.value = "R$ " + fianca.toLocaleString("pt-BR");

    updateCrimesOutput();
  }

  function updateCrimesOutput() {
    if (!crimesListOutput) return;
    crimesListOutput.innerHTML = "";
    if (selectedCrimes.length === 0) {
      crimesListOutput.innerHTML =
        '<div class="empty-message">Nenhum crime selecionado</div>';
      return;
    }
    selectedCrimes.forEach(function (crime, index) {
      var crimeDiv = document.createElement("div");
      crimeDiv.className = "crime-output-item";
      var isInfiancavelText = crime.infiancavel ? " (INF)" : "";
      var nomeExibicao = crime.nome.replace(/\*\*/g, "").trim();
      crimeDiv.innerHTML =
        "<span>" +
        nomeExibicao +
        isInfiancavelText +
        '</span><button data-index="' +
        index +
        '"><i class="fa-solid fa-xmark"></i></button>';
      crimesListOutput.appendChild(crimeDiv);
    });
    var removeBtns = crimesListOutput.querySelectorAll("button");
    for (var i = 0; i < removeBtns.length; i++) {
      removeBtns[i].addEventListener("click", function (e) {
        var idx = parseInt(e.currentTarget.dataset.index);
        var crimeToRemove = selectedCrimes[idx];
        if (crimeToRemove.artigo === "137" && containerDinheiroSujo) {
          containerDinheiroSujo.classList.add("hidden");
          if (inputDinheiroSujo) inputDinheiroSujo.value = "";
        }
        selectedCrimes.splice(idx, 1);
        var originalItem = document.querySelector(
          '.crime-item[data-artigo="' + crimeToRemove.artigo + '"]'
        );
        if (originalItem) originalItem.classList.remove("selected");
        calculateSentence();
      });
    }
  }

  // --- EVENTOS ---
  for (var i = 0; i < crimeItems.length; i++) {
    crimeItems[i].addEventListener("click", function () {
      var el = this;
      var artigo = el.dataset.artigo;
      var nomeElement = el.querySelector(".crime-name");
      var nome = nomeElement ? nomeElement.innerText.trim() : "";
      var pena = parseInt(el.dataset.pena);
      var multa = parseInt(el.dataset.multa);
      var infiancavel = el.dataset.infiancavel === "true";
      var existeIndex = -1;
      for (var k = 0; k < selectedCrimes.length; k++) {
        if (selectedCrimes[k].artigo === artigo) {
          existeIndex = k;
          break;
        }
      }

      if (existeIndex === -1) {
        selectedCrimes.push({
          artigo: artigo,
          nome: nome,
          pena: pena,
          multa: multa,
          infiancavel: infiancavel,
        });
        el.classList.add("selected");
        if (artigo === "137" && containerDinheiroSujo) {
          containerDinheiroSujo.classList.remove("hidden");
          if (inputDinheiroSujo) inputDinheiroSujo.focus();
        }
      } else {
        selectedCrimes.splice(existeIndex, 1);
        el.classList.remove("selected");
        if (artigo === "137" && containerDinheiroSujo) {
          containerDinheiroSujo.classList.add("hidden");
          if (inputDinheiroSujo) inputDinheiroSujo.value = "";
        }
      }
      calculateSentence();
    });
  }

  if (inputDinheiroSujo) {
    inputDinheiroSujo.addEventListener("input", function (e) {
      var val = e.target.value.replace(/\D/g, "");
      val = val.replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1.");
      e.target.value = val;
      calculateSentence();
    });
  }

  for (var c = 0; c < checkboxes.length; c++) {
    checkboxes[c].addEventListener("change", calculateSentence);
  }

  if (btnLimpar) {
    btnLimpar.addEventListener("click", function () {
      if (confirm("Tem certeza?")) {
        selectedCrimes = [];
        var selectedItens = document.querySelectorAll(".crime-item.selected");
        for (var s = 0; s < selectedItens.length; s++)
          selectedItens[s].classList.remove("selected");
        for (var cb = 0; cb < checkboxes.length; cb++)
          checkboxes[cb].checked = false;
        if (nomeInput) nomeInput.value = "";
        if (rgInput) rgInput.value = "";
        if (advogadoInput) advogadoInput.value = "";
        if (itensApreendidosInput) itensApreendidosInput.value = "";

        if (fileInput) fileInput.value = ""; // Limpa input file
        if (fileNameDisplay) fileNameDisplay.textContent = "";
        if (partContainer) partContainer.innerHTML = "";

        if (containerDinheiroSujo)
          containerDinheiroSujo.classList.add("hidden");
        if (inputDinheiroSujo) inputDinheiroSujo.value = "";
        if (hpNaoBtn) hpNaoBtn.checked = true;
        if (document.getElementById("porte-nao"))
          document.getElementById("porte-nao").checked = true;
        if (containerHpMinutos) containerHpMinutos.classList.add("hidden");
        if (inputHpMinutos) inputHpMinutos.value = "";
        calculateSentence();
      }
    });
  }

  // --- ENVIAR PARA DISCORD (COM ARQUIVO LOCAL) ---
  if (btnEnviar) {
    btnEnviar.addEventListener("click", function (e) {
      e.preventDefault();

      var webhookURL = webhookInput ? webhookInput.value.trim() : "";
      if (!webhookURL) {
        mostrarAlerta("Configure a URL do Webhook!", "error");
        if (webhookInput) webhookInput.focus();
        return;
      }

      if (nomeInput.value.trim() === "") {
        mostrarAlerta("Preencha o Nome.", "error");
        nomeInput.focus();
        return;
      }
      if (rgInput.value.trim() === "") {
        mostrarAlerta("Preencha o RG.", "error");
        rgInput.focus();
        return;
      }

      if (
        checkboxAdvogado &&
        checkboxAdvogado.checked &&
        advogadoInput.value.trim() === ""
      ) {
        mostrarAlerta("Preencha o RG do Advogado.", "error");
        advogadoInput.focus();
        return;
      }

      var possuiItem = false;
      for (var x = 0; x < selectedCrimes.length; x++) {
        if (ARTIGOS_COM_ITENS.indexOf(selectedCrimes[x].artigo) > -1) {
          possuiItem = true;
          break;
        }
      }
      if (
        possuiItem &&
        itensApreendidosInput &&
        itensApreendidosInput.value.trim() === ""
      ) {
        mostrarAlerta("Descreva os itens apreendidos.", "error");
        itensApreendidosInput.focus();
        return;
      }

      // DADOS
      var nome = nomeInput.value;
      var rg = rgInput.value;
      var advogado = advogadoInput.value || "Nenhum";
      var penaStr = penaTotalEl.textContent;
      var multaStr = multaTotalEl.textContent;
      var itens = itensApreendidosInput.value || "Nenhum item apreendido";
      var valorSujo = !containerDinheiroSujo.classList.contains("hidden")
        ? inputDinheiroSujo.value
        : "Nenhum";
      var oficial = userNameSpan.textContent;

      // PARTICIPANTES
      var participantesStr = "";
      if (partContainer) {
        var partInputs = partContainer.querySelectorAll(".part-id");
        partInputs.forEach(function (inp) {
          if (inp.value.trim() !== "") {
            participantesStr += "<@" + inp.value.trim() + "> ";
          }
        });
      }
      if (participantesStr === "") participantesStr = "Nenhum adicional.";

      var crimesText =
        selectedCrimes.length > 0
          ? selectedCrimes
              .map(function (c) {
                return (
                  c.nome.replace(/\*\*/g, "").trim() +
                  (c.infiancavel ? "**" : "")
                );
              })
              .join("\n")
          : "Nenhum crime aplicado.";

      var atenuantesText = "";
      for (var cb = 0; cb < checkboxes.length; cb++) {
        if (checkboxes[cb].checked) {
          var lbl = document
            .querySelector('label[for="' + checkboxes[cb].id + '"]')
            .textContent.trim();
          atenuantesText += "🔹 " + lbl + "\n";
        }
      }
      if (hpSimBtn && hpSimBtn.checked && inputHpMinutos.value) {
        atenuantesText +=
          "🔹 Reanimado no HP (-" + inputHpMinutos.value + "m)\n";
      }
      if (atenuantesText === "") atenuantesText = "Nenhum.";

      var porteTexto = "Não";
      for (var p = 0; p < radiosPorte.length; p++) {
        if (radiosPorte[p].checked && radiosPorte[p].value === "sim")
          porteTexto = "Sim";
      }

      // --- FORMDATA PARA ENVIAR ARQUIVO ---
      var formData = new FormData();

      var embed = {
        title: "📑 RELATÓRIO DE PRISÃO - REVOADA RJ",
        color: 3447003,
        fields: [
          { name: "👮 OFICIAL RESPONSÁVEL", value: oficial, inline: false },
          { name: "👮‍♂️ PARTICIPANTES", value: participantesStr, inline: false },
          {
            name: "👤 PRESO",
            value: "**Nome:** " + nome + "\n**RG:** " + rg,
            inline: true,
          },
          {
            name: "⚖️ SENTENÇA",
            value: "**Pena:** " + penaStr + "\n**Multa:** " + multaStr,
            inline: true,
          },
          { name: "🛡️ ADVOGADO", value: advogado, inline: true },
          { name: "📜 CRIMES", value: "```\n" + crimesText + "\n```" },
          { name: "📦 ITENS APREENDIDOS", value: itens },
          {
            name: "🔻 ATENUANTES / STATUS",
            value:
              atenuantesText +
              "\n**Porte:** " +
              porteTexto +
              "\n**Dinheiro Sujo:** " +
              valorSujo,
          },
        ],
        footer: {
          text:
            "Sistema Policial Revoada • " + new Date().toLocaleString("pt-BR"),
        },
      };

      // Se tiver arquivo selecionado, anexa
      if (fileInput && fileInput.files[0]) {
        formData.append("file", fileInput.files[0]);
        embed.image = { url: "attachment://" + fileInput.files[0].name };
      }

      formData.append("payload_json", JSON.stringify({ embeds: [embed] }));

      // ENVIA
      fetch(webhookURL, {
        method: "POST",
        body: formData,
      })
        .then((response) => {
          if (response.ok)
            mostrarAlerta("Relatório enviado para o Discord!", "success");
          else mostrarAlerta("Erro ao enviar. Verifique o Webhook.", "error");
        })
        .catch((err) => {
          console.error(err);
          mostrarAlerta("Erro de conexão.", "error");
        });
    });
  }

  // Inicializa
  calculateSentence();
});
