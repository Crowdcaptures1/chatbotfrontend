export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { messages, assistant_id } = req.body;

    const openaiRes = await fetch(`https://api.openai.com/v1/threads`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        messages,
        assistant_id,
        model: "gpt-4o"
      })
    });

    const result = await openaiRes.json();
    res.status(200).json(result);
  } catch (err) {
    console.error("OpenAI Proxy Error:", err);
    res.status(500).json({ error: "Failed to reach OpenAI API" });
  }
}
