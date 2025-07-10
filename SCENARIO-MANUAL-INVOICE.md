

## 📝 场景：手动创建发票记录 + 后补文件上传

### 🎯 用户场景描述
用户需要先手动创建发票记录（如发票丢失、损坏或暂时没有文件），然后再补充上传文件，系统智能合并数据。

### 🔄 完整业务流程

#### 阶段1：手动创建发票记录

```typescript
// 用户在发票管理页面点击"手动创建发票"
// 打开 ManualInvoiceForm 组件

// 1. 用户填写表单
const manualInvoiceData: ManualInvoiceInput = {
    invoiceNumber: "INV-2024-001",
    supplierName: "ABC Office Supplies",
    supplierTaxId: "12345678901",
    totalAmount: 156.50,
    currency: "AUD",
    invoiceDate: "2024-07-09",
    category: "OFFICE_SUPPLIES",
    description: "Office supplies for July",
    notes: "Monthly stationery order"
};

// 2. 提交到API
const response = await fetch('/api/invoices', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(manualInvoiceData)
});

// 3. 数据库存储
// 注意：fileId 为 null（支持手动创建）
```

#### 数据库记录状态
```sql
-- 手动创建的发票记录
INSERT INTO invoices (
    id, user_id, file_id,           -- file_id = NULL (支持手动创建)
    invoice_number, supplier_name, total_amount,
    currency, invoice_date, category,
    status, validation_status
) VALUES (
    'invoice_123', 'user_456', NULL,  -- 关键：file_id 为 NULL
    'INV-2024-001', 'ABC Office Supplies', 156.50,
    'AUD', '2024-07-09', 'OFFICE_SUPPLIES',
    'PENDING', 'PENDING'
);
```

#### 阶段2：后补文件上传

```typescript
// 用户在发票详情页面点击"上传文件"按钮
// 或者在发票列表中选择"补充文件"

// 1. 文件上传（复用场景1的流程）
const uploadResult = await uploadFile(file);

// 2. 更新发票记录，关联文件ID
const updateResponse = await fetch(`/api/invoices/${invoiceId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        fileId: uploadResult.fileId,
        status: 'PROCESSING'
    })
});

// 3. 触发AI提取
const aiExtractionResult = await extractInvoiceData(uploadResult.fileId);
```

#### 阶段3：智能数据合并

```typescript
// AI提取完成后，智能合并数据
const mergeInvoiceData = (
    existingInvoiceData: Invoice,
    aiExtractedData: AIExtractionResult
): InvoiceUpdateInput => {
    
    // 核心合并逻辑：手动数据优先，AI数据补充
    const updatedInvoiceData = {
        ...existingInvoiceData,
        ...aiExtractedData,
        
        // 特殊处理逻辑
        // 如果手动输入的金额与AI提取的金额差异很大，标记需要审核
        validationStatus: Math.abs(
            existingInvoiceData.totalAmount - aiExtractedData.totalAmount
        ) > existingInvoiceData.totalAmount * 0.1 
            ? 'NEEDS_REVIEW' 
            : 'VALID',
            
        // 保留手动输入的分类（用户意图优先）
        category: existingInvoiceData.category || aiExtractedData.category,
        
        // 合并描述信息
        description: existingInvoiceData.description 
            ? `${existingInvoiceData.description}\n\n[AI提取]: ${aiExtractedData.description}`
            : aiExtractedData.description,
            
        // 更新处理状态
        status: 'COMPLETED',
        processedAt: new Date(),
        extractedData: aiExtractedData,
        aiConfidenceScore: aiExtractedData.confidenceScore
    };
    
    return updatedInvoiceData;
};
```

#### 阶段4：数据验证和用户确认

```typescript
// 显示数据合并结果给用户确认
const showDataMergePanel = (
    originalData: Invoice,
    aiData: AIExtractionResult,
    mergedData: InvoiceUpdateInput
) => {
    // DataMergePanel 组件显示：
    // - 原始手动数据
    // - AI提取数据
    // - 合并后数据
    // - 差异高亮显示
    // - 用户可以选择接受/拒绝/修改
};
```

### 🎨 用户界面流程

#### 手动创建阶段
```
发票列表页面 → 点击"手动创建" → ManualInvoiceForm
         ↓
填写表单 → 验证数据 → 提交 → 成功提示 → 跳转到发票详情
```

#### 后补文件阶段
```
发票详情页面 → 点击"上传文件" → 文件上传组件
         ↓
选择文件 → 上传 → AI处理 → DataMergePanel → 用户确认 → 更新记录
```

### 📊 状态跟踪

#### 发票状态流转
```
手动创建：
PENDING → (用户补充文件) → PROCESSING → COMPLETED

直接上传：
PENDING → PROCESSING → COMPLETED
```

#### 验证状态流转
```
手动创建：
PENDING → (AI提取后) → VALID/INVALID/NEEDS_REVIEW

数据差异大：
NEEDS_REVIEW → (用户确认后) → VALID
```

### 🚨 异常处理场景

#### 1. AI提取失败
```typescript
if (aiExtractionResult.status === 'FAILED') {
    // 保留手动输入的数据
    // 标记文件上传成功但AI处理失败
    // 提供手动编辑选项
}
```

#### 2. 数据冲突严重
```typescript
if (dataConflictLevel > 0.5) {
    // 标记为需要人工审核
    // 发送邮件通知
    // 提供详细的差异报告
}
```

#### 3. 重复发票检测
```typescript
// 检查是否存在相同的发票号码
const duplicateCheck = await checkDuplicateInvoice(
    invoiceNumber, 
    supplierName, 
    totalAmount
);
```

### 💡 设计亮点

1. **渐进式数据完善**：允许用户分步骤完成发票录入
2. **智能数据合并**：AI和手动数据的智能融合
3. **用户意图优先**：关键字段以用户输入为准
4. **透明化处理**：详细显示数据合并过程
5. **灵活的工作流**：支持多种发票录入方式

---
