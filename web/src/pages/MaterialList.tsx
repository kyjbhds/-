import { useEffect, useState } from 'react';
import { Plus, Search } from 'lucide-react';
import { listRecords } from '../utils/baseApi';
import { Material } from '../types';

export default function MaterialList() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadMaterials();
  }, []);

  async function loadMaterials() {
    try {
      const res = await listRecords('tblMS5SGcYE1QFAN', { page_size: '500' });
      console.log('Materials response:', res);
      const items = res.data?.items?.map((item: any) => ({
        record_id: item.record_id,
        ...item.fields
      })) || [];
      setMaterials(items);
    } catch (e) {
      console.error('加载资料失败', e);
    }
  }

  const filteredMaterials = materials.filter(m =>
    m.资料名称?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">课程资料</h2>
        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          <Plus size={20} />
          上传资料
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
        <input
          type="text"
          placeholder="搜索资料名称..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">资料名称</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">类型</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">科目</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">年级</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">适用场景</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredMaterials.map((material) => (
              <tr key={material.record_id} className="hover:bg-gray-50">
                <td className="px-6 py-4 font-medium">{material.资料名称 || '未命名'}</td>
                <td className="px-6 py-4">
                  <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-sm">
                    {material.资料类型 || '未分类'}
                  </span>
                </td>
                <td className="px-6 py-4">{material.关联科目 || '-'}</td>
                <td className="px-6 py-4">{material.关联年级 || '-'}</td>
                <td className="px-6 py-4">{material.适用场景?.join(', ') || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
