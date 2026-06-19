/**
 * api/jobs.js — Vercel Serverless Function
 *
 * Add your Adzuna keys in Vercel:
 *   Project → Settings → Environment Variables
 *   ADZUNA_APP_ID  =  your_id
 *   ADZUNA_APP_KEY =  your_key
 *
 * Usage:
 *   /api/jobs?source=muse&category=Engineering&page=0
 *   /api/jobs?source=adzuna&q=software+engineer&page=1
 *   /api/jobs?source=health
 */

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'GET only' });

  const { source, category, page, q } = req.query;

  try {
    if (source === 'health') {
      return res.status(200).json({
        ok: true,
        adzuna: !!(process.env.ADZUNA_APP_ID && process.env.ADZUNA_APP_KEY),
      });
    }

    if (source === 'muse') {
      const cat = category || 'Engineering';
      const pg  = parseInt(page) || 0;
      const url = `https://www.themuse.com/api/public/jobs?page=${pg}&category=${encodeURIComponent(cat)}&level=Senior%20Level&level=Mid%20Level&descending=true`;
      const r = await fetch(url, { headers: { Accept: 'application/json' } });
      if (!r.ok) return res.status(r.status).json({ error: `Muse ${r.status}`, results: [] });
      return res.status(200).json(await r.json());
    }

    if (source === 'adzuna') {
      const id  = process.env.ADZUNA_APP_ID;
      const key = process.env.ADZUNA_APP_KEY;
      if (!id || !key) {
        return res.status(503).json({ error: 'Add ADZUNA_APP_ID + ADZUNA_APP_KEY in Vercel Environment Variables', results: [] });
      }
      const query = q || 'software engineer';
      const pg    = parseInt(page) || 1;
      const url   = `https://api.adzuna.com/v1/api/jobs/us/search/${pg}?app_id=${id}&app_key=${key}&results_per_page=20&what=${encodeURIComponent(query)}&content-type=application/json`;
      const r = await fetch(url, { headers: { Accept: 'application/json' } });
      if (!r.ok) return res.status(r.status).json({ error: `Adzuna ${r.status}`, results: [] });
      return res.status(200).json(await r.json());
    }

    return res.status(400).json({ error: 'Use ?source=muse, adzuna, or health' });
  } catch (err) {
    return res.status(500).json({ error: err.message, results: [] });
  }
}
