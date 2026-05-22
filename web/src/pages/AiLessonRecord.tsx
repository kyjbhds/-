import { useState } from 'react';
import { Camera, Sparkles, Loader2, CheckCircle, Upload } from 'lucide-react';
import { createRecord, listRecords } from '../utils/baseApi';
import { recognizeLessonImage, fileToBase64 } from '../utils/aiRecognition';

export default function AiLessonRecord() {
  const [studentName, setStudentName] = useState('');
  const [subject, setSubject] = useState('数学');
  const [topic, setTopic] = useState('');
  const [performance, setPerformance] = useState(3);
  const [homework, setHomework] = useState('良好');
  const [notes, setNotes] = useState('');
  const [images, setImages] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [aiResult, setAiResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setImages(files);
      const urls = files.map(file => URL.createObjectURL(file));
      setPreviewUrls(urls);
    }
  };

  const handleAiRecognize = async () => {
    if (images.length === 0) {
      alert('请先上传课堂照片');
      return;
    }

    setLoading(true);
    try {
      const base64 = await fileToBase64(images[0]);
      const result = await recognizeLessonImage(base64);
      setAiResult(result);
      // 自动填充到表单
      setTopic(result.topic || '');
      setSubject(result.subject || '数学');
      setPerformance(result.performance || 3);
      setNotes(result.notes || '');
    } catch (e) {
      console.error('AI识别失败', e);
      alert('AI识别失败，请手动填写');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!studentName || !topic) {
      alert('请填写学生姓名和课程主题');
      return;
    }

    setSaving(true);
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
        下节课计划: ''
      });

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setStudentName('');
        setTopic('');
        setNotes('');
        setImages([]);
        setPreviewUrls([]);
        setAiResult(null);
        setPerformance(3);
        setHomework('良好');
        setSubject('数学');
      }, 2000);
    } catch (e) {
      console.error('保存失败', e);
      alert('保存失败，请重试');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Sparkles className="text-purple-600" size={28} />
        <h2 className="text-2xl font-bold text-gray-900">AI智能课后记录</h2>
      </div>

      <p className="text-gray-600">
        上传课堂照片，AI自动识别板书内容、提取知识点、生成课程记录
      </p>

      {success && (
        <div className="p-4 bg-green-50 text-green-700 rounded-lg flex items-center gap-2">
          <CheckCircle size={20} />
          课程记录保存成功！
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
          <label className="block text-sm font-medium text-gray-700 mb-1">课堂照片</label>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors">
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageUpload}
              className="hidden"
              id="ai-image-upload"
            />
            <label htmlFor="ai-image-upload" className="cursor-pointer">
              <Upload className="mx-auto text-gray-400 mb-2" size={40} />
              <p className="text-gray-600">点击上传课堂照片</p>
              <p className="text-sm text-gray-400 mt-1">支持 JPG、PNG 格式</p>
            </label>
          </div>
        </div>

        {previewUrls.length > 0 && (
          <div className="grid grid-cols-3 gap-2">
            {previewUrls.map((url, idx) => (
              <img key={idx} src={url} alt={`预览${idx + 1}`} className="w-full h-24 object-cover rounded-lg" />
            ))}
          </div>
        )}

        <button
          onClick={handleAiRecognize}
          disabled={loading || images.length === 0}
          className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
        >
          {loading ? (
            <Loader2 size={20} className="animate-spin" />
          ) : (
            <Sparkles size={20} />
          )}
          {loading ? 'AI识别中...' : 'AI识别照片内容'}
        </button>

        {aiResult && (
          <div className="space-y-4 border-t pt-4">
            <h3 className="font-semibold text-lg">识别结果（可编辑）</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">课程主题</label>
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
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
            </div>

            {aiResult.knowledgePoints?.length > 0 && (
              <div className="p-3 bg-yellow-50 rounded-lg">
                <p className="text-sm text-gray-500">识别到的知识点</p>
                <div className="flex flex-wrap gap-2 mt-1">
                  {aiResult.knowledgePoints.map((kp: string, idx: number) => (
                    <span key={idx} className="px-2 py-1 bg-yellow-200 text-yellow-800 rounded text-sm">
                      {kp}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">课堂表现评分</label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setPerformance(star)}
                    className={`w-10 h-10 rounded-lg font-bold transition-colors ${
                      star <= performance
                        ? 'bg-yellow-400 text-white'
                        : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
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
              <label className="block text-sm font-medium text-gray-700 mb-1">教师备注</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? (
                <Loader2 size={20} className="animate-spin" />
              ) : (
                <CheckCircle size={20} />
              )}
              {saving ? '保存中...' : '确认并保存到档案'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
