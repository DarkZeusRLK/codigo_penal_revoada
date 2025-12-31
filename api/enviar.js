// api/enviar.js

export const config = {
  api: {
    bodyParser: false, // OBRIGATÓRIO: Desativa processamento para aceitar arquivos
  },
};

export default async function handler(req, res) {
  // Configurações de CORS
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

    // Pega as chaves secretas
    let webhookUrl;
    const secretPrisao = process.env.WEBHOOK_PRISAO_SECRET;
    const secretFianca = process.env.WEBHOOK_FIANCA_SECRET;

    if (tipo === "fianca") {
      webhookUrl = secretFianca;
    } else {
      webhookUrl = secretPrisao;
    }

    if (!webhookUrl) {
      console.error("ERRO: Webhook URL indefinida.");
      return res.status(500).json({
        error: "CONFIGURAÇÃO VERCEL AUSENTE",
        detalhe:
          tipo === "fianca"
            ? "Falta WEBHOOK_FIANCA_SECRET"
            : "Falta WEBHOOK_PRISAO_SECRET",
      });
    }

    // Filtra headers
    const headersDiscord = {
      "Content-Type": req.headers["content-type"],
    };
    if (req.headers["content-length"]) {
      headersDiscord["Content-Length"] = req.headers["content-length"];
    }

    // ENVIO PARA O DISCORD (Com a correção do duplex)
    const discordResponse = await fetch(webhookUrl, {
      method: "POST",
      headers: headersDiscord,
      body: req,
      duplex: "half", // <--- A LINHA MÁGICA QUE RESOLVE O ERRO
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
