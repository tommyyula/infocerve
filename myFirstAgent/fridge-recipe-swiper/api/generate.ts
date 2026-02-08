import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { v4 as uuidv4 } from 'uuid';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { ingredients, language = 'zh' } = req.body;

    console.log('Generate API called with language:', language);
    console.log('Request body:', JSON.stringify(req.body).slice(0, 500));

    if (!ingredients || !Array.isArray(ingredients) || ingredients.length === 0) {
      return res.status(400).json({ message: language === 'zh' ? '请提供食材列表' : 'Please provide ingredient list' });
    }

    const ingredientNames = ingredients.map((i: { name: string }) => i.name).join(language === 'zh' ? '、' : ', ');

    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    const prompt = language === 'zh'
      ? `基于以下食材，生成 5-8 个可以制作的菜谱：

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
9. 步骤要简洁明了`
      : `Based on the following ingredients, generate 5-8 recipes:

Ingredients: ${ingredientNames}

Return the recipe list in JSON format as follows:
{
  "recipes": [
    {
      "name": "Recipe name",
      "description": "Brief description (20-30 words)",
      "ingredients": [
        { "name": "Ingredient name", "amount": "Amount", "required": true }
      ],
      "steps": ["Step 1", "Step 2", "Step 3"],
      "cookingTime": 15,
      "difficulty": "easy"
    }
  ]
}

Notes:
1. Return only JSON, no other text
2. All text in English
3. cookingTime is in minutes
4. difficulty can only be "easy", "medium", or "hard"
5. required indicates if the ingredient is essential (true) or optional (false)
6. Prioritize using the provided ingredients
7. You can add common seasonings (salt, soy sauce, oil, etc.)
8. Recipes should be diverse, with varying difficulty and cooking times
9. Steps should be clear and concise`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Parse JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error(language === 'zh' ? '无法解析 AI 响应' : 'Unable to parse AI response');
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
    const lang = req.body?.language || 'zh';
    return res.status(500).json({
      message: error instanceof Error ? error.message : (lang === 'zh' ? '食谱生成失败' : 'Failed to generate recipes'),
    });
  }
}
