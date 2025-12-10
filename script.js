document.addEventListener("DOMContentLoaded", () => {
  // --- CONFIGURAÇÃO DE VALORES ---
  const PORCENTAGEM_MULTA_SUJO = 0.5; // 50%
  const MULTIPLIER_FIANCA = 10;

  // Lista de ARTIGOS que obrigam o preenchimento dos Itens Apreendidos
  // Adicione ou remova números aqui conforme a necessidade do servidor
  const ARTIGOS_COM_ITENS = [
    "121",
    "122",
    "123",
    "124",
    "125",
    "126", // Armas e suprimentos
    "128",
    "129",
    "130",
    "131", // Munições, coletes, facas
    "132",
    "133",
    "134",
    "135",
    "136", // Drogas e itens ilegais
  ];
  // --- FIM DA CONFIGURAÇÃO ---

  // Referências aos elementos
  const crimeItems = document.querySelectorAll(".crime-item");
  const checkboxes = document.querySelectorAll(
    '.atenuantes input[type="checkbox"]'
  );
  const btnLimpar = document.getElementById("btn-limpar");
  const btnCopiar = document.getElementById("btn-copiar");

  // Inputs de Texto
  const nomeInput = document.getElementById("nome");
  const rgInput = document.getElementById("rg");
  const advogadoInput = document.getElementById("advogado");
  const checkboxAdvogado = document.getElementById("atenuante-advogado");
  const itensApreendidosInput = document.querySelector(
    ".itens-apreendidos textarea"
  ); // Nova referência direta

  // Outputs
  const crimesListOutput = document.getElementById("crimes-list-output");
  const penaTotalEl = document.getElementById("pena-total");
  const multaTotalEl = document.getElementById("multa-total");
  const fiancaOutputEl = document.getElementById("fianca-output");

  // Dinheiro Sujo
  const containerDinheiroSujo = document.getElementById(
    "container-dinheiro-sujo"
  );
  const inputDinheiroSujo = document.getElementById("input-dinheiro-sujo");

  let selectedCrimes = [];

  // --- FUNÇÃO DE ALERTA PERSONALIZADO ---
  const mostrarAlerta = (mensagem, tipo = "error") => {
    const div = document.createElement("div");
    div.className = `custom-alert ${tipo}`;

    const icone =
      tipo === "success" ? "fa-circle-check" : "fa-triangle-exclamation";
    const titulo =
      tipo === "success" ? "OPERAÇÃO CONCLUÍDA" : "ATENÇÃO - CAMPO OBRIGATÓRIO";

    div.innerHTML = `
            <i class="fa-solid ${icone}"></i>
            <div class="alert-content">
                <span class="alert-title">${titulo}</span>
                <span class="alert-msg">${mensagem}</span>
            </div>
        `;

    document.body.appendChild(div);
    setTimeout(() => {
      div.remove();
    }, 4000);
  };

  // --- FORMATAÇÃO E LÓGICA ---
  inputDinheiroSujo.addEventListener("input", (e) => {
    let value = e.target.value;
    value = value.replace(/\D/g, "");
    value = value.replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1.");
    e.target.value = value;
    calculateSentence();
  });

  const calculateSentence = () => {
    let totalPenaBase = selectedCrimes.reduce(
      (sum, crime) => sum + crime.pena,
      0
    );
    let totalMulta = selectedCrimes.reduce(
      (sum, crime) => sum + crime.multa,
      0
    );

    let valorSujoString = inputDinheiroSujo.value.replace(/\./g, "");
    let valorSujo = parseFloat(valorSujoString) || 0;

    if (!containerDinheiroSujo.classList.contains("hidden")) {
      totalMulta += valorSujo * PORCENTAGEM_MULTA_SUJO;
    }

    let descontoTotal = 0;
    let isInfiancavel = selectedCrimes.some((crime) => crime.infiancavel);

    checkboxes.forEach((checkbox) => {
      if (checkbox.checked) {
        const percent = parseFloat(checkbox.dataset.percent) / 100;
        descontoTotal += percent;
      }
    });

    let totalPenaFinal = Math.max(0, totalPenaBase * (1 + descontoTotal));

    let fianca = 0;
    if (!isInfiancavel && totalPenaFinal > 0) {
      fianca = Math.round(totalPenaFinal * MULTIPLIER_FIANCA);
    }

    penaTotalEl.textContent = `${Math.round(totalPenaFinal)} meses`;
    multaTotalEl.textContent = `R$${totalMulta.toLocaleString("pt-BR")}`;
    fiancaOutputEl.value = `R$ ${fianca.toLocaleString("pt-BR")}`;

    updateCrimesOutput();
  };

  const updateCrimesOutput = () => {
    crimesListOutput.innerHTML = "";
    if (selectedCrimes.length === 0) {
      crimesListOutput.innerHTML =
        '<div class="empty-message">Nenhum crime selecionado</div>';
      return;
    }

    selectedCrimes.forEach((crime, index) => {
      const crimeDiv = document.createElement("div");
      crimeDiv.className = "crime-output-item";
      const isInfiancavelText = crime.infiancavel ? " (INF)" : "";

      crimeDiv.innerHTML = `
                <span>${crime.artigo} - ${crime.nome.replace(
        /\*\*/g,
        ""
      )}${isInfiancavelText}</span>
                <button data-index="${index}" title="Remover"><i class="fa-solid fa-xmark"></i></button>
            `;
      crimesListOutput.appendChild(crimeDiv);
    });

    crimesListOutput.querySelectorAll("button").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const indexToRemove = parseInt(e.currentTarget.dataset.index);
        const crimeToRemove = selectedCrimes[indexToRemove];

        if (crimeToRemove.artigo === "137") {
          containerDinheiroSujo.classList.add("hidden");
          inputDinheiroSujo.value = "";
        }

        selectedCrimes.splice(indexToRemove, 1);

        const originalItem = document.querySelector(
          `.crime-item[data-artigo="${crimeToRemove.artigo}"]`
        );
        if (originalItem) {
          originalItem.classList.remove("selected");
        }

        calculateSentence();
      });
    });
  };

  crimeItems.forEach((item) => {
    item.addEventListener("click", () => {
      const artigo = item.dataset.artigo;
      const nome = item.querySelector(".crime-name").textContent.trim();
      const pena = parseInt(item.dataset.pena);
      const multa = parseInt(item.dataset.multa);
      const infiancavel = item.dataset.infiancavel === "true";

      const index = selectedCrimes.findIndex(
        (crime) => crime.artigo === artigo
      );

      if (index === -1) {
        selectedCrimes.push({ artigo, nome, pena, multa, infiancavel });
        item.classList.add("selected");
        if (artigo === "137") {
          containerDinheiroSujo.classList.remove("hidden");
          inputDinheiroSujo.focus();
        }
      } else {
        selectedCrimes.splice(index, 1);
        item.classList.remove("selected");
        if (artigo === "137") {
          containerDinheiroSujo.classList.add("hidden");
          inputDinheiroSujo.value = "";
        }
      }
      calculateSentence();
    });
  });

  checkboxes.forEach((checkbox) => {
    checkbox.addEventListener("change", calculateSentence);
  });

  btnLimpar.addEventListener("click", () => {
    if (confirm("Tem certeza que deseja limpar todos os dados?")) {
      selectedCrimes = [];
      document.querySelectorAll(".crime-item.selected").forEach((item) => {
        item.classList.remove("selected");
      });
      checkboxes.forEach((checkbox) => {
        checkbox.checked = false;
      });

      nomeInput.value = "";
      rgInput.value = "";
      advogadoInput.value = "";
      itensApreendidosInput.value = "";

      containerDinheiroSujo.classList.add("hidden");
      inputDinheiroSujo.value = "";

      calculateSentence();
    }
  });

  // --- BOTÃO COPIAR COM TODAS AS VALIDAÇÕES ---
  btnCopiar.addEventListener("click", () => {
    // 1. Validação Nome
    if (nomeInput.value.trim() === "") {
      mostrarAlerta("O campo 'Nome' do preso deve ser preenchido.", "error");
      nomeInput.focus();
      return;
    }

    // 2. Validação RG
    if (rgInput.value.trim() === "") {
      mostrarAlerta("O campo 'RG' do preso deve ser preenchido.", "error");
      rgInput.focus();
      return;
    }

    // 3. Validação Advogado
    if (checkboxAdvogado.checked && advogadoInput.value.trim() === "") {
      mostrarAlerta(
        "Informe o RG do advogado ou desmarque a atenuante.",
        "error"
      );
      advogadoInput.focus();
      return;
    }

    // 4. NOVA VALIDAÇÃO: ITENS APREENDIDOS
    // Verifica se algum crime selecionado está na lista ARTIGOS_COM_ITENS
    const possuiCrimeComItens = selectedCrimes.some((crime) =>
      ARTIGOS_COM_ITENS.includes(crime.artigo)
    );

    // Se tiver crime material E o campo de texto estiver vazio
    if (possuiCrimeComItens && itensApreendidosInput.value.trim() === "") {
      mostrarAlerta(
        "Crimes de porte/tráfico identificados. Descreva os itens apreendidos.",
        "error"
      );
      itensApreendidosInput.focus(); // Foca na caixa de texto
      // Adiciona uma borda vermelha temporária para destacar
      itensApreendidosInput.style.borderColor = "var(--color-danger)";
      setTimeout(() => {
        itensApreendidosInput.style.borderColor = "var(--border-color)";
      }, 3000);
      return;
    }

    // --- DADOS PARA O RELATÓRIO ---
    const nome = nomeInput.value;
    const rg = rgInput.value;
    const advogado = advogadoInput.value || "Nenhum";
    const pena = penaTotalEl.textContent;
    const multa = multaTotalEl.textContent;
    const fianca = fiancaOutputEl.value;
    const itensApreendidos =
      itensApreendidosInput.value || "Nenhum item apreendido.";
    const valorDinheiroSujo = !containerDinheiroSujo.classList.contains(
      "hidden"
    )
      ? inputDinheiroSujo.value
      : null;

    const crimesList =
      selectedCrimes
        .map((c) => {
          const isInfiancavel = c.infiancavel ? " (INF)" : "";
          return `- ${c.artigo} - ${c.nome.replace(
            /\*\*/g,
            ""
          )}${isInfiancavel}`;
        })
        .join("\n") || "Nenhum crime aplicado.";

    let atenuantesList = "";
    checkboxes.forEach((checkbox) => {
      if (checkbox.checked) {
        const label = document
          .querySelector(`label[for="${checkbox.id}"]`)
          .textContent.trim();
        atenuantesList += `- ${label}\n`;
      }
    });
    if (atenuantesList === "") atenuantesList = "Nenhum atenuante aplicado.";

    const dinheiroSujoLine = valorDinheiroSujo
      ? `\n**DINHEIRO SUJO APREENDIDO:**\n- Valor: R$ ${valorDinheiroSujo} (Multa adicional aplicada)`
      : "";

    const relatorio = `
**[ 📝 RELATÓRIO DE PRISÃO - REVOADA RJ ]**
---

**DADOS DO PRESO:**
Nome: ${nome}
RG: ${rg}
Advogado: ${advogado}

---

**CRIMES APLICADOS:**
${crimesList}

---

**RESUMO DA SENTENÇA:**
Pena Total: ${pena}
Multa Total: ${multa}
Fiança: ${fianca}

**ATENUANTES:**
${atenuantesList}

---

**ITENS APREENDIDOS:**
${itensApreendidos}
${dinheiroSujoLine}

---
        `.trim();

    navigator.clipboard
      .writeText(relatorio)
      .then(() => {
        mostrarAlerta(
          "Relatório copiado para a área de transferência.",
          "success"
        );
      })
      .catch((err) => {
        console.error(err);
        mostrarAlerta("Houve um erro ao tentar copiar o relatório.", "error");
      });
  });

  calculateSentence();
});
