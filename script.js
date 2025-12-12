document.addEventListener("DOMContentLoaded", function () {
  // --- MUSICA ---
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

  // --- CONFIG ---
  var PORCENTAGEM_MULTA_SUJO = 0.5;
  var PENA_MAXIMA_SERVER = 180;

  // LISTA DE ARTIGOS QUE EXIGEM ITENS APREENDIDOS (Adicionei Disparo, Porte, Trafico conforme seu pedido)
  // Verifique se os números dos artigos no HTML batem com esses
  var ARTIGOS_COM_ITENS = [
    "121",
    "122",
    "123",
    "124",
    "125",
    "126", // Posses e Traficos
    "127", // Disparo
    "128",
    "129", // Municoes
    "130", // Coletes
    "131", // Porte Arma Branca
    "132",
    "133",
    "134",
    "135",
    "136", // Drogas e aviao
  ];

  // --- CARREGAR OFICIAIS ---
  var selectOficial = document.getElementById("select-oficial");
  var LISTA_OFICIAIS = [];
  async function carregarOficiaisDiscord() {
    if (!selectOficial) return;
    selectOficial.innerHTML = '<option value="">Carregando lista...</option>';
    try {
      const response = await fetch("/api/membros");
      if (!response.ok) throw new Error("Erro API");
      LISTA_OFICIAIS = await response.json();
      selectOficial.innerHTML =
        '<option value="">Selecione um oficial...</option>';
      LISTA_OFICIAIS.forEach((oficial) => {
        var option = document.createElement("option");
        option.value = oficial.id;
        option.textContent = oficial.nome;
        selectOficial.appendChild(option);
      });
    } catch (error) {
      console.error(error);
      selectOficial.innerHTML = '<option value="">Erro ao carregar</option>';
    }
  }
  carregarOficiaisDiscord();

  // --- SELETORES ---
  var crimeItems = document.querySelectorAll(".crime-item");
  var checkboxes = document.querySelectorAll(
    '.atenuantes input[type="checkbox"]'
  );
  var btnLimpar = document.getElementById("btn-limpar");
  var btnEnviar = document.getElementById("btn-enviar");

  var nomeInput = document.getElementById("nome");
  var rgInput = document.getElementById("rg");
  var advogadoInput = document.getElementById("advogado");
  var checkboxAdvogado = document.getElementById("atenuante-advogado");
  var itensApreendidosInput = document.querySelector(
    ".itens-apreendidos textarea"
  );

  // Uploads
  var boxPreso = document.getElementById("box-upload-preso");
  var inputPreso = document.getElementById("upload-preso");
  var imgPreviewPreso = document.getElementById("img-preview-preso");
  var boxMochila = document.getElementById("box-upload-mochila");
  var inputMochila = document.getElementById("upload-mochila");
  var imgPreviewMochila = document.getElementById("img-preview-mochila");
  var arquivoPreso = null;
  var arquivoMochila = null;
  var activeUploadBox = null;

  // Participantes
  var btnAddPart = document.getElementById("btn-add-participante");
  var listaParticipantesVisual = document.getElementById(
    "lista-participantes-visual"
  );
  var participantesSelecionados = [];

  // Login
  var loginScreen = document.getElementById("login-screen");
  var btnLoginSimulado = document.getElementById("btn-login-simulado");
  var appContent = document.getElementById("app-content");
  var userNameSpan = document.getElementById("user-name");
  var userAvatarImg = document.getElementById("user-avatar");
  var userIdHidden = document.getElementById("user-id-hidden");

  // Calculo
  var hpSimBtn = document.getElementById("hp-sim");
  var hpNaoBtn = document.getElementById("hp-nao");
  var containerHpMinutos = document.getElementById("container-hp-minutos");
  var inputHpMinutos = document.getElementById("hp-minutos");
  var radiosPorte = document.getElementsByName("porte-arma");
  var radiosFianca = document.getElementsByName("pagou-fianca");
  var radioFiancaSim = document.getElementById("fianca-sim");
  var radioFiancaNao = document.getElementById("fianca-nao");

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

  // --- FUNCOES ---
  function doLogin(username, avatarUrl, userId) {
    loginScreen.style.display = "none";
    appContent.classList.remove("hidden");
    userNameSpan.textContent = username;
    userIdHidden.value = userId;
    if (avatarUrl) {
      userAvatarImg.src = avatarUrl;
      userAvatarImg.classList.remove("hidden");
    }
    if (bgMusic) bgMusic.play().catch((e) => console.log("Autoplay block"));
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

  // Upload Logic
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
  inputPreso.addEventListener("change", function () {
    if (this.files[0]) setFile("preso", this.files[0]);
  });
  inputMochila.addEventListener("change", function () {
    if (this.files[0]) setFile("mochila", this.files[0]);
  });
  boxPreso.addEventListener("click", function () {
    activeUploadBox = "preso";
    boxPreso.classList.add("active-box");
    boxMochila.classList.remove("active-box");
  });
  boxMochila.addEventListener("click", function () {
    activeUploadBox = "mochila";
    boxMochila.classList.add("active-box");
    boxPreso.classList.remove("active-box");
  });
  document.addEventListener("paste", function (e) {
    if (!activeUploadBox) return;
    if (e.clipboardData && e.clipboardData.items) {
      for (var i = 0; i < e.clipboardData.items.length; i++) {
        if (e.clipboardData.items[i].type.indexOf("image") !== -1) {
          setFile(activeUploadBox, e.clipboardData.items[i].getAsFile());
          mostrarAlerta("Imagem colada!", "success");
          e.preventDefault();
          break;
        }
      }
    }
  });

  // Participantes
  if (btnAddPart) {
    btnAddPart.addEventListener("click", function () {
      var id = selectOficial.value;
      var nome = selectOficial.options[selectOficial.selectedIndex].text;
      if (!id) return;
      if (participantesSelecionados.some((p) => p.id === id)) {
        alert("Já adicionado.");
        return;
      }
      participantesSelecionados.push({ id: id, nome: nome });
      var tag = document.createElement("div");
      tag.className = "officer-tag";
      tag.innerHTML = `<span>${nome}</span> <button onclick="removerParticipante('${id}', this)">×</button>`;
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

  // --- CALCULO E LOGICA PRINCIPAL ---
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
    var isInafiancavelTotal = false;

    for (var i = 0; i < selectedCrimes.length; i++) {
      totalPenaRaw += selectedCrimes[i].pena;
      totalMulta += selectedCrimes[i].multa;
      if (selectedCrimes[i].infiancavel) isInafiancavelTotal = true;
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

    // --- LOGICA INAFIANCAVEL ---
    if (isInafiancavelTotal) {
      if (fiancaOutputEl) fiancaOutputEl.value = "INAFIANÇÁVEL";

      // Bloqueia e força "Não"
      if (radioFiancaSim) {
        radioFiancaSim.disabled = true;
        radioFiancaSim.checked = false;
      }
      if (radioFiancaNao) {
        radioFiancaNao.checked = true;
      }
    } else {
      if (fiancaOutputEl)
        fiancaOutputEl.value = "R$ " + totalMulta.toLocaleString("pt-BR");

      // Libera
      if (radioFiancaSim) radioFiancaSim.disabled = false;
    }

    // Calcula breakdown se não for inafiancavel e tiver advogado
    if (
      !isInafiancavelTotal &&
      checkboxAdvogado &&
      checkboxAdvogado.checked &&
      totalMulta > 0
    ) {
      if (fiancaBreakdown) fiancaBreakdown.classList.remove("hidden");
      var partePolicial = totalMulta * 0.35;
      var partePainel = totalMulta * 0.35;
      var parteAdvogado = totalMulta * 0.3;
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
      var nome = el.querySelector(".crime-name").innerText.trim();
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
        location.reload(); // Maneira mais limpa de resetar tudo
      }
    });

  // --- ENVIO SEGURO PARA API ---
  if (btnEnviar) {
    btnEnviar.addEventListener("click", function (e) {
      e.preventDefault();

      // Verifica itens apreendidos obrigatórios
      var temCrimeDeItem = false;
      for (var x = 0; x < selectedCrimes.length; x++) {
        if (ARTIGOS_COM_ITENS.includes(selectedCrimes[x].artigo)) {
          temCrimeDeItem = true;
          break;
        }
      }
      if (temCrimeDeItem && itensApreendidosInput.value.trim() === "") {
        mostrarAlerta(
          "É obrigatório listar os ITENS APREENDIDOS para os crimes selecionados!",
          "error"
        );
        itensApreendidosInput.focus();
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
      if (!arquivoPreso) {
        mostrarAlerta("Falta a foto do PRESO.", "error");
        return;
      }
      if (!arquivoMochila) {
        mostrarAlerta("Falta a foto do INVENTÁRIO.", "error");
        return;
      }

      // Decide URL da API (Fianca ou Prisao)
      var pagouFianca = false;
      for (var i = 0; i < radiosFianca.length; i++) {
        if (radiosFianca[i].checked && radiosFianca[i].value === "sim")
          pagouFianca = true;
      }

      // Monta dados
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
      if (participantesStr === "") participantesStr = "Nenhum adicional.";

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

      var embedColor = pagouFianca ? 3066993 : 3447003;
      var embedTitle = pagouFianca
        ? "💰 RELATÓRIO DE FIANÇA"
        : "🚔 RELATÓRIO DE PRISÃO";

      var embeds = [
        {
          title: embedTitle,
          color: embedColor,
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
                valorSujo +
                "\n**Fiança Paga:** " +
                (pagouFianca ? "SIM" : "NÃO"),
            },
          ],
        },
        {
          title: "📦 FOTO DO INVENTÁRIO",
          color: embedColor,
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

      // ENVIA PARA A API PROXY DA VERCEL (O link do discord nao aparece aqui)
      // Passamos o tipo via Query Param
      var apiEndpoint =
        "/api/enviar.js?tipo=" + (pagouFianca ? "fianca" : "prisao");

      fetch(apiEndpoint, { method: "POST", body: formData })
        .then((response) => {
          if (response.ok)
            mostrarAlerta("Relatório enviado com sucesso!", "success");
          else
            mostrarAlerta(
              "Erro ao enviar. Verifique a configuração na Vercel.",
              "error"
            );
        })
        .catch((err) => {
          console.error(err);
          mostrarAlerta("Erro de conexão.", "error");
        });
    });
  }

  calculateSentence();
});
