interface Req { headers: Record<string, string | undefined> }
interface Res {
  status: (code: number) => Res;
  send: (body: string) => void;
  setHeader: (n: string, v: string) => void;
}

export default function handler(req: Req, res: Res) {
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Cache-Control', 's-maxage=86400');
  const baseUrl = process.env.PUBLIC_BASE_URL || `https://${req.headers['host'] || ''}`;
  res.status(200).send(`User-agent: *
Allow: /
Disallow: /admin

Sitemap: ${baseUrl}/sitemap.xml
`);
}
