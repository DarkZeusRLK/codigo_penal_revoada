document.addEventListener("DOMContentLoaded", function () {
  // --- CONFIGURAÇÃO ---
  var PORCENTAGEM_MULTA_SUJO = 0.5;
  var PENA_MAXIMA_SERVER = 150;

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

  // --- SELETORES LOGIN ---
  var loginScreen = document.getElementById("login-screen");
  var btnLoginSimulado = document.getElementById("btn-login-simulado");
  var appContent = document.getElementById("app-content");
  var userNameSpan = document.getElementById("user-name");
  var userAvatarImg = document.getElementById("user-avatar");

  // --- LÓGICA LOGIN ---
  function doLogin(username, avatarUrl) {
    loginScreen.style.display = "none";
    appContent.classList.remove("hidden");
    userNameSpan.textContent = username;
    if (avatarUrl) {
      userAvatarImg.src = avatarUrl;
      userAvatarImg.classList.remove("hidden");
    }
  }

  // Login Simulado
  if (btnLoginSimulado) {
    btnLoginSimulado.addEventListener("click", function () {
      doLogin("Oficial. Padrao", "Imagens/image.png");
    });
  }

  // OAuth2 Discord
  var fragment = new URLSearchParams(window.location.hash.slice(1));
  var accessToken = fragment.get("access_token");
  if (accessToken) {
    fetch("https://discord.com/api/users/@me", {
      headers: { authorization: `Bearer ${accessToken}` },
    })
      .then((result) => result.json())
      .then((response) => {
        var avatar = `https://cdn.discordapp.com/avatars/${response.id}/${response.avatar}.png`;
        doLogin(response.username + "#" + response.discriminator, avatar);
        history.pushState(
          "",
          document.title,
          window.location.pathname + window.location.search
        );
      })
      .catch(console.error);
  }

  // --- SELETORES GERAIS ---
  var crimeItems = document.querySelectorAll(".crime-item");
  var checkboxes = document.querySelectorAll(
    '.atenuantes input[type="checkbox"]'
  );
  var btnLimpar = document.getElementById("btn-limpar");
  var btnEnviar = document.getElementById("btn-enviar");

  var webhookInput = document.getElementById("webhook-url");
  if (WEBHOOK_URL_FIXA && webhookInput) webhookInput.value = WEBHOOK_URL_FIXA;

  var nomeInput = document.getElementById("nome");
  var rgInput = document.getElementById("rg");
  var advogadoInput = document.getElementById("advogado");
  var checkboxAdvogado = document.getElementById("atenuante-advogado");
  var itensApreendidosInput = document.querySelector(
    ".itens-apreendidos textarea"
  );

  // UPLOADS
  var inputPreso = document.getElementById("upload-preso");
  var imgPreviewPreso = document.getElementById("img-preview-preso");
  var inputMochila = document.getElementById("upload-mochila");
  var imgPreviewMochila = document.getElementById("img-preview-mochila");

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

  // --- LOGICA UPLOADS E PREVIEW ---
  function handlePreview(input, imgElement) {
    if (input && input.files && input.files[0]) {
      var reader = new FileReader();
      reader.onload = function (e) {
        imgElement.src = e.target.result;
        imgElement.classList.remove("hidden");
      };
      reader.readAsDataURL(input.files[0]);
    } else {
      imgElement.src = "";
      imgElement.classList.add("hidden");
    }
  }

  if (inputPreso)
    inputPreso.addEventListener("change", function () {
      handlePreview(this, imgPreviewPreso);
    });
  if (inputMochila)
    inputMochila.addEventListener("change", function () {
      handlePreview(this, imgPreviewMochila);
    });

  // --- PARTICIPANTES ---
  if (btnAddPart) {
    btnAddPart.addEventListener("click", function () {
      var div = document.createElement("div");
      div.className = "participante-row";
      div.innerHTML = `<input type="text" placeholder="ID do Oficial" class="part-id" style="width: 150px;"><button class="btn-remove-part"><i class="fa-solid fa-minus"></i></button>`;
      partContainer.appendChild(div);
      div
        .querySelector(".btn-remove-part")
        .addEventListener("click", function () {
          div.remove();
        });
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

        if (containerDinheiroSujo)
          containerDinheiroSujo.classList.add("hidden");
        if (inputDinheiroSujo) inputDinheiroSujo.value = "";
        if (hpNaoBtn) hpNaoBtn.checked = true;
        if (document.getElementById("porte-nao"))
          document.getElementById("porte-nao").checked = true;
        if (containerHpMinutos) containerHpMinutos.classList.add("hidden");
        if (inputHpMinutos) inputHpMinutos.value = "";

        if (inputPreso) inputPreso.value = "";
        if (imgPreviewPreso) imgPreviewPreso.classList.add("hidden");
        if (inputMochila) inputMochila.value = "";
        if (imgPreviewMochila) imgPreviewMochila.classList.add("hidden");
        if (partContainer) partContainer.innerHTML = "";

        calculateSentence();
      }
    });
  }

  // --- ENVIAR PARA DISCORD (COM FORMDATA - 2 IMAGENS) ---
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

      // Validação dos Arquivos Obrigatórios
      if (!inputPreso.files[0]) {
        mostrarAlerta("Falta a foto do PRESO.", "error");
        return;
      }
      if (!inputMochila.files[0]) {
        mostrarAlerta("Falta a foto do INVENTÁRIO.", "error");
        return;
      }

      // Validação Itens
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

      // --- MONTAR FORMDATA (MULTIPART) ---
      var formData = new FormData();

      // Anexando Arquivos
      formData.append("file1", inputPreso.files[0]);
      formData.append("file2", inputMochila.files[0]);

      // Montando 2 Embeds
      var embeds = [
        {
          title: "📑 RELATÓRIO DE PRISÃO - REVOADA RJ",
          color: 3447003,
          image: { url: "attachment://" + inputPreso.files[0].name }, // Referencia a imagem 1
          fields: [
            { name: "👮 OFICIAL RESPONSÁVEL", value: oficial, inline: false },
            {
              name: "👮‍♂️ PARTICIPANTES",
              value: participantesStr,
              inline: false,
            },
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
        },
        {
          title: "📦 ITENS APREENDIDOS (INVENTÁRIO)",
          color: 3447003,
          description: itens,
          image: { url: "attachment://" + inputMochila.files[0].name }, // Referencia a imagem 2
          footer: {
            text:
              "Sistema Policial Revoada • " +
              new Date().toLocaleString("pt-BR"),
          },
        },
      ];

      formData.append("payload_json", JSON.stringify({ embeds: embeds }));

      // ENVIAR
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

  calculateSentence();
});
