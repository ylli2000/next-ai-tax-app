# 📋 发票管理系统 - 开发任务清单

## 🎯 项目概述
基于PRD构建AI驱动的发票提取与管理应用程序，采用渐进式开发策略，从基础架构到完整功能逐步实现。

## 🏗️ 技术栈确认
- **框架**: Next.js 15.x + React 19.x + TypeScript
- **样式**: Tailwind CSS + Shadcn UI + Framer Motion
- **状态管理**: Zustand (localStorage持久化)
- **数据库**: PostgreSQL + Drizzle ORM
- **认证**: NextAuth.js v5
- **邮件服务**: Nodemailer (邮件验证、通知)
- **文件处理**: formidable + sharp
- **第三方服务**: OpenAI GPT-4 Vision API
- **UI增强**: Recharts + TanStack Table
- **国际化**: next-intl
- **导出**: xlsx
- **开发工具**: Prettier + ESLint + Jest + React Testing Library
- **部署**: Vercel + GitHub Actions

---

## 🎪 第一阶段：基础架构搭建 (Phase 1)

### 📦 1.1 项目初始化和配置
- [x] 使用 `create-next-app` 初始化项目 ✅ *已有*
- [x] 配置 TypeScript、ESLint、Prettier ✅ *已有*
- [x] 安装和配置 Tailwind CSS ✅ *已有 v4*
- [x] 安装和配置 Shadcn UI 组件库 ✅ *依赖已安装*
- [x] 配置 Framer Motion 动画库 ✅ *依赖已安装*
- [x] 设置项目目录结构 (/schema, /utils, /components, /dal, /api, /actions) ✅
- [x] 配置环境变量管理 (.env.local, .env.example) ✅

### 🏷️ 1.2 类型定义和枚举 (/schema)
- [x] **envSchema.ts**: 环境变量类型定义 ✅ *包含完整的环境变量验证*
- [x] **userSchema.ts**: 用户相关类型 (User, UserRole, UserProfile) ✅ *重命名为Schema*
- [x] **invoiceSchema.ts**: 发票相关类型 (Invoice, InvoiceStatus, InvoiceCategory) ✅ *重命名为Schema*
- [x] **uploadSchema.ts**: 文件上传类型 (FileUpload, UploadStatus) ✅ *重命名为Schema*
- [x] **aiSchema.ts**: AI处理类型 (AIResponse, ExtractionResult, ValidationResult) ✅ *重命名为Schema*
- [x] **apiSchema.ts**: API响应类型 (ApiResponse, PaginatedResponse, ErrorResponse) ✅ *重命名为Schema*
- [x] **uiSchema.ts**: UI状态类型 (Theme, Language, ToastType) ✅ *重命名为Schema*
- [x] **exportSchema.ts**: 导出相关类型 (ExportFormat, ExportOptions) ✅ *重命名为Schema*

### 🗄️ 1.3 数据库设计和连接
- [x] 设计数据库 Schema (users, invoices, categories, files) ✅ *完整schema设计*
- [x] 配置 Drizzle ORM 连接 ✅ *使用Neon HTTP适配器*
- [x] 配置 Vercel Postgres 连接 ✅ *通过环境变量配置*
- [x] 创建数据库迁移文件 ✅ *drizzle-kit配置完成*
- [x] 编写数据库种子文件 (seed users, categories) ✅ *包含管理员用户和默认分类*

### 📧 1.4 邮件服务配置 (Nodemailer)
- [x] 安装 Nodemailer 依赖包 ✅ *nodemailer + @types/nodemailer*
- [x] 配置邮件环境变量 ✅ *EMAIL_SERVER_HOST, PORT, USER, PASSWORD, FROM*
- [ ] 创建邮件服务类 🚧 *将在Phase 2.2实现EmailService*
- [ ] 实现邮件模板系统 🚧 *欢迎、验证、发票处理、密码重置、异常通知*
- [x] 集成环境变量验证 ✅ *在envSchema.ts中*

### 🔐 1.5 用户认证系统
- [ ] 配置 NextAuth.js v5 🚧 *依赖已安装，待配置*
- [ ] 设置认证提供商 (Email, Google, GitHub) 🚧 *环境变量已预设*
- [ ] 创建认证中间件 (middleware.ts) 
- [ ] 实现角色权限管理 (RBAC) 🚧 *schema已包含角色*
- [x] 创建种子管理员用户 ✅ *在seed.ts中*

---

## ⚙️ 第二阶段：核心服务层 (Phase 2)

### 🔧 2.1 工具函数库 (/utils)
> ℹ️ 默认采用澳洲本地标准：日期格式（DD/MM/YYYY）、财年计算（7月1日-6月30日）、货币显示（A$1,234.56）。支持国际发票的多币种显示（USD: $1,234.56, GBP: £1,234.56, EUR: €1,234.56, JPY: ¥1,235, CNY: CN¥1,234.56），但税务计算仅适用澳洲GST（10%），确保符合澳洲税务局(ATO)要求。
- [x] **authUtils.ts**: 认证相关工具函数 ✅ *密码加密、权限控制、会话管理*
- [x] **validationUtils.ts**: 数据验证函数 (Zod schemas) ✅ *已重命名，包含完整验证系统*
- [x] **fileUtils.ts**: 文件处理工具函数 ✅ *已重命名，包含文件转换、压缩等*
- [x] **formatUtils.ts**: 数据格式化函数 (日期、货币、文件大小) ✅ *已重命名，完整格式化工具*
- [x] **exportUtils.ts**: 导出功能工具函数 ✅ *Excel/CSV导出、字段映射*
- [x] **aiUtils.ts**: AI响应处理工具函数 ✅ *OpenAI响应处理、分类建议*
- [x] **constants.ts**: 常量定义 (分类、状态枚举等) ✅ *全面扩展，新增AUTH_CONSTANTS*
- [x] **dateUtils.ts**: 日期处理工具函数 ✅ *dayjs集成、时区转换、财年计算*
- [x] **apiUtils.ts**: API交互工具函数 ✅ *HTTP封装、重试机制、错误处理*
- [x] **errorUtils.ts**: 错误处理工具函数 ✅ *结构化错误、用户友好消息*

### 🌐 2.2 第三方服务集成
- [ ] **OpenAI API 集成**: 文件上传和图像识别
- [ ] **文件上传服务**: formidable + sharp 图片优化
- [ ] **测试 OpenAI Vision API**: 发票信息提取测试
- [ ] **错误处理**: API调用失败处理机制

### 🗃️ 2.3 数据访问层 (/dal)
- [ ] **userDal.ts**: 用户数据访问层
- [ ] **invoiceDal.ts**: 发票数据访问层  
- [ ] **categoryDal.ts**: 分类数据访问层
- [ ] **fileDal.ts**: 文件数据访问层
- [ ] **statisticsDal.ts**: 统计数据访问层
- [ ] **确保所有DAL函数只能通过API访问**

### 🔗 2.4 API路由设计 (/api)
- [ ] **auth相关**: `/api/auth/*` (NextAuth配置)
- [ ] **用户管理**: `/api/users/*` (CRUD, profile)
- [ ] **发票管理**: `/api/invoices/*` (CRUD, upload, list)
- [ ] **分类管理**: `/api/categories/*` (CRUD, custom categories)
- [ ] **文件处理**: `/api/files/*` (upload, process, preview)
- [ ] **AI处理**: `/api/ai/*` (extract, validate, suggest)
- [ ] **统计分析**: `/api/analytics/*` (statistics, reports)
- [ ] **导出功能**: `/api/export/*` (excel, csv)

---

## 🧠 第三阶段：业务逻辑层 (Phase 3)

### 🎭 3.1 状态管理 (Zustand)
- [ ] **authStore.ts**: 用户认证状态
- [ ] **invoiceStore.ts**: 发票管理状态
- [ ] **uiStore.ts**: UI状态 (主题、语言、加载状态)
- [ ] **uploadStore.ts**: 文件上传状态
- [ ] **配置localStorage持久化**

### 🎬 3.2 Actions (/actions)
- [ ] **authActions.ts**: 认证相关操作
- [ ] **invoiceActions.ts**: 发票操作 (通过API)
- [ ] **uploadActions.ts**: 文件上传操作
- [ ] **exportActions.ts**: 导出操作
- [ ] **确保所有Actions通过API访问，不直接访问DAL**

### 🪝 3.3 自定义Hooks (/hooks)
- [ ] **useAuth.ts**: 认证状态管理
- [ ] **useInvoices.ts**: 发票数据管理
- [ ] **useUpload.ts**: 文件上传管理
- [ ] **useLocalStorage.ts**: 本地存储管理
- [ ] **useDebounce.ts**: 防抖处理
- [ ] **useToast.ts**: 消息提示管理

### 🤖 3.4 AI业务逻辑
> ℹ️ 所有AI处理均使用OpenAI GPT-4 Vision API，支持多币种发票识别，但税务抵扣判断仅基于澳洲税法规则。
- [ ] **发票信息提取**: 结构化输出处理
- [ ] **数据验证逻辑**: 金额计算、格式验证
- [ ] **异常检测**: 重复发票、异常金额检测
- [ ] **智能分类**: 基于历史数据的分类建议
- [ ] **税务抵扣识别**: AI识别可抵扣项目

---

## 🎨 第四阶段：用户界面层 (Phase 4)

### 🧩 4.1 基础UI组件 (/components/ui)
- [ ] 安装和配置所有需要的 Shadcn UI 组件
- [ ] **ThemeProvider**: 明暗主题切换
- [ ] **LoadingSpinner**: 加载动画组件
- [ ] **Toast**: 消息提示组件
- [ ] **Modal**: 模态框组件
- [ ] **DataTable**: 基于TanStack Table的数据表格
- [ ] **FileUpload**: 文件上传组件
- [ ] **ConfettiAnimation**: 成功庆祝动画

### 🏠 4.2 业务组件 (/components)
- [ ] **Header**: 导航栏组件 (含语言/主题切换)
- [ ] **Sidebar**: 侧边栏导航
- [ ] **InvoiceCard**: 发票卡片组件
- [ ] **StatisticsCard**: 统计卡片组件
- [ ] **CategorySelector**: 分类选择器
- [ ] **FilterPanel**: 筛选面板
- [ ] **ExportButton**: 导出按钮组件
- [ ] **WelcomeMessage**: 个性化欢迎信息

### 🌍 4.3 国际化配置
> ℹ️ 本项目主要面向澳洲用户，默认采用澳洲本地化标准，同时支持国际发票的多币种显示和处理。
- [ ] 配置 next-intl
- [ ] 创建中英文语言文件
- [ ] 实现语言切换功能
- [ ] 配置 middleware 语言路由

### 📄 4.4 页面组件 (/app)
- [ ] **根布局**: app/layout.tsx (含认证检查)
- [ ] **首页**: app/page.tsx (仪表板)
- [ ] **登录页**: app/auth/signin/page.tsx
- [ ] **上传页**: app/upload/page.tsx
- [ ] **发票列表**: app/invoices/page.tsx
- [ ] **发票详情**: app/invoices/[id]/page.tsx
- [ ] **用户设置**: app/settings/page.tsx

---

## 📊 第五阶段：高级功能 (Phase 5)

### 📈 5.1 数据分析功能
> ℹ️ 所有数据分析均使用Recharts库，财年报表按澳洲标准（7月-6月），支持多币种金额展示，但税务抵扣分析仅基于澳洲GST规则。
- [ ] **统计面板**: 总支出、分类占比、趋势分析
- [ ] **图表组件**: Recharts 集成 (柱状图、饼图、折线图)
- [ ] **时间筛选**: 按月份、季度、财年分组
- [ ] **供应商分析**: 供应商支出统计

### 📋 5.2 导出功能
- [ ] **Excel导出**: 使用xlsx库实现
- [ ] **CSV导出**: 同样使用xlsx库
- [ ] **自定义字段**: 用户选择导出字段
- [ ] **批量导出**: 支持筛选后批量导出

### 😊 5.3 愉悦化用户体验
- [ ] **成功动画**: 上传成功的彩色纸屑动画
- [ ] **里程碑庆祝**: 处理发票数量提醒
- [ ] **友好空状态**: 可爱的空状态插图和文案
- [ ] **温暖错误处理**: 友好的错误提示信息
- [ ] **微交互动画**: 悬停效果、加载动画
- [ ] **智能鼓励系统**: 使用习惯鼓励和赞美
- [ ] **个性化问候**: 基于时间的用户称呼

---

## 🧪 第六阶段：测试和优化 (Phase 6)

### ✅ 6.1 单元测试
- [x] 工具函数测试 (/utils)
- [ ] 组件测试 (/components)
- [ ] API路由测试 (/api)
- [ ] Hook测试 (/hooks)

### 🔍 6.2 集成测试
- [ ] 文件上传流程测试
- [ ] AI识别功能测试
- [ ] 用户认证流程测试
- [ ] 导出功能测试

### ⚡ 6.3 性能优化
- [ ] 图片优化 (sharp压缩)
- [ ] 代码分割优化
- [ ] API响应缓存策略
- [ ] 数据库查询优化

### 🚀 6.4 部署准备
- [ ] 配置 Vercel 部署
- [ ] 设置 GitHub Actions CI/CD
- [ ] 环境变量配置
- [ ] 数据库迁移部署
- [ ] 生产环境测试

---

## 📝 开发规范

### 🎯 编码规范
- 所有代码使用英文注释
- 使用 TypeScript 严格模式
- 避免使用 `any` 或 `unknown`
- 优先使用 `type` 而不是 `interface`
- React组件props使用独立类型定义

### 🔒 安全规范  
- DAL访问只能通过API进行
- Actions不能直接访问DAL，必须通过API
- 严格的用户权限验证
- 敏感数据加密存储

### 📦 文件组织
```
数据模型都在 /schema/*Tables.ts
类型和数据模型定义,都在 /schema/*Schema.ts
工具函数都在 /utils 目录
例子:
src/
├── app/                 # Next.js App Router页面
├── components/          # 可重用组件
│   └── ui/             # Shadcn UI组件
├── utils/              # 工具函数
├── dal/                # 数据访问层
├── schema/             # 类型和数据模型定义
├── actions/            # Server Actions
├── hooks/              # 自定义Hooks
└── stores/             # Zustand状态管理
```

---

## 🏁 里程碑检查点

### ✅ Phase 1 完成标志
- [x] 项目成功运行 ✅ *Next.js 15 + Tailwind CSS v4*
- [ ] 数据库连接正常 🚧 *需要设置DATABASE_URL*
- [ ] 用户认证系统可用 🚧 *NextAuth配置待完成*
- [ ] 种子数据插入成功 🚧 *等待数据库连接*

### ✅ Phase 2 完成标志  
- [ ] OpenAI API集成测试通过
- [ ] 文件上传功能正常
- [ ] 所有API端点响应正常
- [ ] DAL层功能完整

### ✅ Phase 3 完成标志
- [ ] 状态管理正常工作
- [ ] AI业务逻辑测试通过
- [ ] 所有Actions功能正常

### ✅ Phase 4 完成标志
- [ ] 所有页面正常渲染
- [ ] 国际化切换正常
- [ ] 主题切换正常
- [ ] 响应式布局正常

### ✅ Phase 5 完成标志
- [ ] 数据分析图表显示正常
- [ ] 导出功能测试通过
- [ ] 愉悦化体验功能完整

### ✅ Phase 6 完成标志
- [ ] 所有测试通过
- [ ] 性能指标达标
- [ ] 生产环境部署成功

---

*📅 预计开发周期：6-8周*
*👥 建议团队规模：2-3名开发者*
*🎯 优先级：P0(必须) > P1(重要) > P2(可选)* 