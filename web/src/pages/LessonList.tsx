import { useEffect, useState } from 'react';
import { Plus, Search } from 'lucide-react';
import { listRecords, createRecord } from '../utils/baseApi';
import { Lesson } from '../types';

export default function LessonList() {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [newLesson, setNewLesson] = useState<{
    课程主题: string;
    科目: string;
    上课日期: string;
    课堂表现评分: number;
    作业完成情况: string;
    课堂内容: string;
    下节课计划: string;
  }>({
    课程主题: '',
    科目: '',
    上课日期: new Date().toISOString().split('T')[0],
    课堂表现评分: 3,
    作业完成情况: '良好',
    课堂内容: '',
    下节课计划: ''
  });

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

  async function handleAddLesson() {
    if (!newLesson.课程主题) {
      alert('请输入课程主题');
      return;
    }
    try {
      await createRecord('tbleAUBwresCnvln', {
        '课程主题': newLesson.课程主题,
        '科目': newLesson.科目,
        '上课日期': newLesson.上课日期,
        '课堂表现评分': newLesson.课堂表现评分,
        '作业完成情况': newLesson.作业完成情况,
        '课堂内容': newLesson.课堂内容,
        '下节课计划': newLesson.下节课计划
      });
      setShowModal(false);
      setNewLesson({
        课程主题: '',
        科目: '',
        上课日期: new Date().toISOString().split('T')[0],
        课堂表现评分: 3,
        作业完成情况: '良好',
        课堂内容: '',
        下节课计划: ''
      });
      loadLessons();
    } catch (e) {
      console.error('添加课程失败', e);
      alert('添加失败，请检查网络连接');
    }
  }

  const filteredLessons = lessons.filter(l =>
    l.课程主题?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">课程记录</h2>
        <button 
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
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

      {/* 添加课程弹窗 */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-bold mb-4">添加课程记录</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">课程主题 *</label>
                <input
                  type="text"
                  value={newLesson.课程主题}
                  onChange={(e) => setNewLesson({...newLesson, 课程主题: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="请输入课程主题"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">科目</label>
                <select
                  value={newLesson.科目}
                  onChange={(e) => setNewLesson({...newLesson, 科目: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">请选择</option>
                  <option value="数学">数学</option>
                  <option value="物理">物理</option>
                  <option value="化学">化学</option>
                  <option value="生物">生物</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">上课日期</label>
                <input
                  type="date"
                  value={newLesson.上课日期}
                  onChange={(e) => setNewLesson({...newLesson, 上课日期: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">课堂表现评分</label>
                <input
                  type="number"
                  min="1"
                  max="5"
                  value={newLesson.课堂表现评分}
                  onChange={(e) => setNewLesson({...newLesson, 课堂表现评分: Number(e.target.value) || 3})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">作业完成情况</label>
                <select
                  value={newLesson.作业完成情况}
                  onChange={(e) => setNewLesson({...newLesson, 作业完成情况: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="优秀">优秀</option>
                  <option value="良好">良好</option>
                  <option value="一般">一般</option>
                  <option value="未完成">未完成</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">课堂内容</label>
                <textarea
                  value={newLesson.课堂内容}
                  onChange={(e) => setNewLesson({...newLesson, 课堂内容: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="请描述本次课堂内容..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">下节课计划</label>
                <textarea
                  value={newLesson.下节课计划}
                  onChange={(e) => setNewLesson({...newLesson, 下节课计划: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="请输入下节课的教学计划..."
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={handleAddLesson}
                className="flex-1 bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700"
              >
                确认添加
              </button>
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 bg-gray-200 text-gray-800 py-2 rounded-md hover:bg-gray-300"
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
