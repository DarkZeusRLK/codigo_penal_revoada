document.addEventListener("DOMContentLoaded", function () {
  // --- 1. CONFIGURAÇÕES ---
  var PORCENTAGEM_MULTA_SUJO = 0.5; // 50%
  var PENA_MAXIMA_SERVER = 150; // Teto de 150 meses

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
  var crimeItems = document.querySelectorAll(".crime-item");
  var checkboxes = document.querySelectorAll(
    '.atenuantes input[type="checkbox"]'
  );

  var btnLimpar = document.getElementById("btn-limpar");
  var btnCopiar = document.getElementById("btn-copiar");

  var nomeInput = document.getElementById("nome");
  var rgInput = document.getElementById("rg");
  var advogadoInput = document.getElementById("advogado");
  var checkboxAdvogado = document.getElementById("atenuante-advogado");
  var itensApreendidosInput = document.querySelector(
    ".itens-apreendidos textarea"
  );

  // SELETORES ESPECÍFICOS
  var hpSimBtn = document.getElementById("hp-sim");
  var hpNaoBtn = document.getElementById("hp-nao");
  var containerHpMinutos = document.getElementById("container-hp-minutos");
  var inputHpMinutos = document.getElementById("hp-minutos");
  var radiosPorte = document.getElementsByName("porte-arma");

  var containerDinheiroSujo = document.getElementById(
    "container-dinheiro-sujo"
  );
  var inputDinheiroSujo = document.getElementById("input-dinheiro-sujo");

  // OUTPUTS
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

  // --- 3. FUNÇÃO DE ALERTA ---
  function mostrarAlerta(mensagem, tipo) {
    if (!tipo) tipo = "error";
    var div = document.createElement("div");
    div.className = "custom-alert " + tipo;

    var icone =
      tipo === "success" ? "fa-circle-check" : "fa-triangle-exclamation";
    var titulo = tipo === "success" ? "SUCESSO" : "ATENÇÃO";

    div.innerHTML =
      '<i class="fa-solid ' +
      icone +
      '"></i>' +
      '<div class="alert-content">' +
      '<span class="alert-title">' +
      titulo +
      "</span>" +
      '<span class="alert-msg">' +
      mensagem +
      "</span>" +
      "</div>";

    document.body.appendChild(div);
    setTimeout(function () {
      if (div.parentNode) div.parentNode.removeChild(div);
    }, 4000);
  }

  // --- 4. LÓGICA DO INPUT HP (DIRETA) ---
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

  // --- 5. LÓGICA DE CÁLCULO ---
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

    // TRAVA PENA EM 150 ANTES DE DESCONTAR
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
    // Converter % (ex: -20) para fator decimal (ex: 0.20)
    var descontoDecimal = Math.abs(totalDiscountPercent) / 100;
    var totalPenaFinal = Math.max(0, penaBaseCalculo * (1 - descontoDecimal));

    var hpReduction = 0;
    var hpMarcado = false;
    if (hpSimBtn && hpSimBtn.checked) hpMarcado = true;

    if (hpMarcado && inputHpMinutos) {
      var val = parseInt(inputHpMinutos.value);
      if (!isNaN(val)) {
        hpReduction = val;
      }
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

  // --- 6. ATUALIZAR LISTA VISUAL ---
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
        "</span>" +
        '<button data-index="' +
        index +
        '" title="Remover"><i class="fa-solid fa-xmark"></i></button>';

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

  // --- 7. EVENTOS GERAIS ---
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
      if (confirm("Tem certeza que deseja limpar todos os dados?")) {
        selectedCrimes = [];
        var selectedItens = document.querySelectorAll(".crime-item.selected");
        for (var s = 0; s < selectedItens.length; s++) {
          selectedItens[s].classList.remove("selected");
        }
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

        calculateSentence();
      }
    });
  }

  // --- 8. GERAR RELATÓRIO ---
  if (btnCopiar) {
    btnCopiar.addEventListener("click", function (e) {
      e.preventDefault(); // EVITA RECARREGAR A PÁGINA

      if (nomeInput && nomeInput.value.trim() === "") {
        mostrarAlerta("Preencha o NOME do preso.", "error");
        nomeInput.focus();
        return;
      }
      if (rgInput && rgInput.value.trim() === "") {
        mostrarAlerta("Preencha o RG do preso.", "error");
        rgInput.focus();
        return;
      }

      if (
        checkboxAdvogado &&
        checkboxAdvogado.checked &&
        advogadoInput &&
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

      var nome = nomeInput.value;
      var rg = rgInput.value;
      var advogado = advogadoInput.value || "Nenhum";
      var penaStr = penaTotalEl ? penaTotalEl.textContent : "0 meses";
      var multaStr = multaTotalEl ? multaTotalEl.textContent : "R$0";
      var itens = itensApreendidosInput
        ? itensApreendidosInput.value || "Nenhum item apreendido"
        : "Nenhum item apreendido";
      var valorSujo =
        inputDinheiroSujo && !containerDinheiroSujo.classList.contains("hidden")
          ? inputDinheiroSujo.value
          : null;

      var now = new Date();
      var dataHora =
        now.toLocaleDateString("pt-BR") +
        " - " +
        now.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

      var porteTexto = "Não";
      for (var p = 0; p < radiosPorte.length; p++) {
        if (radiosPorte[p].checked && radiosPorte[p].value === "sim")
          porteTexto = "Sim";
      }
      var hpSim = hpSimBtn && hpSimBtn.checked;

      var totalDiscountPercent = 0;
      for (var cb = 0; cb < checkboxes.length; cb++) {
        if (checkboxes[cb].checked)
          totalDiscountPercent += parseFloat(checkboxes[cb].dataset.percent);
      }
      var penaFinalPercent = 100 + totalDiscountPercent;
      var multaPercent = 100;

      var crimesText = "";
      if (selectedCrimes.length === 0) {
        crimesText = "Nenhum crime aplicado.";
      } else {
        var arr = selectedCrimes.map(function (c) {
          var inf = c.infiancavel ? "**" : "";
          var cleanName = c.nome.replace(/\*\*/g, "").trim();
          if (!cleanName.startsWith("Art.")) {
            cleanName = "Art. " + c.artigo + " - " + cleanName;
          }
          return cleanName + inf;
        });
        crimesText = arr.join("\n");
      }

      var atenuantesText = "";
      for (var cb = 0; cb < checkboxes.length; cb++) {
        if (checkboxes[cb].checked) {
          var lbl = document
            .querySelector('label[for="' + checkboxes[cb].id + '"]')
            .textContent.trim();
          var parts = lbl.split("(");
          var name = parts[0].trim();
          var percent = parts[1]
            ? parts[1].replace(")", "").replace("-", "")
            : "";
          atenuantesText +=
            "* 🔹 " + name + ": Redução de " + percent + " na pena total.\n";
        }
      }
      if (hpSim && inputHpMinutos && inputHpMinutos.value > 0) {
        atenuantesText +=
          "* 🔹 Reanimado no HP: Redução de " +
          inputHpMinutos.value +
          " minutos.\n";
      }
      if (atenuantesText === "") atenuantesText = "Nenhum atenuante aplicado.";

      var sujoLine = valorSujo ? "\n**DINHEIRO SUJO:** R$ " + valorSujo : "";

      var relatorio =
        "QRA:\n" +
        "```md\n" +
        "# INFORMAÇÕES DO PRESO:\n" +
        "* NOME: " +
        nome +
        "\n" +
        "* RG: " +
        rg +
        "\n" +
        (advogado !== "Nenhum" ? "* ADVOGADO: " + advogado + "\n" : "") +
        "\n" +
        "# PENA TOTAL: " +
        penaStr +
        " (" +
        penaFinalPercent +
        "%)\n" +
        "# MULTA: " +
        multaStr +
        " (" +
        multaPercent +
        "%)\n" +
        "\n" +
        "# CRIMES:\n" +
        crimesText +
        "\n" +
        "\n" +
        "# ITENS APREENDIDOS\n" +
        itens +
        "\n" +
        sujoLine +
        "\n" +
        "\n" +
        "# ATENUANTES:\n" +
        atenuantesText +
        "\n" +
        "\n" +
        "# 📋 PORTE DE ARMA: " +
        porteTexto +
        "\n" +
        "# 🏥 REANIMADO NO HP: " +
        (hpSim ? "Sim" : "Não") +
        "\n" +
        "* DATA: " +
        dataHora +
        "\n" +
        "```";

      navigator.clipboard
        .writeText(relatorio)
        .then(function () {
          mostrarAlerta("Relatório copiado (formato MD)!", "success");
        })
        .catch(function (err) {
          console.error(err);
          mostrarAlerta("Erro ao copiar.", "error");
        });
    });
  }

  // Inicializa
  calculateSentence();
});
