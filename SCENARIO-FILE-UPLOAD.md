# 🎬 业务场景流程文档

## 📋 文档说明

本文档记录了发票管理系统中的关键业务流程和复杂场景，帮助开发团队理解系统的工作方式和用户交互模式。

---

## 📤 场景：双存储文件上传架构流程（Pre-signed URL 工作流）

### 🎯 用户场景描述
用户需要上传发票文件（PDF、JPG、PNG），系统采用双存储架构：客户端直接上传至AWS S3（7年归档）+ 服务端上传至OpenAI（临时处理），AI处理完成后自动清理OpenAI文件，仅保留S3永久存储。通过pre-signed URL实现安全的客户端直接上传，避免文件通过服务器中转，提升效率和扩展性。

### 🔄 完整技术流程

#### 1. **用户交互阶段**
```
用户操作方式：
├── 方式A：点击上传按钮
│   └── 触发文件选择对话框
│   └── 用户选择文件
│   └── 获取 File 对象
├── 方式B：拖拽文件到上传区域
│   └── 触发 dragover/drop 事件
│   └── 从 event.dataTransfer.files 获取文件
│   └── 获取 File 对象
```

#### 2. **前端验证阶段**
```typescript
// 使用 uploadUtils.ts 进行文件验证
const validation = validateFile(file);
// 验证内容：
// - 文件大小 ≤ 10MB
// - 文件类型：PDF/JPG/PNG
// - 文件扩展名验证
// - MIME类型验证

if (!validation.isValid) {
    showError(validation.error);
    return;
}
```

#### 3. **文件预处理阶段**
```typescript
// 如果是图片文件，进行智能压缩
if (isImageFile(file)) {
    const compressed = await compressImage(file, 500 * 1024); // 500KB目标
    // 压缩算法特点：
    // - 渐进式质量降低
    // - 智能尺寸调整
    // - 保持长宽比
    // - 最多5次压缩尝试
    file = compressed.file;
}

// 生成预览和元数据
const previewUrl = createPreviewUrl(file);
const metadata = getFileMetadata(file);
```

#### 4. **Pre-signed URL 工作流初始化**
```typescript
// 新工作流：客户端pre-signed URL上传
// Step 1: 请求上传会话和pre-signed URL
const initResponse = await fetch('/api/files/initiate-upload', {
    method: 'POST',
    body: JSON.stringify({
        fileName: file.name,
        contentType: file.type,
        fileSize: file.size,
        userId: currentUser.id
    }),
    headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
    }
});

const {
    success,
    presignedUploadUrl,
    s3ObjectKey,
    uploadSessionId,
    error
} = await initResponse.json();

if (!success) {
    throw new Error(error || 'Failed to initiate upload');
}

// 更新状态：NOT_UPLOADED → PRESIGNED_GENERATED
onProgressUpdate('PRESIGNED_GENERATED', 5);
```

#### 5. **客户端直接上传到S3**
```typescript
// Step 2: 客户端直接上传到S3（无需服务器中转）
onProgressUpdate('CLIENT_UPLOADING', 5);

const uploadToS3 = async (file: File, presignedUrl: string) => {
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        
        // 监听上传进度
        xhr.upload.addEventListener('progress', (event) => {
            if (event.lengthComputable) {
                const progress = (event.loaded / event.total) * 100;
                // 5-45% 进度范围分配给客户端上传
                onProgressUpdate('CLIENT_UPLOADING', 5 + progress * 0.4);
            }
        });
        
        xhr.addEventListener('load', () => {
            if (xhr.status >= 200 && xhr.status < 300) {
                onProgressUpdate('CLIENT_UPLOADING', 45);
                resolve(xhr.response);
            } else {
                reject(new Error(`S3 upload failed: ${xhr.status}`));
            }
        });
        
        xhr.addEventListener('error', () => {
            reject(new Error('Network error during S3 upload'));
        });
        
        // 直接上传到S3
        xhr.open('PUT', presignedUrl);
        xhr.setRequestHeader('Content-Type', file.type);
        xhr.send(file);
    });
};

await uploadToS3(file, presignedUploadUrl);
```

#### 6. **服务端确认和AI处理**
```typescript
// Step 3: 通知服务器确认上传并开始AI处理
const confirmResponse = await fetch('/api/files/confirm-upload', {
    method: 'POST',
    body: JSON.stringify({
        uploadSessionId,
        userId: currentUser.id
    }),
    headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
    }
});

const {
    success: confirmSuccess,
    fileId,
    extractedData,
    error: confirmError
} = await confirmResponse.json();

if (!confirmSuccess) {
    throw new Error(confirmError || 'Failed to confirm upload');
}

// 整个流程完成
onProgressUpdate('COMPLETED', 100);
```

#### 7. **后端工作流处理**
```typescript
// API端点：/api/files/initiate-upload
// 1. 验证用户权限和文件信息
// 2. 生成S3 pre-signed upload URL（15分钟有效期）
// 3. 同时上传文件到OpenAI（临时处理准备）
// 4. 创建上传会话（30分钟有效期）
// 5. 返回pre-signed URL和会话ID

// API端点：/api/files/confirm-upload
// 1. 验证上传会话有效性
// 2. 确认S3文件存在
// 3. 创建数据库记录
// 4. 使用OpenAI处理文件
// 5. 清理OpenAI临时文件
// 6. 返回处理结果
```

#### 8. **数据库存储阶段**
```sql
-- 存储到 invoice_files 表
INSERT INTO invoice_files (
    id, original_name, file_name, file_size, 
    mime_type, s3_object_key
) VALUES (
    'cuid2_id', 'invoice.pdf', 'invoice_1234567890_abc123.pdf', 
    1024000, 'application/pdf', 'invoices/user123/2024/01/invoice_1234567890_abc123.pdf'
);
```

### 📊 状态跟踪

#### 新的文件上传状态流转
```
NOT_UPLOADED → PRESIGNED_GENERATED → CLIENT_UPLOADING → UPLOAD_CONFIRMED → AI_UPLOADING → PROCESSING → COMPLETED
      ↓               ↓                      ↓                ↓              ↓            ↓
    FAILED          FAILED               FAILED           FAILED         FAILED       FAILED
```

#### 详细状态说明
- **NOT_UPLOADED**: 等待开始上传
- **PRESIGNED_GENERATED**: 已生成预签名URL，等待客户端上传
- **CLIENT_UPLOADING**: 客户端正在上传到S3
- **UPLOAD_CONFIRMED**: 服务端已确认S3上传成功
- **AI_UPLOADING**: 正在上传到OpenAI进行AI处理
- **PROCESSING**: AI正在分析发票
- **COMPLETED**: 全流程完成，OpenAI文件已清理，S3归档保存
- **FAILED**: 任一阶段失败

#### 进度分配（新工作流）
```typescript
const progressMapping = {
    NOT_UPLOADED: 0,
    PRESIGNED_GENERATED: 5,
    CLIENT_UPLOADING: 5-45,    // 客户端上传（40%进度范围）
    UPLOAD_CONFIRMED: 45,
    AI_UPLOADING: 45-60,       // AI准备（15%进度范围）
    PROCESSING: 60-100,        // AI处理（40%进度范围）
    COMPLETED: 100,
    FAILED: 0,
};
```

### 🎨 用户体验设计

#### 成功流程（新工作流）
1. **文件选择**：拖拽区域高亮，文件图标显示
2. **验证通过**：显示文件预览和元数据
3. **准备上传**：生成上传权限，"正在准备上传..."
4. **客户端上传**：进度条动画，"正在上传到云端存储..."
5. **上传确认**：服务端验证，"上传确认，准备AI分析..."
6. **AI处理**：加载动画，"AI正在识别发票信息..."
7. **自动清理**：后台清理OpenAI临时文件
8. **完成庆祝**：彩色纸屑动画，"文件已安全存储并分析完成！"

#### 错误处理（新工作流）
1. **权限获取失败**：重新登录或稍后重试
2. **客户端上传失败**：网络检查 + 自动重试机制
3. **上传会话过期**：自动重新初始化上传流程
4. **文件确认失败**：检查文件完整性，重新上传
5. **AI处理失败**：文件已安全存储，可稍后重试分析

#### Pre-signed URL 工作流优势
- **性能提升**：文件直接上传到S3，避免服务器中转
- **扩展性**：服务器不处理文件流，支持更高并发
- **成本优化**：减少服务器带宽和存储需求
- **安全性**：时限性pre-signed URL，无永久凭证暴露
- **用户体验**：更快的上传速度，实时进度反馈
- **错误恢复**：会话管理支持断点续传和重试

---

## 🔐 场景：安全文件访问和下载流程

### 🎯 用户场景描述
用户需要预览或下载已上传的发票文件，系统通过pre-signed URL提供安全、时限性的文件访问，避免直接暴露AWS凭证或永久性公共链接。

### 🔄 文件访问技术流程

#### 1. **用户请求文件访问**
```typescript
// 用户场景：
// - 在发票列表页点击"查看发票"
// - 在发票详情页点击文件预览
// - 在发票详情页点击"下载原文件"

// 前端请求
const accessFileRequest = async (invoiceId: string, action: 'view' | 'download') => {
    const response = await fetch(`/api/files/access/${invoiceId}`, {
        method: 'POST',
        body: JSON.stringify({ action }),
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${userToken}`,
        }
    });
    
    const { success, signedUrl, error } = await response.json();
    
    if (success && signedUrl) {
        if (action === 'view') {
            window.open(signedUrl, '_blank'); // 新窗口预览
        } else {
            window.location.href = signedUrl; // 直接下载
        }
    }
};
```

#### 2. **后端权限验证和URL生成**
```typescript
// API端点：/api/files/access/[invoiceId]
// 1. 验证用户身份和权限
//    - 检查用户是否登录
//    - 验证用户是否有权限访问该发票文件
//    - 检查发票是否属于当前用户或用户有管理权限

// 2. 获取文件S3引用
//    - 从数据库查询invoice记录
//    - 获取关联的s3ObjectKey

// 3. 生成pre-signed download URL
const { success, signedUrl } = await generatePresignedDownloadUrl(
    s3ObjectKey,
    3600 // 1小时有效期
);

// 4. 返回安全URL给前端
return { success: true, signedUrl };
```

#### 3. **安全访问特性**
```typescript
// Pre-signed URL特性：
// ✅ 时限性：默认1小时后自动失效
// ✅ 权限控制：只有授权用户可获取URL
// ✅ 无需AWS凭证：客户端无法访问AWS密钥
// ✅ 单次使用：URL针对特定文件和用户
// ✅ 审计跟踪：所有访问请求都有日志记录

// 安全日志记录
logInfo("File access requested", {
    userId: user.id,
    invoiceId: invoiceId,
    s3ObjectKey: invoice.s3ObjectKey,
    action: requestAction,
    userAgent: request.headers['user-agent'],
    ipAddress: getClientIP(request)
});
```

### 🔒 安全优势

#### 相比传统文件服务的优势
- **无公共URL**：文件不会暴露在公共网络中
- **时限控制**：URL在指定时间后自动失效
- **权限集成**：与用户认证系统紧密集成
- **审计友好**：所有文件访问都有完整日志
- **成本可控**：避免CDN或代理服务器成本
- **客户端直传**：提升上传性能和系统扩展性

#### 安全风险缓解
- **URL泄露**：即使URL被泄露，也会在1小时后失效
- **重放攻击**：每次访问都需要重新验证权限
- **越权访问**：严格的用户权限验证
- **恶意下载**：访问频率限制和用户行为监控
- **会话管理**：上传会话过期机制防止资源滥用

---

## 📋 新工作流实现清单

### ✅ 已完成的核心功能
- [x] **uploadSchema.ts**: 新状态枚举定义（8个状态），移除后端批量上传逻辑
- [x] **messageSchema.ts**: Pre-signed URL相关错误和成功消息
- [x] **uploadStatusUtils.ts**: 新状态检查函数和进度计算
- [x] **awsUtils.ts**: Pre-signed URL生成和文件确认机制
- [x] **dualStorageUtils.ts**: 完整的新工作流实现
  - `initiateDualStorageWorkflow()`: 初始化上传会话
  - `confirmUploadAndProcessAI()`: 确认上传和AI处理
  - 上传会话管理（创建、获取、清理）
- [x] **bulkUploadUtils.ts**: 前端并行上传工具函数（每个文件独立的单文件上传）

### 🚧 待实现的API端点
- [ ] **POST /api/files/initiate-upload**: 初始化上传会话
- [ ] **POST /api/files/confirm-upload**: 确认上传并处理
- [ ] **POST /api/files/access/[invoiceId]**: 安全文件访问（已存在）

### 🎨 待更新的前端组件
- [ ] **文件上传组件**: 使用新的工作流状态
- [ ] **进度显示组件**: 更新进度条和状态消息
- [ ] **错误处理组件**: 新的错误类型和恢复机制
- [ ] **前端并行上传界面**: 多文件独立上传显示
  - 每个文件使用独立的 pre-signed URL
  - 每个文件有独立的上传状态和进度
  - 失败的文件不影响其他文件
  - 前端协调多个并行上传的显示

### 🧪 待编写的测试
- [ ] **单元测试**: 新工作流函数测试
- [ ] **集成测试**: 端到端上传流程测试
- [ ] **错误场景测试**: 各种失败情况的处理测试

---

## 🚀 部署和迁移策略

### 阶段1：后端API实现（当前阶段）
- 实现新的API端点
- 保持向后兼容性
- 添加功能开关

### 阶段2：前端组件更新
- 更新文件上传组件
- 实现新的状态显示
- 添加错误处理

### 阶段3：测试和验证
- 完整功能测试
- 性能基准测试
- 安全性验证

### 阶段4：生产部署
- 灰度发布
- 监控和日志
- 旧工作流下线

---