export interface AIRecognitionResult {
  topic: string;
  subject: string;
  knowledgePoints: string[];
  notes: string;
  performance: number;
}

// GLM-4-Flash API 配置
const GLM_API_KEY = import.meta.env.VITE_GLM_API_KEY || '';
const GLM_API_URL = 'https://open.bigmodel.cn/api/paas/v4/chat/completions';

export async function recognizeLessonImage(imageBase64: string): Promise<AIRecognitionResult> {
  const prompt = `请分析这张课堂照片，识别板书或练习内容，提取以下信息：
1. 课程主题（如：二次函数图像与性质）
2. 科目（数学/物理/化学/生物）
3. 涉及的知识点列表
4. 课堂情况简要描述
5. 学生表现评分（1-5分）

请以JSON格式返回：
{
  "topic": "课程主题",
  "subject": "科目",
  "knowledgePoints": ["知识点1", "知识点2"],
  "notes": "课堂情况描述",
  "performance": 4
}`;

  try {
    const response = await fetch(GLM_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GLM_API_KEY}`
      },
      body: JSON.stringify({
        model: 'glm-4-flash',
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: prompt },
              { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${imageBase64}` } }
            ]
          }
        ],
        max_tokens: 1000
      })
    });

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '{}';
    
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    
    return {
      topic: '未识别',
      subject: '数学',
      knowledgePoints: [],
      notes: content,
      performance: 3
    };
  } catch (e) {
    console.error('AI识别失败', e);
    return {
      topic: '识别失败',
      subject: '数学',
      knowledgePoints: [],
      notes: 'AI识别服务暂时不可用',
      performance: 3
    };
  }
}

export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
