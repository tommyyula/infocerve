import type { VercelRequest, VercelResponse } from '@vercel/node';
import { kv } from '@vercel/kv';

const FAVORITES_KEY = 'fridge-recipe:favorites';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { id } = req.query;

  if (req.method !== 'DELETE') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ message: '请提供有效的食谱 ID' });
  }

  try {
    // Get all favorites
    const favorites = await kv.lrange(FAVORITES_KEY, 0, -1);

    // Find and remove the matching favorite
    for (const f of favorites) {
      const parsed = typeof f === 'string' ? JSON.parse(f) : f;
      if (parsed.id === id) {
        await kv.lrem(FAVORITES_KEY, 1, typeof f === 'string' ? f : JSON.stringify(f));
        break;
      }
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Delete favorite error:', error);
    return res.status(500).json({
      message: error instanceof Error ? error.message : '删除失败',
    });
  }
}
