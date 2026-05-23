import { useEffect, useState } from 'react';
import type { FC } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Calendar, BookOpen, Star, TrendingUp, Award, Clock, ChevronRight, LucideIcon } from 'lucide-react';
import { listRecords } from '../utils/baseApi';
import { Student, Lesson, StudentKnowledge, Milestone } from '../types';

interface TimelineEvent {
  id: string;
  date: number;
  dateStr: string;
  type: 'lesson' | 'milestone' | 'knowledge' | 'improvement';
  title: string;
  description: string;
  score?: number;
  subject?: string;
  icon: LucideIcon;
  color: string;
  bgColor: string;
  details?: Record<string, string>;
}

export default function StudentTimeline() {
  const { id } = useParams<{ id: string }>();
  const [student, setStudent] = useState<Student | null>(null);
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [filter, setFilter] = useState<string>('all');
  const [stats, setStats] = useState({
    totalLessons: 0,
    avgScore: 0,
    knowledgeCount: 0,
    milestones: 0,
    learningDays: 0,
  });

  useEffect(() => {
    if (id) loadTimelineData(id);
  }, [id]);

  async function loadTimelineData(studentId: string) {
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
      const sortedLessons = studentLessons.sort((a: Lesson, b: Lesson) => (a.上课日期 || 0) - (b.上课日期 || 0));

      const skRes = await listRecords('tblyQaIBb4jghBha', { page_size: '500' });
      const allSK = skRes.data?.items?.map((item: any) => ({
        record_id: item.record_id,
        ...item.fields
      })) || [];
      const studentSK = allSK.filter((sk: StudentKnowledge) => sk.关联学生?.includes(studentId));

      const milestoneRes = await listRecords('tbl milestones placeholder', { page_size: '500' });
      const allMilestones = milestoneRes.data?.items?.map((item: any) => ({
        record_id: item.record_id,
        ...item.fields
      })) || [];
      const studentMilestones = allMilestones.filter((m: Milestone) => m.关联学生?.includes(studentId));

      const timelineEvents: TimelineEvent[] = [];

      sortedLessons.forEach((lesson: Lesson, index: number) => {
        timelineEvents.push({
          id: lesson.record_id,
          date: lesson.上课日期 || 0,
          dateStr: lesson.上课日期 ? new Date(lesson.上课日期).toLocaleDateString('zh-CN') : '',
          type: 'lesson',
          title: lesson.课程主题 || '课程',
          description: lesson.教师备注 || '',
          score: lesson.课堂表现评分,
          subject: lesson.科目,
          icon: BookOpen,
          color: 'text-blue-600',
          bgColor: 'bg-blue-100',
          details: {
            '作业完成': lesson.作业完成情况 || '-',
            '课时序号': `第 ${index + 1} 次课`,
            '下节计划': lesson.下节课计划 || '-',
          }
        });
      });

      studentSK.forEach((sk: StudentKnowledge) => {
        const levelMap: Record<string, { color: string; bg: string; icon: LucideIcon }> = {
          '未接触': { color: 'text-gray-600', bg: 'bg-gray-100', icon: Clock },
          '初学': { color: 'text-yellow-600', bg: 'bg-yellow-100', icon: Star },
          '巩固': { color: 'text-orange-600', bg: 'bg-orange-100', icon: TrendingUp },
          '熟练': { color: 'text-green-600', bg: 'bg-green-100', icon: Award },
          '精通': { color: 'text-purple-600', bg: 'bg-purple-100', icon: Award },
        };
        const style = levelMap[sk.掌握程度] || levelMap['未接触'];
        timelineEvents.push({
          id: sk.record_id,
          date: sk.最近巩固日期 || sk.首次接触日期 || 0,
          dateStr: sk.最近巩固日期 ? new Date(sk.最近巩固日期).toLocaleDateString('zh-CN') : '',
          type: 'knowledge',
          title: sk.关联知识点?.[0] || '知识点',
          description: `掌握程度: ${sk.掌握程度}`,
          icon: style.icon,
          color: style.color,
          bgColor: style.bg,
          details: {
            '首次接触': sk.首次接触日期 ? new Date(sk.首次接触日期).toLocaleDateString('zh-CN') : '-',
            '最近巩固': sk.最近巩固日期 ? new Date(sk.最近巩固日期).toLocaleDateString('zh-CN') : '-',
          }
        });
      });

      studentMilestones.forEach((m: Milestone) => {
        timelineEvents.push({
          id: m.record_id,
          date: m.结束日期 || m.开始日期 || 0,
          dateStr: m.结束日期 ? new Date(m.结束日期).toLocaleDateString('zh-CN') : '',
          type: 'milestone',
          title: m.阶段类型 || '阶段总结',
          description: m.阶段评价 || '',
          icon: Award,
          color: 'text-indigo-600',
          bgColor: 'bg-indigo-100',
          details: {
            '开始日期': m.开始日期 ? new Date(m.开始日期).toLocaleDateString('zh-CN') : '-',
            '报告状态': m.报告状态 || '-',
          }
        });
      });

      if (sortedLessons.length >= 2) {
        for (let i = 1; i < sortedLessons.length; i++) {
          const prev = sortedLessons[i - 1];
          const curr = sortedLessons[i];
          const diff = (curr.课堂表现评分 || 0) - (prev.课堂表现评分 || 0);
          if (diff >= 0.5) {
            timelineEvents.push({
              id: `improve-${i}`,
              date: curr.上课日期 || 0,
              dateStr: curr.上课日期 ? new Date(curr.上课日期).toLocaleDateString('zh-CN') : '',
              type: 'improvement',
              title: '表现提升',
              description: `课堂表现从 ${prev.课堂表现评分} 分提升至 ${curr.课堂表现评分} 分`,
              icon: TrendingUp,
              color: 'text-emerald-600',
              bgColor: 'bg-emerald-100',
            });
          }
        }
      }

      timelineEvents.sort((a, b) => b.date - a.date);
      setEvents(timelineEvents);

      const firstDate = sortedLessons[0]?.上课日期;
      const lastDate = sortedLessons[sortedLessons.length - 1]?.上课日期;
      const days = firstDate && lastDate ? Math.ceil((lastDate - firstDate) / (1000 * 60 * 60 * 24)) : 0;

      setStats({
        totalLessons: sortedLessons.length,
        avgScore: sortedLessons.length > 0
          ? Math.round((sortedLessons.reduce((s: number, l: Lesson) => s + (l.课堂表现评分 || 0), 0) / sortedLessons.length) * 10) / 10
          : 0,
        knowledgeCount: studentSK.length,
        milestones: studentMilestones.length,
        learningDays: days,
      });
    } catch (e) {
      console.error('加载时间线失败', e);
    }
  }

  const filteredEvents = filter === 'all' ? events : events.filter(e => e.type === filter);

  const filterOptions = [
    { key: 'all', label: '全部', count: events.length },
    { key: 'lesson', label: '课程', count: events.filter(e => e.type === 'lesson').length },
    { key: 'knowledge', label: '知识点', count: events.filter(e => e.type === 'knowledge').length },
    { key: 'improvement', label: '进步', count: events.filter(e => e.type === 'improvement').length },
    { key: 'milestone', label: '里程碑', count: events.filter(e => e.type === 'milestone').length },
  ];

  if (!student) return <div className="p-8">加载中...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to={`/students/${id}`} className="p-2 hover:bg-gray-100 rounded-lg">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h2 className="text-2xl font-bold">{student.学生姓名}</h2>
            <p className="text-sm text-gray-500">学习成长时间线</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <StatCard label="总课时" value={`${stats.totalLessons} 次`} icon={BookOpen} color="blue" />
        <StatCard label="平均表现" value={`${stats.avgScore} 分`} icon={Star} color="yellow" />
        <StatCard label="知识点" value={`${stats.knowledgeCount} 个`} icon={Award} color="purple" />
        <StatCard label="里程碑" value={`${stats.milestones} 个`} icon={TrendingUp} color="green" />
        <StatCard label="学习天数" value={`${stats.learningDays} 天`} icon={Calendar} color="indigo" />
      </div>

      <div className="flex flex-wrap gap-2">
        {filterOptions.map(opt => (
          <button
            key={opt.key}
            onClick={() => setFilter(opt.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === opt.key
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            {opt.label} ({opt.count})
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="relative">
          <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200" />

          <div className="space-y-6">
            {filteredEvents.length === 0 && (
              <p className="text-gray-500 text-center py-12">暂无记录</p>
            )}

            {filteredEvents.map((event, index) => {
              const Icon = event.icon;
              const isFirst = index === 0;
              return (
                <div key={event.id} className="relative flex gap-4">
                  <div className={`relative z-10 flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${event.bgColor}`}>
                    <Icon size={20} className={event.color} />
                  </div>

                  <div className="flex-1 pb-6">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-500">{event.dateStr}</span>
                          {isFirst && (
                            <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">
                              最新
                            </span>
                          )}
                          {event.type === 'improvement' && (
                            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs rounded-full">
                              进步
                            </span>
                          )}
                        </div>
                        <h4 className="font-semibold text-gray-900 mt-1">{event.title}</h4>
                        <p className="text-sm text-gray-600 mt-1">{event.description}</p>

                        {event.score !== undefined && (
                          <div className="flex items-center gap-2 mt-2">
                            <div className="flex items-center gap-1">
                              {[1, 2, 3, 4, 5].map(star => (
                                <Star
                                  key={star}
                                  size={14}
                                  className={star <= (event.score || 0) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}
                                />
                              ))}
                            </div>
                            <span className="text-sm font-medium">{event.score} 分</span>
                          </div>
                        )}

                        {event.details && Object.keys(event.details).length > 0 && (
                          <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                            <div className="grid grid-cols-2 gap-2">
                              {Object.entries(event.details).map(([key, value]) => (
                                <div key={key}>
                                  <span className="text-xs text-gray-500">{key}</span>
                                  <p className="text-sm font-medium text-gray-900">{value}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {event.subject && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                          {event.subject}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon: Icon, color }: { label: string; value: string; icon: LucideIcon; color: string }) {
  const colorMap: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-600',
    yellow: 'bg-yellow-50 text-yellow-600',
    purple: 'bg-purple-50 text-purple-600',
    green: 'bg-green-50 text-green-600',
    indigo: 'bg-indigo-50 text-indigo-600',
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${colorMap[color]}`}>
          <Icon size={20} />
        </div>
        <div>
          <p className="text-sm text-gray-500">{label}</p>
          <p className="text-lg font-bold">{value}</p>
        </div>
      </div>
    </div>
  );
}
