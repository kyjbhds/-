import { useEffect, useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Users, BookOpen, AlertCircle, PlusCircle, Sparkles, Clock, FileText, Database, TrendingUp, Calendar, Brain, Search, Zap, TrendingDown } from 'lucide-react';
import { listRecords, createRecord } from '../utils/baseApi';
import { Student, Lesson } from '../types';

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalStudents: 0,
    monthlyLessons: 0,
    pendingReports: 0,
    totalIncome: 0,
  });
  const [recentLessons, setRecentLessons] = useState<Lesson[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [quickStudent, setQuickStudent] = useState('');
  const [quickScore, setQuickScore] = useState(3);
  const [quickTopic, setQuickTopic] = useState('');
  const [quickSubject, setQuickSubject] = useState('数学');
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    loadDashboardData();
    const saved = localStorage.getItem('quickLesson');
    if (saved) {
      const { student, subject } = JSON.parse(saved);
      setQuickStudent(student || '');
      setQuickSubject(subject || '数学');
    }
  }, []);

  async function loadDashboardData() {
    try {
      const studentsRes = await listRecords('tblJpLri9blmavJP', { page_size: '500' });
      const lessonsRes = await listRecords('tbleAUBwresCnvln', { page_size: '500' });

      const allStudents: Student[] = studentsRes.data?.items?.map((item: any) => ({ 
        record_id: item.record_id,
        ...item.fields 
      })) || [];
      const lessons: Lesson[] = lessonsRes.data?.items?.map((item: any) => ({ 
        record_id: item.record_id,
        ...item.fields 
      })) || [];

      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

      setStats({
        totalStudents: allStudents.filter(s => s.当前状态 === '在读').length,
        monthlyLessons: lessons.filter(l => l.上课日期 && l.上课日期 >= monthStart).length,
        pendingReports: Math.ceil(allStudents.filter(s => s.当前状态 === '在读').length / 4),
        totalIncome: lessons.filter(l => l.上课日期 && l.上课日期 >= monthStart).length * 200,
      });

      setStudents(allStudents);
      setRecentLessons(
        lessons
          .filter(l => l.上课日期)
          .sort((a, b) => (b.上课日期 || 0) - (a.上课日期 || 0))
          .slice(0, 5)
      );
    } catch (e) {
      console.error('加载数据失败', e);
    }
  }

  async function handleQuickSave() {
    if (!quickStudent.trim()) {
      alert('请输入学生姓名');
      return;
    }

    setSaving(true);
    try {
      localStorage.setItem('quickLesson', JSON.stringify({
        student: quickStudent,
        subject: quickSubject,
      }));

      const studentsRes = await listRecords('tblJpLri9blmavJP', { 
        filter: `CurrentValue.[学生姓名] = "${quickStudent}"`,
        page_size: '1' 
      });
      
      let studentId = '';
      if (studentsRes.data?.items?.length > 0) {
        studentId = studentsRes.data.items[0].record_id;
      } else {
        const newStudent = await createRecord('tblJpLri9blmavJP', {
          学生姓名: quickStudent,
          年级: '初一',
          科目: [quickSubject],
          入学时间: Date.now(),
          当前状态: '在读'
        });
        studentId = newStudent.data?.record?.record_id || '';
      }

      await createRecord('tbleAUBwresCnvln', {
        关联学生: studentId ? [studentId] : [],
        上课日期: Date.now(),
        科目: quickSubject,
        课程主题: quickTopic || `${quickSubject}课程`,
        课堂表现评分: quickScore,
        作业完成情况: '良好',
        教师备注: '',
        下节课计划: ''
      });

      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
        setQuickTopic('');
      }, 2000);

      loadDashboardData();
    } catch (e) {
      console.error('快速保存失败', e);
      alert('保存失败，请重试');
    } finally {
      setSaving(false);
    }
  }

  const filteredStudents = students.filter(s => 
    s.学生姓名?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">仪表盘</h2>
        <div className="flex gap-3">
          <Link
            to="/lessons/ai-record"
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            <Sparkles size={20} />
            AI智能记录
          </Link>
          <Link
            to="/lessons/record"
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <PlusCircle size={20} />
            课后记录
          </Link>
        </div>
      </div>

      <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl shadow-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold mb-2">🚀 快速记录</h3>
            <p className="text-sm opacity-90">下课了？快速记录本次课程！</p>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-1 md:grid-cols-5 gap-3">
          <input
            type="text"
            value={quickStudent}
            onChange={(e) => setQuickStudent(e.target.value)}
            placeholder="学生姓名"
            className="px-4 py-2 rounded-lg text-gray-900 placeholder-gray-500"
          />
          <select
            value={quickSubject}
            onChange={(e) => setQuickSubject(e.target.value)}
            className="px-4 py-2 rounded-lg text-gray-900"
          >
            <option value="数学">数学</option>
            <option value="物理">物理</option>
            <option value="化学">化学</option>
            <option value="生物">生物</option>
          </select>
          <input
            type="text"
            value={quickTopic}
            onChange={(e) => setQuickTopic(e.target.value)}
            placeholder="课程主题（可选）"
            className="px-4 py-2 rounded-lg text-gray-900 placeholder-gray-500"
          />
          <div className="flex items-center gap-2">
            <span className="text-sm">评分:</span>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setQuickScore(star)}
                  className={`w-8 h-8 rounded font-bold transition-colors ${
                    star <= quickScore
                      ? 'bg-yellow-400 text-white'
                      : 'bg-white/30 text-white hover:bg-white/50'
                  }`}
                >
                  {star}
                </button>
              ))}
            </div>
          </div>
          <button
            onClick={handleQuickSave}
            disabled={saving}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-white text-blue-600 rounded-lg hover:bg-gray-100 font-medium disabled:opacity-50"
          >
            {saveSuccess ? '✓ 已保存' : saving ? '保存中...' : '⚡ 快速保存'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard title="在读学生" value={stats.totalStudents} icon={Users} color="blue" />
        <StatCard title="本月课时" value={stats.monthlyLessons} icon={BookOpen} color="green" />
        <StatCard title="本月收入" value={`¥${stats.totalIncome}`} icon={TrendingUp} color="purple" />
        <StatCard title="待生成报告" value={stats.pendingReports} icon={AlertCircle} color="orange" />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">搜索学生</h3>
        </div>
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="输入学生姓名快速搜索..."
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="space-y-2">
          {searchQuery && filteredStudents.slice(0, 5).map((student) => (
            <Link
              key={student.record_id}
              to={`/students/${student.record_id}`}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-medium">
                  {student.学生姓名?.charAt(0)}
                </div>
                <div>
                  <p className="font-medium text-gray-900">{student.学生姓名}</p>
                  <p className="text-sm text-gray-500">{student.年级} · {student.科目?.join(', ')}</p>
                </div>
              </div>
              <span className={`px-2 py-1 rounded text-sm ${
                student.当前状态 === '在读' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
              }`}>
                {student.当前状态}
              </span>
            </Link>
          ))}
          {!searchQuery && (
            <p className="text-center text-gray-500 py-4">输入学生姓名开始搜索</p>
          )}
          {searchQuery && filteredStudents.length === 0 && (
            <p className="text-center text-gray-500 py-4">未找到匹配的学生</p>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold mb-4">最近课程</h3>
        <div className="space-y-3">
          {recentLessons.length === 0 && (
            <p className="text-gray-500 text-center py-8">暂无课程记录</p>
          )}
          {recentLessons.map((lesson, idx) => (
            <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
              <div>
                <p className="font-medium">{lesson.课程主题 || '未命名课程'}</p>
                <p className="text-sm text-gray-500">
                  {lesson.上课日期 ? new Date(lesson.上课日期).toLocaleDateString('zh-CN') : '无日期'} · {lesson.科目 || '未分类'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded text-sm">
                  表现: {lesson.课堂表现评分 || 0}分
                </span>
              </div>
            </div>
          ))}
        </div>
        <Link
          to="/lessons"
          className="block mt-4 text-center text-blue-600 hover:text-blue-700 font-medium"
        >
          查看全部课程 →
        </Link>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, color }: {
  title: string;
  value: number | string;
  icon: React.ElementType;
  color: string;
}) {
  const colorClasses: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    orange: 'bg-orange-50 text-orange-600',
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">{title}</p>
          <p className="text-3xl font-bold mt-1">{value}</p>
        </div>
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
          <Icon size={24} />
        </div>
      </div>
    </div>
  );
}

function QuickAction({ to, icon: Icon, label, description, color }: {
  to: string;
  icon: React.ElementType;
  label: string;
  description: string;
  color: string;
}) {
  const colorClasses: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-600 hover:bg-blue-100',
    green: 'bg-green-50 text-green-600 hover:bg-green-100',
    purple: 'bg-purple-50 text-purple-600 hover:bg-purple-100',
    indigo: 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100',
    teal: 'bg-teal-50 text-teal-600 hover:bg-teal-100',
    orange: 'bg-orange-50 text-orange-600 hover:bg-orange-100',
    pink: 'bg-pink-50 text-pink-600 hover:bg-pink-100',
    cyan: 'bg-cyan-50 text-cyan-600 hover:bg-cyan-100',
  };

  return (
    <Link
      to={to}
      className={`p-4 rounded-lg border border-gray-200 hover:shadow-md transition-all`}
    >
      <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-3 ${colorClasses[color]}`}>
        <Icon size={22} />
      </div>
      <p className="font-medium text-gray-900">{label}</p>
      <p className="text-xs text-gray-500 mt-1">{description}</p>
    </Link>
  );
}
