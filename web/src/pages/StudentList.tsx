import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search } from 'lucide-react';
import { listRecords } from '../utils/baseApi';
import { Student } from '../types';

export default function StudentList() {
  const [students, setStudents] = useState<Student[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadStudents();
  }, []);

  async function loadStudents() {
    try {
      const res = await listRecords('tblJpLri9blmavJP', { page_size: '500' });
      const items = res.data?.items?.map((item: any) => ({
        record_id: item.record_id,
        ...item.fields
      })) || [];
      setStudents(items);
    } catch (e) {
      console.error('加载学生失败', e);
    }
  }

  const filteredStudents = students.filter(s =>
    s.学生姓名?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">学生档案</h2>
        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          <Plus size={20} />
          添加学生
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
        <input
          type="text"
          placeholder="搜索学生姓名..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">学生姓名</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">年级</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">科目</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">状态</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">总课时</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredStudents.map((student) => (
              <tr key={student.record_id} className="hover:bg-gray-50">
                <td className="px-6 py-4 font-medium">{student.学生姓名}</td>
                <td className="px-6 py-4">{student.年级}</td>
                <td className="px-6 py-4">{student.科目?.join(', ')}</td>
                <td className="px-6 py-4">
                  <StatusBadge status={student.当前状态} />
                </td>
                <td className="px-6 py-4">{student.总课时数 || 0}</td>
                <td className="px-6 py-4">
                  <Link
                    to={`/students/${student.record_id}`}
                    className="text-blue-600 hover:text-blue-700 font-medium"
                  >
                    查看详情
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
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
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[status] || 'bg-gray-100'}`}>
      {status}
    </span>
  );
}
