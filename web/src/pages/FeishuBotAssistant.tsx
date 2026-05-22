import { useState } from 'react';
import { Send, MessageSquare, FileText, Bell, Sparkles, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { sendCustomMessage, isBotConfigured, sendLessonNotification, sendReportNotification } from '../utils/feishuBot';

export default function FeishuBotAssistant() {
  const [mode, setMode] = useState<'custom' | 'quick'>('custom');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [template, setTemplate] = useState<'blue' | 'green' | 'orange' | 'red' | 'purple'>('blue');
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleSendCustomMessage = async () => {
    if (!title && !content) {
      alert('请填写标题或内容');
      return;
    }

    setSending(true);
    setResult(null);

    try {
      const success = await sendCustomMessage(title || '消息', content, template);
      setResult({
        success,
        message: success ? '消息发送成功！' : '消息发送失败，请检查配置'
      });
    } catch (e) {
      setResult({
        success: false,
        message: '发送出错，请重试'
      });
    } finally {
      setSending(false);
    }
  };

  const quickMessages: Array<{
    title: string;
    content: string;
    template: 'blue' | 'green' | 'orange' | 'red' | 'purple';
  }> = [
    {
      title: '📢 家长会通知',
      content: '**尊敬的家长：**\n\n您好！我们定于本周六下午2点召开家长会，请准时参加。\n\n会议地点：学校多功能厅\n\n如有特殊情况不能参加，请提前告知班主任。',
      template: 'blue'
    },
    {
      title: '🎯 进步表扬',
      content: '**表扬通知**\n\n某某同学在本周的学习中表现优异，成绩提升明显！\n\n特此表扬，望继续保持！',
      template: 'green'
    },
    {
      title: '⚠️ 作业提醒',
      content: '**作业提醒**\n\n提醒各位家长，督促孩子完成本周作业：\n1. 数学练习册第30-32页\n2. 背诵课文两篇\n\n请于周日晚上前完成。',
      template: 'orange'
    },
    {
      title: '📋 考试通知',
      content: '**考试通知**\n\n下周将进行单元测试，请提醒孩子做好复习：\n\n考试科目：数学、物理\n考试时间：下周一、二\n\n请督促孩子认真复习，注意休息！',
      template: 'red'
    }
  ];

  const handleQuickSend = async (msg: typeof quickMessages[0]) => {
    setTitle(msg.title);
    setContent(msg.content);
    setTemplate(msg.template);
    setSending(true);
    setResult(null);

    try {
      const success = await sendCustomMessage(msg.title, msg.content, msg.template);
      setResult({
        success,
        message: success ? '快捷消息发送成功！' : '发送失败，请检查配置'
      });
    } catch (e) {
      setResult({
        success: false,
        message: '发送出错，请重试'
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <MessageSquare className="text-blue-600" size={32} />
        <div>
          <h1 className="text-2xl font-bold text-gray-900">飞书机器人助手</h1>
          <p className="text-gray-500">通过飞书机器人向家长群发送通知</p>
        </div>
      </div>

      {!isBotConfigured() && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="text-yellow-600 flex-shrink-0 mt-0.5" size={20} />
          <div>
            <h3 className="font-medium text-yellow-800">飞书机器人未配置</h3>
            <p className="text-sm text-yellow-700 mt-1">
              请在环境变量中配置 <code className="bg-yellow-100 px-1 py-0.5 rounded">VITE_FEISHU_BOT_WEBHOOK</code> 变量
            </p>
            <p className="text-xs text-yellow-600 mt-1">
              获取方式：飞书群 → 设置 → 群机器人 → 添加自定义机器人 → 复制 Webhook 地址
            </p>
          </div>
        </div>
      )}

      {result && (
        <div className={`flex items-center gap-3 p-4 rounded-lg ${result.success ? 'bg-green-50' : 'bg-red-50'}`}>
          {result.success ? <CheckCircle className="text-green-600" size={20} /> : <AlertCircle className="text-red-600" size={20} />}
          <p className={result.success ? 'text-green-700' : 'text-red-700'}>{result.message}</p>
        </div>
      )}

      <div className="flex gap-2">
        <button
          onClick={() => setMode('custom')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${mode === 'custom' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
        >
          自定义消息
        </button>
        <button
          onClick={() => setMode('quick')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${mode === 'quick' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
        >
          快捷消息
        </button>
      </div>

      {mode === 'custom' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            <MessageSquare size={18} />
            自定义消息
          </h3>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">消息标题</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="请输入消息标题"
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">消息内容</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="支持 Markdown 格式，例如：**加粗**、- 列表等"
              rows={8}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">卡片主题</label>
            <div className="flex gap-3">
              {[
                { value: 'blue', label: '蓝色', color: 'bg-blue-100 border-blue-300' },
                { value: 'green', label: '绿色', color: 'bg-green-100 border-green-300' },
                { value: 'orange', label: '橙色', color: 'bg-orange-100 border-orange-300' },
                { value: 'red', label: '红色', color: 'bg-red-100 border-red-300' },
                { value: 'purple', label: '紫色', color: 'bg-purple-100 border-purple-300' }
              ].map((t) => (
                <button
                  key={t.value}
                  onClick={() => setTemplate(t.value as any)}
                  className={`px-4 py-2 rounded-lg border-2 transition-colors ${t.color} ${template === t.value ? 'ring-2 ring-offset-1 ring-gray-400' : ''}`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleSendCustomMessage}
            disabled={sending || !isBotConfigured()}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {sending ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                发送中...
              </>
            ) : (
              <>
                <Send size={20} />
                发送消息
              </>
            )}
          </button>
        </div>
      )}

      {mode === 'quick' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {quickMessages.map((msg, idx) => (
            <div key={idx} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <div className="flex items-start justify-between mb-3">
                <h4 className="font-medium text-gray-900">{msg.title}</h4>
              </div>
              <p className="text-sm text-gray-600 line-clamp-4 mb-4">
                {msg.content.replace(/\*\*/g, '')}
              </p>
              <button
                onClick={() => handleQuickSend(msg)}
                disabled={sending || !isBotConfigured()}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                <Sparkles size={16} />
                发送
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="bg-gray-50 rounded-xl p-4">
        <h4 className="font-medium text-gray-900 mb-2">📝 Markdown 格式说明</h4>
        <div className="text-sm text-gray-600 space-y-1">
          <p><code className="bg-gray-200 px-1 py-0.5 rounded">**文字**</code> = <strong>加粗</strong></p>
          <p><code className="bg-gray-200 px-1 py-0.5 rounded">- 项目</code> = 列表项目</p>
        </div>
      </div>
    </div>
  );
}
