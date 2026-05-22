import { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { ArrowLeft, Download, FileText, Loader2, Sparkles, Send, MessageSquare } from 'lucide-react';
import { listRecords } from '../utils/baseApi';
import { exportReportToPDF } from '../utils/pdfExport';
import { generateStudentComment, generateTemplateComment } from '../utils/aiComment';
import { sendReportNotification, isBotConfigured } from '../utils/feishuBot';
import { Student, Lesson, StudentKnowledge } from '../types';

export default function StudentReport() {
  const { id } = useParams<{ id: string }>();
  const reportRef = useRef<HTMLDivElement>(null);
  const [student, setStudent] = useState<Student | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [knowledgeData, setKnowledgeData] = useState<any[]>([]);
  const [growthData, setGrowthData] = useState<any[]>([]);
  const [reportPeriod, setReportPeriod] = useState('学期');
  const [exporting, setExporting] = useState(false);
  const [teacherComment, setTeacherComment] = useState('');
  const [generatingComment, setGeneratingComment] = useState(false);
  const [sendingToFeishu, setSendingToFeishu] = useState(false);
  const [sendResult, setSendResult] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    if (id) loadStudentData(id);
  }, [id]);

  async function loadStudentData(studentId: string) {
    try {
      const studentRes = await listRecords('tblJpLri9blmavJP', { 
        filter: `CurrentValue.[record_id] = "${studentId}"`, 
        page_size: '1' 
      });
      const studentData = studentRes.data?.items?.[0]?.fields;
      if (studentData) {
        setStudent({ record_id: studentRes.data.items[0].record_id, ...studentData });
      }

      const lessonsRes = await listRecords('tbleAUBwresCnvln', { page_size: '500' });
      const allLessons = lessonsRes.data?.items?.map((item: any) => ({ 
        record_id: item.record_id, 
        ...item.fields 
      })) || [];
      const studentLessons = allLessons.filter((l: Lesson) => l.关联学生?.includes(studentId));
      setLessons(studentLessons.sort((a: Lesson, b: Lesson) => (b.上课日期 || 0) - (a.上课日期 || 0)));

      const skRes = await listRecords('tblyQaIBb4jghBha', { page_size: '500' });
      const allSK = skRes.data?.items?.map((item: any) => ({ 
        record_id: item.record_id, 
        ...item.fields 
      })) || [];
      const studentSK = allSK.filter((sk: StudentKnowledge) => sk.关联学生?.includes(studentId));

      const radarData = studentSK.map((sk: StudentKnowledge) => ({
        subject: sk.关联知识点?.[0] || '未知',
        level: getLevelValue(sk.掌握程度),
        fullMark: 4,
      }));
      setKnowledgeData(radarData);

      const sortedLessons = studentLessons.sort((a: Lesson, b: Lesson) => (a.上课日期 || 0) - (b.上课日期 || 0));
      const growth = sortedLessons.map((l: Lesson, index: number) => ({
        date: l.上课日期 ? new Date(l.上课日期).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' }) : '',
        score: l.课堂表现评分 || 0,
        lesson: index + 1,
      }));
      setGrowthData(growth);
    } catch (e) {
      console.error('加载学生详情失败', e);
    }
  }

  function getLevelValue(level: string): number {
    const map: Record<string, number> = {
      '未接触': 0, '初学': 1, '巩固': 2, '熟练': 3, '精通': 4,
    };
    return map[level] || 0;
  }

  const handleGenerateComment = async () => {
    if (!student) return;
    setGeneratingComment(true);
    setSendResult(null);
    try {
      const recentScores = lessons.slice(0, 10).map(l => l.课堂表现评分 || 3);
      const knowledgePoints = knowledgeData.map(k => k.subject);
      const avgScore = parseFloat(avgScoreStr);
      
      const improvements = avgScore > 3 ? ['课堂参与度', '作业完成质量'] : ['学习态度'];
      const weaknesses = avgScore < 4 ? ['知识点巩固', '练习量'] : [];

      try {
        const comment = await generateStudentComment(
          student.学生姓名,
          student.科目?.[0] || '数学',
          recentScores,
          knowledgePoints,
          improvements,
          weaknesses
        );
        setTeacherComment(comment);
      } catch (aiError) {
        const templateComment = generateTemplateComment(
          student.学生姓名,
          student.科目?.[0] || '数学',
          avgScore,
          improvements
        );
        setTeacherComment(templateComment);
      }
    } catch (e) {
      console.error('生成评语失败', e);
      alert('生成评语失败');
    } finally {
      setGeneratingComment(false);
    }
  };

  const handleSendToFeishu = async () => {
    if (!student) return;
    setSendingToFeishu(true);
    setSendResult(null);
    try {
      const knowledgeSummary = knowledgeData.length > 0 
        ? knowledgeData.map(k => `${k.subject}（${['未接触', '初学', '巩固', '熟练', '精通'][k.level]}）`).join('、')
        : '暂无';

      const success = await sendReportNotification({
        studentName: student.学生姓名,
        period: reportPeriod,
        totalLessons: lessons.length,
        avgScore: parseFloat(avgScoreStr),
        knowledgeSummary,
        teacherComment: teacherComment || '详见报告内容',
      });

      setSendResult({
        success,
        message: success ? '报告已发送到飞书！' : '发送失败，请检查配置'
      });
    } catch (e) {
      console.error('发送失败', e);
      setSendResult({ success: false, message: '发送失败，请重试' });
    } finally {
      setSendingToFeishu(false);
    }
  };

  const handleExportPDF = async () => {
    if (!reportRef.current) return;
    setExporting(true);
    try {
      await exportReportToPDF('student-report', `${student?.学生姓名 || '学生'}_${reportPeriod}报告`);
    } catch (e) {
      console.error('PDF导出失败', e);
      alert('PDF导出失败，请重试');
    } finally {
      setExporting(false);
    }
  };

  const avgScoreStr = lessons.length > 0 
    ? (lessons.reduce((sum, l) => sum + (l.课堂表现评分 || 0), 0) / lessons.length).toFixed(1)
    : '0';

  const homeworkStats = {
    优秀: lessons.filter(l => l.作业完成情况 === '优秀').length,
    良好: lessons.filter(l => l.作业完成情况 === '良好').length,
    一般: lessons.filter(l => l.作业完成情况 === '一般').length,
    未完成: lessons.filter(l => l.作业完成情况 === '未完成').length,
  };

  if (!student) return <div className="p-8">加载中...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to={`/students/${id}`} className="p-2 hover:bg-gray-100 rounded-lg">
              <ArrowLeft size={20} />
            </Link>
            <h2 className="text-2xl font-bold">{student.学生姓名} - 成长报告</h2>
          </div>
          <div className="flex gap-3">
            {isBotConfigured() && (
              <button
                onClick={handleSendToFeishu}
                disabled={sendingToFeishu}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
              >
                {sendingToFeishu ? (
                  <Loader2 size={20} className="animate-spin" />
                ) : (
                  <Send size={20} />
                )}
                {sendingToFeishu ? '发送中...' : '发送到飞书'}
              </button>
            )}
            <button
              onClick={handleExportPDF}
              disabled={exporting}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
            >
              {exporting ? (
                <Loader2 size={20} className="animate-spin" />
              ) : (
                <FileText size={20} />
              )}
              {exporting ? '导出中...' : '导出PDF'}
            </button>
          </div>
        </div>

        {sendResult && (
          <div className={`flex items-center gap-3 p-4 rounded-lg ${sendResult.success ? 'bg-green-50' : 'bg-red-50'}`}>
            {sendResult.success ? (
              <MessageSquare size={20} className="text-green-600" />
            ) : (
              <MessageSquare size={20} className="text-red-600" />
            )}
            <p className={sendResult.success ? 'text-green-700' : 'text-red-700'}>
              {sendResult.message}
            </p>
          </div>
        )}

      <div className="flex gap-4">
        {['月度', '学期', '完课总结'].map((period) => (
          <button
            key={period}
            onClick={() => setReportPeriod(period)}
            className={`px-4 py-2 rounded-lg ${
              reportPeriod === period
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {period}报告
          </button>
        ))}
      </div>

      <div id="student-report" ref={reportRef} className="space-y-6 bg-white p-8 rounded-xl">
        <div className="text-center border-b pb-6">
          <h1 className="text-3xl font-bold text-gray-900">{student.学生姓名}</h1>
          <p className="text-lg text-gray-600 mt-2">{reportPeriod}学习成长报告</p>
          <p className="text-sm text-gray-400 mt-1">
            生成时间：{new Date().toLocaleDateString('zh-CN')}
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <p className="text-2xl font-bold text-blue-600">{lessons.length}</p>
            <p className="text-sm text-gray-600">总课时</p>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <p className="text-2xl font-bold text-green-600">{avgScoreStr}</p>
            <p className="text-sm text-gray-600">平均表现</p>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <p className="text-2xl font-bold text-purple-600">{knowledgeData.length}</p>
            <p className="text-sm text-gray-600">知识点数</p>
          </div>
          <div className="text-center p-4 bg-orange-50 rounded-lg">
            <p className="text-2xl font-bold text-orange-600">
              {lessons.filter(l => l.作业完成情况 === '优秀').length}
            </p>
            <p className="text-sm text-gray-600">优秀作业</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-gray-50 rounded-xl p-6">
            <h3 className="text-lg font-semibold mb-4">知识点掌握度</h3>
            {knowledgeData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <RadarChart data={knowledgeData}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="subject" />
                  <PolarRadiusAxis angle={90} domain={[0, 4]} />
                  <Radar name="掌握度" dataKey="level" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} />
                </RadarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-gray-500 text-center py-12">暂无知识点数据</p>
            )}
          </div>

          <div className="bg-gray-50 rounded-xl p-6">
            <h3 className="text-lg font-semibold mb-4">课堂表现趋势</h3>
            {growthData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={growthData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis domain={[0, 5]} />
                  <Tooltip />
                  <Line type="monotone" dataKey="score" stroke="#3b82f6" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-gray-500 text-center py-12">暂无课程数据</p>
            )}
          </div>
        </div>

        <div className="bg-gray-50 rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-4">课程记录明细</h3>
          <div className="space-y-3">
            {lessons.map((lesson) => (
              <div key={lesson.record_id} className="flex items-center justify-between p-3 bg-white rounded-lg">
                <div>
                  <p className="font-medium">{lesson.课程主题 || '未命名课程'}</p>
                  <p className="text-sm text-gray-500">
                    {lesson.上课日期 ? new Date(lesson.上课日期).toLocaleDateString('zh-CN') : '无日期'} · {lesson.科目 || '未分类'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded text-sm">
                    {lesson.课堂表现评分 || 0}分
                  </span>
                  <span className={`px-2 py-1 rounded text-sm ${
                    lesson.作业完成情况 === '优秀' ? 'bg-green-100 text-green-700' :
                    lesson.作业完成情况 === '良好' ? 'bg-blue-100 text-blue-700' :
                    lesson.作业完成情况 === '一般' ? 'bg-orange-100 text-orange-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {lesson.作业完成情况 || '-'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-gray-50 rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-4">作业完成情况统计</h3>
          <div className="grid grid-cols-4 gap-4">
            <div className="text-center p-3 bg-white rounded-lg">
              <p className="text-xl font-bold text-green-600">{homeworkStats.优秀}</p>
              <p className="text-sm text-gray-600">优秀</p>
            </div>
            <div className="text-center p-3 bg-white rounded-lg">
              <p className="text-xl font-bold text-blue-600">{homeworkStats.良好}</p>
              <p className="text-sm text-gray-600">良好</p>
            </div>
            <div className="text-center p-3 bg-white rounded-lg">
              <p className="text-xl font-bold text-orange-600">{homeworkStats.一般}</p>
              <p className="text-sm text-gray-600">一般</p>
            </div>
            <div className="text-center p-3 bg-white rounded-lg">
              <p className="text-xl font-bold text-red-600">{homeworkStats.未完成}</p>
              <p className="text-sm text-gray-600">未完成</p>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">教师评语</h3>
            <button
              onClick={handleGenerateComment}
              disabled={generatingComment}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {generatingComment ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Sparkles size={16} />
              )}
              {generatingComment ? '生成中...' : 'AI生成评语'}
            </button>
          </div>
          <div className="p-4 bg-white rounded-lg">
            <textarea
              value={teacherComment || `${student.学生姓名}同学在本${reportPeriod}表现${parseFloat(avgScoreStr) >= 4 ? '优秀' : '良好'}，共完成${lessons.length}节课的学习。课堂参与度较高，作业完成情况${homeworkStats.优秀 + homeworkStats.良好 > lessons.length / 2 ? '较好' : '有待提高'}。建议下阶段继续巩固薄弱知识点，加强练习。`}
              onChange={(e) => setTeacherComment(e.target.value)}
              className="w-full min-h-[100px] text-gray-700 leading-relaxed resize-y"
              placeholder="输入教师评语..."
            />
          </div>
        </div>

        <div className="text-center text-sm text-gray-400 pt-4 border-t">
          <p>本报告由学生成长管理系统自动生成</p>
          <p>如有疑问请联系任课教师</p>
        </div>
      </div>
    </div>
  );
}
