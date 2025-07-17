
## 🔐 场景：Email登录认证和JWT保护流程

### 🎯 用户场景描述
系统支持Email/Password登录方式，Admin可以手动创建email用户，用户通过JWT token在protected pages中安全导航。

### 🔄 Email登录完整技术流程

#### 阶段1：用户登录请求
```typescript
// 用户在登录页面填写表单
const loginData: SignInData = {
    email: "user@example.com",
    password: "userPassword123",
    remember: false
};

// 前端提交到NextAuth signIn
const result = await signIn("credentials", {
    email: loginData.email,
    password: loginData.password,
    redirect: false
});
```

#### 阶段2：NextAuth Credentials Provider验证
```typescript
// auth.ts 中的 Credentials Provider
Credentials({
    credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
    },
    async authorize(credentials) {
        // 1. 验证输入数据
        const validation = signInSchema.safeParse(credentials);
        if (!validation.success) return null;

        // 2. 查询数据库用户
        const user = await db.query.users.findFirst({
            where: eq(users.email, validation.data.email)
        });
        if (!user || !user.password) return null;

        // 3. 验证密码 (复用utils/core/auth.ts)
        const isValidPassword = await verifyPassword(
            validation.data.password, 
            user.password
        );
        if (!isValidPassword) return null;

        // 4. 返回用户对象 (进入JWT flow)
        return {
            id: user.id,
            email: user.email,
            name: user.name,
            image: user.image,
            role: user.role,
            emailVerified: user.emailVerified
        };
    }
})
```

#### 阶段3：JWT Token生成 (利用现有架构)
```typescript
// 现有的 JWT callback 自动触发
async jwt({ token, user }) {
    if (user) {
        // 将用户信息写入JWT token
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.picture = user.image;
        token.role = user.role;
        token.emailVerified = user.emailVerified;
    }
    return token;
}

// 现有的 Session callback 自动触发
async session({ session, token }) {
    if (token && session.user) {
        // 从JWT token读取到session对象
        session.user.id = token.sub || token.id;
        session.user.email = token.email;
        session.user.name = token.name;
        session.user.image = token.picture;
        session.user.role = token.role;
        session.user.emailVerified = token.emailVerified;
    }
    return session;
}
```

#### 阶段4：JWT Token存储
```
NextAuth v5 自动处理：
├── 生成加密的JWT token
├── 存储为httpOnly cookie (安全)
├── 设置过期时间 (7天)
└── 浏览器自动携带在后续请求中
```

### 🛡️ JWT保护的页面导航流程

#### 1. 路由访问拦截
```typescript
// middleware.ts 自动拦截每个请求
export default auth((req: NextRequest & { auth: any }) => {
    const { nextUrl } = req;
    const isLoggedIn = !!req.auth; // JWT自动解析到req.auth

    // 检查是否为保护路由
    const isProtected = isProtectedRoute(nextUrl.pathname);
    
    // 未登录用户访问保护路由 → 重定向到登录页
    if (isProtected && !isLoggedIn) {
        const signInUrl = new URL(ROUTES.AUTH.SIGNIN, nextUrl.origin);
        signInUrl.searchParams.set("callbackUrl", nextUrl.href);
        return NextResponse.redirect(signInUrl);
    }
    
    return NextResponse.next();
});
```

#### 2. Protected Page中的数据访问
```typescript
// 任何protected page中的组件
export default async function DashboardPage() {
    // 从JWT token获取session数据
    const session = await auth();
    
    // 安全检查
    if (!session) {
        redirect(ROUTES.AUTH.SIGNIN);
    }
    
    // 权限检查 (复用现有utils/core/auth.ts)
    const canManage = canManageUsers(session.user.role);
    
    return (
        <div>
            <h1>Welcome, {session.user.name}</h1>
            <p>Role: {session.user.role}</p>
            
            {canManage && (
                <AdminPanel user={session.user} />
            )}
        </div>
    );
}
```

#### 3. API Route中的认证
```typescript
// /api/admin/users/route.ts
export async function POST(request: Request) {
    // 从JWT token获取session
    const session = await auth();
    
    if (!session) {
        return NextResponse.json(
            { error: "Unauthorized" }, 
            { status: 401 }
        );
    }
    
    // 权限检查
    if (!canManageUsers(session.user.role)) {
        return NextResponse.json(
            { error: "Forbidden" }, 
            { status: 403 }
        );
    }
    
    // 处理请求...
}
```

### 👨‍💼 Admin用户管理流程

#### 阶段1：Admin创建Email用户
```typescript
// Admin在用户管理页面创建新用户
const createEmailUser = async (userData: CreateUserData) => {
    // 1. 验证Admin权限
    const session = await auth();
    if (!canManageUsers(session.user.role)) {
        throw new Error("Insufficient permissions");
    }
    
    // 2. 生成临时密码
    const tempPassword = generateSecureToken(12);
    const hashedPassword = await hashPassword(tempPassword);
    
    // 3. 创建用户记录
    const newUser = await db.insert(users).values({
        email: userData.email,
        name: userData.name,
        role: userData.role || "USER",
        password: hashedPassword,
        emailVerified: null // 需要用户首次登录验证
    }).returning();
    
    // 4. 发送欢迎邮件（包含临时密码）
    if (userData.sendWelcomeEmail) {
        await sendWelcomeEmail(userData.email, tempPassword);
    }
    
    return newUser;
};
```

#### 阶段2：新用户首次登录
```typescript
// 新用户使用临时密码登录后
const handleFirstLogin = async (userId: string) => {
    // 1. 检测是否首次登录
    const user = await db.query.users.findFirst({
        where: eq(users.id, userId)
    });
    
    if (!user.emailVerified) {
        // 2. 强制跳转到密码设置页面
        redirect('/auth/set-password');
    }
};

// 密码设置页面
const setNewPassword = async (newPassword: string) => {
    const hashedPassword = await hashPassword(newPassword);
    
    await db.update(users)
        .set({ 
            password: hashedPassword,
            emailVerified: new Date() // 标记为已验证
        })
        .where(eq(users.id, userId));
};
```

### 📊 认证状态跟踪

#### JWT Token生命周期
```
用户登录 → JWT生成 → 存储cookie → 页面导航 → 自动验证 → Token过期 → 重新登录
    ↓           ↓         ↓          ↓         ↓          ↓
  Credentials  加密JWT   httpOnly   解析用户   权限检查    清除cookie
  Provider     callback  cookie     信息      通过/拒绝   重定向登录
```

#### Session数据结构
```typescript
interface UserSession {
    user: {
        id: string;           // 用户ID
        email: string;        // 邮箱地址
        name: string;         // 显示名称
        image?: string;       // 头像URL
        role: UserRole;       // 用户角色
        emailVerified: Date | null; // 邮箱验证状态
    };
    expires: string;          // Session过期时间
}
```

#### 权限分级系统
```typescript
// 权限层级 (复用现有utils/core/auth.ts)
const roleHierarchy = {
    USER: 0,        // 普通用户：管理自己的发票
    ACCOUNTANT: 1,  // 会计师：管理分配的客户
    ADMIN: 2        // 管理员：管理所有用户和系统
};

// 权限检查函数
hasPermission(userRole, requiredRole) // 层级比较
canManageUsers(userRole)              // 管理用户权限
canAccessUser(currentUser, targetId)  // 用户数据访问权限
```

### 🔒 安全机制

#### 1. 密码安全
```typescript
// 使用bcrypt加密 (AUTH_CONSTANTS.BCRYPT_ROUNDS = 12)
const hashedPassword = await hashPassword(plainPassword);

// 密码验证
const isValid = await verifyPassword(plainPassword, hashedPassword);

// 密码强度要求 (来自VALIDATION_RULES)
- 最少8位字符
- 包含大小写字母
- 包含数字
- 包含特殊字符
```

#### 2. JWT Token安全
```typescript
// NextAuth v5 自动处理的安全措施
- JWT使用AUTH_SECRET加密
- httpOnly cookie防XSS攻击
- SameSite=Lax防CSRF攻击
- 7天过期时间 (AUTH_CONSTANTS.SESSION_MAX_AGE)
- 每次刷新自动轮换token
```

#### 3. 路由保护
```typescript
// 自动保护的路由类型
PROTECTED_ROUTES = [
    "/dashboard",
    "/invoices",
    "/settings",
    "/admin"
];

// 公开路由
PUBLIC_ROUTES = [
    "/",
    "/auth/signin",
    "/auth/signup",
    "/auth/error"
];
```

### 🎨 用户体验设计

#### 登录成功流程
```
用户提交表单 → 显示加载动画 → 验证成功 → 跳转dashboard
      ↓              ↓           ↓         ↓
   禁用按钮      "正在验证..."   成功提示    欢迎信息
```

#### 认证失败处理
```typescript
// 登录失败类型和用户友好提示
const authErrors = {
    'CredentialsSignin': '邮箱或密码错误，请重试',
    'CallbackRouteError': '登录服务暂时不可用',
    'OAuthAccountNotLinked': '该邮箱已与其他登录方式关联'
};
```

#### 权限不足处理
```typescript
// 403页面组件
const AccessDeniedPage = ({ userRole, requiredRole }) => (
    <div>
        <h1>访问被拒绝</h1>
        <p>您的角色：{userRole}</p>
        <p>所需角色：{requiredRole}</p>
        <Button onClick={() => router.back()}>返回上页</Button>
    </div>
);
```

### 🚨 异常处理场景

#### 1. Token过期处理
```typescript
// middleware自动检测过期token
if (isTokenExpired(req.auth)) {
    // 清除过期cookie
    // 重定向到登录页面
    // 保存原始访问URL for redirect
}
```

#### 2. 网络错误处理
```typescript
// 登录API调用失败
try {
    const result = await signIn("credentials", credentials);
} catch (error) {
    if (error.code === 'NETWORK_ERROR') {
        showError('网络连接失败，请检查网络设置');
        // 提供重试按钮
    }
}
```

#### 3. 并发Session处理
```typescript
// 检测多设备登录
const handleMultipleDevices = (userId: string) => {
    // NextAuth v5 自动处理
    // 新登录会使旧session失效
    // 旧设备下次请求时自动重定向到登录页
};
```

### 💡 设计亮点

1. **统一认证体验**：Email和OAuth登录使用相同的JWT flow
2. **细粒度权限控制**：基于角色的多层级权限系统
3. **安全优先**：遵循OWASP安全最佳实践
4. **用户友好**：详细的错误提示和状态反馈
5. **可扩展性**：易于添加新的认证方式和权限规则

---

## 📝 后续场景待补充

- 批量发票处理流程
- 发票审核和校验流程
- 数据导出和报告生成
- 异常恢复和数据修复
- 多租户隔离和数据安全

---

*该文档将随着系统功能的完善持续更新* ✨