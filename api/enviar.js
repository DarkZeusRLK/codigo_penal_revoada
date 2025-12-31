import { IncomingForm } from "formidable";
import FormData from "form-data";
import fs from "fs";
import fetch from "node-fetch";

// Desativa o processamento padrão do Vercel para permitir upload de arquivos
export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  // Configuração de CORS (Permite que seu site converse com a API)
  res.setHeader("Access-Control-Allow-Credentials", true);
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version"
  );

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método não permitido. Use POST." });
  }

  // 1. Detecta o tipo de envio (Prisão ou Fiança) pela URL ou Query
  const { tipo } = req.query; // ex: /api/enviar?tipo=fianca

  // 2. Seleciona o Webhook correto do arquivo .env
  const webhookUrl =
    tipo === "fianca"
      ? process.env.WEBHOOK_FIANCA_SECRET
      : process.env.WEBHOOK_PRISAO_SECRET;

  if (!webhookUrl) {
    console.error("ERRO: Webhook não configurado nas variáveis de ambiente.");
    return res
      .status(500)
      .json({ error: "Erro de configuração do servidor (Webhook ausente)." });
  }

  // 3. Configura o leitor de formulário
  const form = new IncomingForm({
    keepExtensions: true, // Mantém a extensão .jpg/.png
    multiples: true, // Permite múltiplos arquivos
  });

  // 4. Processa os dados que vieram do script.js
  form.parse(req, async (err, fields, files) => {
    if (err) {
      console.error("Erro ao ler formulário:", err);
      return res.status(500).json({ error: "Erro ao processar dados." });
    }

    try {
      // Função auxiliar para limpar arrays que o formidable cria
      const getVal = (val) => (Array.isArray(val) ? val[0] : val);

      // Pegamos os dados de texto
      const nomePreso = getVal(fields.nome_preso);
      const rg = getVal(fields.rg);
      const pena = getVal(fields.pena);
      const multa = getVal(fields.multa);
      const itens = getVal(fields.itens);
      const fiancaPaga = getVal(fields.fianca_paga);
      const oficialNome = getVal(fields.oficial_nome);
      const oficialId = getVal(fields.oficial_id);
      const dataHora = getVal(fields.data_hora);

      // Parse dos JSONs complexos
      const crimes = JSON.parse(getVal(fields.crimes) || "[]");
      const atenuantes = JSON.parse(getVal(fields.atenuantes) || "[]");
      const participantes = JSON.parse(getVal(fields.participantes) || "[]");

      // 5. Monta o Embed do Discord (O visual do relatório)
      const embed = {
        title:
          tipo === "fianca"
            ? "💰 RELATÓRIO DE FIANÇA PAGA"
            : "🚔 RELATÓRIO DE PRISÃO",
        color: tipo === "fianca" ? 16766720 : 15548997, // Dourado ou Vermelho
        fields: [
          {
            name: "👮 Oficial Responsável",
            value: `${oficialNome} (<@${oficialId}>)`,
            inline: false,
          },
          {
            name: "👤 Preso",
            value: `**${nomePreso}** (RG: ${rg})`,
            inline: true,
          },
          { name: "⚖️ Pena Total", value: `${pena}`, inline: true },
          { name: "💸 Multa Total", value: `${multa}`, inline: true },
          {
            name: "📦 Itens Apreendidos",
            value: `\`\`\`${itens || "Nenhum"}\`\`\``,
            inline: false,
          },
          {
            name: "📜 Crimes",
            value:
              crimes.map((c) => `• ${c.nome}`).join("\n") || "Não informado",
            inline: false,
          },
        ],
        footer: { text: `Sistema Policial • ${dataHora}` },
      };

      if (atenuantes.length > 0) {
        embed.fields.push({
          name: "📉 Atenuantes / Obs",
          value: atenuantes.join(", "),
          inline: false,
        });
      }

      if (participantes.length > 0) {
        const partsTexto = participantes.map((p) => `<@${p.id}>`).join(", ");
        embed.fields.push({
          name: "🤝 Oficiais Auxiliares",
          value: partsTexto,
          inline: false,
        });
      }

      // 6. Prepara o envio para o Discord
      const discordFormData = new FormData();

      // Anexa o JSON do Embed
      discordFormData.append(
        "payload_json",
        JSON.stringify({ embeds: [embed] })
      );

      // Função para anexar arquivo se existir
      const anexar = (arquivo, nomeNoDiscord) => {
        if (!arquivo) return;
        const fileObj = Array.isArray(arquivo) ? arquivo[0] : arquivo;
        if (fileObj && fileObj.filepath) {
          discordFormData.append(
            nomeNoDiscord,
            fs.createReadStream(fileObj.filepath),
            fileObj.originalFilename
          );
        }
      };

      // 7. ANEXA OS ARQUIVOS (AQUI ESTÁ O DEPÓSITO!)
      anexar(files.arquivo_preso, "files[0]");
      anexar(files.arquivo_mochila, "files[1]");

      // >>> AQUI ELE PEGA O SEU ARQUIVO DE DEPÓSITO <<<
      if (files.arquivo_deposito) {
        anexar(files.arquivo_deposito, "files[2]");
      }

      if (files.arquivo_extra) {
        anexar(files.arquivo_extra, "files[3]");
      }

      // 8. Envia para o Webhook
      const response = await fetch(webhookUrl, {
        method: "POST",
        body: discordFormData,
        headers: discordFormData.getHeaders(),
      });

      if (response.ok) {
        return res.status(200).json({ success: true });
      } else {
        const textoErro = await response.text();
        console.error("Erro Discord:", textoErro);
        return res.status(response.status).json({
          error: "O Discord recusou o relatório.",
          details: textoErro,
        });
      }
    } catch (processError) {
      console.error("Erro no processamento:", processError);
      return res
        .status(500)
        .json({ error: "Erro interno ao processar relatório." });
    }
  });
}
