import { useEffect, useState } from 'react';
import { Plus, Search, Loader2, AlertCircle } from 'lucide-react';
import { listRecords, createRecord } from '../utils/baseApi';
import { Lesson } from '../types';

export default function LessonList() {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  
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
    setLoading(true);
    setError(null);
    try {
      console.log('开始加载课程列表...');
      const res = await listRecords('tbleAUBwresCnvln', { page_size: '500' });
      console.log('课程列表响应:', res);
      const items = res.data?.items?.map((item: any) => ({
        record_id: item.record_id,
        ...item.fields
      })) || [];
      console.log(`成功加载 ${items.length} 条课程记录`);
      setLessons(items);
    } catch (e: any) {
      console.error('加载课程失败', e);
      const errorMsg = e.message || '加载失败，请检查网络连接';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  }

  async function handleAddLesson() {
    if (!newLesson.课程主题.trim()) {
      alert('请输入课程主题');
      return;
    }
    
    setSubmitting(true);
    setSubmitError(null);
    
    try {
      console.log('开始添加课程...');
      console.log('提交的数据:', JSON.stringify(newLesson, null, 2));
      
      await createRecord('tbleAUBwresCnvln', {
        '课程主题': newLesson.课程主题,
        '科目': newLesson.科目,
        '上课日期': newLesson.上课日期,
        '课堂表现评分': newLesson.课堂表现评分,
        '作业完成情况': newLesson.作业完成情况,
        '课堂内容': newLesson.课堂内容,
        '下节课计划': newLesson.下节课计划
      });
      
      console.log('课程添加成功');
      
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
      
      alert('课程添加成功！');
      loadLessons();
    } catch (e: any) {
      console.error('添加课程失败', e);
      const errorMsg = e.message || '添加失败，请检查网络连接';
      setSubmitError(errorMsg);
      alert(`添加失败：${errorMsg}`);
    } finally {
      setSubmitting(false);
    }
  }

  const filteredLessons = lessons.filter(l =>
    l.课程主题?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-blue-600" size={48} />
        <span className="ml-3 text-gray-600">加载中...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">课程记录</h2>
        <div className="flex items-center gap-3">
          <button
            onClick={() => loadLessons()}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            刷新列表
          </button>
          <button 
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus size={20} />
            添加课程
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
          <div className="flex-1">
            <h3 className="font-medium text-red-800">加载失败</h3>
            <p className="text-sm text-red-600 mt-1">{error}</p>
            <button
              onClick={() => loadLessons()}
              className="mt-2 text-sm text-red-700 underline hover:no-underline"
            >
              点击重试
            </button>
          </div>
        </div>
      )}

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
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <p className="text-sm text-gray-600">
            共 <span className="font-semibold text-gray-900">{filteredLessons.length}</span> 条课程记录
          </p>
        </div>
        
        {filteredLessons.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">暂无课程记录</p>
            <button
              onClick={() => setShowModal(true)}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              添加第一条记录
            </button>
          </div>
        ) : (
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
        )}
      </div>

      {/* 添加课程弹窗 */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold mb-4">添加课程记录</h3>
            
            {submitError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={16} />
                <p className="text-sm text-red-700">{submitError}</p>
              </div>
            )}
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">课程主题 *</label>
                <input
                  type="text"
                  value={newLesson.课程主题}
                  onChange={(e) => setNewLesson({...newLesson, 课程主题: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="请输入课程主题"
                  disabled={submitting}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">科目</label>
                <select
                  value={newLesson.科目}
                  onChange={(e) => setNewLesson({...newLesson, 科目: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={submitting}
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
                  disabled={submitting}
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
                  disabled={submitting}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">作业完成情况</label>
                <select
                  value={newLesson.作业完成情况}
                  onChange={(e) => setNewLesson({...newLesson, 作业完成情况: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={submitting}
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
                  disabled={submitting}
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
                  disabled={submitting}
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={handleAddLesson}
                disabled={submitting}
                className="flex-1 bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 disabled:bg-blue-300 flex items-center justify-center gap-2"
              >
                {submitting && <Loader2 className="animate-spin" size={16} />}
                {submitting ? '添加中...' : '确认添加'}
              </button>
              <button
                onClick={() => {
                  setShowModal(false);
                  setSubmitError(null);
                }}
                disabled={submitting}
                className="flex-1 bg-gray-200 text-gray-800 py-2 rounded-md hover:bg-gray-300 disabled:bg-gray-100"
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
