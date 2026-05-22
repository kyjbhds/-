const APP_ID = import.meta.env.VITE_FEISHU_APP_ID || '';
const APP_SECRET = import.meta.env.VITE_FEISHU_APP_SECRET || '';
const CHAT_ID = import.meta.env.VITE_FEISHU_CHAT_ID || '';

let cachedToken: { token: string; expire: number } | null = null;

async function getTenantAccessToken(): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.expire) {
    return cachedToken.token;
  }

  const response = await fetch('https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      app_id: APP_ID,
      app_secret: APP_SECRET,
    }),
  });

  const data = await response.json();
  if (data.code !== 0) {
    throw new Error(`获取token失败: ${data.msg}`);
  }

  cachedToken = {
    token: data.tenant_access_token,
    expire: Date.now() + (data.expire - 60) * 1000,
  };

  return cachedToken.token;
}

async function sendMessage(cardContent: any): Promise<boolean> {
  if (!APP_ID || !APP_SECRET || !CHAT_ID) {
    console.warn('飞书配置不完整，请检查环境变量');
    return false;
  }

  try {
    const token = await getTenantAccessToken();

    const response = await fetch(`https://open.feishu.cn/open-apis/im/v1/messages?receive_id_type=chat_id`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        receive_id: CHAT_ID,
        msg_type: 'interactive',
        content: JSON.stringify({ card: cardContent }),
      }),
    });

    const result = await response.json();
    if (result.code !== 0) {
      console.error('飞书发送失败:', result);
      return false;
    }
    return true;
  } catch (e) {
    console.error('飞书请求失败:', e);
    return false;
  }
}

interface NotifyPayload {
  studentName: string;
  lessonDate: string;
  subject: string;
  topic: string;
  score: number;
  homework: string;
  teacherNote: string;
  nextPlan: string;
  parentPhone?: string;
}

export async function sendLessonNotification(payload: NotifyPayload): Promise<boolean> {
  const scoreStars = '★'.repeat(Math.round(payload.score)) + '☆'.repeat(5 - Math.round(payload.score));

  const cardContent = {
    config: { wide_screen_mode: true },
    header: {
      title: { tag: 'plain_text', content: `📚 ${payload.studentName} 今日课程反馈` },
      template: 'blue',
    },
    elements: [
      {
        tag: 'div',
        fields: [
          { is_short: true, text: { tag: 'lark_md', content: `**📅 上课日期**\n${payload.lessonDate}` } },
          { is_short: true, text: { tag: 'lark_md', content: `**📖 科目**\n${payload.subject}` } },
          { is_short: true, text: { tag: 'lark_md', content: `**📝 课程主题**\n${payload.topic}` } },
          { is_short: true, text: { tag: 'lark_md', content: `**⭐ 课堂表现**\n${scoreStars} (${payload.score}分)` } },
        ],
      },
      { tag: 'hr' },
      {
        tag: 'div',
        text: { tag: 'lark_md', content: `**📝 作业完成情况**\n${payload.homework || '暂无'}` },
      },
      {
        tag: 'div',
        text: { tag: 'lark_md', content: `**💬 教师评语**\n${payload.teacherNote || '暂无'}` },
      },
      {
        tag: 'div',
        text: { tag: 'lark_md', content: `**📋 下节课计划**\n${payload.nextPlan || '待定'}` },
      },
      { tag: 'hr' },
      {
        tag: 'note',
        elements: [{ tag: 'plain_text', content: '本消息由学生成长管理系统自动发送' }],
      },
    ],
  };

  return sendMessage(cardContent);
}

interface ReportPayload {
  studentName: string;
  period: string;
  totalLessons: number;
  avgScore: number;
  knowledgeSummary: string;
  teacherComment: string;
  reportUrl?: string;
}

export async function sendReportNotification(payload: ReportPayload): Promise<boolean> {
  const cardContent = {
    config: { wide_screen_mode: true },
    header: {
      title: { tag: 'plain_text', content: `📊 ${payload.studentName} ${payload.period}学习报告` },
      template: 'green',
    },
    elements: [
      {
        tag: 'div',
        fields: [
          { is_short: true, text: { tag: 'lark_md', content: `**📚 总课时**\n${payload.totalLessons} 次` } },
          { is_short: true, text: { tag: 'lark_md', content: `**⭐ 平均表现**\n${payload.avgScore} 分` } },
        ],
      },
      { tag: 'hr' },
      {
        tag: 'div',
        text: { tag: 'lark_md', content: `**📖 知识点掌握情况**\n${payload.knowledgeSummary}` },
      },
      {
        tag: 'div',
        text: { tag: 'lark_md', content: `**💬 教师综合评价**\n${payload.teacherComment}` },
      },
      ...(payload.reportUrl
        ? [
            {
              tag: 'action',
              actions: [
                {
                  tag: 'button',
                  text: { tag: 'plain_text', content: '查看完整报告' },
                  type: 'primary',
                  url: payload.reportUrl,
                },
              ],
            },
          ]
        : []),
      { tag: 'hr' },
      {
        tag: 'note',
        elements: [{ tag: 'plain_text', content: '本消息由学生成长管理系统自动发送' }],
      },
    ],
  };

  return sendMessage(cardContent);
}

export async function sendWeeklyReminder(
  studentName: string,
  weakPoints: string[],
  nextLessonDate: string,
  materials: string[]
): Promise<boolean> {
  const weakPointsText = weakPoints.length > 0 ? weakPoints.map(p => `- ${p}`).join('\n') : '暂无薄弱点';
  const materialsText = materials.length > 0 ? materials.map(m => `- ${m}`).join('\n') : '暂无推荐资料';

  const cardContent = {
    config: { wide_screen_mode: true },
    header: {
      title: { tag: 'plain_text', content: `📢 ${studentName} 下周课前提醒` },
      template: 'orange',
    },
    elements: [
      {
        tag: 'div',
        text: { tag: 'lark_md', content: `**📅 下次上课时间**\n${nextLessonDate}` },
      },
      { tag: 'hr' },
      {
        tag: 'div',
        text: { tag: 'lark_md', content: `**⚠️ 薄弱知识点提醒**\n${weakPointsText}` },
      },
      {
        tag: 'div',
        text: { tag: 'lark_md', content: `**📚 推荐复习资料**\n${materialsText}` },
      },
      { tag: 'hr' },
      {
        tag: 'note',
        elements: [{ tag: 'plain_text', content: '本消息由学生成长管理系统自动发送' }],
      },
    ],
  };

  return sendMessage(cardContent);
}

export async function sendCustomMessage(
  title: string, 
  content: string, 
  template: 'blue' | 'green' | 'orange' | 'red' | 'purple' = 'blue'
): Promise<boolean> {
  const cardContent = {
    config: { wide_screen_mode: true },
    header: {
      title: { tag: 'plain_text', content: title },
      template: template,
    },
    elements: [
      {
        tag: 'div',
        text: { tag: 'lark_md', content: content },
      },
      { tag: 'hr' },
      {
        tag: 'note',
        elements: [{ tag: 'plain_text', content: '本消息由学生成长管理系统发送' }],
      },
    ],
  };

  return sendMessage(cardContent);
}

export function isBotConfigured(): boolean {
  return !!(APP_ID && APP_SECRET && CHAT_ID);
}
