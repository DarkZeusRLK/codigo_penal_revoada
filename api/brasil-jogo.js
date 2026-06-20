export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Credentials", true);
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    const apiKey = process.env.FOOTBALL_API_KEY;
    if (!apiKey) {
      return res.status(200).json({ error: "FOOTBALL_API_KEY nao configurada", matches: [] });
    }

    const response = await fetch(
      "https://api.football-data.org/v4/teams/764/matches?limit=15",
      { headers: { "X-Auth-Token": apiKey } }
    );

    if (!response.ok) {
      return res.status(200).json({ error: "Erro externo: " + response.status, matches: [] });
    }

    const data = await response.json();
    res.status(200).json(data);
  } catch (err) {
    res.status(200).json({ error: err.message || "Erro interno", matches: [] });
  }
}
