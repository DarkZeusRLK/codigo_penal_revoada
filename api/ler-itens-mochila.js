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
    return res.status(405).json({ error: "Metodo incorreto. Use POST." });
  }

  const apiKey = process.env.API_GEMINI_KEY;
  if (!apiKey) {
    return res.status(500).json({
      error:
        "Configuracao ausente no servidor: defina API_GEMINI_KEY nas variaveis da Vercel.",
    });
  }

  try {
    const { imageBase64, mimeType, cropRightPanel } = req.body || {};

    if (!imageBase64) {
      return res
        .status(400)
        .json({ error: "Imagem invalida: envie imageBase64 no corpo da requisicao." });
    }

    const base64Limpo = String(imageBase64)
      .replace(/^data:[^;]+;base64,/, "")
      .trim();

    if (!base64Limpo) {
      return res.status(400).json({ error: "Imagem base64 vazia." });
    }

    const promptLines = [
      "Analise somente o inventario do preso (painel revistado/bau do lado direito).",
      "IMPORTANTE: ignore totalmente itens do jogador, painel esquerdo, barra inferior, armas equipadas e qualquer HUD/overlay.",
      "Liste somente itens ilegais que estejam visiveis no painel da direita (armas, municoes, drogas e itens ilicitos).",
      "Nao inclua itens legais como roupas, celular, radio, bebida, comida e similares.",
      "Itens com prefixo 'M-' (ex.: M-G3, M-MICROSMG) sao municoes, nao armas.",
      "Pacote Pistola conta como 1 arma leve. Pacote Special/Carbine conta como 1 arma pesada.",
      "Para dinheiro sujo, preserve o sufixo K/M quando visivel (ex.: 20k Dinheiro Sujo).",
      "Retorne sem explicacoes e sem markdown.",
      "Formato obrigatorio: uma linha por item, exatamente como '<quantidade>x <item>'.",
      "Exemplo:",
      "1x G36",
      "10x Municao G36",
      "150x Erva",
      "20k Dinheiro Sujo",
      "Se nao identificar item ilegal com seguranca, retorne exatamente: NENHUM_ITEM_ILEGAL_IDENTIFICADO",
    ];

    if (cropRightPanel) {
      promptLines.unshift(
        "A imagem recebida ja esta recortada para o painel da direita; use somente esse recorte.",
      );
    }

    const prompt = promptLines.join("\n");

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
        ultimoErro = `Modelo ${model} respondeu sem texto util.`;
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
        detalhe: ultimoErro || "Nenhum modelo retornou resposta valida.",
      });
    }

    const itemsText = limparLista(textoBruto);

    if (!itemsText) {
      return res.status(422).json({
        error: "A I.A. nao identificou itens ilegais com seguranca nessa imagem.",
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
