import { kv } from '@vercel/kv';

// Proxies chat requests to the Anthropic API using a server-side key.
// Requires a Bearer token issued at signup/login (see /api/kv + index.html),
// so the endpoint can't be hit anonymously and run up your API bill.
export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  if (!token) {
    return res.status(401).json({ error: 'Not logged in' });
  }

  try {
    const session = await kv.get(`authtoken:${token}`);
    if (!session) {
      return res.status(401).json({ error: 'Invalid or expired session' });
    }
  } catch (e) {
    return res.status(401).json({ error: 'Could not verify session' });
  }

  const { prompt, maxTokens } = req.body || {};
  if (!prompt) {
    return res.status(400).json({ error: 'prompt is required' });
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        // Check console.anthropic.com/docs for the current model string —
        // this changes over time and the one below may be out of date.
        model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-5',
        max_tokens: maxTokens || 1000,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      return res.status(response.status).json({ error: errText });
    }

    const data = await response.json();
    const text = (data.content || []).map((b) => b.text || '').join('\n');
    return res.status(200).json({ text });
  } catch (e) {
    return res.status(500).json({ error: e.message || 'Unknown error calling Claude' });
  }
}
