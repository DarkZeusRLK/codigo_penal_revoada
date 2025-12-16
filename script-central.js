// script-central.js

// --- CONFIGURAÇÃO DE CARGOS (PEGUE OS IDS NO DISCORD) ---
// Clique com botão direito no cargo > Copiar ID
const ROLE_COMANDANTE = "123456789012345678"; // ID do cargo que pode mandar AVISOS
const ROLE_JORNALISTA = "987654321098765432"; // ID do cargo que pode mandar NOTÍCIAS

// --- WEBHOOKS PARA A CENTRAL ---
// Crie novos webhooks no Discord para esses canais específicos
const WEBHOOK_AVISOS = "https://discord.com/api/webhooks/...";
const WEBHOOK_JORNAL = "https://discord.com/api/webhooks/...";

document.addEventListener("DOMContentLoaded", async function () {
  // 1. VERIFICAÇÃO DE LOGIN E CARGOS
  const fragment = new URLSearchParams(window.location.hash.slice(1));
  let accessToken = fragment.get("access_token");

  // Se não tiver token na URL, tenta pegar do localStorage (se você salvou antes)
  // ou redireciona pro login do index se quiser forçar.
  if (!accessToken) {
    // Redireciona para o login se não tiver token
    alert("Faça login na calculadora primeiro.");
    window.location.href = "index.html";
    return;
  }

  try {
    const response = await fetch("/api/auth", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    const data = await response.json();

    if (response.ok && data.authorized) {
      // LOGIN SUCESSO
      document.getElementById("auth-loading").classList.add("hidden");

      // Preenche Header
      document.getElementById("user-display").innerText =
        data.nick || data.username;
      document.getElementById("jornal-autor").value =
        "Repórter: " + (data.nick || data.username);
      if (data.avatar)
        document.getElementById(
          "user-avatar"
        ).src = `https://cdn.discordapp.com/avatars/${data.id}/${data.avatar}.png`;

      // VERIFICA CARGOS PARA MOSTRAR BOTÕES
      const userRoles = data.roles || [];

      // Se tiver cargo de Comandante, mostra aba Avisos
      if (userRoles.includes(ROLE_COMANDANTE)) {
        document.getElementById("nav-aviso").classList.remove("hidden");
      }

      // Se tiver cargo de Jornalista, mostra aba Redação
      if (userRoles.includes(ROLE_JORNALISTA)) {
        document.getElementById("nav-jornal").classList.remove("hidden");
      }
    } else {
      alert("Acesso Negado: " + data.error);
      window.location.href = "index.html";
    }
  } catch (e) {
    console.error(e);
    alert("Erro de conexão.");
    window.location.href = "index.html";
  }

  // --- LÓGICA DE UPLOAD DE IMAGEM DA NOTÍCIA ---
  const boxUpload = document.getElementById("box-upload-noticia");
  const inputUpload = document.getElementById("input-noticia");
  const previewImg = document.getElementById("preview-noticia");
  let arquivoNoticia = null;

  boxUpload.addEventListener("click", () => inputUpload.click());

  inputUpload.addEventListener("change", function () {
    if (this.files[0]) processFile(this.files[0]);
  });

  // Paste
  document.addEventListener("paste", function (e) {
    // Só cola se a aba jornal estiver visível
    if (document.getElementById("tab-postar-jornal").style.display === "none")
      return;

    if (e.clipboardData.items) {
      for (let i = 0; i < e.clipboardData.items.length; i++) {
        if (e.clipboardData.items[i].type.indexOf("image") !== -1) {
          processFile(e.clipboardData.items[i].getAsFile());
          break;
        }
      }
    }
  });

  function processFile(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      previewImg.src = e.target.result;
      previewImg.classList.remove("hidden");
      arquivoNoticia = file; // Guarda para envio
    };
    reader.readAsDataURL(file);
  }

  // --- ENVIAR AVISO (ADMIN) ---
  document
    .getElementById("btn-enviar-aviso")
    .addEventListener("click", function () {
      const titulo = document.getElementById("aviso-titulo").value;
      const texto = document.getElementById("aviso-texto").value;
      const cor = document.getElementById("aviso-cor").value;

      if (!titulo || !texto) return alert("Preencha tudo!");

      let colorCode = 3447003; // Azul
      if (cor === "amarelo") colorCode = 16776960;
      if (cor === "vermelho") colorCode = 15158332;

      const embed = {
        title: "📢 " + titulo,
        description: texto,
        color: colorCode,
        footer: { text: "Comunicado Oficial • Polícia Revoada" },
        timestamp: new Date(),
      };

      enviarWebhook(WEBHOOK_AVISOS, { embeds: [embed] });
    });

  // --- ENVIAR JORNAL ---
  document
    .getElementById("btn-enviar-jornal")
    .addEventListener("click", function () {
      const titulo = document.getElementById("jornal-titulo").value;
      const texto = document.getElementById("jornal-texto").value;
      const autor = document.getElementById("jornal-autor").value;

      if (!titulo || !texto || !arquivoNoticia)
        return alert("Preencha tudo e coloque uma foto!");

      const formData = new FormData();
      formData.append("file", arquivoNoticia, "noticia.jpg");

      const embed = {
        title: "📰 " + titulo,
        description: texto,
        color: 16777215, // Branco
        image: { url: "attachment://noticia.jpg" },
        footer: { text: autor + " • Jornal Revoada" },
        timestamp: new Date(),
      };

      formData.append("payload_json", JSON.stringify({ embeds: [embed] }));

      // Envia direto (ou via proxy se preferir esconder esse webhook tambem)
      fetch(WEBHOOK_JORNAL, { method: "POST", body: formData }).then((r) => {
        if (r.ok) {
          alert("Matéria publicada!");
          location.reload();
        } else alert("Erro ao publicar.");
      });
    });

  function enviarWebhook(url, json) {
    fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(json),
    }).then((r) => {
      if (r.ok) {
        alert("Enviado com sucesso!");
        location.reload();
      } else alert("Erro ao enviar.");
    });
  }
});

// --- SISTEMA DE ABAS ---
window.showTab = function (tabId) {
  // Esconde todas
  document
    .querySelectorAll(".tab-content")
    .forEach((t) => t.classList.remove("active"));
  document
    .querySelectorAll(".nav-item")
    .forEach((n) => n.classList.remove("active"));

  // Mostra a certa
  document.getElementById(tabId).classList.add("active");

  // Ativa botão (gambiarra simples para identificar qual botão foi clicado)
  if (tabId === "tab-home")
    document
      .querySelector("button[onclick*='tab-home']")
      .classList.add("active");
  if (tabId === "tab-aviso")
    document.getElementById("nav-aviso").classList.add("active");
  if (tabId === "tab-postar-jornal")
    document.getElementById("nav-jornal").classList.add("active");
};

window.logout = function () {
  window.location.href = "index.html";
};
