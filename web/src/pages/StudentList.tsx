import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search } from 'lucide-react';
import { listRecords, createRecord } from '../utils/baseApi';
import { Student } from '../types';

export default function StudentList() {
  const [students, setStudents] = useState<Student[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [newStudent, setNewStudent] = useState({
    学生姓名: '',
    年级: '',
    科目: [] as string[],
    家长联系方式: '',
    地址: '',
    当前状态: '在读'
  });

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

  async function handleAddStudent() {
    if (!newStudent.学生姓名) {
      alert('请输入学生姓名');
      return;
    }
    try {
      await createRecord('tblJpLri9blmavJP', {
        '学生姓名': newStudent.学生姓名,
        '年级': newStudent.年级,
        '科目': newStudent.科目,
        '家长联系方式': newStudent.家长联系方式,
        '地址': newStudent.地址,
        '当前状态': newStudent.当前状态,
        '总课时数': 0
      });
      setShowModal(false);
      setNewStudent({
        学生姓名: '',
        年级: '',
        科目: [],
        家长联系方式: '',
        地址: '',
        当前状态: '在读'
      });
      loadStudents();
    } catch (e) {
      console.error('添加学生失败', e);
      alert('添加失败，请检查网络连接');
    }
  }

  const filteredStudents = students.filter(s =>
    s.学生姓名?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">学生档案</h2>
        <button 
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
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

      {/* 添加学生弹窗 */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-bold mb-4">添加学生</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">学生姓名 *</label>
                <input
                  type="text"
                  value={newStudent.学生姓名}
                  onChange={(e) => setNewStudent({...newStudent, 学生姓名: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="请输入学生姓名"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">年级</label>
                <select
                  value={newStudent.年级}
                  onChange={(e) => setNewStudent({...newStudent, 年级: e.target.value})}
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
                <label className="block text-sm font-medium text-gray-700 mb-1">科目</label>
                <div className="flex gap-2 flex-wrap">
                  {['数学', '物理', '化学', '生物'].map(subject => (
                    <label key={subject} className="flex items-center gap-1">
                      <input
                        type="checkbox"
                        checked={newStudent.科目.includes(subject)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setNewStudent({...newStudent, 科目: [...newStudent.科目, subject]});
                          } else {
                            setNewStudent({...newStudent, 科目: newStudent.科目.filter(s => s !== subject)});
                          }
                        }}
                        className="rounded"
                      />
                      <span className="text-sm">{subject}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">家长联系方式</label>
                <input
                  type="text"
                  value={newStudent.家长联系方式}
                  onChange={(e) => setNewStudent({...newStudent, 家长联系方式: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="手机号或微信"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">地址</label>
                <input
                  type="text"
                  value={newStudent.地址}
                  onChange={(e) => setNewStudent({...newStudent, 地址: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="学生家庭地址"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={handleAddStudent}
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
