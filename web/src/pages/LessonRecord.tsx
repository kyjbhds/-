import { useState } from 'react';
import { Camera, Send, Loader2, Bell } from 'lucide-react';
import { createRecord, listRecords } from '../utils/baseApi';
import { sendLessonNotification } from '../utils/feishuBot';

export default function LessonRecord() {
  const [studentName, setStudentName] = useState('');
  const [subject, setSubject] = useState('数学');
  const [topic, setTopic] = useState('');
  const [performance, setPerformance] = useState(3);
  const [homework, setHomework] = useState('良好');
  const [notes, setNotes] = useState('');
  const [nextPlan, setNextPlan] = useState('');
  const [images, setImages] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [notifyParent, setNotifyParent] = useState(true);
  const [notifyStatus, setNotifyStatus] = useState<string>('');

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setImages(Array.from(e.target.files));
    }
  };

  const handleSubmit = async () => {
    if (!studentName || !topic) {
      alert('请填写学生姓名和课程主题');
      return;
    }

    setLoading(true);
    try {
      const studentsRes = await listRecords('tblJpLri9blmavJP', { 
        filter: `CurrentValue.[学生姓名] = "${studentName}"`,
        page_size: '1' 
      });
      
      let studentId = '';
      if (studentsRes.data?.items?.length > 0) {
        studentId = studentsRes.data.items[0].record_id;
      } else {
        const newStudent = await createRecord('tblJpLri9blmavJP', {
          学生姓名: studentName,
          年级: '初一',
          科目: [subject],
          入学时间: Date.now(),
          当前状态: '在读'
        });
        studentId = newStudent.data?.record?.record_id || '';
      }

      await createRecord('tbleAUBwresCnvln', {
        关联学生: studentId ? [studentId] : [],
        上课日期: Date.now(),
        科目: subject,
        课程主题: topic,
        课堂表现评分: performance,
        作业完成情况: homework,
        教师备注: notes,
        下节课计划: nextPlan
      });

      if (notifyParent) {
        setNotifyStatus('正在发送家长通知...');
        const notified = await sendLessonNotification({
          studentName,
          lessonDate: new Date().toLocaleDateString('zh-CN'),
          subject,
          topic,
          score: performance,
          homework,
          teacherNote: notes,
          nextPlan,
        });
        setNotifyStatus(notified ? '家长通知已发送' : '家长通知发送失败');
      }

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setStudentName('');
        setTopic('');
        setNotes('');
        setNextPlan('');
        setImages([]);
        setPerformance(3);
      }, 2000);
    } catch (e) {
      console.error('保存课程记录失败', e);
      alert('保存失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">课后快速记录</h2>

      {success && (
        <div className="p-4 bg-green-50 text-green-700 rounded-lg space-y-1">
          <p>课程记录保存成功！</p>
          {notifyStatus && <p className="text-sm">{notifyStatus}</p>}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">学生姓名</label>
          <input
            type="text"
            value={studentName}
            onChange={(e) => setStudentName(e.target.value)}
            placeholder="输入学生姓名"
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">科目</label>
          <select
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="数学">数学</option>
            <option value="物理">物理</option>
            <option value="化学">化学</option>
            <option value="生物">生物</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">课程主题</label>
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="如：二次函数图像与性质"
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">课堂表现评分</label>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => setPerformance(star)}
                className={`w-10 h-10 rounded-lg font-bold ${
                  star <= performance
                    ? 'bg-yellow-400 text-white'
                    : 'bg-gray-100 text-gray-400'
                }`}
              >
                {star}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">作业完成情况</label>
          <select
            value={homework}
            onChange={(e) => setHomework(e.target.value)}
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="优秀">优秀</option>
            <option value="良好">良好</option>
            <option value="一般">一般</option>
            <option value="未完成">未完成</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">课堂照片</label>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg cursor-pointer hover:bg-gray-200">
              <Camera size={20} />
              <span>上传照片</span>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageUpload}
                className="hidden"
              />
            </label>
            {images.length > 0 && (
              <span className="text-sm text-gray-500">已选择 {images.length} 张照片</span>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">教师备注</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="记录课堂情况、学生表现、需要关注的问题..."
            rows={4}
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">下节课计划</label>
          <input
            type="text"
            value={nextPlan}
            onChange={(e) => setNextPlan(e.target.value)}
            placeholder="下节课要讲的内容..."
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={notifyParent}
              onChange={(e) => setNotifyParent(e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded"
            />
            <span className="text-sm text-gray-700 flex items-center gap-1">
              <Bell size={14} />
              自动通知家长
            </span>
          </label>
        </div>

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? (
            <Loader2 size={20} className="animate-spin" />
          ) : (
            <Send size={20} />
          )}
          {loading ? '保存中...' : '保存课程记录'}
        </button>
      </div>
    </div>
  );
}
