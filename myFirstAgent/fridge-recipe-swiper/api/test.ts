import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(req: VercelRequest, res: VercelResponse) {
  return res.status(200).json({
    message: 'API is working!',
    env: process.env.GEMINI_API_KEY ? 'API key is set' : 'API key is missing',
    method: req.method,
  });
}
