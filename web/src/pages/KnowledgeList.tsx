import { useEffect, useState } from 'react';
import { Plus, Search } from 'lucide-react';
import { listRecords, createRecord } from '../utils/baseApi';
import { KnowledgePoint } from '../types';

export default function KnowledgeList() {
  const [knowledgePoints, setKnowledgePoints] = useState<KnowledgePoint[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [newKnowledge, setNewKnowledge] = useState({
    知识点名称: '',
    所属科目: '',
    所属年级: '',
    难度等级: '中等'
  });

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

  async function handleAddKnowledge() {
    if (!newKnowledge.知识点名称) {
      alert('请输入知识点名称');
      return;
    }
    try {
      await createRecord('tbl4sYDOqsNIWBWp', {
        '知识点名称': newKnowledge.知识点名称,
        '所属科目': newKnowledge.所属科目,
        '所属年级': newKnowledge.所属年级,
        '难度等级': newKnowledge.难度等级
      });
      setShowModal(false);
      setNewKnowledge({
        知识点名称: '',
        所属科目: '',
        所属年级: '',
        难度等级: '中等'
      });
      loadKnowledgePoints();
    } catch (e) {
      console.error('添加知识点失败', e);
      alert('添加失败，请检查网络连接');
    }
  }

  const filteredKnowledge = knowledgePoints.filter(k =>
    k.知识点名称?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">知识点库</h2>
        <button 
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
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

      {/* 添加知识点弹窗 */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-bold mb-4">添加知识点</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">知识点名称 *</label>
                <input
                  type="text"
                  value={newKnowledge.知识点名称}
                  onChange={(e) => setNewKnowledge({...newKnowledge, 知识点名称: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="请输入知识点名称"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">所属科目</label>
                <select
                  value={newKnowledge.所属科目}
                  onChange={(e) => setNewKnowledge({...newKnowledge, 所属科目: e.target.value})}
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
                <label className="block text-sm font-medium text-gray-700 mb-1">所属年级</label>
                <select
                  value={newKnowledge.所属年级}
                  onChange={(e) => setNewKnowledge({...newKnowledge, 所属年级: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">请选择</option>
                  <option value="初一">初一</option>
                  <option value="初二">初二</option>
                  <option value="初三">初三</option>
                  <option value="高一">高一</option>
                  <option value="高二">高二</option>
                  <option value="高三">高三</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">难度等级</label>
                <select
                  value={newKnowledge.难度等级}
                  onChange={(e) => setNewKnowledge({...newKnowledge, 难度等级: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="基础">基础</option>
                  <option value="中等">中等</option>
                  <option value="较难">较难</option>
                  <option value="竞赛">竞赛</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={handleAddKnowledge}
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
