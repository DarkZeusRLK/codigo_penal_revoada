export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Credentials", true);
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") return res.status(200).end();

  const userToken = req.headers.authorization;
  const botToken = process.env.Discord_Bot_Token;

  // IDs dos Servidores
  const guildIdPolicia = process.env.Discord_Guild_ID;
  const guildIdOAB = process.env.Discord_Guild_ID_OAB;

  // Verificação 1: Variáveis da Vercel
  if (!botToken || !guildIdPolicia) {
    return res.status(500).json({
      error:
        "Erro de Configuração: Faltam variáveis na Vercel (Token ou Guild ID da Polícia).",
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

    // --- FUNÇÃO AUXILIAR PARA CHECAR SERVIDOR ---
    async function checarServidor(guildId) {
      if (!guildId) return { status: 404 }; // Se não tiver ID configurado, ignora
      const url = `https://discord.com/api/v10/guilds/${guildId}/members/${userId}`;
      return await fetch(url, {
        headers: { Authorization: `Bot ${botToken}` },
      });
    }

    // PASSO 2: Verificar POLÍCIA
    const resPolicia = await checarServidor(guildIdPolicia);

    if (resPolicia.status === 200) {
      // É POLICIAL!
      return res.status(200).json({
        authorized: true,
        username: userData.username,
        avatar: userData.avatar,
        id: userData.id,
        job: "Policial", // Identificador para o front-end
      });
    }

    // PASSO 3: Se não for polícia, Verificar OAB
    // Só verifica se a variável da OAB estiver configurada
    if (guildIdOAB) {
      const resOAB = await checarServidor(guildIdOAB);

      if (resOAB.status === 200) {
        // É ADVOGADO!
        return res.status(200).json({
          authorized: true,
          username: userData.username,
          avatar: userData.avatar,
          id: userData.id,
          job: "Advogado", // Identificador para o front-end
        });
      }
    }

    // PASSO 4: Se chegou aqui, não é nem Polícia nem OAB

    // Verifica erros de permissão do Bot (códigos 401/403 no request da API)
    if (resPolicia.status === 401 || resPolicia.status === 403) {
      return res.status(500).json({
        error:
          "Erro do Bot: O Bot não tem permissão para ler os membros. Verifique se o Bot está no servidor.",
      });
    }

    // Retorna erro de acesso negado padrão
    return res.status(403).json({
      error: `Acesso Negado: O usuário ${userData.username} não foi encontrado na Polícia nem na OAB.`,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Erro interno na verificação." });
  }
}
