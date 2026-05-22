# 学生成长管理系统

为独立教师打造的学生学习档案与成长可视化系统！

---

## 🚀 快速开始

### 1. 本地开发模式
```bash
cd /workspace/student-growth-system/web
npm install
npm run dev
```
然后访问 **http://localhost:5173**

### 2. 生产构建
```bash
npm run build
# 构建产物在 dist/ 目录
```

---

## 📋 已实现功能

### ✅ 核心功能
- **学生档案管理**：添加、查看、编辑学生信息
- **课程记录管理**：手动/AI智能记录每节课
- **成长可视化**：雷达图、成长曲线、学习时间线
- **家长报告**：一键生成PDF报告（月度/学期/完课）
- **数据备份**：JSON/CSV导入导出

### 📱 页面导航
| 页面 | 路径 | 说明 |
|------|------|------|
| 仪表盘 | `/` | 全局概览 + 快速操作 |
| 学生档案 | `/students` | 学生列表 |
| 学生详情 | `/students/:id` | 学生档案 + 可视化 |
| 成长报告 | `/students/:id/report` | 生成PDF报告 |
| 成长时间线 | `/students/:id/timeline` | 学习历程 |
| 课程列表 | `/lessons` | 历史课程 |
| 课后记录 | `/lessons/record` | 手动记录 |
| AI智能记录 | `/lessons/ai-record` | 图片识别自动记录 |
| 知识点库 | `/knowledge` | 知识管理 |
| 课程资料 | `/materials` | 资料管理 |
| 课前准备 | `/prepare` | 备课助手 |
| 数据备份 | `/backup` | 导入导出 |

---

## 🔧 环境配置

在 `web/.env` 中配置（如不存在则复制 `.env.example`）：

```bash
# 飞书 Base 配置
VITE_BASE_TOKEN=你的base_token

# OpenAI API（用于AI图片识别）
VITE_OPENAI_API_KEY=你的api_key

# 飞书机器人 Webhook（用于自动通知家长）
VITE_FEISHU_BOT_WEBHOOK=https://open.feishu.cn/open-apis/bot/v2/hook/...
```

---

## 📝 待办事项

详见 [TODO.md](./TODO.md)

### 下次提醒：
- ⏰ 配置飞书机器人 Webhook

---

## 🛠️ 技术栈
- **前端框架**：React 18 + TypeScript + Vite
- **UI组件**：Tailwind CSS + Lucide 图标
- **图表库**：Recharts
- **数据存储**：飞书多维表格 API
- **AI处理**：GPT-4 Vision API
- **PDF导出**：jsPDF + html2canvas

---

## 📄 许可证
本项目仅供学习和个人使用。
