# Axiom — 智能审计工作底稿平台

Axiom 是一款面向审计团队的智能工作底稿管理平台，提供从账簿导入、科目管理、试算平衡到 A300 检查的全流程数字化审计支持。

---

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | React 18 + Vite + TypeScript + Ant Design + Tailwind CSS |
| 状态管理 | Redux Toolkit |
| 后端 | Django 5 + Python 3.14 + Django REST Framework |
| 数据库 | SQLite（开发）/ PostgreSQL（生产） |
| 构建工具 | npm |

---

## 功能特性

- **多项目管理** — 支持按审计项目隔离数据与权限
- **智能账簿导入** — 支持 CSV / Excel 多格式上传、列映射、数据校验、版本管理
- **科目表管理** — 动态总账科目维护与余额追踪
- **试算平衡** — 自动生成试算平衡表并标识差异
- **A300 检查** — 自动化审计检查清单与异常标记
- **工作底稿概览** — 项目级仪表盘，实时掌握审计进度
- **调整分录** — 审计调整录入与自动回滚
- **角色权限** — 基于项目的 RBAC 权限控制（审计员 / 经理 / 管理员）

---

## 快速启动

### 后端

```bash
cd backend
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

### 前端

```bash
cd frontend
npm install
npm run dev
```

---

## 项目结构

```
Axiom/
├── backend/                 # Django 后端
│   ├── apps/
│   │   ├── accounts/        # 用户认证
│   │   ├── projects/        # 项目管理
│   │   ├── ledger/          # 科目表 / 总账
│   │   ├── imports/         # 账簿导入（上传 / 解析 / 校验 / 版本）
│   │   ├── adjustments/     # 审计调整
│   │   ├── trial_balance/   # 试算平衡
│   │   ├── a300_checks/     # A300 审计检查
│   │   ├── workpapers/      # 工作底稿
│   │   ├── notes/           # 项目笔记
│   │   └── exports/         # 报告导出
│   └── axiom/               # Django 配置
├── frontend/                # React 前端
│   ├── src/
│   │   ├── modules/         # 页面模块
│   │   ├── features/        # Redux slices
│   │   ├── api/             # API 封装
│   │   └── components/      # 公共组件
│   └── index.html
└── README.md
```

---

## 贡献

欢迎提交 Issue 和 Pull Request。

---

> 本项目为审计数字化转型而生。
