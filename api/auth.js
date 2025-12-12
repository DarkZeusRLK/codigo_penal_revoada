export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Credentials", true);
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") return res.status(200).end();

  const userToken = req.headers.authorization;
  const botToken = process.env.DISCORD_BOT_TOKEN;
  const guildId = process.env.DISCORD_GUILD_ID;

  if (!botToken || !guildId || !userToken) {
    return res.status(401).json({ error: "Configuração ou Token ausente." });
  }

  try {
    // 1. Identifica o Usuário
    const userRes = await fetch("https://discord.com/api/users/@me", {
      headers: { Authorization: userToken },
    });

    if (!userRes.ok) return res.status(401).json({ error: "Token inválido." });
    const userData = await userRes.json();

    // 2. Busca o Membro no Servidor (COM CARGOS)
    const memberUrl = `https://discord.com/api/v10/guilds/${guildId}/members/${userData.id}`;
    const memberRes = await fetch(memberUrl, {
      headers: { Authorization: `Bot ${botToken}` },
    });

    if (memberRes.status === 200) {
      const memberData = await memberRes.json();

      return res.status(200).json({
        authorized: true,
        username: userData.username,
        avatar: userData.avatar,
        id: userData.id,
        roles: memberData.roles, // <--- O SEGREDINHO: Devolvemos os cargos aqui
        nick: memberData.nick,
      });
    } else {
      return res
        .status(403)
        .json({ error: "Você não está no servidor da Polícia." });
    }
  } catch (error) {
    return res.status(500).json({ error: "Erro interno." });
  }
}
