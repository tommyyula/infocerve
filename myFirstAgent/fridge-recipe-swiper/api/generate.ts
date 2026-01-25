import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { v4 as uuidv4 } from 'uuid';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { ingredients } = req.body;

    if (!ingredients || !Array.isArray(ingredients) || ingredients.length === 0) {
      return res.status(400).json({ message: '请提供食材列表' });
    }

    const ingredientNames = ingredients.map((i: { name: string }) => i.name).join('、');

    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    const prompt = `基于以下食材，生成 5-8 个可以制作的菜谱：

食材：${ingredientNames}

请以 JSON 格式返回菜谱列表，格式如下：
{
  "recipes": [
    {
      "name": "菜名",
      "description": "简短描述（20-30字）",
      "ingredients": [
        { "name": "食材名", "amount": "用量", "required": true }
      ],
      "steps": ["步骤1", "步骤2", "步骤3"],
      "cookingTime": 15,
      "difficulty": "easy"
    }
  ]
}

注意：
1. 只返回 JSON，不要其他文字
2. 所有文字用中文
3. cookingTime 是分钟数
4. difficulty 只能是 "easy"、"medium"、"hard" 之一
5. required 表示该食材是否必须，true 表示必须有，false 表示可选
6. 优先使用用户提供的食材
7. 可以添加常见调料（如盐、酱油、油等）
8. 菜谱要多样化，包括不同难度和烹饪时间
9. 步骤要简洁明了`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Parse JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('无法解析 AI 响应');
    }

    const data = JSON.parse(jsonMatch[0]);

    // Add unique IDs to recipes
    const recipes = (data.recipes || []).map((recipe: Record<string, unknown>) => ({
      ...recipe,
      id: uuidv4(),
    }));

    return res.status(200).json({ recipes });
  } catch (error) {
    console.error('Generate error:', error);
    return res.status(500).json({
      message: error instanceof Error ? error.message : '食谱生成失败',
    });
  }
}
