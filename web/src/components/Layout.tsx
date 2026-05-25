import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar, { MenuButton } from './Sidebar';

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* 侧边栏（手机端抽屉式，桌面端固定） */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* 主内容区 */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* 手机端顶部导航栏 */}
        <header className="lg:hidden sticky top-0 z-30 bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3">
          <MenuButton onClick={() => setSidebarOpen(true)} />
          <h1 className="text-lg font-bold text-gray-900">学生成长系统</h1>
        </header>

        {/* 页面内容 */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
