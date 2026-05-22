import { useEffect, useState } from 'react';
import { Plus, Search } from 'lucide-react';
import { listRecords } from '../utils/baseApi';
import { Lesson } from '../types';

export default function LessonList() {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadLessons();
  }, []);

  async function loadLessons() {
    try {
      const res = await listRecords('tbleAUBwresCnvln', { page_size: '500' });
      console.log('Lessons response:', res);
      const items = res.data?.items?.map((item: any) => ({
        record_id: item.record_id,
        ...item.fields
      })) || [];
      setLessons(items);
    } catch (e) {
      console.error('加载课程失败', e);
    }
  }

  const filteredLessons = lessons.filter(l =>
    l.课程主题?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">课程记录</h2>
        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          <Plus size={20} />
          添加课程
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
        <input
          type="text"
          placeholder="搜索课程主题..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">上课日期</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">科目</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">课程主题</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">表现评分</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">作业完成</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredLessons.map((lesson) => (
              <tr key={lesson.record_id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  {lesson.上课日期 ? new Date(lesson.上课日期).toLocaleDateString('zh-CN') : '无日期'}
                </td>
                <td className="px-6 py-4">{lesson.科目}</td>
                <td className="px-6 py-4 font-medium">{lesson.课程主题 || '未命名'}</td>
                <td className="px-6 py-4">
                  <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded text-sm">
                    {lesson.课堂表现评分 || 0}分
                  </span>
                </td>
                <td className="px-6 py-4">{lesson.作业完成情况 || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
