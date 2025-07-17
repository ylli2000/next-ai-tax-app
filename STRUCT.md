# 📁 项目结构文档

## 🏗️ 架构概览

本项目采用分层架构，明确分离关注点：

**数据流向：** `Schema` → `DAL` → `Services` → `API Routes` → `Components`

**工具支持：** `lib/`（配置层）+ `utils/`（工具层）支持所有层级

---

## 📂 目录结构详解

### `/src/lib/` - 核心基础设施
*基础配置和第三方服务集成*

- **`auth.ts`** - NextAuth.js配置及OAuth提供商 // (使用者：app路由、中间件、认证操作)
- **`database.ts`** - Drizzle ORM数据库连接配置 // (使用者：DAL层、API路由)

### `/src/utils/` - 工具函数库
*按作用域和复杂度组织的纯工具函数*

#### `/src/utils/sys/` - 系统级工具
*最小依赖的底层系统工具*

- **`env.ts`** - 环境变量验证和管理 // (使用者：所有层级、构建脚本、数据库工具)
- **`log.ts`** - 开发和生产环境的结构化日志工具 // (使用者：所有服务、API路由、错误处理)

#### `/src/utils/core/` - 应用级工具
*业务无关的通用工具函数*

- **`api.ts`** - HTTP请求封装，包含重试逻辑和错误处理 // (使用者：前端组件、客户端数据获取)
- **`auth.ts`** - 认证辅助函数、密码加密、角色验证 // (使用者：认证操作、API中间件、用户管理)
- **`browser.ts`** - 浏览器兼容性检测和DOM工具 // (使用者：文件上传组件、客户端处理)
- **`date.ts`** - 日期格式化和澳洲财年计算 // (使用者：发票显示、分析统计、导出功能)
- **`endpoint.ts`** - API端点URL构建器和路径验证 // (使用者：前端API调用、路由工具)
- **`file.ts`** - 文件验证、元数据提取、类型检查 // (使用者：上传组件、文件处理服务)
- **`format.ts`** - 货币、文件大小、数字的数据格式化 // (使用者：UI组件、导出功能、显示工具)
- **`route.ts`** - URL构建、路由验证、导航辅助 // (使用者：组件、中间件、API路由)

### `/src/services/` - 业务服务层
*特定领域的业务逻辑和编排*

#### `/src/services/ai/` - AI处理服务
- **`processing.ts`** - OpenAI Vision API集成、发票数据提取、验证 // (使用者：上传API路由、发票处理工作流)

#### `/src/services/file/` - 文件处理服务
- **`export.ts`** - Excel/CSV导出生成、数据转换 // (使用者：导出API路由、分析组件)
- **`image.ts`** - 客户端图像压缩和优化 // (使用者：上传工作流、文件处理)
- **`pdf.ts`** - 使用PDF.js进行PDF转图像转换 // (使用者：上传工作流、文档处理)

#### `/src/services/storage/` - 存储服务
- **`aws.ts`** - AWS S3操作、预签名URL、文件生命周期管理 // (使用者：上传服务、文件访问API)

#### `/src/services/upload/` - 上传编排服务
- **`bulk.ts`** - 前端批量上传工具和进度管理 // (使用者：上传组件、批处理UI)
- **`client.ts`** - 客户端上传协调和工作流 // (使用者：上传组件、文件拖放区域)
- **`server.ts`** - 服务端上传处理和API协调 // (使用者：上传API路由、文件处理端点)
- **`status.ts`** - 上传状态管理和验证 // (使用者：上传服务、进度跟踪)

### `/src/dal/` - 数据访问层
*数据库操作和数据持久化*

#### `/src/dal/analytics/` - 分析数据访问
- **`getCategoryStats.ts`** - 基于分类的支出分析 // (使用者：分析API、仪表板组件)
- **`getInvoiceStats.ts`** - 发票汇总统计和指标 // (使用者：分析API、报告功能)
- **`getUserStats.ts`** - 用户活动和使用统计 // (使用者：管理员API、用户管理)

#### `/src/dal/invoice/` - 发票数据访问
- **`createInvoice.ts`** - 发票记录创建 // (使用者：发票API路由、手动录入工作流)
- **`createInvoiceFile.ts`** - 发票文件关联创建 // (使用者：上传API、文件处理)
- **`deleteInvoice.ts`** - 发票删除及级联处理 // (使用者：发票管理API)
- **`deleteInvoiceFile.ts`** - 发票文件删除和清理 // (使用者：文件管理API)
- **`getInvoiceById.ts`** - 通过ID获取单个发票 // (使用者：发票详情API、编辑表单)
- **`getInvoiceFileById.ts`** - 发票文件元数据获取 // (使用者：文件访问API、预览功能)
- **`getInvoicesByCategory.ts`** - 按分类筛选发票查询 // (使用者：筛选API、分析统计)
- **`getInvoicesByStatus.ts`** - 基于状态的发票筛选 // (使用者：状态管理API、工作流)
- **`getInvoicesByUserId.ts`** - 用户特定发票获取 // (使用者：用户仪表板、发票列表)
- **`listInvoices.ts`** - 分页发票列表及筛选 // (使用者：发票列表API、搜索功能)
- **`searchInvoices.ts`** - 全文发票搜索功能 // (使用者：搜索API、高级筛选)
- **`updateInvoice.ts`** - 发票记录更新和修改 // (使用者：编辑API、AI数据合并)

#### `/src/dal/user/` - 用户数据访问
- **`createUser.ts`** - 用户账户创建 // (使用者：注册API、管理员用户管理)
- **`deleteUser.ts`** - 用户账户删除及清理 // (使用者：管理员API、账户管理)
- **`getRoleDistribution.ts`** - 管理员用户角色统计 // (使用者：管理员分析、用户管理)
- **`getUserByEmail.ts`** - 基于邮箱的用户查找 // (使用者：身份验证、密码重置)
- **`getUserById.ts`** - 基于ID的用户获取 // (使用者：会话管理、个人资料API)
- **`getUserByRole.ts`** - 基于角色的用户筛选 // (使用者：管理员功能、权限管理)
- **`listUsers.ts`** - 用户列表及分页 // (使用者：管理员用户管理)
- **`searchUsers.ts`** - 用户搜索功能 // (使用者：管理员搜索、用户管理)
- **`updateUser.ts`** - 用户账户更新 // (使用者：个人资料管理、管理员编辑)
- **`updateUserProfile.ts`** - 用户资料特定更新 // (使用者：个人资料API、用户设置)

#### `/src/dal/` - 数据库管理
- **`db-dangerously-hard-reset.ts`** - 开发环境完整数据库重置 // (使用者：npm脚本、开发工作流)
- **`db-seed.ts`** - 数据库种子数据初始化 // (使用者：npm脚本、开发环境设置)

### `/src/schema/` - 类型定义和验证
*Zod模式、TypeScript类型和验证规则*

- **`aiSchema.ts`** - AI处理类型、OpenAI响应结构 // (使用者：AI服务、发票处理)
- **`apiSchema.ts`** - API请求/响应类型、HTTP错误映射 // (使用者：API路由、客户端工具)
- **`authSchema.ts`** - 认证类型、会话数据结构 // (使用者：认证服务、中间件)
- **`commonSchemas.ts`** - 共享验证规则和系统常量 // (使用者：所有schema文件、验证工具)
- **`dateSchema.ts`** - 日期格式化和澳洲标准 // (使用者：日期工具、发票显示)
- **`envSchema.ts`** - 环境变量验证和类型 // (使用者：所有服务、配置管理)
- **`exportSchema.ts`** - 导出配置和格式类型 // (使用者：导出服务、分析统计)
- **`financialSchema.ts`** - 货币、税务和财务常量 // (使用者：发票处理、格式化)
- **`invoiceQueries.ts`** - 发票查询和筛选类型 // (使用者：发票DAL、搜索API)
- **`invoiceSchema.ts`** - 发票业务逻辑和验证 // (使用者：发票服务、DAL、API)
- **`invoiceTables.ts`** - 发票数据库表定义 // (使用者：Drizzle ORM、DAL操作)
- **`messageSchema.ts`** - 错误消息和用户通信 // (使用者：所有层级、错误处理)
- **`pdfSchema.ts`** - PDF处理类型、Zod验证模式和常量 // (使用者：PDF服务、文件处理、上传工作流)
- **`routeSchema.ts`** - 应用路由和导航类型 // (使用者：路由工具、中间件)
- **`uiSchema.ts`** - UI状态和组件类型 // (使用者：组件、状态管理)
- **`uploadSchema.ts`** - 文件上传类型和处理状态 // (使用者：上传服务、文件处理)
- **`userQueries.ts`** - 用户查询和搜索类型 // (使用者：用户DAL、管理员功能)
- **`userSchema.ts`** - 用户业务逻辑和角色定义 // (使用者：用户服务、身份验证)
- **`userTables.ts`** - 用户数据库表定义 // (使用者：Drizzle ORM、用户DAL)

### `/src/app/` - Next.js App Router
*页面、布局和API路由*

#### `/src/app/api/` - API路由
- **`ai/extract/`** - AI处理端点 // (使用者：上传工作流、发票处理)
- **`auth/[...nextauth]/route.ts`** - NextAuth.js认证端点 // (使用者：认证系统)
- **`files/upload/`** - 文件上传端点 // (使用者：文件上传组件)
- **`invoices/[id]/status/`** - 发票状态管理 // (使用者：发票处理工作流)
- **`test/openai/`** - OpenAI集成测试端点 // (使用者：开发测试)
- **`upload/`** - 上传协调端点 // (使用者：上传服务)

#### `/src/app/` - 页面和布局
- **`auth/signin/page.tsx`** - 登录页面组件 // (使用者：认证流程)
- **`dashboard/page.tsx`** - 主仪表板界面 // (使用者：已认证用户)
- **`layout.tsx`** - 根应用布局 // (使用者：所有页面)
- **`page.tsx`** - 首页/登陆页 // (使用者：公开访问、营销)
- **`globals.css`** - 全局样式和Tailwind CSS // (使用者：所有组件)

### `/src/components/` - React组件
*可重用UI组件和自定义元素*

- **`btn-dummy.tsx`** - 开发测试按钮组件 // (使用者：开发测试)
- **`ui/`** - Shadcn UI组件库 // (使用者：所有应用组件)

### `/src/types/` - TypeScript声明
*类型扩展和模块声明*

- **`next-auth.d.ts`** - NextAuth.js类型扩展 // (使用者：TypeScript编译器、认证系统)

### `/src/actions/` - 服务器操作
*Next.js服务器操作，用于表单处理和变更*
*(目录已存在，文件待实现)*

### `/src/hooks/` - 自定义React钩子
*可重用的状态逻辑和副作用*
*(目录已存在，钩子待实现)*

### `/src/stores/` - 状态管理
*全局应用状态的Zustand存储*
*(目录已存在，存储待实现)*

---

## 🔄 架构原则

### 依赖关系流向
- **Schema** → 为所有层级定义类型
- **DAL** → 仅访问数据库，使用schema类型
- **Services** → 编排业务逻辑，通过API调用DAL
- **Utils** → 提供纯函数，无外部依赖
- **API Routes** → 协调服务和DAL之间的交互
- **Components** → 仅调用API路由，绝不直接访问DAL

### 导入模式
```typescript
// 正确：组件调用API路由
const response = await fetch('/api/invoices');

// 正确：服务使用schema类型
import { Invoice } from '@/schema/invoiceSchema';

// 正确：工具函数是纯函数
import { formatCurrency } from '@/utils/core/format';

// 错误：组件绝不直接访问DAL
// import { getInvoiceById } from '@/dal/invoice/getInvoiceById'; ❌
```

### 文件命名约定
- **Services**：描述性操作名称（如：`processing.ts`、`export.ts`）
- **DAL**：基于动词的CRUD操作（如：`createInvoice.ts`、`getUserById.ts`）
- **Utils**：功能分类（如：`format.ts`、`auth.ts`）
- **Schema**：基于领域分组（如：`invoiceSchema.ts`、`userTables.ts`）

---

*📄 本文档反映了2024年完成的Phase 2A重构后的当前项目结构*