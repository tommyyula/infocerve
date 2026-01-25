import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { image } = req.body;

    if (!image) {
      return res.status(400).json({ message: '请提供图片' });
    }

    // Extract base64 data from data URL
    const base64Data = image.replace(/^data:image\/\w+;base64,/, '');

    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    const prompt = `分析这张冰箱食材照片，识别所有可见的食材。

请以 JSON 格式返回食材列表，格式如下：
{
  "ingredients": [
    { "name": "食材名称", "quantity": "大约数量（可选）", "confidence": 0.9 }
  ]
}

注意：
1. 只返回 JSON，不要其他文字
2. name 用中文
3. confidence 表示识别置信度，0-1 之间
4. 尽量识别所有可见食材
5. 如果无法识别某个物品，请跳过`;

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          mimeType: 'image/jpeg',
          data: base64Data,
        },
      },
    ]);

    const response = await result.response;
    const text = response.text();

    // Parse JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('无法解析 AI 响应');
    }

    const data = JSON.parse(jsonMatch[0]);

    return res.status(200).json({
      ingredients: data.ingredients || [],
    });
  } catch (error) {
    console.error('Recognize error:', error);
    return res.status(500).json({
      message: error instanceof Error ? error.message : '食材识别失败',
    });
  }
}
