import { createHash, createHmac, timingSafeEqual } from 'node:crypto';

const cookieName = 'omega_access';
const sessionSeconds = 12 * 60 * 60;
const digest = value => createHash('sha256').update(value).digest();
const signature = (expiry, secret) => createHmac('sha256', secret).update(`omega:${expiry}`).digest('hex');
const equal = (a, b) => timingSafeEqual(digest(a), digest(b));

export default function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  const secret = process.env.OMEGA_ACCESS_PASSWORD;
  if (!secret) return res.status(503).json({ error: 'not_configured' });
  if (req.method === 'GET') {
    const token = (req.headers.cookie || '').split(';').map(v => v.trim()).find(v => v.startsWith(`${cookieName}=`))?.slice(cookieName.length + 1) || '';
    const [expiry, mac, extra] = token.split('.');
    const valid = !extra && /^\d{10,13}$/.test(expiry || '') && /^[a-f0-9]{64}$/.test(mac || '') && Number(expiry) > Date.now() && Number(expiry) <= Date.now() + sessionSeconds * 1000 && equal(mac, signature(expiry, secret));
    return res.status(valid ? 200 : 401).json({ authenticated: !!valid });
  }
  if (req.method !== 'POST') return res.status(405).json({ error: 'method_not_allowed' });
  const origin = req.headers.origin;
  if (origin) {
    try { if (new URL(origin).host !== req.headers.host) return res.status(403).json({ error: 'invalid_origin' }); }
    catch { return res.status(403).json({ error: 'invalid_origin' }); }
  }
  const password = req.body && typeof req.body === 'object' ? req.body.password : undefined;
  if (typeof password !== 'string' || password.length > 256 || !equal(password, secret)) return res.status(401).json({ error: 'invalid_password' });
  const expiry = String(Date.now() + sessionSeconds * 1000);
  const secure = req.headers['x-forwarded-proto'] === 'https' ? '; Secure' : '';
  res.setHeader('Set-Cookie', `${cookieName}=${expiry}.${signature(expiry, secret)}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${sessionSeconds}${secure}`);
  return res.status(200).json({ authenticated: true });
}
