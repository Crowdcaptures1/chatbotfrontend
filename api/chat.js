export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { messages, assistant_id } = req.body;

    // 1. Create a thread
    const threadRes = await fetch("https://api.openai.com/v1/threads", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      }
    });

    const thread = await threadRes.json();

    // 2. Post message to thread
    await fetch(`https://api.openai.com/v1/threads/${thread.id}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        role: "user",
        content: messages[0].content
      })
    });

    // 3. Start assistant run
    const runRes = await fetch(`https://api.openai.com/v1/threads/${thread.id}/runs`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        assistant_id
      })
    });

    const run = await runRes.json();

    // 4. Poll until run completes
let status = run.status;
const maxChecks = 5; // 5 x 1.5s = 7.5s total max
let checks = 0;

while (status !== "completed" && status !== "failed" && checks < maxChecks) {
  await new Promise((resolve) => setTimeout(resolve, 1500));

  const statusCheck = await fetch(
    `https://api.openai.com/v1/threads/${thread.id}/runs/${run.id}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
      }
    }
  );

  const statusData = await statusCheck.json();
  status = statusData.status;
  checks++;
}

console.log("Polling ended:", { status, checks });

if (status !== "completed") {
  return res.status(408).json({ error: "OpenAI assistant run is taking too long. Try again shortly." });
}

    // 5. Get the response message
    const messagesRes = await fetch(
      `https://api.openai.com/v1/threads/${thread.id}/messages`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
        }
      }
    );

    const messagesData = await messagesRes.json();
    const lastMessage = messagesData.data?.[0]?.content?.[0]?.text?.value;

    return res.status(200).json({ reply: lastMessage || "No message returned" });
  } catch (err) {
    console.error("Chat API Error:", err);
    res.status(500).json({ error: "OpenAI interaction failed." });
  }
}
