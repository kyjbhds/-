import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, BookOpen, FileText, Brain, GraduationCap, PlusCircle, Sparkles, Database, MessageSquare, LogOut } from 'lucide-react';
import { logout } from './Login';

const navItems = [
  { path: '/', label: '仪表盘', icon: LayoutDashboard },
  { path: '/students', label: '学生档案', icon: Users },
  { path: '/lessons', label: '课程记录', icon: BookOpen },
  { path: '/lessons/record', label: '课后记录', icon: PlusCircle },
  { path: '/lessons/ai-record', label: 'AI智能记录', icon: Sparkles },
  { path: '/materials', label: '课程资料', icon: FileText },
  { path: '/knowledge', label: '知识点库', icon: Brain },
  { path: '/prepare', label: '课前准备', icon: GraduationCap },
  { path: '/feishu-bot', label: '飞书机器人', icon: MessageSquare },
  { path: '/backup', label: '数据备份', icon: Database },
];

export default function Sidebar() {
  const location = useLocation();

  const handleLogout = () => {
    if (confirm('确定要退出登录吗？')) {
      logout();
    }
  };

  return (
    <aside className="w-64 bg-white border-r border-gray-200 min-h-screen flex flex-col">
      <div className="p-6">
        <h1 className="text-xl font-bold text-gray-900">学生成长系统</h1>
      </div>
      <nav className="px-4 space-y-1 flex-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/');
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isActive
                  ? 'bg-blue-50 text-blue-700 font-medium'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Icon size={20} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="px-4 pb-6">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-600 hover:bg-gray-50 hover:text-red-600 transition-colors"
        >
          <LogOut size={20} />
          <span>退出登录</span>
        </button>
      </div>
    </aside>
  );
}
