     ╭─────────────────────────────────────────────────────────────────────────────────────
     │ 完整的NextAuth Email登录和JWT保护流程实现计划                                       
     │                                                                                     
     │ 🔄 JWT认证流程分析 (基于现有架构)                                                   
     │                                                                                     
     │ 现有JWT架构已完备：                                                                 
     │                                                                                     
     │ - ✅ JWT Strategy: auth.ts中已配置SESSION_STRATEGY = "jwt"                          
     │ - ✅ JWT Callbacks: jwt()和session()回调已实现用户数据传递                          
     │ - ✅ Route Protection: middleware.ts已实现基于JWT的路由保护                         
     │ - ✅ Permission System: authUtils.ts中hasPermission完整实现                         
     │                                                                                     
     │ 📋 Email登录JWT流程设计                                                             
     │                                                                                     
     │ 🔐 登录阶段 (JWT Token生成)                                                         
     │                                                                                     
     │ 1. 用户提交email/password → Credentials Provider                                    
     │ 2. Provider验证密码 → 返回user对象                                                  
     │ 3. JWT callback触发 → 将user信息写入JWT token                                       
     │ 4. 浏览器接收JWT token (httpOnly cookie)                                            
     │                                                                                     
     │ 🛡️ 页面导航保护 (JWT Token验证)                                                     
     │                                                                                     
     │ 1. 用户访问protected页面 → middleware.ts拦截                                        
     │ 2. NextAuth自动解析JWT → req.auth包含用户信息                                       
     │ 3. 检查isProtectedRoute() → 验证访问权限                                            
     │ 4. 页面组件调用auth() → 获取完整session数据                                         
     │                                                                                     
     │ 🎯 实现计划 (利用现有NextAuth v5框架)                                               
     │                                                                                     
     │ 1️⃣ 数据库Schema增强                                                                  
     │                                                                                     
     │ 修改userTables.ts                                                                   
     │ // 在users表中添加password字段                                                      
     │ password: text("password"), // 可选，用于email/password登录                         
     │                                                                                     
     │ 2️⃣ NextAuth Credentials Provider配置                                                 
     │                                                                                     
     │ 修改auth.ts - 利用现有JWT架构                                                       
     │ // 添加到providers数组，与现有OAuth providers并存                                   
     │ Credentials({                                                                       
     │     credentials: {                                                                  
     │         email: { label: "Email", type: "email" },                                   
     │         password: { label: "Password", type: "password" }                           
     │     },                                                                              
     │     async authorize(credentials) {                                                  
     │         // 复用现有authUtils.ts的verifyPassword()                                   
     │         // 复用现有db查询逻辑                                                       
     │         // 返回user对象，自动进入现有JWT flow                                       
     │     }                                                                               
     │ })                                                                                  
     │                                                                                     
     │ 3️⃣ JWT Token数据流                                                                   
     │                                                                                     
     │ 利用现有JWT callbacks (无需修改)                                                    
     │ - ✅ jwt() callback: 已实现role, emailVerified等写入JWT                             
     │ - ✅ session() callback: 已实现从JWT读取到session.user                              
     │ - ✅ Pages可直接使用const session = await auth()获取数据                            
     │                                                                                     
     │ 4️⃣ 路由保护流程                                                                      
     │                                                                                     
     │ 利用现有middleware.ts (无需修改)                                                    
     │ - ✅ req.auth自动包含JWT解析后的用户信息                                            
     │ - ✅ isProtectedRoute()已实现路由权限检查                                           
     │ - ✅ 自动重定向到login页面 + callbackUrl                                            
     │                                                                                     
     │ 5️⃣ 用户管理DAL层                                                                     
     │                                                                                     
     │ 创建userDal.ts - 复用现有schemas                                                    
     │ // 使用userQueries.ts中的createUserDataSchema                                       
     │ // 使用authUtils.ts中的hashPassword                                                 
     │ // 实现Admin创建email用户功能                                                       
     │                                                                                     
     │ 6️⃣ Admin用户管理                                                                     
     │                                                                                     
     │ API路由: /api/admin/users/                                                          
     │ - 利用现有hasPermission(user.role, "ADMIN")权限检查                                 
     │ - 使用现有userQueries.ts的schemas进行验证                                           
     │                                                                                     
     │ UI页面: /app/admin/users/                                                           
     │ - 页面自动受middleware保护 (JWT验证)                                                
     │ - 使用const session = await auth()获取用户权限                                      
     │ - 基于canManageUsers(session.user.role)显示管理界面                                 
     │                                                                                     
     │ 🔒 JWT Security流程确认                                                             
     │                                                                                     
     │ 登录成功后的JWT流：                                                                 
     │                                                                                     
     │ 1. Token存储: NextAuth v5自动将JWT存储为httpOnly cookie                             
     │ 2. 页面导航: 每次路由跳转，middleware自动验证JWT                                    
     │ 3. API调用: 服务端组件通过auth()读取JWT中的用户信息                                 
     │ 4. 权限检查: 基于JWT中的role字段进行权限验证                                        
     │                                                                                     
     │ Protected Pages中的数据访问：                                                       
     │                                                                                     
     │ // 在任何protected page中                                                           
     │ const session = await auth(); // 从JWT token中获取用户信息                          
     │ if (!session) redirect(ROUTES.AUTH.SIGNIN);                                         
     │                                                                                     
     │ // 权限检查                                                                         
     │ if (!canManageUsers(session.user.role)) {                                           
     │     return <div>Access Denied</div>;                                                
     │ }                                                                                   
     │                                                                                     
     │ 🛠️ TASK.md更新                                                                      
     │                                                                                     
     │ - 1.3 数据库: ✅ 支持email/password认证的schema                                     
     │ - 1.5 认证系统: ✅ Credentials Provider + JWT session strategy                      
     │ - 2.3 DAL层: ✅ userDal.ts完成                                                      
     │ - 2.4 API路由: ✅ Admin用户管理API                                                  
     │ - 4.4 页面组件: ✅ Admin管理页面 + JWT保护                                          
     │                                                                                     
     │ 💡 关键优势                                                                         
     │                                                                                     
     │ 1. 零重复造轮子: 完全复用NextAuth v5的JWT框架                                       
     │ 2. 安全性: 利用NextAuth的成熟安全实践                                               
     │ 3. 一致性: OAuth和Credentials登录用相同的JWT flow                                   
     │ 4. 可扩展: 现有permission system无缝支持新用户                                      
     │                                                                                     
     │ 这个方案确保email登录用户享受与OAuth用户相同的JWT保护体验，在protected pages中无缝导。
     ╰─────────────────────────────────────────────────────────────────────────────────────