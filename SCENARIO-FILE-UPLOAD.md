# 🎬 业务场景流程文档

## 📋 文档说明

本文档记录了发票管理系统中的关键业务流程和复杂场景，帮助开发团队理解系统的工作方式和用户交互模式。

---

## 📤 场景：双存储文件上传架构流程

### 🎯 用户场景描述
用户需要上传发票文件（PDF、JPG、PNG），系统采用双存储架构：同时上传至AWS S3（7年归档）和OpenAI（临时处理），AI处理完成后自动清理OpenAI文件，仅保留S3永久存储。

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

#### 4. **API双存储上传阶段**
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

// 分阶段进度跟踪
const onProgressUpdate = (status, progress) => {
    updateUI(status, progress);
};
```

#### 5. **后端双存储处理阶段**
```typescript
// API端点：/api/files/upload
// 1. 验证用户权限和文件格式
// 2. 阶段1：上传到AWS S3（永久存储）
//    - 生成S3对象键：invoices/{userId}/{year}/{month}/{filename}
//    - 上传到Sydney region存储桶
//    - 获得s3ObjectKey
// 3. 阶段2：上传到OpenAI Files API（临时处理）
//    - 同时上传相同文件到OpenAI
//    - 获得临时openaiFileId
// 4. 存储到数据库（仅S3引用）
// 5. 触发AI处理
// 6. 清理OpenAI临时文件
```

#### 6. **数据库存储阶段**
```sql
-- 存储到 invoice_files 表（简化模型）
INSERT INTO invoice_files (
    id, original_name, file_name, file_size, 
    mime_type, s3_object_key
) VALUES (
    'cuid2_id', 'invoice.pdf', 'invoice_1234567890_abc123.pdf', 
    1024000, 'application/pdf', 'invoices/user123/2024/01/invoice_1234567890_abc123.pdf'
);
```

#### 7. **AI处理和清理阶段**
```typescript
// 同步处理流程
const processingResult = await processDualStorageWorkflow(file, userId, onProgressUpdate);

// 内部流程：
// 1. uploadToDualStorage() - 双存储上传
// 2. processWithOpenAI(openaiFileId) - AI处理
// 3. deleteOpenAIFile(openaiFileId) - 清理临时文件
// 4. 返回处理结果和S3永久引用
```

### 📊 状态跟踪

#### 文件上传状态流转
```
NOT_UPLOADED → UPLOADING_STAGE_1 → UPLOADING_STAGE_2 → PROCESSING → COMPLETED
                      ↓                    ↓              ↓
                    FAILED              FAILED         FAILED
```

#### 分阶段状态说明
- **NOT_UPLOADED**: 尚未开始上传
- **UPLOADING_STAGE_1**: 正在上传至AWS S3
- **UPLOADING_STAGE_2**: 正在上传至OpenAI（临时）
- **PROCESSING**: 正在等待OpenAI处理返回
- **COMPLETED**: AI处理完成，OpenAI文件已清理，S3归档保存
- **FAILED**: 任一阶段失败

#### 用户界面状态
```typescript
// 双存储上传进度状态
interface UploadState {
    progress: number;        // 0-100
    status: UploadStatus;    // 分阶段上传状态
    error?: string;          // 错误信息
    previewUrl?: string;     // 预览链接
    metadata: FileMetadata;  // 文件元数据
    s3ObjectKey?: string;    // S3永久存储引用
}
```

### 🎨 用户体验设计

#### 成功流程
1. **文件选择**：拖拽区域高亮，文件图标显示
2. **验证通过**：显示文件预览和元数据
3. **阶段1上传**：进度条动画，"正在上传到云端存储..."
4. **阶段2上传**：进度条动画，"正在准备AI分析..."
5. **AI处理**：加载动画，"AI正在识别发票信息..."
6. **自动清理**：后台清理OpenAI临时文件
7. **完成庆祝**：彩色纸屑动画，"文件已安全存储并分析完成！"

#### 错误处理
1. **文件太大**：友好提示 + 建议压缩
2. **格式错误**：显示支持的格式列表
3. **S3上传失败**：网络重试 + 切换到备用区域
4. **OpenAI上传失败**：保留S3文件，提供手动处理选项
5. **AI处理失败**：文件已安全存储，可稍后重试分析
6. **临时文件清理失败**：记录日志，不影响用户体验

#### 双存储优势
- **数据安全**：即使OpenAI处理失败，文件已安全存储在S3
- **合规性**：7年归档符合澳洲会计法规要求
- **成本优化**：OpenAI临时存储，避免长期费用
- **错误恢复**：任一阶段失败都有备选方案

---