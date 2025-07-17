# 🎬 业务场景流程文档

## 📋 文档说明

本文档记录了发票管理系统中的关键业务流程和复杂场景，帮助开发团队理解系统的工作方式和用户交互模式。

---

## 📤 场景：简化客户端文件上传架构流程（Client-Side Processing + S3 Direct Upload）

### 🎯 用户场景描述
用户需要上传发票文件（PDF、JPG、PNG），系统采用简化的客户端处理架构：
- **PDF文件**：客户端转换为图像格式
- **所有文件**：客户端压缩优化，直接上传至AWS S3永久存储
- **AI处理**：OpenAI Vision API直接从S3 URL分析图像
- **无中转存储**：移除OpenAI Files临时存储，简化架构复杂度

通过pre-signed URL实现安全的客户端直接上传，所有处理在客户端完成，服务端仅负责生成上传凭证和AI分析。

### 🔄 完整技术流程

#### 1. **用户交互阶段**
```
用户操作方式：
├── 方式A：点击上传按钮
│   └── 触发文件选择对话框
│   └── 用户选择文件（可多选）
│   └── 获取 File 对象数组
├── 方式B：拖拽文件到上传区域
│   └── 触发 dragover/drop 事件
│   └── 从 event.dataTransfer.files 获取文件
│   └── 获取 File 对象数组
```

#### 2. **前端验证阶段**
```typescript
// 使用 utils/core/file.ts 进行批量文件验证
const { valid: validFiles, invalid: invalidFiles } = validateFiles(files);

// 验证内容：
// - 文件大小 ≤ 10MB
// - 文件类型：PDF/JPG/PNG/GIF/BMP/WEBP
// - 文件扩展名验证
// - MIME类型验证
// - 文件名安全性检查

if (invalidFiles.length > 0) {
    showValidationErrors(invalidFiles);
    // 继续处理有效文件
}
```

#### 3. **客户端PDF处理阶段（新增长图支持）**
```typescript
// 使用 pdfProcessingUtils.ts 智能处理PDF文件
import { smartPdfProcessing } from '@/services/file/pdf';

for (const file of validFiles) {
    if (file.type === 'application/pdf') {
        // 状态：NOT_UPLOADED → PROCESSING_PDF
        onProgressUpdate('PROCESSING_PDF', 10);
        
        // 智能PDF处理 - 自动选择最佳策略（已简化，移除mode参数）
        const result = await smartPdfProcessing(file, {
            maxPages: PDF_PROCESSING.MAX_READ_PDF_PAGES, // 默认3页，可配置
            scale: 2.0,            // 高清渲染
            outputFormat: 'image/jpeg',
            quality: 0.9,          // 高质量输出
            maxWidth: 1920,        // 限制最大宽度
            pageSpacing: 20,       // 页面间距
            addPageSeparator: true // 添加分隔线
        });
        
        if (result.success && result.imageFile) {
            file = result.imageFile; // 替换为转换后的图像
            
            logInfo('PDF processing completed', {
                strategy: result.strategy,      // 处理策略：single-page/first-page/long-image-X-pages
                pageCount: result.pageCount,   // 总页数
                processedPages: result.processedPages, // 实际处理的页数
                totalHeight: result.totalHeight,       // 长图总高度
            });
        } else {
            throw new Error(result.error || 'PDF转换失败');
        }
    }
}

// 智能处理策略（自动选择，无需手动配置）：
// - 1页PDF → 单页高质量转换
// - 2-3页PDF → 自动生成垂直拼接长图
// - 4+页PDF → 仅处理第一页（发票通常在首页）
```

#### 4. **客户端图像压缩阶段（智能缩放）**
```typescript
// 使用 clientUploadUtils.ts 智能压缩图像（内置缩放逻辑）
import { compressImageWithStandardInterface } from '@/services/file/image';

// 状态：PROCESSING_PDF/NOT_UPLOADED → COMPRESSING_IMAGE
onProgressUpdate('COMPRESSING_IMAGE', 25);

// 智能参数缩放（根据PDF处理结果）
const isLongImage = pdfProcessingInfo.strategy?.startsWith("long-image");
const pageCount = pdfProcessingInfo.processedPages || 1;

// 长图自动缩放压缩参数
const targetSizeBytes = isLongImage 
    ? UPLOAD_CONSTANTS.TARGET_COMPRESSED_FILE_SIZE_IN_BYTES * pageCount  // 例：3页 = 3MB
    : UPLOAD_CONSTANTS.TARGET_COMPRESSED_FILE_SIZE_IN_BYTES;             // 单页 = 1MB

const maxHeight = isLongImage
    ? IMAGE_COMPRESSION.DEFAULT_MAX_HEIGHT * pageCount  // 例：3页 = 3240px
    : IMAGE_COMPRESSION.DEFAULT_MAX_HEIGHT;             // 单页 = 1080px

const compressed = await compressImageWithStandardInterface(file, {
    targetSizeBytes,            // 智能缩放目标大小
    maxWidth: 1920,             // 最大宽度保持统一
    maxHeight,                  // 智能缩放最大高度
    quality: 0.8,               // 初始质量
    outputFormat: 'image/jpeg'  // 统一输出格式
});

if (compressed.success && compressed.compressedFile) {
    file = compressed.compressedFile;
    // 状态：COMPRESSING_IMAGE → UPLOADING_TO_S3
    onProgressUpdate('UPLOADING_TO_S3', 40);
    
    // 记录压缩详情（含缩放信息）
    logInfo('智能压缩完成', {
        isLongImage,
        pageCount,
        targetSizeBytes,
        maxHeight,
        compressionStats: compressed.compressionStats
    });
} else {
    throw new Error('图像压缩失败');
}
```

#### 5. **S3直接上传阶段**
```typescript
// 使用 clientUploadUtils.ts 完整客户端上传流程
import { handleFileUpload } from '@/services/upload/client';

const result = await handleFileUpload(
    file,
    userId,
    (status, progress, message) => {
        // 实时状态更新
        onProgressUpdate(status, progress, message);
    }
);

// 内部流程：
// 1. 请求服务端pre-signed URL
// 2. 客户端直接上传到S3
// 3. 调用服务端AI处理接口
// 4. 返回完整结果
```

#### 6. **服务端AI处理阶段**
```typescript
// 状态：UPLOADING_TO_S3 → AI_PROCESSING
onProgressUpdate('AI_PROCESSING', 70);

// 服务端处理流程（serverUploadUtils.ts）：
// 1. 验证S3文件存在性
// 2. 生成S3 download URL
// 3. 创建数据库记录
// 4. 调用OpenAI Vision API直接处理S3图像
// 5. 返回提取的发票数据

const extractedData = await processWithOpenAIVision(s3ImageUrl);

// 状态：AI_PROCESSING → COMPLETED
onProgressUpdate('COMPLETED', 100);
```

### 📊 状态跟踪（新6状态工作流）

#### 简化的文件上传状态流转
```
NOT_UPLOADED → PROCESSING_PDF → COMPRESSING_IMAGE → UPLOADING_TO_S3 → AI_PROCESSING → COMPLETED
      ↓               ↓                 ↓                  ↓              ↓
    FAILED          FAILED            FAILED           FAILED         FAILED
```

#### 详细状态说明
- **NOT_UPLOADED**: 初始状态，等待开始上传
- **PROCESSING_PDF**: 客户端PDF转图像处理中（仅PDF文件）
- **COMPRESSING_IMAGE**: 客户端图像压缩优化中
- **UPLOADING_TO_S3**: 上传图像到S3永久存储
- **AI_PROCESSING**: OpenAI Vision分析S3图像
- **COMPLETED**: 全流程完成
- **FAILED**: 任一阶段失败（可重试）

#### 进度分配（新工作流）
```typescript
const progressMapping = {
    NOT_UPLOADED: 0,
    PROCESSING_PDF: 0-20,      // PDF转换（20%）
    COMPRESSING_IMAGE: 20-40,  // 图像压缩（20%）
    UPLOADING_TO_S3: 40-70,    // S3上传（30%）
    AI_PROCESSING: 70-100,     // AI处理（30%）
    COMPLETED: 100,
    FAILED: 0
};

// 智能进度计算（services/upload/status.ts）
export const getProgressForStatus = (
    status: UploadStatus,
    stageProgress: number = 0
): number => {
    const baseProgress = {
        NOT_UPLOADED: 0,
        PROCESSING_PDF: 0 + Math.min(stageProgress * 0.2, 20),
        COMPRESSING_IMAGE: 20 + Math.min(stageProgress * 0.15, 15), 
        UPLOADING_TO_S3: 35 + Math.min(stageProgress * 0.35, 35),
        AI_PROCESSING: 70 + Math.min(stageProgress * 0.3, 30),
        COMPLETED: 100,
        FAILED: 0,
    };
    return Math.min(100, Math.max(0, baseProgress[status] || 0));
};
```

### 🎨 用户体验设计（新工作流）

#### 成功流程
1. **文件选择**：支持多文件选择，拖拽区域高亮
2. **验证反馈**：实时显示文件预览和验证状态
3. **PDF转换**：动画显示"正在转换PDF为图像..."
4. **图像优化**：进度条显示"正在优化图像质量..."
5. **云端上传**：实时上传进度"正在上传到云端存储..."
6. **AI分析**：加载动画"AI正在分析您的发票..."
7. **完成庆祝**：彩色纸屑动画"分析完成！"

#### 并行上传体验
```typescript
// 多文件并行上传显示（services/upload/bulk.ts）
const batchProgress = calculateOverallProgress(progresses);

// 显示整体进度
console.log(`总进度: ${batchProgress.overallProgress}%`);
console.log(`完成: ${batchProgress.completedCount}/${progresses.length}`);
console.log(`PDF处理中: ${batchProgress.pdfProcessingCount}`);
console.log(`图像处理中: ${batchProgress.imageProcessingCount}`);
console.log(`上传中: ${batchProgress.uploadingCount}`);
console.log(`AI分析中: ${batchProgress.aiProcessingCount}`);
console.log(`失败: ${batchProgress.failedCount}`);
```

#### 错误处理和恢复
1. **PDF转换失败**：提示用户检查PDF文件完整性，支持重试
2. **图像压缩失败**：自动降级处理或跳过压缩
3. **网络上传失败**：断点续传机制，自动重试
4. **AI处理失败**：文件已安全存储，可稍后重新分析
5. **权限问题**：引导用户重新登录或联系支持

### 🏗️ 架构优势（相比旧8状态双存储）

#### 性能提升
- **客户端处理**：PDF转换和图像压缩在客户端完成，减少服务端负载
- **直接上传**：文件直接上传到S3，无需服务器中转
- **并行处理**：多文件独立并行上传，提升吞吐量
- **智能压缩**：客户端图像优化减少传输时间

#### 架构简化
- **移除OpenAI Files**：AI直接从S3 URL处理，无需临时存储
- **减少状态**：从8状态简化为6状态，降低复杂度
- **无会话管理**：移除上传会话机制，简化状态追踪
- **单一存储**：只使用S3永久存储，无需双存储协调

#### 成本优化
- **减少服务器资源**：客户端处理减少CPU和内存使用
- **降低带宽成本**：文件直接上传到S3，减少服务器流量
- **移除临时存储**：无需OpenAI Files存储和清理成本
- **提高并发能力**：服务器可支持更多并发用户

#### 安全性保障
- **时限URL**：Pre-signed URL限时有效，防止滥用
- **客户端验证**：文件在客户端验证，减少恶意上传
- **权限控制**：服务端严格权限验证
- **审计跟踪**：完整的上传和处理日志

---

## 🔐 场景：安全文件访问和下载流程

### 🎯 用户场景描述
用户需要预览或下载已上传的发票文件，系统通过pre-signed URL提供安全、时限性的文件访问。由于所有文件都已转换为图像格式并存储在S3，访问流程更加统一和简化。

### 🔄 文件访问技术流程

#### 1. **用户请求文件访问**
```typescript
// 使用 serverUploadUtils.ts 的文件访问功能
import { getFileAccessUrl } from '@/services/upload/server';

const accessFile = async (fileId: string, action: 'view' | 'download') => {
    // 1. 从数据库获取文件的S3对象键
    const file = await getFileByIdFromDatabase(fileId);
    
    // 2. 生成安全访问URL（1小时有效期）
    const result = await getFileAccessUrl(file.s3ObjectKey, 3600);
    
    if (result.success && result.accessUrl) {
        if (action === 'view') {
            window.open(result.accessUrl, '_blank'); // 新窗口预览
        } else {
            window.location.href = result.accessUrl; // 直接下载
        }
    } else {
        showError(result.error || '文件访问失败');
    }
};
```

#### 2. **后端权限验证和URL生成**
```typescript
// 使用 awsUtils.ts 生成预签名下载URL
import { generatePresignedDownloadUrl } from '@/services/storage/aws';

export const getFileAccessUrl = async (
    s3ObjectKey: string,
    expirySeconds: number = 3600
): Promise<{
    success: boolean;
    accessUrl?: string;
    error?: string;
}> => {
    try {
        // 验证文件存在性
        const fileExists = await checkS3FileExists(s3ObjectKey);
        if (!fileExists) {
            return {
                success: false,
                error: '文件不存在或已被删除'
            };
        }
        
        // 生成预签名下载URL
        const result = await generatePresignedDownloadUrl(
            s3ObjectKey,
            expirySeconds
        );
        
        return {
            success: result.success,
            accessUrl: result.signedUrl,
            error: result.success ? undefined : '生成访问链接失败'
        };
    } catch (error) {
        logError('Failed to get file access URL', { error, s3ObjectKey });
        return {
            success: false,
            error: '系统错误，请稍后重试'
        };
    }
};
```

### 🔒 安全优势

#### 统一文件格式的安全优势
- **标准化访问**：所有文件都是JPEG图像，统一安全策略
- **预览安全**：图像文件可安全在浏览器预览，无脚本执行风险
- **大小可控**：压缩后的图像文件减少传输和存储风险
- **格式验证**：服务端确保所有文件都是安全的图像格式

#### Pre-signed URL安全特性
- **时限控制**：默认1小时有效期，可根据需要调整
- **单次使用**：每次访问需要重新生成URL
- **权限隔离**：用户只能访问自己的文件
- **无凭证暴露**：客户端无法获取AWS访问密钥
- **审计完整**：所有文件访问都有详细日志

---

## 📋 新架构实现清单

### ✅ 已完成的核心功能

#### 核心架构文件
- [x] **uploadSchema.ts**: 新6状态枚举定义，移除双存储复杂性
- [x] **messageSchema.ts**: PDF处理和图像压缩相关消息
- [x] **services/upload/status.ts**: 6状态检查函数和智能进度计算

#### 客户端处理工具
- [x] **services/file/pdf.ts**: PDF转图像客户端处理（新增长图支持）
  - `convertPdfToImage()`: 单页PDF转换
  - `convertPdfToImages()`: 多页PDF转多图
  - `convertPdfToLongImage()`: 多页PDF垂直拼接长图（新功能）
  - `smartPdfProcessing()`: 智能选择最佳处理策略
- [x] **services/file/image.ts**: 智能图像压缩工具（已存在）
- [x] **services/upload/client.ts**: 完整客户端上传协调器（支持长图模式）
- [x] **services/upload/bulk.ts**: 前端多文件并行上传工具

#### 服务端支持
- [x] **services/upload/server.ts**: 服务端上传处理API函数
  - `handleRequestUploadUrl()`: 生成S3预签名上传URL
  - `handleProcessWithAI()`: OpenAI Vision直接处理S3图像
  - `getFileAccessUrl()`: 安全文件访问URL生成
- [x] **services/ai/processing.ts**: 重写为使用S3 URL的OpenAI Vision处理
- [x] **services/storage/aws.ts**: S3操作工具（预签名URL、文件检查等）

#### 已移除的过时代码
- [x] **aiUploadUtil.ts**: 删除OpenAI Files相关代码（已不需要）

### 🚧 待实现的功能

#### API端点实现
- [ ] **POST /api/files/request-upload-url**: 基于`handleRequestUploadUrl`
- [ ] **POST /api/files/process-with-ai**: 基于`handleProcessWithAI`
- [ ] **GET /api/files/access/[fileId]**: 基于`getFileAccessUrl`

#### 前端组件更新
- [ ] **文件上传组件**: 集成新的客户端处理流程
  - PDF转换进度显示
  - 图像压缩状态反馈
  - 6状态进度条更新
- [ ] **多文件上传界面**: 并行上传状态管理
  - 每个文件独立状态显示
  - 整体进度汇总
  - 错误文件重试机制
- [ ] **文件预览组件**: 统一图像格式预览

#### 错误处理增强
- [ ] **客户端错误恢复**: PDF转换失败处理
- [ ] **网络中断处理**: 断点续传机制
- [ ] **权限错误处理**: 自动重新认证

### 🧪 测试策略

#### 单元测试
- [ ] PDF转换功能测试（各种PDF格式）
- [ ] 图像压缩算法测试（不同尺寸和格式）
- [ ] 状态转换逻辑测试（6状态流转）
- [ ] 进度计算准确性测试

#### 集成测试
- [ ] 端到端上传流程测试（PDF和图像）
- [ ] 多文件并行上传测试
- [ ] AI处理结果验证测试
- [ ] 文件访问权限测试

#### 性能测试
- [ ] 大文件PDF转换性能
- [ ] 多文件并发上传压力测试
- [ ] 客户端内存使用监控
- [ ] S3上传速度基准测试

---

## 🚀 部署和迁移策略

### 阶段1：服务端API实现
- 实现新的简化API端点
- 部署新的处理逻辑
- 保持向后兼容性（如需要）

### 阶段2：前端组件重构
- 更新文件上传组件使用新工作流
- 实现PDF客户端转换界面
- 添加新的进度和状态显示

### 阶段3：功能测试验证
- 各种文件格式上传测试
- 并行上传性能验证
- 错误场景处理测试
- 用户体验评估

### 阶段4：生产部署
- 灰度发布新工作流
- 监控性能指标
- 收集用户反馈
- 完全替换旧架构

### 架构演进总结

从复杂的8状态双存储架构进化为简洁的6状态客户端处理架构，并新增多页PDF长图支持：

#### 核心架构改进
- **性能提升**: 客户端处理 + 直接S3上传
- **架构简化**: 移除OpenAI Files临时存储
- **成本优化**: 减少服务器负载和存储成本
- **用户体验**: 更快的处理速度和更清晰的状态反馈
- **安全性**: 保持Pre-signed URL安全机制
- **可扩展性**: 更好的并发支持和并行处理能力

#### 新增长图功能特性
- **智能处理策略**: 根据PDF页数自动选择最佳处理方式
  - 1页PDF → 单页高质量转换
  - 2-3页PDF → 自动生成垂直拼接长图
  - 4+页PDF → 智能提取首页（发票通常在第一页）
- **长图优化**: 页面间距、分隔线、居中对齐、内存管理
- **用户配置**: 支持手动指定处理模式、最大页数、分隔样式
- **向后兼容**: 无缝集成现有工作流，不影响图像文件处理

---