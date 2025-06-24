export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { messages } = req.body;
    const assistant_id = process.env.ASSISTANT_ID;

    if (!assistant_id) {
      throw new Error("Missing ASSISTANT_ID in environment");
    }

    // 1. Create a thread
    const threadRes = await fetch("https://api.openai.com/v1/threads", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      }
    });

    const thread = await threadRes.json();

    // 2. Post user message to thread
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
      body: JSON.stringify({ assistant_id })
    });

    const run = await runRes.json();

    // 4. Poll for completion (max ~7.5s)
    let status = run.status;
    let checks = 0;
    const maxChecks = 5;

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

    if (status !== "completed") {
      return res.status(200).json({
        reply: "Got it! I’ve submitted your design. A mockup will appear here soon — feel free to continue or ask anything else in the meantime."
      });
    }

    // 5. Get latest assistant message
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

    return res.status(200).json({
      reply: lastMessage || "Assistant responded but no message was found."
    });

  } catch (err) {
    console.error("Chat API Error:", err);
    res.status(500).json({ error: "Assistant error. Please try again shortly." });
  }
}
