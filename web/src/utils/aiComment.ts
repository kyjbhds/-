export async function generateStudentComment(
  studentName: string,
  subject: string,
  recentScores: number[],
  knowledgePoints: string[],
  improvements: string[],
  weaknesses: string[],
  customPrompt?: string
): Promise<string> {
  const apiKey = import.meta.env.VITE_GLM_API_KEY || '';
  if (!apiKey) {
    throw new Error('请先配置 GLM API Key');
  }

  const avgScore = recentScores.length > 0 
    ? (recentScores.reduce((a, b) => a + b, 0) / recentScores.length).toFixed(1)
    : '暂无';

  const latestScore = recentScores.length > 0 ? recentScores[recentScores.length - 1] : '暂无';
  const improvement = recentScores.length >= 2 && recentScores[recentScores.length - 1] > recentScores[0];

  const prompt = customPrompt || `请作为一名${subject}老师，为学生${studentName}生成一份150-200字的学习评语。

学生信息：
- 最近${recentScores.length}次课堂表现评分：${recentScores.join(' / ')} (满分5分)
- 平均评分：${avgScore}
- 最近一次评分：${latestScore}
- 整体趋势：${improvement ? '进步' : '稳定'}
- 已掌握的知识点：${knowledgePoints.join('、') || '暂无'}
- 有进步的方面：${improvements.join('、') || '暂无'}
- 需要加强的方面：${weaknesses.join('、') || '暂无'}

要求：
1. 语言亲切，鼓励为主
2. 肯定学生的努力和进步
3. 指出具体需要改进的地方
4. 给出具体的建议
5. 150-200字左右

请直接输出评语内容，不要其他格式。`;

  try {
    const response = await fetch('https://open.bigmodel.cn/api/paas/v4/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'glm-4-flash',
        messages: [
          {
            role: 'system',
            content: '你是一名有经验的家教老师，善于鼓励学生，评语真诚具体。'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.8,
        max_tokens: 500,
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error?.message || 'AI生成失败');
    }

    return data.choices[0].message.content.trim();
  } catch (error) {
    console.error('AI评语生成失败:', error);
    throw error;
  }
}

export function generateTemplateComment(
  studentName: string,
  subject: string,
  score: number,
  improvements: string[]
): string {
  const scoreComment = score >= 4 ? '表现优秀' : score >= 3 ? '表现良好' : '需要加强';
  const improveText = improvements.length > 0 
    ? `在${improvements.join('、')}方面有明显进步。` 
    : '';

  return `${studentName}同学在${subject}学习中${scoreComment}。${improveText}希望你继续保持学习热情，多做练习题，及时复习巩固。相信只要坚持努力，你一定能取得更大的进步！加油！`;
}
