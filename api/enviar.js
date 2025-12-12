// api/enviar.js
export const config = {
  api: {
    bodyParser: false, // IMPORTANTE: Desativa o parser padrão para aceitar arquivos (Multipart)
  },
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método não permitido" });
  }

  try {
    // 1. Decide qual Webhook usar baseado na Query String (?tipo=prisao ou ?tipo=fianca)
    const { tipo } = req.query;

    let webhookUrl;
    if (tipo === "fianca") {
      webhookUrl = process.env.WEBHOOK_FIANCA_SECRET;
    } else {
      webhookUrl = process.env.WEBHOOK_PRISAO_SECRET;
    }

    if (!webhookUrl) {
      console.error("ERRO: Webhook não configurado na Vercel.");
      return res
        .status(500)
        .json({ error: "Configuração de servidor ausente." });
    }

    // 2. Repassa a requisição EXATAMENTE como veio (Proxy)
    // Isso envia os textos e as imagens diretamente para o Discord
    const discordResponse = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        // Repassa o Content-Type (multipart/form-data; boundary=...)
        "Content-Type": req.headers["content-type"],
      },
      body: req, // O corpo da requisição (stream) vai direto pro Discord
    });

    if (discordResponse.ok) {
      return res.status(200).json({ success: true });
    } else {
      const errText = await discordResponse.text();
      console.error("Erro Discord:", errText);
      return res
        .status(discordResponse.status)
        .json({ error: "O Discord rejeitou os dados." });
    }
  } catch (error) {
    console.error("Erro interno:", error);
    return res.status(500).json({ error: "Erro interno no servidor." });
  }
}
