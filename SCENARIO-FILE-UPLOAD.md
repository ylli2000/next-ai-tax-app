# 🎬 业务场景流程文档

## 📋 文档说明

本文档记录了发票管理系统中的关键业务流程和复杂场景，帮助开发团队理解系统的工作方式和用户交互模式。

---

## 📤 场景：文件上传架构流程

### 🎯 用户场景描述
用户需要上传发票文件（PDF、JPG、PNG），系统自动识别并提取发票信息。

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

#### 4. **API上传阶段**
```typescript
// 构建上传请求
const formData = new FormData();
formData.append('file', file);
formData.append('userId', currentUser.id);

// 发送到API端点
const response = await fetch('/api/files/upload', {
    method: 'POST',
    body: formData,
    headers: {
        'Authorization': `Bearer ${token}`,
    }
});

// 处理上传进度
const uploadProgress = await trackUploadProgress(response);
```

#### 5. **后端处理阶段**
```typescript
// API端点：/api/files/upload
// 1. 验证用户权限
// 2. 再次验证文件
// 3. 生成唯一文件名
// 4. 上传到OpenAI Files API
// 5. 存储到数据库 invoice_files 表
// 6. 返回文件信息
```

#### 6. **数据库存储阶段**
```sql
-- 存储到 invoice_files 表
INSERT INTO invoice_files (
    id, original_name, file_name, file_size, 
    mime_type, openai_file_id, upload_status
) VALUES (
    'cuid2_id', 'invoice.pdf', 'invoice_1234567890_abc123.pdf', 
    1024000, 'application/pdf', 'file-abc123', 'COMPLETED'
);
```

#### 7. **AI处理触发阶段**
```typescript
// 上传完成后触发AI提取
const aiResponse = await fetch('/api/ai/extract', {
    method: 'POST',
    body: JSON.stringify({
        fileId: uploadResult.fileId,
        userId: currentUser.id
    })
});
```

### 📊 状态跟踪

#### 文件上传状态流转
```
NOT_UPLOADED → UPLOADING → PROCESSING → COMPLETED
                     ↓
                   FAILED
```

#### 用户界面状态
```typescript
// 上传进度状态
interface UploadState {
    progress: number;        // 0-100
    status: UploadStatus;    // 上传状态
    error?: string;          // 错误信息
    previewUrl?: string;     // 预览链接
    metadata: FileMetadata;  // 文件元数据
}
```

### 🎨 用户体验设计

#### 成功流程
1. **文件选择**：拖拽区域高亮，文件图标显示
2. **验证通过**：显示文件预览和元数据
3. **上传进行**：进度条动画，剩余时间估算
4. **AI处理**：加载动画，"AI正在识别中..."
5. **完成庆祝**：彩色纸屑动画，成功提示

#### 错误处理
1. **文件太大**：友好提示 + 建议压缩
2. **格式错误**：显示支持的格式列表
3. **网络错误**：重试按钮 + 错误详情
4. **AI处理失败**：手动编辑选项

---