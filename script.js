document.addEventListener("DOMContentLoaded", function () {
  // --- MÚSICA ---
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

  // --- CONFIGURAÇÕES ---
  var PORCENTAGEM_MULTA_SUJO = 0.5;
  var PENA_MAXIMA_SERVER = 180;

  var ARTIGOS_COM_ITENS = [
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
  ];

  // GRUPOS DE CRIMES MUTUAMENTE EXCLUSIVOS
  var GRUPOS_CONFLITO = [
    // Grupo Drogas (Só pode 1)
    ["132", "133", "135"],
    // Grupo Munições (Só pode 1)
    ["128", "129"],
  ];

  // --- CARREGAR OFICIAIS ---
  var searchInputCheck = document.getElementById("search-oficial");
  var LISTA_OFICIAIS = [];

  async function carregarOficiaisDiscord() {
    if (!searchInputCheck) return;
    try {
      const response = await fetch("/api/membros");
      if (response.ok) {
        LISTA_OFICIAIS = await response.json();
        console.log(
          "Lista carregada com sucesso. Total: " + LISTA_OFICIAIS.length
        );
      }
    } catch (error) {
      console.error("Erro ao buscar oficiais:", error);
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

  var checkPrimario = document.getElementById("atenuante-primario");
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
  var boxDeposito = document.getElementById("box-upload-deposito");
  var inputDeposito = document.getElementById("upload-deposito");
  var imgPreviewDeposito = document.getElementById("img-preview-deposito");
  var arquivoPreso = null;
  var arquivoMochila = null;
  var arquivoDeposito = null;
  var activeUploadBox = null;

  // Pesquisa
  var searchInput = document.getElementById("search-oficial");
  var dropdownResults = document.getElementById("dropdown-oficiais");
  var selectedOficialIdInput = document.getElementById("selected-oficial-id");
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
  var containerFiancaRadio = document.getElementById("container-radio-fianca");

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
  var isCrimeInafiancavelGlobal = false;

  // --- FUNCOES ---
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
    carregarOficiaisDiscord();
  }

  if (btnLoginSimulado)
    btnLoginSimulado.addEventListener("click", function () {
      doLogin("Oficial. Padrao", "Imagens/image.png", "0000000000");
    });

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
          history.pushState("", document.title, window.location.pathname);
        } else {
          mostrarAlerta(data.error || "Acesso negado.", "error");
          if (h2Login) h2Login.innerText = "ACESSO NEGADO";
        }
      })
      .catch((err) => {
        console.error(err);
        mostrarAlerta("Erro de conexão.", "error");
      });
  }

  if (containerFiancaRadio) {
    containerFiancaRadio.addEventListener(
      "click",
      function (e) {
        if (isCrimeInafiancavelGlobal) {
          mostrarAlerta("⚠️ HÁ CRIMES INAFIANÇÁVEIS SELECIONADOS!", "error");
          radioFiancaNao.checked = true;
          radioFiancaSim.checked = false;
          checkFiancaState();
        }
      },
      true
    );
  }

  // --- AUTOCOMPLETE ---
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
    document.addEventListener("click", function (e) {
      if (e.target !== searchInput && e.target !== dropdownResults)
        dropdownResults.classList.add("hidden");
    });
  }
  if (btnAddPart) {
    btnAddPart.addEventListener("click", function () {
      var id = selectedOficialIdInput.value;
      var nome = searchInput.value;
      var myId = userIdHidden.value;

      if (!id || !nome) {
        mostrarAlerta("Pesquise e selecione um oficial na lista.", "error");
        return;
      }
      if (id === myId) {
        mostrarAlerta(
          "Você não pode se adicionar. Você já é o relator!",
          "error"
        );
        searchInput.value = "";
        selectedOficialIdInput.value = "";
        return;
      }
      var jaExiste = participantesSelecionados.some((p) => p.id === id);
      if (jaExiste) {
        mostrarAlerta("Este oficial já foi adicionado.", "error");
        searchInput.value = "";
        selectedOficialIdInput.value = "";
        return;
      }
      participantesSelecionados.push({ id: id, nome: nome });
      var tag = document.createElement("div");
      tag.className = "officer-tag";
      tag.innerHTML = `<span>${nome}</span> <button onclick="removerParticipante('${id}', this)">×</button>`;
      listaParticipantesVisual.appendChild(tag);
      searchInput.value = "";
      selectedOficialIdInput.value = "";
    });
  }
  window.removerParticipante = function (id, btnElement) {
    participantesSelecionados = participantesSelecionados.filter(
      (p) => p.id !== id
    );
    btnElement.parentElement.remove();
  };

  // --- UPLOAD LOGIC ---
  function comprimirImagem(file, callback) {
    var reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = function (event) {
      var img = new Image();
      img.src = event.target.result;
      img.onload = function () {
        var canvas = document.createElement("canvas");
        var ctx = canvas.getContext("2d");
        var maxWidth = 1280;
        var scale = 1;
        if (img.width > maxWidth) scale = maxWidth / img.width;
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        canvas.toBlob(
          function (blob) {
            callback(blob);
          },
          "image/jpeg",
          0.7
        );
      };
    };
  }
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
  inputPreso.addEventListener("change", function () {
    if (this.files[0]) setFile("preso", this.files[0]);
  });
  inputMochila.addEventListener("change", function () {
    if (this.files[0]) setFile("mochila", this.files[0]);
  });
  inputDeposito.addEventListener("change", function () {
    if (this.files[0]) setFile("deposito", this.files[0]);
  });

  boxPreso.addEventListener("click", function () {
    activeUploadBox = "preso";
    boxPreso.classList.add("active-box");
    boxMochila.classList.remove("active-box");
    boxDeposito.classList.remove("active-box");
  });
  boxMochila.addEventListener("click", function () {
    activeUploadBox = "mochila";
    boxMochila.classList.add("active-box");
    boxPreso.classList.remove("active-box");
    boxDeposito.classList.remove("active-box");
  });
  boxDeposito.addEventListener("click", function () {
    activeUploadBox = "deposito";
    boxDeposito.classList.add("active-box");
    boxPreso.classList.remove("active-box");
    boxMochila.classList.remove("active-box");
  });

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
          e.preventDefault();
          break;
        }
      }
    }
  });

  function checkFiancaState() {
    if (radioFiancaSim.checked) {
      boxDeposito.classList.remove("hidden");
    } else {
      boxDeposito.classList.add("hidden");
      arquivoDeposito = null;
      imgPreviewDeposito.src = "";
      imgPreviewDeposito.classList.add("hidden");
    }
  }
  if (radioFiancaSim && radioFiancaNao) {
    radioFiancaSim.addEventListener("change", checkFiancaState);
    radioFiancaNao.addEventListener("change", checkFiancaState);
  }

  // --- SELEÇÃO DE CRIMES ---
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

      var idDoloso = "105";
      var idCulposo = "107";
      var idQualificado = "104";
      var idCulposoTransito = "108";
      var grupoHomicidios = [
        idDoloso,
        idCulposo,
        idQualificado,
        idCulposoTransito,
      ];

      if (grupoHomicidios.includes(artigo)) {
        var conflitoHomicidio = selectedCrimes.find((c) =>
          grupoHomicidios.includes(c.artigo)
        );
        if (conflitoHomicidio) {
          mostrarAlerta(
            `Incoerência: Você já marcou "${conflitoHomicidio.nome}".`,
            "error"
          );
          return;
        }
      }
      if (existeIndex === -1) {
        if (artigo === "161" && checkPrimario.checked) {
          mostrarAlerta(
            "Incoerência: Desmarque 'Réu Primário' antes de adicionar 'Réu Reincidente'!",
            "error"
          );
          return;
        }
        if (artigo === "123") {
          var temPorte = selectedCrimes.some(
            (c) => c.artigo === "125" || c.artigo === "126"
          );
          if (temPorte) {
            mostrarAlerta(
              "Incoerência: O Tráfico de Armas engloba o Porte.",
              "error"
            );
            return;
          }
        }
        if (artigo === "125" || artigo === "126") {
          var temTraficoArmas = selectedCrimes.some((c) => c.artigo === "123");
          if (temTraficoArmas) {
            mostrarAlerta("Incoerência: Já marcou Tráfico de Armas.", "error");
            return;
          }
        }
        var grupoDoCrime = GRUPOS_CONFLITO.find((grupo) =>
          grupo.includes(artigo)
        );
        if (grupoDoCrime) {
          var conflito = selectedCrimes.find((c) =>
            grupoDoCrime.includes(c.artigo)
          );
          if (conflito) {
            mostrarAlerta(
              `Incoerência: Você já selecionou "${conflito.nome}".`,
              "error"
            );
            return;
          }
        }

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

  // --- CHECKBOX EVENT ---
  for (var c = 0; c < checkboxes.length; c++) {
    checkboxes[c].addEventListener("change", function () {
      if (this.id === "atenuante-primario" && this.checked) {
        var temReincidente = selectedCrimes.some((c) => c.artigo === "161");
        if (temReincidente) {
          mostrarAlerta(
            "Incoerência: Remova o crime 'Réu Reincidente' antes de marcar 'Réu Primário'!",
            "error"
          );
          this.checked = false;
          return;
        }
      }
      calculateSentence();
    });
  }

  // --- CALCULO ---
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
  if (inputDinheiroSujo)
    inputDinheiroSujo.addEventListener("input", function (e) {
      var val = e.target.value
        .replace(/\D/g, "")
        .replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1.");
      e.target.value = val;
      calculateSentence();
    });

  // --- CORREÇÃO 1: Lógica de Cálculo Ajustada (Soma -> Desconto -> Teto) ---
  function calculateSentence() {
    var totalPenaRaw = 0;
    var totalMulta = 0;
    isCrimeInafiancavelGlobal = false;

    // 1. Soma Bruta
    for (var i = 0; i < selectedCrimes.length; i++) {
      totalPenaRaw += selectedCrimes[i].pena;
      totalMulta += selectedCrimes[i].multa;
      if (selectedCrimes[i].infiancavel) isCrimeInafiancavelGlobal = true;
    }

    // 2. Dinheiro Sujo
    var valorSujo = 0;
    if (
      inputDinheiroSujo &&
      !containerDinheiroSujo.classList.contains("hidden")
    ) {
      var valorSujoString = inputDinheiroSujo.value.replace(/\./g, "");
      valorSujo = parseFloat(valorSujoString) || 0;
      totalMulta += valorSujo * PORCENTAGEM_MULTA_SUJO;
    }

    // 3. Aplica Descontos (Atenuantes)
    var totalDiscountPercent = 0;
    for (var k = 0; k < checkboxes.length; k++) {
      if (checkboxes[k].checked)
        totalDiscountPercent += parseFloat(checkboxes[k].dataset.percent);
    }
    var descontoDecimal = Math.abs(totalDiscountPercent) / 100;

    // Pena com desconto, mas SEM TETO ainda
    var totalPenaFinal = Math.max(0, totalPenaRaw * (1 - descontoDecimal));

    // 4. Redução HP
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

    // 5. Aplica Teto Máximo (180) NO FINAL
    if (totalPenaFinal > PENA_MAXIMA_SERVER) {
      totalPenaFinal = PENA_MAXIMA_SERVER;
      if (alertaPenaMaxima) alertaPenaMaxima.classList.remove("hidden");
    } else {
      if (alertaPenaMaxima) alertaPenaMaxima.classList.add("hidden");
    }

    // Interface Fiança
    if (isCrimeInafiancavelGlobal) {
      if (fiancaOutputEl) fiancaOutputEl.value = "INAFIANÇÁVEL";
      radioFiancaSim.disabled = true;
      radioFiancaSim.checked = false;
      radioFiancaNao.checked = true;
      checkFiancaState();
    } else {
      if (fiancaOutputEl)
        fiancaOutputEl.value = "R$ " + totalMulta.toLocaleString("pt-BR");
      radioFiancaSim.disabled = false;
    }

    // Interface Advogado
    if (
      !isCrimeInafiancavelGlobal &&
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

  if (btnLimpar)
    btnLimpar.addEventListener("click", function () {
      if (confirm("Tem certeza?")) {
        location.reload();
      }
    });

  // --- ENVIO ---
  if (btnEnviar) {
    btnEnviar.addEventListener("click", function (e) {
      e.preventDefault();

      var isPrimario = checkPrimario.checked;
      var isReincidente = selectedCrimes.some((c) => c.artigo === "161");

      if (isPrimario && isReincidente) {
        mostrarAlerta(
          "ERRO: O réu não pode ser Primário e Reincidente ao mesmo tempo!",
          "error"
        );
        return;
      }
      if (!isPrimario && !isReincidente) {
        mostrarAlerta(
          "OBRIGATÓRIO: Selecione se o réu é Primário ou adicione o crime de Reincidente (Art. 161).",
          "error"
        );
        return;
      }

      var temCrimeDeItem = false;
      for (var x = 0; x < selectedCrimes.length; x++) {
        if (ARTIGOS_COM_ITENS.includes(selectedCrimes[x].artigo)) {
          temCrimeDeItem = true;
          break;
        }
      }
      if (temCrimeDeItem && itensApreendidosInput.value.trim() === "") {
        mostrarAlerta("É obrigatório listar os ITENS APREENDIDOS!", "error");
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

      var pagouFianca = false;
      for (var i = 0; i < radiosFianca.length; i++) {
        if (radiosFianca[i].checked && radiosFianca[i].value === "sim")
          pagouFianca = true;
      }
      if (pagouFianca && !arquivoDeposito) {
        mostrarAlerta(
          "Se pagou fiança, a foto do COMPROVANTE é obrigatória!",
          "error"
        );
        return;
      }

      btnEnviar.disabled = true;
      btnEnviar.textContent = "ENVIANDO...";

      comprimirImagem(arquivoPreso, function (presoBlob) {
        comprimirImagem(arquivoMochila, function (mochilaBlob) {
          // Função interna para finalizar após imagens
          var finalizarEnvio = function (depositoBlob) {
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

            // Este conteúdo será usado fora do embed para pingar o bot
            var qraContent =
              "**QRA:** <@" + officerId + "> " + participantesStr;

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
            formData.append("file1", presoBlob, "preso.jpg");
            formData.append("file2", mochilaBlob, "mochila.jpg");
            if (depositoBlob)
              formData.append("file3", depositoBlob, "deposito.jpg");

            var embedColor = pagouFianca ? 3066993 : 3447003;
            var embedTitle = pagouFianca
              ? "💰 RELATÓRIO DE FIANÇA"
              : "🚔 RELATÓRIO DE PRISÃO";

            var embeds = [
              {
                title: embedTitle,
                color: embedColor,
                image: { url: "attachment://preso.jpg" },
                fields: [
                  {
                    name: "👮 OFICIAL RESPONSÁVEL",
                    value: oficial,
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
                      valorSujo +
                      "\n**Fiança Paga:** " +
                      (pagouFianca ? "SIM" : "NÃO"),
                  },
                ],
              },
              {
                title: "📦 FOTO DO INVENTÁRIO",
                color: embedColor,
                image: { url: "attachment://mochila.jpg" },
              },
            ];

            // --- CORREÇÃO 2: Webhook com Menção no Content ---
            var payload = {
              content: qraContent, // <--- Isso garante que a menção <@ID> funcione
              embeds: embeds,
              allowed_mentions: { parse: ["users"] }, // Permite que o bot leia como user mention
            };

            formData.append("payload_json", JSON.stringify(payload));

            fetch("/api/webhook", {
              method: "POST",
              body: formData,
            })
              .then(function (response) {
                if (response.ok) {
                  mostrarAlerta("Relatório enviado com sucesso!", "success");
                  setTimeout(function () {
                    location.reload();
                  }, 2000);
                } else {
                  mostrarAlerta("Erro ao enviar relatório.", "error");
                  btnEnviar.disabled = false;
                  btnEnviar.textContent = "ENVIAR RELATÓRIO";
                }
              })
              .catch(function (error) {
                console.error(error);
                mostrarAlerta("Erro de conexão.", "error");
                btnEnviar.disabled = false;
                btnEnviar.textContent = "ENVIAR RELATÓRIO";
              });
          }; // Fim finalizarEnvio

          // Lógica para processar imagem 3 (se houver) e chamar finalizarEnvio
          if (arquivoDeposito) {
            comprimirImagem(arquivoDeposito, function (depositoBlob) {
              finalizarEnvio(depositoBlob);
            });
          } else {
            finalizarEnvio(null);
          }
        }); // Fim mochila
      }); // Fim preso
    }); // Fim click listener
  }
}); // Fim DOMContentLoaded
