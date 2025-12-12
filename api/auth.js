export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Credentials", true);
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") return res.status(200).end();

  const userToken = req.headers.authorization;
  const botToken = process.env.DISCORD_BOT_TOKEN;
  const guildId = process.env.DISCORD_GUILD_ID;

  // Verificação 1: Variáveis da Vercel
  if (!botToken || !guildId) {
    return res.status(500).json({
      error:
        "Erro de Configuração: Faltam variáveis na Vercel (Token ou Guild ID).",
    });
  }

  if (!userToken)
    return res.status(401).json({ error: "Token de usuário não recebido." });

  try {
    // PASSO 1: Descobrir quem é o usuário
    const userRes = await fetch("https://discord.com/api/users/@me", {
      headers: { Authorization: userToken },
    });

    if (!userRes.ok)
      return res.status(401).json({
        error: "Login expirou ou token inválido. Tente logar novamente.",
      });

    const userData = await userRes.json();
    const userId = userData.id;

    // PASSO 2: Verificar se ele está no servidor (Usando o Bot)
    const memberUrl = `https://discord.com/api/v10/guilds/${guildId}/members/${userId}`;

    const memberRes = await fetch(memberUrl, {
      headers: { Authorization: `Bot ${botToken}` },
    });

    // --- ANÁLISE DO RESULTADO DO DISCORD ---

    if (memberRes.status === 200) {
      // SUCESSO!
      return res.status(200).json({
        authorized: true,
        username: userData.username,
        avatar: userData.avatar,
        id: userData.id,
      });
    } else if (memberRes.status === 404) {
      // O Discord disse "Não encontrado". Isso significa que o usuário NÃO está no servidor.
      // OU que o ID do servidor está errado.
      return res.status(403).json({
        error: `Acesso Negado: O usuário ${userData.username} não foi encontrado no Servidor (ID: ${guildId}). Entre no Discord da Polícia.`,
      });
    } else if (memberRes.status === 401 || memberRes.status === 403) {
      // O Bot não tem permissão para olhar.
      return res.status(500).json({
        error:
          "Erro do Bot: O Bot não tem permissão ou o Token está errado. Verifique as 'Intents' no Developer Portal.",
      });
    } else {
      // Outro erro
      return res
        .status(500)
        .json({ error: `Erro inesperado do Discord: ${memberRes.status}` });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Erro interno na verificação." });
  }
}
