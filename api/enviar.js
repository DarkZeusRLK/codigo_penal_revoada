// api/enviar.js

// 1. Configuração OBRIGATÓRIA para Vercel aceitar arquivos
export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  // 2. Permissões de CORS (Para o site falar com a API)
  res.setHeader("Access-Control-Allow-Credentials", true);
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método incorreto. Use POST." });
  }

  try {
    const { tipo } = req.query;

    // 3. Verificação das Chaves Secretas
    let webhookUrl;
    const secretPrisao = process.env.WEBHOOK_PRISAO_SECRET;
    const secretFianca = process.env.WEBHOOK_FIANCA_SECRET;

    if (tipo === "fianca") {
      webhookUrl = secretFianca;
    } else {
      webhookUrl = secretPrisao;
    }

    // DIAGNÓSTICO: Se não achar o link, avisa qual chave está faltando
    if (!webhookUrl) {
      console.error("ERRO: Webhook URL indefinida.");
      return res.status(500).json({
        error: "CONFIGURAÇÃO VERCEL AUSENTE",
        detalhe:
          tipo === "fianca"
            ? "Falta a variável WEBHOOK_FIANCA_SECRET"
            : "Falta a variável WEBHOOK_PRISAO_SECRET",
        status_variaveis: {
          prisao_definida: !!secretPrisao,
          fianca_definida: !!secretFianca,
        },
      });
    }

    // 4. Envio para o Discord (Proxy)
    // Filtramos os headers para enviar apenas o necessário e evitar conflito
    const headersDiscord = {
      "Content-Type": req.headers["content-type"],
    };

    if (req.headers["content-length"]) {
      headersDiscord["Content-Length"] = req.headers["content-length"];
    }

    const discordResponse = await fetch(webhookUrl, {
      method: "POST",
      headers: headersDiscord,
      body: req, // Stream direta do arquivo
    });

    if (discordResponse.ok) {
      return res.status(200).json({ success: true });
    } else {
      const errText = await discordResponse.text();
      console.error("Discord recusou:", errText);
      return res.status(discordResponse.status).json({
        error: "O Discord rejeitou o envio.",
        discord_message: errText,
      });
    }
  } catch (error) {
    console.error("Erro Crítico:", error);
    return res.status(500).json({
      error: "Erro Interno do Servidor",
      message: error.message,
    });
  }
}
