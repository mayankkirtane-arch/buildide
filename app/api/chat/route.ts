import { routeModel, SYSTEM_PROMPT } from '@/lib/router';

// Agent API: BYOK. The user's OpenRouter key is sent per-request from the browser
// (stored encrypted client-side). Server never stores it. Proxies to OpenRouter.
export async function POST(req: Request) {
  try {
    const { messages, apiKey } = await req.json();

    if (!apiKey || typeof apiKey !== 'string' || !apiKey.startsWith('sk-or-')) {
      return Response.json(
        { error: 'A valid OpenRouter API key is required. Get one free at openrouter.ai/keys' },
        { status: 401 }
      );
    }
    if (!Array.isArray(messages) || messages.length === 0) {
      return Response.json({ error: 'No messages provided.' }, { status: 400 });
    }

    const lastUser = [...messages].reverse().find((m: any) => m.role === 'user');
    const choice = routeModel(lastUser?.content ?? '');

    const upstream = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': req.headers.get('origin') ?? 'http://localhost:3000',
        'X-Title': 'BuildIDE',
      },
      body: JSON.stringify({
        model: choice.model,
        messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...messages],
        stream: false,
        max_tokens: 4000,
      }),
    });

    if (!upstream.ok) {
      const detail = await upstream.text();
      return Response.json(
        { error: `Model provider error (${upstream.status}): ${detail.slice(0, 300)}` },
        { status: upstream.status }
      );
    }

    const data = await upstream.json();
    const content = data.choices?.[0]?.message?.content ?? '';
    return Response.json({ content, model: choice.model, tier: choice.tier, reason: choice.reason });
  } catch (err: any) {
    return Response.json({ error: err?.message ?? 'Unknown error' }, { status: 500 });
  }
}
