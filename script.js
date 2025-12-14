document.addEventListener("DOMContentLoaded", function () {
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

  // --- SISTEMA DE CACHE DE SESSÃO (LOGIN AUTOMÁTICO) ---
  const SESSION_KEY = "policia_session_v1";
  const SESSION_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 dias

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
    // Se estiver voltando do Discord (login novo), ignora o cache
    if (window.location.hash.includes("access_token")) return false;

    const dadosSalvos = localStorage.getItem(SESSION_KEY);
    if (!dadosSalvos) return false;

    try {
      const sessao = JSON.parse(dadosSalvos);
      const agora = new Date().getTime();

      // Validação de Segurança (Limpa se o ID parecer um link ou for inválido)
      if (
        !sessao.id ||
        sessao.id.toString().includes("http") ||
        sessao.id.length < 5
      ) {
        console.warn("Cache corrompido detectado. Limpando...");
        localStorage.removeItem(SESSION_KEY);
        return false;
      }

      // Validação de Validade (7 dias)
      if (agora - sessao.timestamp > SESSION_DURATION) {
        localStorage.removeItem(SESSION_KEY);
        return false;
      }

      // --- RECUPERA ELEMENTOS ---
      const loginScreen = document.getElementById("login-screen");
      const appContent = document.getElementById("app-content");
      const userNameSpan = document.getElementById("user-name");
      const userIdHidden = document.getElementById("user-id-hidden");
      const userAvatarImg = document.getElementById("user-avatar");

      // Se não achar a tela principal, NÃO esconde o login (Evita Tela Preta)
      if (!appContent) {
        console.error(
          "ERRO CRÍTICO: Div 'app-content' não encontrada no HTML."
        );
        return false;
      }

      // Preenche os dados
      if (userNameSpan) userNameSpan.textContent = sessao.nome;
      if (userIdHidden) userIdHidden.value = sessao.id;
      if (userAvatarImg && sessao.avatar) {
        userAvatarImg.src = sessao.avatar;
        userAvatarImg.classList.remove("hidden");
      }

      // Troca a tela
      if (loginScreen) loginScreen.style.display = "none";
      appContent.classList.remove("hidden");

      console.log("Sessão restaurada: " + sessao.nome);
      return true;
    } catch (e) {
      console.error("Erro na sessão:", e);
      localStorage.removeItem(SESSION_KEY);
      return false;
    }
  }

  // --- CONFIGURAÇÕES GERAIS ---
  var PORCENTAGEM_MULTA_SUJO = 0.5;
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

  // --- CARREGAMENTO DE OFICIAIS ---
  var LISTA_OFICIAIS = [];
  async function carregarOficiaisDiscord() {
    try {
      const response = await fetch("/api/membros");
      if (response.ok) {
        LISTA_OFICIAIS = await response.json();
        console.log("Oficiais carregados: " + LISTA_OFICIAIS.length);
      }
    } catch (error) {
      console.error("Erro ao buscar oficiais:", error);
    }
  }

  // --- ELEMENTOS DO DOM ---
  var loginScreen = document.getElementById("login-screen");
  var appContent = document.getElementById("app-content");
  var userNameSpan = document.getElementById("user-name");
  var userAvatarImg = document.getElementById("user-avatar");
  var userIdHidden = document.getElementById("user-id-hidden");

  // Inputs e Botões
  var nomeInput = document.getElementById("nome");
  var rgInput = document.getElementById("rg");
  var advogadoInput = document.getElementById("advogado");
  var checkPrimario = document.getElementById("atenuante-primario");
  var itensApreendidosInput = document.querySelector(
    ".itens-apreendidos textarea"
  );

  var btnEnviar = document.getElementById("btn-enviar");
  var btnLimpar = document.getElementById("btn-limpar");

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

  // Variáveis de Cálculo
  var selectedCrimes = [];
  var penaTotalEl = document.getElementById("pena-total");
  var multaTotalEl = document.getElementById("multa-total");
  var checkboxes = document.querySelectorAll(
    '.atenuantes input[type="checkbox"]'
  );
  var inputHpMinutos = document.getElementById("hp-minutos");
  var hpSimBtn = document.getElementById("hp-sim");
  var hpNaoBtn = document.getElementById("hp-nao");
  var inputDinheiroSujo = document.getElementById("input-dinheiro-sujo");
  var containerDinheiroSujo = document.getElementById(
    "container-dinheiro-sujo"
  );
  var radiosFianca = document.getElementsByName("pagou-fianca");
  var radiosPorte = document.getElementsByName("porte-arma");

  // --- FUNÇÕES AUXILIARES ---
  function mostrarAlerta(mensagem, tipo) {
    if (!tipo) tipo = "error";
    var div = document.createElement("div");
    div.className = "custom-alert " + tipo;
    div.innerHTML = `<i class="fa-solid ${
      tipo === "success" ? "fa-circle-check" : "fa-triangle-exclamation"
    }"></i> <span>${mensagem}</span>`;
    document.body.appendChild(div);
    setTimeout(() => div.remove(), 4000);
  }

  function doLogin(username, avatarUrl, userId) {
    salvarSessao(username, avatarUrl, userId);

    if (loginScreen) loginScreen.style.display = "none";
    if (appContent) appContent.classList.remove("hidden");

    if (userNameSpan) userNameSpan.textContent = username;
    if (userIdHidden) userIdHidden.value = userId;

    if (avatarUrl && userAvatarImg) {
      userAvatarImg.src = avatarUrl;
      userAvatarImg.classList.remove("hidden");
    }

    if (bgMusic) bgMusic.play().catch((e) => console.log("Audio play blocked"));
    carregarOficiaisDiscord();
  }

  // --- INICIALIZAÇÃO ---
  // 1. Tenta recuperar sessão
  verificarSessao();

  // 2. Verifica se veio do Login Discord (Hash na URL)
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

  // --- LÓGICA DE UPLOAD (Clique e Ctrl+V) ---
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
    boxPreso.addEventListener("click", function () {
      activeUploadBox = "preso";
      destacarBox(boxPreso);
    });
  if (boxMochila)
    boxMochila.addEventListener("click", function () {
      activeUploadBox = "mochila";
      destacarBox(boxMochila);
    });
  if (boxDeposito)
    boxDeposito.addEventListener("click", function () {
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
          var blob = e.clipboardData.items[i].getAsFile();
          setFile(activeUploadBox, blob);
          break;
        }
      }
    }
  });

  // --- LÓGICA DE CRIMES ---
  var crimeItems = document.querySelectorAll(".crime-item");
  var crimesListOutput = document.getElementById("crimes-list-output");

  crimeItems.forEach((item) => {
    item.addEventListener("click", function () {
      var artigo = this.dataset.artigo;
      var nome = this.querySelector(".crime-name").innerText.trim();
      var pena = parseInt(this.dataset.pena);
      var multa = parseInt(this.dataset.multa);
      var infiancavel = this.dataset.infiancavel === "true";

      // Verifica duplicidade
      if (selectedCrimes.some((c) => c.artigo === artigo)) return;

      // Adiciona crime
      selectedCrimes.push({ artigo, nome, pena, multa, infiancavel });

      // Lógica Dinheiro Sujo
      if (artigo === "137" && containerDinheiroSujo) {
        containerDinheiroSujo.classList.remove("hidden");
      }

      atualizarListaCrimes();
      calculateSentence();
    });
  });

  function atualizarListaCrimes() {
    crimesListOutput.innerHTML = "";
    if (selectedCrimes.length === 0) {
      crimesListOutput.innerHTML =
        '<div class="empty-message">Nenhum crime selecionado</div>';
      return;
    }
    selectedCrimes.forEach((crime, index) => {
      var div = document.createElement("div");
      div.className = "crime-output-item";
      div.innerHTML = `<span>${crime.nome.replace(/\*\*/g, "")} ${
        crime.infiancavel ? "(INF)" : ""
      }</span> <button onclick="removerCrime(${index})"><i class="fa-solid fa-xmark"></i></button>`;
      crimesListOutput.appendChild(div);
    });
  }

  window.removerCrime = function (index) {
    var removido = selectedCrimes[index];
    selectedCrimes.splice(index, 1);

    if (removido.artigo === "137" && containerDinheiroSujo) {
      containerDinheiroSujo.classList.add("hidden");
      inputDinheiroSujo.value = "";
    }
    atualizarListaCrimes();
    calculateSentence();
  };

  // --- CÁLCULO DA PENA ---
  function calculateSentence() {
    var totalPena = 0;
    var totalMulta = 0;
    var isInfiancavel = false;

    // Soma Base
    selectedCrimes.forEach((c) => {
      totalPena += c.pena;
      totalMulta += c.multa;
      if (c.infiancavel) isInfiancavel = true;
    });

    // Dinheiro Sujo
    if (inputDinheiroSujo && inputDinheiroSujo.value) {
      var sujo = parseFloat(inputDinheiroSujo.value.replace(/\./g, "")) || 0;
      totalMulta += sujo * PORCENTAGEM_MULTA_SUJO;
    }

    // Atenuantes
    var desconto = 0;
    checkboxes.forEach((cb) => {
      if (cb.checked) desconto += Math.abs(parseFloat(cb.dataset.percent));
    });
    totalPena = Math.max(0, totalPena * (1 - desconto / 100));

    // HP
    if (hpSimBtn && hpSimBtn.checked && inputHpMinutos.value) {
      totalPena = Math.max(0, totalPena - parseInt(inputHpMinutos.value));
    }

    // Exibe
    penaTotalEl.textContent = Math.ceil(totalPena) + " meses";
    multaTotalEl.textContent = "R$" + totalMulta.toLocaleString("pt-BR");

    // Controle de Fiança (Se tiver crime infiançável, bloqueia o Sim)
    var radioFiancaSim = document.getElementById("fianca-sim");
    var radioFiancaNao = document.getElementById("fianca-nao");
    if (isInfiancavel && radioFiancaSim) {
      radioFiancaSim.disabled = true;
      radioFiancaNao.checked = true;
    } else if (radioFiancaSim) {
      radioFiancaSim.disabled = false;
    }
  }

  // Listeners de Cálculo
  if (inputHpMinutos)
    inputHpMinutos.addEventListener("input", calculateSentence);
  if (hpSimBtn) hpSimBtn.addEventListener("change", calculateSentence);
  if (hpNaoBtn) hpNaoBtn.addEventListener("change", calculateSentence);
  if (inputDinheiroSujo)
    inputDinheiroSujo.addEventListener("input", function (e) {
      var val = e.target.value
        .replace(/\D/g, "")
        .replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1.");
      e.target.value = val;
      calculateSentence();
    });
  checkboxes.forEach((cb) => cb.addEventListener("change", calculateSentence));

  // --- PESQUISA DE OFICIAIS ---
  var searchInput = document.getElementById("search-oficial");
  var dropdownResults = document.getElementById("dropdown-oficiais");
  var selectedOficialIdInput = document.getElementById("selected-oficial-id");
  var btnAddPart = document.getElementById("btn-add-participante");
  var listaParticipantesVisual = document.getElementById(
    "lista-participantes-visual"
  );
  var participantesSelecionados = [];

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
      if (!id) return mostrarAlerta("Selecione um oficial da lista.", "error");

      if (participantesSelecionados.some((p) => p.id === id))
        return mostrarAlerta("Já adicionado.", "error");
      if (id === userIdHidden.value)
        return mostrarAlerta("Você já é o relator.", "error");

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

  // --- ENVIO E MODAL DE CONFIRMAÇÃO ---
  var modalConfirmacao = document.getElementById("modal-confirmacao");
  var btnCancelarConf = document.getElementById("btn-cancelar-conf");
  var btnConfirmarEnvio = document.getElementById("btn-confirmar-envio");

  function abrirModalConfirmacao() {
    // Preenche Modal
    var oficialLogado = userNameSpan.textContent;
    var listaOficiais = [oficialLogado];
    participantesSelecionados.forEach((p) => listaOficiais.push(p.nome));
    document.getElementById("conf-oficiais").textContent =
      listaOficiais.join(", ");

    document.getElementById("conf-preso").textContent =
      nomeInput.value + " (RG: " + rgInput.value + ")";
    document.getElementById("conf-advogado").textContent =
      advogadoInput.value || "Não informado";
    document.getElementById("conf-sentenca").textContent =
      penaTotalEl.textContent;
    document.getElementById("conf-multa").textContent =
      multaTotalEl.textContent;

    // Crimes
    var listaCrimes = document.getElementById("conf-crimes");
    listaCrimes.innerHTML = "";
    selectedCrimes.forEach((c) => {
      var li = document.createElement("li");
      li.textContent =
        c.nome.replace(/\*\*/g, "") + (c.infiancavel ? " (INF)" : "");
      listaCrimes.appendChild(li);
    });

    // Imagens
    document.getElementById("conf-img-preso").src = imgPreviewPreso.src;
    document.getElementById("conf-img-mochila").src = imgPreviewMochila.src;
    var boxConfDeposito = document.getElementById("box-conf-deposito");

    var pagouFianca = false;
    for (var i = 0; i < radiosFianca.length; i++)
      if (radiosFianca[i].checked && radiosFianca[i].value === "sim")
        pagouFianca = true;

    if (pagouFianca && imgPreviewDeposito.src) {
      boxConfDeposito.classList.remove("hidden");
      document.getElementById("conf-img-deposito").src = imgPreviewDeposito.src;
    } else {
      boxConfDeposito.classList.add("hidden");
    }

    modalConfirmacao.classList.remove("hidden");
  }

  if (btnCancelarConf)
    btnCancelarConf.addEventListener("click", () =>
      modalConfirmacao.classList.add("hidden")
    );

  // Clique no botão ENVIAR (Validação)
  if (btnEnviar) {
    btnEnviar.addEventListener("click", function (e) {
      e.preventDefault();

      // Validações Básicas
      if (!nomeInput.value.trim() || !rgInput.value.trim())
        return mostrarAlerta("Preencha Nome e RG do preso.", "error");
      if (!arquivoPreso || !arquivoMochila)
        return mostrarAlerta(
          "Fotos do Preso e Inventário são obrigatórias.",
          "error"
        );

      // Validação Primário/Reincidente
      var isPrimario = checkPrimario.checked;
      var isReincidente = selectedCrimes.some((c) => c.artigo === "161");
      if (!isPrimario && !isReincidente)
        return mostrarAlerta(
          "Selecione 'Réu Primário' ou adicione o crime 'Reincidente'.",
          "error"
        );
      if (isPrimario && isReincidente)
        return mostrarAlerta(
          "Réu não pode ser Primário e Reincidente ao mesmo tempo.",
          "error"
        );

      abrirModalConfirmacao();
    });
  }

  // Clique no botão CONFIRMAR (Envio Real)
  if (btnConfirmarEnvio) {
    btnConfirmarEnvio.addEventListener("click", function () {
      btnConfirmarEnvio.disabled = true;
      btnConfirmarEnvio.textContent = "ENVIANDO...";

      // Prepara envio
      function comprimirImagem(file, cb) {
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
            canvas.toBlob(cb, "image/jpeg", 0.7);
          };
        };
      }

      comprimirImagem(arquivoPreso, function (presoBlob) {
        comprimirImagem(arquivoMochila, function (mochilaBlob) {
          var enviarFinal = function (depositoBlob) {
            var formData = new FormData();
            formData.append("file1", presoBlob, "preso.jpg");
            formData.append("file2", mochilaBlob, "mochila.jpg");
            if (depositoBlob)
              formData.append("file3", depositoBlob, "deposito.jpg");

            // Dados para o Discord
            var pagouFianca = false;
            for (var i = 0; i < radiosFianca.length; i++)
              if (radiosFianca[i].checked && radiosFianca[i].value === "sim")
                pagouFianca = true;

            var participantesStr = "";
            participantesSelecionados.forEach(
              (p) => (participantesStr += `<@${p.id}> `)
            );

            // Proteção ID do Oficial
            var officerId = userIdHidden.value;
            if (officerId && officerId.includes("http")) officerId = ""; // Evita bug do link

            var mentionString = officerId ? `<@${officerId}> ` : "";
            mentionString += participantesStr;

            var crimesText = selectedCrimes
              .map(
                (c) =>
                  c.nome.replace(/\*\*/g, "") +
                  (c.infiancavel ? " **(INF)**" : "")
              )
              .join("\n");

            var embeds = [
              {
                title: pagouFianca
                  ? "💰 RELATÓRIO DE FIANÇA"
                  : "🚔 RELATÓRIO DE PRISÃO",
                color: pagouFianca ? 3066993 : 15158332,
                image: { url: "attachment://preso.jpg" },
                fields: [
                  {
                    name: "👮 OFICIAL",
                    value:
                      userNameSpan.textContent +
                      (officerId ? ` (<@${officerId}>)` : ""),
                    inline: false,
                  },
                  {
                    name: "👥 PARTICIPANTES",
                    value: participantesStr || "Nenhum",
                    inline: false,
                  },
                  {
                    name: "👤 PRESO",
                    value: `**Nome:** ${nomeInput.value}\n**RG:** ${rgInput.value}`,
                    inline: true,
                  },
                  {
                    name: "⚖️ SENTENÇA",
                    value: `**Pena:** ${penaTotalEl.textContent}\n**Multa:** ${multaTotalEl.textContent}`,
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
                color: pagouFianca ? 3066993 : 15158332,
                image: { url: "attachment://mochila.jpg" },
              },
            ];

            if (depositoBlob) {
              embeds.push({
                title: "💸 COMPROVANTE",
                image: { url: "attachment://deposito.jpg" },
                color: 3066993,
              });
            }

            var payload = {
              content: "|| " + mentionString + " ||",
              embeds: embeds,
              allowed_mentions: { parse: ["users"] },
            };

            formData.append("payload_json", JSON.stringify(payload));

            fetch("/api/enviar?tipo=" + (pagouFianca ? "fianca" : "prisao"), {
              method: "POST",
              body: formData,
            })
              .then((res) => {
                if (res.ok) {
                  mostrarAlerta("Enviado com Sucesso!", "success");
                  setTimeout(() => location.reload(), 2000);
                } else {
                  throw new Error("Erro API: " + res.status);
                }
              })
              .catch((err) => {
                console.error(err);
                mostrarAlerta("Erro ao enviar.", "error");
                btnConfirmarEnvio.disabled = false;
                btnConfirmarEnvio.textContent = "CONFIRMAR E ENVIAR";
              });
          };

          if (arquivoDeposito) {
            comprimirImagem(arquivoDeposito, enviarFinal);
          } else {
            enviarFinal(null);
          }
        });
      });
    });
  }

  // Se houver botão de Limpar
  if (btnLimpar)
    btnLimpar.addEventListener("click", () => {
      if (confirm("Limpar tudo?")) location.reload();
    });
}); // FIM DO DOMContentLoaded
