import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { ArrowLeft, Calendar, BookOpen, TrendingUp, FileText, Clock } from 'lucide-react';
import { listRecords } from '../utils/baseApi';
import { Student, Lesson, StudentKnowledge } from '../types';

export default function StudentDetail() {
  const { id } = useParams<{ id: string }>();
  const [student, setStudent] = useState<Student | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [knowledgeData, setKnowledgeData] = useState<any[]>([]);
  const [growthData, setGrowthData] = useState<any[]>([]);

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

  if (!student) return <div className="p-8">加载中...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/students" className="p-2 hover:bg-gray-100 rounded-lg">
            <ArrowLeft size={20} />
          </Link>
          <h2 className="text-2xl font-bold">{student.学生姓名}</h2>
          <StatusBadge status={student.当前状态} />
        </div>
        <div className="flex items-center gap-2">
          <Link
            to={`/students/${id}/timeline`}
            className="flex items-center gap-2 px-4 py-2 bg-white text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50"
          >
            <Clock size={20} />
            成长时间线
          </Link>
          <Link
            to={`/students/${id}/report`}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <FileText size={20} />
            生成成长报告
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <InfoCard icon={Calendar} label="年级" value={student.年级 || '-'} />
        <InfoCard icon={BookOpen} label="科目" value={student.科目?.join(', ') || '-'} />
        <InfoCard icon={TrendingUp} label="总课时" value={`${lessons.length} 次`} />
        <InfoCard icon={Calendar} label="最近上课" value={lessons[0]?.上课日期 ? new Date(lessons[0].上课日期).toLocaleDateString('zh-CN') : '无'} />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold mb-4">联系信息</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500 mb-1">家长联系方式</p>
            <p className="font-medium">{student.家长联系方式 || '-'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1">地址</p>
            <p className="font-medium">{student.地址 || '-'}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
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

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
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

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">最近课程</h3>
          <div className="flex gap-2">
            <span className="text-sm text-gray-500">共 {lessons.length} 次课</span>
          </div>
        </div>
        <div className="space-y-3">
          {lessons.slice(0, 5).map((lesson) => (
            <div key={lesson.record_id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium">{lesson.课程主题 || '未命名课程'}</p>
                <p className="text-sm text-gray-500">
                  {lesson.上课日期 ? new Date(lesson.上课日期).toLocaleDateString('zh-CN') : '无日期'} · {lesson.科目 || '未分类'}
                </p>
              </div>
              <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded text-sm">
                {lesson.课堂表现评分 || 0}分
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold mb-4">学习分析</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-600 font-medium">平均课堂表现</p>
            <p className="text-2xl font-bold text-blue-700 mt-1">
              {lessons.length > 0 
                ? (lessons.reduce((s, l) => s + (l.课堂表现评分 || 0), 0) / lessons.length).toFixed(1) 
                : '-'
              } 分
            </p>
          </div>
          <div className="p-4 bg-green-50 rounded-lg">
            <p className="text-sm text-green-600 font-medium">学习时长</p>
            <p className="text-2xl font-bold text-green-700 mt-1">
              {lessons.length > 0 
                ? Math.ceil((Date.now() - (lessons[lessons.length - 1].上课日期 || Date.now())) / (1000 * 60 * 60 * 24))
                : 0
              } 天
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoCard({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
          <Icon size={20} />
        </div>
        <div>
          <p className="text-sm text-gray-500">{label}</p>
          <p className="font-semibold">{value}</p>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    '在读': 'bg-green-100 text-green-700',
    '暂停': 'bg-yellow-100 text-yellow-700',
    '结课': 'bg-gray-100 text-gray-700',
  };

  return (
    <span className={`px-3 py-1 rounded-full text-sm font-medium ${colors[status] || 'bg-gray-100'}`}>
      {status}
    </span>
  );
}
