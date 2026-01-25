import express from 'express';
import cors from 'cors';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// Test endpoint
app.get('/api/test', (req, res) => {
  res.json({
    message: 'API is working!',
    hasApiKey: !!process.env.GEMINI_API_KEY,
  });
});

// Recognize endpoint
app.post('/api/recognize', async (req, res) => {
  try {
    const { image } = req.body;

    if (!image) {
      return res.status(400).json({ message: '请提供图片' });
    }

    const base64Data = image.replace(/^data:image\/\w+;base64,/, '');
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    const prompt = `分析这张冰箱食材照片，识别所有可见的食材。

请以 JSON 格式返回食材列表，格式如下：
{
  "ingredients": [
    { "name": "食材名称", "confidence": 0.9 }
  ]
}

注意：
1. 只返回 JSON，不要其他文字
2. name 用中文
3. confidence 表示识别置信度，0-1 之间`;

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
    const jsonMatch = text.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
      throw new Error('无法解析 AI 响应');
    }

    const data = JSON.parse(jsonMatch[0]);
    res.json({ ingredients: data.ingredients || [] });
  } catch (error) {
    console.error('Recognize error:', error);
    res.status(500).json({ message: error.message || '食材识别失败' });
  }
});

// Generate endpoint
app.post('/api/generate', async (req, res) => {
  try {
    const { ingredients } = req.body;

    if (!ingredients || ingredients.length === 0) {
      return res.status(400).json({ message: '请提供食材列表' });
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    const ingredientNames = ingredients.map(i => i.name).join('、');

    const prompt = `根据以下食材推荐5个家常菜食谱：${ingredientNames}

请以 JSON 格式返回，格式如下：
{
  "recipes": [
    {
      "id": "unique-id",
      "name": "菜名",
      "description": "简短描述",
      "ingredients": [{ "name": "食材", "amount": "用量" }],
      "steps": ["步骤1", "步骤2"],
      "cookingTime": 15,
      "difficulty": "easy"
    }
  ]
}

注意：只返回 JSON，difficulty 只能是 easy/medium/hard`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    const jsonMatch = text.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
      throw new Error('无法解析 AI 响应');
    }

    const data = JSON.parse(jsonMatch[0]);
    res.json({ recipes: data.recipes || [] });
  } catch (error) {
    console.error('Generate error:', error);
    res.status(500).json({ message: error.message || '食谱生成失败' });
  }
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`API server running on http://localhost:${PORT}`);
  console.log(`GEMINI_API_KEY: ${process.env.GEMINI_API_KEY ? 'Set' : 'Missing'}`);
});
