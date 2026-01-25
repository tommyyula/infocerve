import type { VercelRequest, VercelResponse } from '@vercel/node';
import { kv } from '@vercel/kv';

const FAVORITES_KEY = 'fridge-recipe:favorites';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method === 'GET') {
      // Get all favorites
      const favorites = await kv.lrange(FAVORITES_KEY, 0, -1);
      return res.status(200).json({
        favorites: favorites.map((f) => (typeof f === 'string' ? JSON.parse(f) : f)),
      });
    }

    if (req.method === 'POST') {
      // Add a favorite
      const { recipe } = req.body;

      if (!recipe || !recipe.id) {
        return res.status(400).json({ message: '请提供有效的食谱' });
      }

      // Check if already exists
      const favorites = await kv.lrange(FAVORITES_KEY, 0, -1);
      const exists = favorites.some((f) => {
        const parsed = typeof f === 'string' ? JSON.parse(f) : f;
        return parsed.id === recipe.id;
      });

      if (!exists) {
        await kv.lpush(FAVORITES_KEY, JSON.stringify(recipe));
      }

      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ message: 'Method not allowed' });
  } catch (error) {
    console.error('Favorites error:', error);
    return res.status(500).json({
      message: error instanceof Error ? error.message : '操作失败',
    });
  }
}
