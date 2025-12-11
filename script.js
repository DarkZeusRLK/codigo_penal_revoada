document.addEventListener("DOMContentLoaded", function () {
  // --- MÚSICA DE FUNDO ---
  var bgMusic = document.getElementById("bg-music");
  var btnMusic = document.getElementById("btn-music-toggle");

  if (bgMusic) {
    bgMusic.volume = 0.1; // Volume 10% (tranquilo)
  }

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
  // --- CONFIGURAÇÃO ---
  var PORCENTAGEM_MULTA_SUJO = 0.5;
  var PENA_MAXIMA_SERVER = 150;
  var WEBHOOK_URL_FIXA =
    "https://discord.com/api/webhooks/1448692300266868767/xfqk-pLh49481dceQHNg2W9VwWfVuvMIcHdKfaDa1QGwlzfHDePExBMIwuFWRZUUo1EY";

  // --- CARREGAR OFICIAIS AUTOMATICAMENTE ---
  var selectOficial = document.getElementById("select-oficial");
  var LISTA_OFICIAIS = []; // Começa vazia

  // Função para buscar da API
  async function carregarOficiaisDiscord() {
    if (!selectOficial) return;

    // Coloca um "Carregando..." enquanto busca
    selectOficial.innerHTML = '<option value="">Carregando lista...</option>';

    try {
      const response = await fetch("/api/membros"); // Chama o nosso arquivo api/membros.js
      if (!response.ok) throw new Error("Erro na API");

      LISTA_OFICIAIS = await response.json();

      // Limpa e popula o select
      selectOficial.innerHTML =
        '<option value="">Selecione um oficial...</option>';

      LISTA_OFICIAIS.forEach((oficial) => {
        var option = document.createElement("option");
        option.value = oficial.id;
        option.textContent = oficial.nome;
        selectOficial.appendChild(option);
      });
    } catch (error) {
      console.error("Erro ao carregar oficiais:", error);
      selectOficial.innerHTML =
        '<option value="">Erro ao carregar lista</option>';
      // Fallback: Se der erro, você pode deixar uma lista manual de emergência aqui se quiser
    }
  }

  // Chama a função assim que o site carrega
  carregarOficiaisDiscord();

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

  // --- ARMAZENAMENTO DE ARQUIVOS (PASTE + INPUT) ---
  // Vamos guardar o objeto File real aqui, vindo do input ou do paste
  var arquivoPreso = null;
  var arquivoMochila = null;

  // SELETORES DE UPLOAD
  var boxPreso = document.getElementById("box-upload-preso");
  var inputPreso = document.getElementById("upload-preso");
  var imgPreviewPreso = document.getElementById("img-preview-preso");

  var boxMochila = document.getElementById("box-upload-mochila");
  var inputMochila = document.getElementById("upload-mochila");
  var imgPreviewMochila = document.getElementById("img-preview-mochila");

  // VARIÁVEL PARA SABER ONDE COLAR
  var activeUploadBox = null; // 'preso' ou 'mochila'

  // --- LOGIN ---
  var loginScreen = document.getElementById("login-screen");
  var btnLoginSimulado = document.getElementById("btn-login-simulado");
  var appContent = document.getElementById("app-content");
  var userNameSpan = document.getElementById("user-name");
  var userAvatarImg = document.getElementById("user-avatar");
  var userIdHidden = document.getElementById("user-id-hidden");

  function doLogin(username, avatarUrl, userId) {
    loginScreen.style.display = "none";
    appContent.classList.remove("hidden");
    userNameSpan.textContent = username;
    userIdHidden.value = userId;
    if (avatarUrl) {
      userAvatarImg.src = avatarUrl;
      userAvatarImg.classList.remove("hidden");
    }
  }

  if (btnLoginSimulado)
    btnLoginSimulado.addEventListener("click", function () {
      doLogin("Oficial. Padrao", "Imagens/image.png", "0000000000");
    });

  var fragment = new URLSearchParams(window.location.hash.slice(1));
  var accessToken = fragment.get("access_token");
  if (accessToken) {
    fetch("https://discord.com/api/users/@me", {
      headers: { authorization: `Bearer ${accessToken}` },
    })
      .then((result) => result.json())
      .then((response) => {
        var avatar = `https://cdn.discordapp.com/avatars/${response.id}/${response.avatar}.png`;
        doLogin(response.username, avatar, response.id);
        history.pushState(
          "",
          document.title,
          window.location.pathname + window.location.search
        );
      })
      .catch(console.error);
  }

  // --- LÓGICA DE UPLOAD UNIFICADA (INPUT + PASTE) ---

  // 1. Função genérica para atualizar a preview e salvar o arquivo na variavel
  function setFile(type, file) {
    var reader = new FileReader();
    reader.onload = function (e) {
      if (type === "preso") {
        arquivoPreso = file;
        imgPreviewPreso.src = e.target.result;
        imgPreviewPreso.classList.remove("hidden");
      } else {
        arquivoMochila = file;
        imgPreviewMochila.src = e.target.result;
        imgPreviewMochila.classList.remove("hidden");
      }
    };
    reader.readAsDataURL(file);
  }

  // 2. Listeners para Input File (Clique tradicional)
  inputPreso.addEventListener("change", function () {
    if (this.files[0]) setFile("preso", this.files[0]);
  });
  inputMochila.addEventListener("change", function () {
    if (this.files[0]) setFile("mochila", this.files[0]);
  });

  // 3. Listeners para Foco (Saber onde colar)
  boxPreso.addEventListener("click", function () {
    activeUploadBox = "preso";
    boxPreso.classList.add("active-box");
    boxMochila.classList.remove("active-box");
  });
  boxPreso.addEventListener("focus", function () {
    activeUploadBox = "preso";
    boxPreso.classList.add("active-box");
    boxMochila.classList.remove("active-box");
  });

  boxMochila.addEventListener("click", function () {
    activeUploadBox = "mochila";
    boxMochila.classList.add("active-box");
    boxPreso.classList.remove("active-box");
  });
  boxMochila.addEventListener("focus", function () {
    activeUploadBox = "mochila";
    boxMochila.classList.add("active-box");
    boxPreso.classList.remove("active-box");
  });

  // 4. Listener Global de PASTE
  document.addEventListener("paste", function (e) {
    if (!activeUploadBox) return; // Se não clicou em nenhuma caixa, ignora

    if (e.clipboardData && e.clipboardData.items) {
      var items = e.clipboardData.items;
      for (var i = 0; i < items.length; i++) {
        if (items[i].type.indexOf("image") !== -1) {
          var blob = items[i].getAsFile();
          // Envia para a caixa que está ativa no momento
          setFile(activeUploadBox, blob);
          mostrarAlerta(
            "Imagem colada em: " +
              (activeUploadBox === "preso" ? "Foto Preso" : "Inventário"),
            "success"
          );
          e.preventDefault();
          break;
        }
      }
    }
  });

  // --- SELEÇÃO DE PARTICIPANTES ---
  var selectOficial = document.getElementById("select-oficial");
  var btnAddPart = document.getElementById("btn-add-participante");
  var listaParticipantesVisual = document.getElementById(
    "lista-participantes-visual"
  );
  var participantesSelecionados = [];

  if (selectOficial) {
    LISTA_OFICIAIS.forEach((oficial) => {
      var option = document.createElement("option");
      option.value = oficial.id;
      option.textContent = oficial.nome;
      selectOficial.appendChild(option);
    });
  }

  if (btnAddPart) {
    btnAddPart.addEventListener("click", function () {
      var idSelecionado = selectOficial.value;
      var nomeSelecionado =
        selectOficial.options[selectOficial.selectedIndex].text;
      if (!idSelecionado) return;
      if (participantesSelecionados.some((p) => p.id === idSelecionado)) {
        alert("Oficial já adicionado.");
        return;
      }

      participantesSelecionados.push({
        id: idSelecionado,
        nome: nomeSelecionado,
      });
      var tag = document.createElement("div");
      tag.className = "officer-tag";
      tag.innerHTML = `<span>${nomeSelecionado}</span> <button onclick="removerParticipante('${idSelecionado}', this)">×</button>`;
      listaParticipantesVisual.appendChild(tag);
      selectOficial.value = "";
    });
  }

  window.removerParticipante = function (id, btnElement) {
    participantesSelecionados = participantesSelecionados.filter(
      (p) => p.id !== id
    );
    btnElement.parentElement.remove();
  };

  // --- RESTO DA LÓGICA (Cálculos, Seletores) ---
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
      if (checkboxes[k].checked)
        totalDiscountPercent += parseFloat(checkboxes[k].dataset.percent);
    }

    var descontoDecimal = Math.abs(totalDiscountPercent) / 100;
    var totalPenaFinal = Math.max(0, penaBaseCalculo * (1 - descontoDecimal));

    var hpReduction = 0;
    if (
      hpSimBtn &&
      hpSimBtn.checked &&
      inputHpMinutos &&
      !isNaN(parseInt(inputHpMinutos.value))
    ) {
      hpReduction = parseInt(inputHpMinutos.value);
    }
    totalPenaFinal = Math.max(0, totalPenaFinal - hpReduction);

    var fianca = 0;
    if (!isInfiancavel) fianca = totalMulta;

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

  if (inputDinheiroSujo)
    inputDinheiroSujo.addEventListener("input", function (e) {
      var val = e.target.value
        .replace(/\D/g, "")
        .replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1.");
      e.target.value = val;
      calculateSentence();
    });

  for (var c = 0; c < checkboxes.length; c++)
    checkboxes[c].addEventListener("change", calculateSentence);

  if (btnLimpar)
    btnLimpar.addEventListener("click", function () {
      if (confirm("Tem certeza?")) {
        selectedCrimes = [];
        participantesSelecionados = [];
        listaParticipantesVisual.innerHTML = "";
        arquivoPreso = null;
        arquivoMochila = null;

        document
          .querySelectorAll(".crime-item.selected")
          .forEach((el) => el.classList.remove("selected"));
        checkboxes.forEach((cb) => (cb.checked = false));
        nomeInput.value = "";
        rgInput.value = "";
        advogadoInput.value = "";
        itensApreendidosInput.value = "";

        if (containerDinheiroSujo)
          containerDinheiroSujo.classList.add("hidden");
        if (inputDinheiroSujo) inputDinheiroSujo.value = "";
        hpNaoBtn.checked = true;
        document.getElementById("porte-nao").checked = true;
        containerHpMinutos.classList.add("hidden");
        inputHpMinutos.value = "";

        inputPreso.value = "";
        imgPreviewPreso.classList.add("hidden");
        imgPreviewPreso.src = "";
        inputMochila.value = "";
        imgPreviewMochila.classList.add("hidden");
        imgPreviewMochila.src = "";
        boxPreso.classList.remove("active-box");
        boxMochila.classList.remove("active-box");

        calculateSentence();
      }
    });

  if (btnEnviar) {
    btnEnviar.addEventListener("click", function (e) {
      e.preventDefault();
      var webhookURL = webhookInput ? webhookInput.value.trim() : "";
      if (!webhookURL) {
        mostrarAlerta("Configure a URL do Webhook!", "error");
        return;
      }
      if (nomeInput.value.trim() === "") {
        mostrarAlerta("Preencha o Nome.", "error");
        return;
      }
      if (rgInput.value.trim() === "") {
        mostrarAlerta("Preencha o RG.", "error");
        return;
      }

      // Verifica se temos os arquivos nas variaveis (seja por paste ou input)
      if (!arquivoPreso) {
        mostrarAlerta("Falta a foto do PRESO.", "error");
        return;
      }
      if (!arquivoMochila) {
        mostrarAlerta("Falta a foto do INVENTÁRIO.", "error");
        return;
      }

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
      var officerId = userIdHidden.value || "000000";

      var participantesStr = "";
      participantesSelecionados.forEach((p) => {
        participantesStr += "<@" + p.id + "> ";
      });
      if (participantesStr === "") participantesStr = ".";

      var qraContent = "**QRA:** <@" + officerId + "> " + participantesStr;
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
      if (hpSimBtn && hpSimBtn.checked && inputHpMinutos.value)
        atenuantesText +=
          "🔹 Reanimado no HP (-" + inputHpMinutos.value + "m)\n";
      if (atenuantesText === "") atenuantesText = "Nenhum.";

      var porteTexto = "Não";
      for (var p = 0; p < radiosPorte.length; p++) {
        if (radiosPorte[p].checked && radiosPorte[p].value === "sim")
          porteTexto = "Sim";
      }

      var formData = new FormData();
      formData.append("file1", arquivoPreso, "preso.png");
      formData.append("file2", arquivoMochila, "mochila.png");

      var embeds = [
        {
          title: "📑 RELATÓRIO DE PRISÃO - REVOADA RJ",
          color: 3447003,
          image: { url: "attachment://preso.png" },
          fields: [
            { name: "👮 OFICIAL RESPONSÁVEL", value: oficial, inline: false },
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
          title: "📦 FOTO DO INVENTÁRIO",
          color: 3447003,
          image: { url: "attachment://mochila.png" },
          footer: {
            text:
              "Sistema Policial Revoada • " +
              new Date().toLocaleString("pt-BR"),
          },
        },
      ];

      formData.append(
        "payload_json",
        JSON.stringify({ content: qraContent, embeds: embeds })
      );

      fetch(webhookURL, { method: "POST", body: formData })
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
