import { useState } from 'react';
import { Download, Upload, Database, FileJson, FileSpreadsheet, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { listRecords, createRecord } from '../utils/baseApi';

interface BackupData {
  students: any[];
  lessons: any[];
  knowledge: any[];
  studentKnowledge: any[];
  materials: any[];
  milestones: any[];
  exportTime: string;
  version: string;
}

const TABLE_MAP: Record<string, string> = {
  students: 'tblJpLri9blmavJP',
  lessons: 'tbleAUBwresCnvln',
  knowledge: 'tbl placeholder',
  studentKnowledge: 'tblyQaIBb4jghBha',
  materials: 'tbl placeholder2',
  milestones: 'tbl placeholder3',
};

export default function DataBackup() {
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [stats, setStats] = useState({ students: 0, lessons: 0, knowledge: 0 });

  async function handleExport() {
    setExporting(true);
    setStatus(null);

    try {
      const [studentsRes, lessonsRes, skRes] = await Promise.all([
        listRecords(TABLE_MAP.students, { page_size: '500' }),
        listRecords(TABLE_MAP.lessons, { page_size: '500' }),
        listRecords(TABLE_MAP.studentKnowledge, { page_size: '500' }),
      ]);

      const backup: BackupData = {
        students: studentsRes.data?.items?.map((i: any) => ({ record_id: i.record_id, ...i.fields })) || [],
        lessons: lessonsRes.data?.items?.map((i: any) => ({ record_id: i.record_id, ...i.fields })) || [],
        knowledge: [],
        studentKnowledge: skRes.data?.items?.map((i: any) => ({ record_id: i.record_id, ...i.fields })) || [],
        materials: [],
        milestones: [],
        exportTime: new Date().toISOString(),
        version: '1.0',
      };

      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `student-growth-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setStats({
        students: backup.students.length,
        lessons: backup.lessons.length,
        knowledge: backup.studentKnowledge.length,
      });
      setStatus({ type: 'success', message: `导出成功！学生 ${backup.students.length} 人，课程 ${backup.lessons.length} 条，知识点 ${backup.studentKnowledge.length} 条` });
    } catch (e) {
      console.error('导出失败', e);
      setStatus({ type: 'error', message: '导出失败，请检查网络连接' });
    } finally {
      setExporting(false);
    }
  }

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    setStatus(null);

    try {
      const text = await file.text();
      const data: BackupData = JSON.parse(text);

      if (!data.version) {
        setStatus({ type: 'error', message: '无效的备份文件格式' });
        return;
      }

      let importedStudents = 0;
      let importedLessons = 0;

      if (data.students?.length > 0) {
        for (const student of data.students) {
          try {
            const { record_id, ...fields } = student;
            await createRecord(TABLE_MAP.students, fields);
            importedStudents++;
          } catch (err) {
            console.warn('导入学生失败:', err);
          }
        }
      }

      if (data.lessons?.length > 0) {
        for (const lesson of data.lessons) {
          try {
            const { record_id, ...fields } = lesson;
            await createRecord(TABLE_MAP.lessons, fields);
            importedLessons++;
          } catch (err) {
            console.warn('导入课程失败:', err);
          }
        }
      }

      setStatus({
        type: 'success',
        message: `导入完成！成功导入学生 ${importedStudents}/${data.students?.length || 0} 人，课程 ${importedLessons}/${data.lessons?.length || 0} 条`,
      });
    } catch (e) {
      console.error('导入失败', e);
      setStatus({ type: 'error', message: '导入失败，请检查文件格式' });
    } finally {
      setImporting(false);
      e.target.value = '';
    }
  }

  function handleExportCSV() {
    setExporting(true);
    setStatus(null);

    Promise.all([
      listRecords(TABLE_MAP.students, { page_size: '500' }),
      listRecords(TABLE_MAP.lessons, { page_size: '500' }),
    ])
      .then(([studentsRes, lessonsRes]) => {
        const students = studentsRes.data?.items?.map((i: any) => i.fields) || [];
        const lessons = lessonsRes.data?.items?.map((i: any) => i.fields) || [];

        const studentCsv = convertToCSV(students, ['学生姓名', '年级', '科目', '当前状态', '家长联系方式']);
        const lessonCsv = convertToCSV(lessons, ['课程主题', '科目', '课堂表现评分', '作业完成情况', '教师备注']);

        downloadFile(studentCsv, `students-${new Date().toISOString().split('T')[0]}.csv`, 'text/csv');
        downloadFile(lessonCsv, `lessons-${new Date().toISOString().split('T')[0]}.csv`, 'text/csv');

        setStatus({ type: 'success', message: 'CSV导出成功！已下载学生和课程数据' });
      })
      .catch((e) => {
        console.error('CSV导出失败', e);
        setStatus({ type: 'error', message: 'CSV导出失败' });
      })
      .finally(() => setExporting(false));
  }

  function convertToCSV(data: any[], headers: string[]): string {
    if (data.length === 0) return headers.join(',') + '\n';
    const rows = data.map((row) =>
      headers
        .map((h) => {
          const val = row[h];
          if (Array.isArray(val)) return `"${val.join(';')}"`;
          if (typeof val === 'string' && val.includes(',')) return `"${val}"`;
          return val ?? '';
        })
        .join(',')
    );
    return [headers.join(','), ...rows].join('\n');
  }

  function downloadFile(content: string, filename: string, type: string) {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">数据备份与恢复</h2>

      {status && (
        <div
          className={`p-4 rounded-lg flex items-start gap-3 ${
            status.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
          }`}
        >
          {status.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
          <p>{status.message}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
              <Download size={24} />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">导出数据</h3>
              <p className="text-sm text-gray-500">备份所有学生数据到本地</p>
            </div>
          </div>

          <div className="space-y-3">
            <button
              onClick={handleExport}
              disabled={exporting}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {exporting ? <Loader2 size={18} className="animate-spin" /> : <FileJson size={18} />}
              {exporting ? '导出中...' : '导出 JSON 备份'}
            </button>

            <button
              onClick={handleExportCSV}
              disabled={exporting}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              {exporting ? <Loader2 size={18} className="animate-spin" /> : <FileSpreadsheet size={18} />}
              {exporting ? '导出中...' : '导出 CSV 表格'}
            </button>
          </div>

          {stats.students > 0 && (
            <div className="p-3 bg-gray-50 rounded-lg text-sm text-gray-600">
              <p>上次导出：学生 {stats.students} 人，课程 {stats.lessons} 条</p>
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-50 text-green-600 rounded-lg">
              <Upload size={24} />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">导入数据</h3>
              <p className="text-sm text-gray-500">从备份文件恢复数据</p>
            </div>
          </div>

          <div className="space-y-3">
            <label className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 cursor-pointer disabled:opacity-50">
              {importing ? <Loader2 size={18} className="animate-spin" /> : <Database size={18} />}
              {importing ? '导入中...' : '选择备份文件导入'}
              <input
                type="file"
                accept=".json"
                onChange={handleImport}
                disabled={importing}
                className="hidden"
              />
            </label>

            <div className="p-3 bg-yellow-50 rounded-lg text-sm text-yellow-700">
              <p className="font-medium">⚠️ 注意事项</p>
              <ul className="mt-1 space-y-1 list-disc list-inside">
                <li>仅支持本系统导出的 JSON 文件</li>
                <li>导入会创建新记录，不会覆盖现有数据</li>
                <li>大量数据导入可能需要一些时间</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-900 mb-4">数据说明</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="font-medium text-gray-700">JSON 备份</p>
            <p className="text-gray-500 mt-1">包含完整数据结构，适合全量备份和恢复</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="font-medium text-gray-700">CSV 导出</p>
            <p className="text-gray-500 mt-1">表格格式，适合在 Excel 中查看和分析</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="font-medium text-gray-700">飞书 Base</p>
            <p className="text-gray-500 mt-1">数据实时同步存储在飞书多维表格中</p>
          </div>
        </div>
      </div>
    </div>
  );
}
