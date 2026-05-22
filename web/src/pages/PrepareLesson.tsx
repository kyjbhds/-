import { useEffect, useState } from 'react';
import { Search, AlertTriangle, BookOpen, Calendar } from 'lucide-react';
import { listRecords } from '../utils/baseApi';
import { Student, Lesson, StudentKnowledge } from '../types';

export default function PrepareLesson() {
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<string>('');
  const [studentLessons, setStudentLessons] = useState<Lesson[]>([]);
  const [weakPoints, setWeakPoints] = useState<StudentKnowledge[]>([]);

  useEffect(() => {
    loadStudents();
  }, []);

  useEffect(() => {
    if (selectedStudent) {
      loadStudentData(selectedStudent);
    }
  }, [selectedStudent]);

  async function loadStudents() {
    try {
      const res = await listRecords('tblJpLri9blmavJP', { page_size: '500' });
      const items = res.data?.items?.map((item: any) => ({
        record_id: item.record_id,
        ...item.fields
      })) || [];
      setStudents(items.filter((s: Student) => s.当前状态 === '在读'));
    } catch (e) {
      console.error('加载学生失败', e);
    }
  }

  async function loadStudentData(studentId: string) {
    try {
      const lessonsRes = await listRecords('tbleAUBwresCnvln', { page_size: '500' });
      const allLessons = lessonsRes.data?.items?.map((item: any) => ({
        record_id: item.record_id,
        ...item.fields
      })) || [];
      const filtered = allLessons.filter((l: Lesson) => l.关联学生?.includes(studentId));
      setStudentLessons(filtered.sort((a: Lesson, b: Lesson) => (b.上课日期 || 0) - (a.上课日期 || 0)));

      const skRes = await listRecords('tblyQaIBb4jghBha', { page_size: '500' });
      const allSK = skRes.data?.items?.map((item: any) => ({
        record_id: item.record_id,
        ...item.fields
      })) || [];
      const studentSK = allSK.filter((sk: StudentKnowledge) => 
        sk.关联学生?.includes(studentId) && 
        (sk.掌握程度 === '初学' || sk.掌握程度 === '未接触')
      );
      setWeakPoints(studentSK);
    } catch (e) {
      console.error('加载学生数据失败', e);
    }
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">课前准备助手</h2>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">选择学生</label>
        <select
          value={selectedStudent}
          onChange={(e) => setSelectedStudent(e.target.value)}
          className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">请选择学生...</option>
          {students.map((student) => (
            <option key={student.record_id} value={student.record_id}>
              {student.学生姓名} - {student.年级} - {student.科目?.join(', ')}
            </option>
          ))}
        </select>
      </div>

      {selectedStudent && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-red-50 text-red-600 rounded-lg">
                  <AlertTriangle size={20} />
                </div>
                <h3 className="text-lg font-semibold">薄弱知识点</h3>
              </div>
              {weakPoints.length > 0 ? (
                <div className="space-y-2">
                  {weakPoints.map((wp) => (
                    <div key={wp.record_id} className="p-3 bg-red-50 rounded-lg">
                      <p className="font-medium">{wp.关联知识点?.[0] || '未知知识点'}</p>
                      <p className="text-sm text-red-600">掌握程度: {wp.掌握程度}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">暂无薄弱知识点记录</p>
              )}
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                  <Calendar size={20} />
                </div>
                <h3 className="text-lg font-semibold">最近课程</h3>
              </div>
              {studentLessons.length > 0 ? (
                <div className="space-y-2">
                  {studentLessons.slice(0, 5).map((lesson) => (
                    <div key={lesson.record_id} className="p-3 bg-gray-50 rounded-lg">
                      <p className="font-medium">{lesson.课程主题 || '未命名'}</p>
                      <p className="text-sm text-gray-500">
                        {lesson.上课日期 ? new Date(lesson.上课日期).toLocaleDateString('zh-CN') : '无日期'}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">暂无课程记录</p>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-green-50 text-green-600 rounded-lg">
                <BookOpen size={20} />
              </div>
              <h3 className="text-lg font-semibold">备课建议</h3>
            </div>
            {weakPoints.length > 0 ? (
              <div className="space-y-3">
                <p className="text-gray-700">根据该学生的薄弱知识点，建议下节课重点讲解以下内容：</p>
                <ul className="list-disc list-inside space-y-1 text-gray-600">
                  {weakPoints.slice(0, 3).map((wp, idx) => (
                    <li key={idx}>{wp.关联知识点?.[0] || '未知知识点'} - 需要巩固练习</li>
                  ))}
                </ul>
              </div>
            ) : (
              <p className="text-gray-500">请先选择学生查看备课建议</p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
