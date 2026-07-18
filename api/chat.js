function json(res, status, data) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

const MODELS = [
  'nvidia/nemotron-3-super-120b-a12b:free',
  'nvidia/nemotron-3-nano-30b-a3b:free',
  'nvidia/nemotron-3-ultra-550b-a55b:free',
  'google/gemma-4-26b-a4b-it:free',
  'tencent/hy3:free',
];

async function callOpenRouter(model, systemPrompt, messages, stream = false) {
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages.slice(-20),
      ],
      max_tokens: 1024,
      stream,
    }),
  });
  if (!response.ok) {
    const err = await response.text();
    throw new Error(`${model}: ${response.status} ${err}`);
  }
  if (stream) return response;
  const data = await response.json();
  return data.choices?.[0]?.message?.content ?? null;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    json(res, 405, { error: 'Method not allowed' });
    return;
  }

  let body;
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  } catch {
    json(res, 400, { error: 'Invalid JSON' });
    return;
  }

  const { systemPrompt, messages } = body;
  if (!systemPrompt || !messages) {
    json(res, 400, { error: 'Missing systemPrompt or messages' });
    return;
  }

  const isStream = req.query?.stream === '1';

  if (isStream) {
    for (const model of MODELS) {
      try {
        const openRouterRes = await callOpenRouter(model, systemPrompt, messages, true);
        res.writeHead(200, {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        });
        const reader = openRouterRes.body.getReader();
        const decoder = new TextDecoder();
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          res.write(decoder.decode(value));
        }
        res.end();
        return;
      } catch {}
    }
    json(res, 200, { text: "I'm sorry, I'm having trouble connecting right now. Please try again." });
    return;
  }

  for (const model of MODELS) {
    try {
      const text = await callOpenRouter(model, systemPrompt, messages);
      if (text) {
        json(res, 200, { text });
        return;
      }
    } catch {}
  }

  json(res, 200, { text: "I'm sorry, I'm having trouble connecting right now. Please try again." });
}
