import { kv } from '@vercel/kv';

// Generic key-value store used for accounts, saved CV history, and auth tokens.
// NOTE: this endpoint is intentionally unauthenticated (signup/login need to
// read/write it before a token exists). It's low-risk to leave open since it
// doesn't cost money per-call the way /api/claude does, but if you want to
// harden it further later, add rate limiting or move accounts to a real
// auth provider like Supabase Auth.
export default async function handler(req, res) {
  // Never let the browser or Vercel's edge cache these responses — account
  // and session data must always be read fresh, or logins/signups can see
  // stale "not found" results even after the data actually changed.
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');

  try {
    if (req.method === 'GET') {
      const { key, prefix } = req.query;

      if (prefix !== undefined) {
        const pattern = prefix ? `${prefix}*` : '*';
        const keys = await kv.keys(pattern);
        return res.status(200).json({ keys });
      }

      if (!key) return res.status(400).json({ error: 'key is required' });
      const value = await kv.get(key);
      if (value === null || value === undefined) {
        return res.status(404).json({ error: 'not found' });
      }
      // @vercel/kv auto-deserializes JSON on read, so `value` may already be
      // an object here instead of the original string. The frontend always
      // expects a string back (it calls JSON.parse itself), so normalize.
      const outValue = typeof value === 'string' ? value : JSON.stringify(value);
      return res.status(200).json({ value: outValue });
    }

    if (req.method === 'POST') {
      const { key, value } = req.body || {};
      if (!key) return res.status(400).json({ error: 'key is required' });
      await kv.set(key, value);
      return res.status(200).json({ ok: true });
    }

    if (req.method === 'DELETE') {
      const { key } = req.query;
      if (!key) return res.status(400).json({ error: 'key is required' });
      await kv.del(key);
      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (e) {
    return res.status(500).json({ error: e.message || 'Unknown storage error' });
  }
}
