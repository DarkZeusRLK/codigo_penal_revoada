export default async function handler(req, res) {
  // Configuração CORS
  res.setHeader("Access-Control-Allow-Credentials", true);
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") return res.status(200).end();

  const userToken = req.headers.authorization; // Token do usuário (que veio do login)
  const botToken = process.env.Discord_Bot_Token; // Token do seu Bot (Vercel)
  const guildId = process.env.Discord_Guild_ID; // ID do Servidor (Vercel)

  if (!userToken) return res.status(401).json({ error: "Token ausente." });

  try {
    // 1. Descobrir o ID do usuário usando o Token dele
    const userResponse = await fetch("https://discord.com/api/users/@me", {
      headers: { Authorization: userToken }, // Usa o token do usuário aqui (Bearer ...)
    });

    if (!userResponse.ok)
      return res.status(401).json({ error: "Token de usuário inválido." });
    const userData = await userResponse.json();
    const userId = userData.id;

    // 2. Perguntar ao Bot se esse ID está no servidor da Polícia
    const memberResponse = await fetch(
      `https://discord.com/api/v10/guilds/${guildId}/members/${userId}`,
      {
        headers: { Authorization: `Bot ${botToken}` }, // Usa o token do BOT aqui
      }
    );

    if (memberResponse.status === 200) {
      // SUCESSO: Está no servidor!
      return res.status(200).json({
        authorized: true,
        username: userData.username,
        avatar: userData.avatar,
        id: userData.id,
      });
    } else if (memberResponse.status === 404) {
      // ERRO: Não está no servidor
      return res
        .status(403)
        .json({ error: "Você não é membro do Discord da Polícia." });
    } else {
      throw new Error("Erro ao verificar membro.");
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Erro interno de verificação." });
  }
}
