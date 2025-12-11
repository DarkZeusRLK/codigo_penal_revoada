export default async function handler(request, response) {
  const botToken = process.env.Discord_Bot_Token;
  const guildId = process.env.Discord_Guild_Token;

  if (!botToken || !guildId) {
    return response
      .status(500)
      .json({ error: "Configuração de servidor ausente." });
  }

  try {
    // Busca os membros do servidor (limite de 1000 para garantir performance)
    const discordRes = await fetch(
      `https://discord.com/api/v10/guilds/${guildId}/members?limit=1000`,
      {
        headers: {
          Authorization: `Bot ${botToken}`,
        },
      }
    );

    if (!discordRes.ok) {
      throw new Error(`Erro Discord: ${discordRes.statusText}`);
    }

    const members = await discordRes.json();

    // Filtra para remover bots e pega apenas o que precisamos (Nome e ID)
    const listaFormatada = members
      .filter((m) => !m.user.bot) // Remove bots da lista
      .map((m) => ({
        id: m.user.id,
        // Usa o apelido do servidor se tiver, senão usa o nome de usuário
        nome: m.nick || m.user.global_name || m.user.username,
      }))
      .sort((a, b) => a.nome.localeCompare(b.nome)); // Ordena alfabético

    // Cacheia o resultado por 60 segundos para ser rápido
    response.setHeader("Cache-Control", "s-maxage=60, stale-while-revalidate");

    return response.status(200).json(listaFormatada);
  } catch (error) {
    console.error(error);
    return response.status(500).json({ error: "Falha ao buscar membros." });
  }
}
