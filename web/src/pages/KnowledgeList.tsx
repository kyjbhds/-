import { useEffect, useState } from 'react';
import { Plus, Search } from 'lucide-react';
import { listRecords } from '../utils/baseApi';
import { KnowledgePoint } from '../types';

export default function KnowledgeList() {
  const [knowledgePoints, setKnowledgePoints] = useState<KnowledgePoint[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadKnowledgePoints();
  }, []);

  async function loadKnowledgePoints() {
    try {
      const res = await listRecords('tbl4sYDOqsNIWBWp', { page_size: '500' });
      console.log('Knowledge response:', res);
      const items = res.data?.items?.map((item: any) => ({
        record_id: item.record_id,
        ...item.fields
      })) || [];
      setKnowledgePoints(items);
    } catch (e) {
      console.error('加载知识点失败', e);
    }
  }

  const filteredKnowledge = knowledgePoints.filter(k =>
    k.知识点名称?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">知识点库</h2>
        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          <Plus size={20} />
          添加知识点
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
        <input
          type="text"
          placeholder="搜索知识点名称..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">知识点名称</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">科目</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">年级</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">难度</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredKnowledge.map((kp) => (
              <tr key={kp.record_id} className="hover:bg-gray-50">
                <td className="px-6 py-4 font-medium">{kp.知识点名称 || '未命名'}</td>
                <td className="px-6 py-4">{kp.所属科目 || '-'}</td>
                <td className="px-6 py-4">{kp.所属年级 || '-'}</td>
                <td className="px-6 py-4">
                  <DifficultyBadge level={kp.难度等级} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function DifficultyBadge({ level }: { level: string }) {
  const colors: Record<string, string> = {
    '基础': 'bg-green-100 text-green-700',
    '中等': 'bg-blue-100 text-blue-700',
    '较难': 'bg-orange-100 text-orange-700',
    '竞赛': 'bg-red-100 text-red-700',
  };

  return (
    <span className={`px-2 py-1 rounded text-sm font-medium ${colors[level] || 'bg-gray-100'}`}>
      {level || '未分类'}
    </span>
  );
}
