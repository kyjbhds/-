import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import { Login, isAuthenticated } from './components/Login';
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
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setAuthenticated(isAuthenticated());
    setLoading(false);
  }, []);

  const handleLogin = () => {
    setAuthenticated(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!authenticated) {
    return <Login onLogin={handleLogin} />;
  }

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
