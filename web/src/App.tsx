import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import StudentList from './pages/StudentList';
import StudentDetail from './pages/StudentDetail';
import StudentReport from './pages/StudentReport';
import StudentTimeline from './pages/StudentTimeline';
import LessonList from './pages/LessonList';
import LessonRecord from './pages/LessonRecord';
import AiLessonRecord from './pages/AiLessonRecord';
import MaterialList from './pages/MaterialList';
import KnowledgeList from './pages/KnowledgeList';
import PrepareLesson from './pages/PrepareLesson';
import DataBackup from './pages/DataBackup';
import FeishuBotAssistant from './pages/FeishuBotAssistant';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="students" element={<StudentList />} />
          <Route path="students/:id" element={<StudentDetail />} />
          <Route path="students/:id/report" element={<StudentReport />} />
          <Route path="students/:id/timeline" element={<StudentTimeline />} />
          <Route path="lessons" element={<LessonList />} />
          <Route path="lessons/record" element={<LessonRecord />} />
          <Route path="lessons/ai-record" element={<AiLessonRecord />} />
          <Route path="materials" element={<MaterialList />} />
          <Route path="knowledge" element={<KnowledgeList />} />
          <Route path="prepare" element={<PrepareLesson />} />
          <Route path="backup" element={<DataBackup />} />
          <Route path="feishu-bot" element={<FeishuBotAssistant />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
