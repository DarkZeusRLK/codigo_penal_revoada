export const config = {
  api: {
    bodyParser: {
      sizeLimit: "12mb",
    },
  },
};

function modelsParaTeste() {
  const base = [
    process.env.GEMINI_MODEL || "gemini-2.5-flash",
    "gemini-2.5-flash-lite",
    "gemini-3-flash-preview",
  ];
  const normalizados = base
    .map((m) => String(m || "").trim())
    .filter(Boolean);
  return [...new Set(normalizados)];
}

function extrairTextoGemini(payload) {
  const candidates = payload?.candidates || [];
  for (const candidate of candidates) {
    const parts = candidate?.content?.parts || [];
    const texto = parts
      .map((part) => (typeof part?.text === "string" ? part.text : ""))
      .filter(Boolean)
      .join("\n")
      .trim();
    if (texto) return texto;
  }
  return "";
}

function limparLista(texto) {
  const bruto = String(texto || "").trim();
  if (!bruto) return "";
  if (bruto.toUpperCase().includes("NENHUM_ITEM_ILEGAL_IDENTIFICADO")) return "";

  return bruto
    .replace(/```[a-z]*|```/gi, "")
    .split(/\r?\n/)
    .map((linha) => linha.trim())
    .filter(Boolean)
    .map((linha) => linha.replace(/^[-*\u2022]+\s*/, "").trim())
    .map((linha) => linha.replace(/^\d+\s*[\.\)\-:]\s*/, "").trim())
    .filter(Boolean)
    .join("\n");
}

function obterDetalheErro(payload, raw, status) {
  const msg =
    payload?.error?.message ||
    payload?.message ||
    (typeof raw === "string" ? raw : "") ||
    "Erro desconhecido";
  return `HTTP ${status}: ${String(msg).slice(0, 500)}`;
}

export default async function handler(req, res) {
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

  const apiKey = process.env.API_GEMINI_KEY;
  if (!apiKey) {
    return res.status(500).json({
      error:
        "Configuração ausente no servidor: defina API_GEMINI_KEY nas variáveis da Vercel.",
    });
  }

  try {
    const { imageBase64, mimeType } = req.body || {};

    if (!imageBase64) {
      return res
        .status(400)
        .json({ error: "Imagem inválida: envie imageBase64 no corpo da requisição." });
    }

    const base64Limpo = String(imageBase64)
      .replace(/^data:[^;]+;base64,/, "")
      .trim();

    if (!base64Limpo) {
      return res.status(400).json({ error: "Imagem base64 vazia." });
    }

    const prompt = [
      "Analise somente a imagem da mochila/inventário.",
      "Liste somente itens ilegais que estejam visíveis (armas, munições, drogas e itens ilícitos).",
      "Retorne sem explicações e sem markdown.",
      "Formato obrigatório: uma linha por item, exatamente como '<quantidade>x <item>'.",
      "Exemplo:",
      "1x G36",
      "10x Munição G36",
      "150x Erva",
      "Se não identificar item ilegal com segurança, retorne exatamente: NENHUM_ITEM_ILEGAL_IDENTIFICADO",
    ].join("\n");

    const requestBody = {
      contents: [
        {
          parts: [
            { text: prompt },
            {
              inline_data: {
                mime_type: mimeType || "image/jpeg",
                data: base64Limpo,
              },
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.1,
      },
    };

    const modelos = modelsParaTeste();
    let textoBruto = "";
    let ultimoErro = "";

    for (const model of modelos) {
      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`;

      const geminiResponse = await fetch(geminiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
        body: JSON.stringify(requestBody),
      });

      const raw = await geminiResponse.text();
      let geminiPayload = {};
      try {
        geminiPayload = JSON.parse(raw);
      } catch {
        geminiPayload = {};
      }

      if (geminiResponse.ok) {
        textoBruto = extrairTextoGemini(geminiPayload);
        if (textoBruto) break;
        ultimoErro = `Modelo ${model} respondeu sem texto útil.`;
        continue;
      }

      const detalhe = obterDetalheErro(geminiPayload, raw, geminiResponse.status);
      ultimoErro = `Modelo ${model} -> ${detalhe}`;

      const erroMsg = String(geminiPayload?.error?.message || "").toLowerCase();
      const naoEncontradoOuIndisponivel =
        geminiResponse.status === 404 ||
        erroMsg.includes("not found") ||
        erroMsg.includes("is not found") ||
        erroMsg.includes("unsupported");

      if (!naoEncontradoOuIndisponivel) {
        return res.status(502).json({
          error: "Falha ao consultar o Gemini.",
          detalhe: ultimoErro,
        });
      }
    }

    if (!textoBruto) {
      return res.status(502).json({
        error: "Falha ao consultar o Gemini.",
        detalhe: ultimoErro || "Nenhum modelo retornou resposta válida.",
      });
    }

    const itemsText = limparLista(textoBruto);

    if (!itemsText) {
      return res.status(422).json({
        error: "A I.A. não identificou itens ilegais com segurança nessa imagem.",
      });
    }

    return res.status(200).json({ itemsText });
  } catch (error) {
    return res.status(500).json({
      error: "Erro interno ao processar a leitura da imagem.",
      detalhe: error.message,
    });
  }
}
