const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  console.log('Request received:', req.method, req.body);

  if (req.method !== 'POST') {
    console.error('Invalid method');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { messages, assistant_id } = req.body;

  try {
    const thread = await openai.beta.threads.create();
    console.log('Created thread:', thread.id);

    await openai.beta.threads.messages.create(thread.id, {
      role: 'user',
      content: messages?.[0]?.content || 'No message content',
    });
    console.log('Message added to thread');

    const run = await openai.beta.threads.runs.create(thread.id, {
      assistant_id: assistant_id || process.env.ASSISTANT_ID,
    });
    console.log('Run started:', run.id);

    // Poll until complete
    let status = 'in_progress';
    let finalRun;
    while (status !== 'completed' && status !== 'failed') {
      await new Promise(resolve => setTimeout(resolve, 2000));
      finalRun = await openai.beta.threads.runs.retrieve(thread.id, run.id);
      status = finalRun.status;
      console.log('Polling status:', status);
    }

    if (status === 'failed') {
      console.error('Assistant run failed');
      return res.status(500).json({ error: 'Assistant run failed' });
    }

    const messagesRes = await openai.beta.threads.messages.list(thread.id);
    const last = messagesRes.data.find(m => m.role === 'assistant');
    const finalResponse = last?.content?.[0]?.text?.value || 'No response from assistant.';

    console.log('Assistant response:', finalResponse);
    res.status(200).json({
      choices: [{ message: { content: finalResponse } }],
    });
  } catch (err) {
    console.error('OpenAI error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}
