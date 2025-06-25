const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { messages, assistant_id } = req.body;

  try {
    const thread = await openai.beta.threads.create();

    await openai.beta.threads.messages.create(thread.id, {
      role: 'user',
      content: messages[0].content,
    });

    const run = await openai.beta.threads.runs.create(thread.id, {
      assistant_id: assistant_id || process.env.asst_Iipk5uRob6IXSgf3t3OcoLVP,
    });

    // Poll until complete
    let status = 'in_progress';
    let finalRun;
    while (status !== 'completed' && status !== 'failed') {
      await new Promise(resolve => setTimeout(resolve, 2000));
      finalRun = await openai.beta.threads.runs.retrieve(thread.id, run.id);
      status = finalRun.status;
    }

    if (status === 'failed') {
      return res.status(500).json({ error: 'Assistant run failed' });
    }

    const messagesRes = await openai.beta.threads.messages.list(thread.id);
    const last = messagesRes.data.find(m => m.role === 'assistant');

    res.status(200).json({
      choices: [
        { message: { content: last?.content?.[0]?.text?.value || 'No response.' } },
      ],
    });
  } catch (err) {
    console.error('OpenAI error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}
