import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, BookOpen, FileText, Brain, GraduationCap, PlusCircle, Sparkles, Database, MessageSquare, LogOut, X, Menu } from 'lucide-react';
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

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const location = useLocation();

  const handleLogout = () => {
    if (confirm('确定要退出登录吗？')) {
      logout();
    }
  };

  const handleNavClick = () => {
    onClose();
  };

  return (
    <>
      {/* 手机端遮罩层 */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* 侧边栏 */}
      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-50
          w-64 bg-white border-r border-gray-200
          flex flex-col
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* 顶部：标题 + 关闭按钮 */}
        <div className="flex items-center justify-between p-4 lg:p-6">
          <h1 className="text-xl font-bold text-gray-900">学生成长系统</h1>
          <button
            onClick={onClose}
            className="lg:hidden p-1 rounded-md text-gray-500 hover:bg-gray-100"
          >
            <X size={22} />
          </button>
        </div>

        {/* 导航列表 */}
        <nav className="px-3 lg:px-4 space-y-1 flex-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path || 
              (item.path !== '/' && location.pathname.startsWith(item.path + '/'));
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={handleNavClick}
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

        {/* 退出登录 */}
        <div className="px-3 lg:px-4 pb-6">
          <button
            onClick={() => {
              handleLogout();
              onClose();
            }}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-600 hover:bg-gray-50 hover:text-red-600 transition-colors"
          >
            <LogOut size={20} />
            <span>退出登录</span>
          </button>
        </div>
      </aside>
    </>
  );
}

// 导出汉堡菜单按钮供Layout使用
export function MenuButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="lg:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100"
    >
      <Menu size={24} />
    </button>
  );
}
