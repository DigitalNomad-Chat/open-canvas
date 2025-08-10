# New API 集成配置指南

## 概述

Open Canvas 现在支持通过 [New API](https://github.com/QuantumNous/new-api) 统一管理所有大模型接口，实现成本优化和集中管理。

## 配置步骤

### 1. 启用 New API

在 `.env` 文件中设置：

```bash
# 启用 New API 统一接口
USE_NEW_API="true"

# New API 服务地址
NEW_API_BASE_URL="http://your-newapi-domain/v1"

# New API 访问密钥
NEW_API_KEY="sk-your-newapi-token"
```

### 2. 按功能配置模型

根据不同功能需求，在 New API 中配置相应的模型，然后在环境变量中指定模型名称：

#### 2.1 主要内容生成功能
```bash
# 用户交互的核心模型（生成和编辑文档/代码）
NEW_API_CONTENT_MODEL="gpt-4o"
NEW_API_CONTENT_MODEL_BACKUP="claude-3-5-sonnet"
```

#### 2.2 快速任务功能
```bash
# 对话标题生成（低成本、高速度）
NEW_API_TITLE_MODEL="gpt-4o-mini"

# 后续建议生成
NEW_API_FOLLOWUP_MODEL="gpt-4o-mini"
```

#### 2.3 搜索和查询功能
```bash
# 网络搜索查询生成（需要优秀的推理能力）
NEW_API_SEARCH_QUERY_MODEL="claude-3-5-sonnet"

# 消息分类（判断是否需要搜索）
NEW_API_SEARCH_CLASSIFY_MODEL="claude-3-5-sonnet"
```

#### 2.4 文本处理功能
```bash
# 对话摘要（长文本处理能力强）
NEW_API_SUMMARY_MODEL="claude-3-5-sonnet"

# 用户偏好学习和反思
NEW_API_REFLECTION_MODEL="claude-3-5-sonnet"
```

#### 2.5 多模态和特殊功能
```bash
# URL内容分析（多模态能力）
NEW_API_URL_ANALYSIS_MODEL="gemini-2.0-flash"

# 图片、文件处理
NEW_API_MULTIMODAL_MODEL="gemini-2.0-flash"
```

#### 2.6 工具调用备用
```bash
# 当主模型不支持工具调用时使用
NEW_API_TOOL_FALLBACK_MODEL="gpt-4o"
```

## 功能对应的模型需求

### 高频使用功能（建议配置高性能模型）
- **NEW_API_CONTENT_MODEL**: 用户主要交互，影响体验
- **NEW_API_SEARCH_QUERY_MODEL**: 搜索功能的准确性关键

### 中频使用功能（平衡性能和成本）
- **NEW_API_SUMMARY_MODEL**: 长对话时触发
- **NEW_API_REFLECTION_MODEL**: 学习用户偏好
- **NEW_API_URL_ANALYSIS_MODEL**: 处理URL内容

### 低频使用功能（可使用低成本模型）
- **NEW_API_TITLE_MODEL**: 仅在对话开始时使用
- **NEW_API_FOLLOWUP_MODEL**: 生成简单建议

## New API 中的模型配置建议

### 成本优化配置
```bash
# 高性能任务
NEW_API_CONTENT_MODEL="claude-3-5-sonnet"           # 平衡性能和成本
NEW_API_SEARCH_QUERY_MODEL="claude-3-5-sonnet"     # 确保搜索准确性

# 中等任务
NEW_API_SUMMARY_MODEL="claude-3-5-haiku"           # 性价比高
NEW_API_REFLECTION_MODEL="claude-3-5-haiku"        
NEW_API_URL_ANALYSIS_MODEL="gemini-1.5-flash"      # 多模态低成本

# 低成本任务
NEW_API_TITLE_MODEL="gpt-4o-mini"                  # 最低成本
NEW_API_FOLLOWUP_MODEL="gpt-4o-mini"
```

### 高性能配置
```bash
# 追求最佳体验
NEW_API_CONTENT_MODEL="gpt-4o"                     # 最新最强
NEW_API_SEARCH_QUERY_MODEL="claude-3-5-sonnet"     # 推理能力强
NEW_API_SUMMARY_MODEL="claude-3-5-sonnet"          # 长文本处理佳
NEW_API_URL_ANALYSIS_MODEL="gemini-2.0-flash"      # 多模态能力强
```

## 切换回传统模式

如需回到传统的分散API配置，只需设置：

```bash
USE_NEW_API="false"
```

然后正常配置各厂商的API密钥即可。

## 故障排除

### 1. 模型不存在错误
确保在 New API 管理界面中已正确添加并启用相应的模型。

### 2. 权限错误
检查 `NEW_API_KEY` 是否有访问相应模型的权限。

### 3. 连接错误
确认 `NEW_API_BASE_URL` 地址正确且服务正常运行。

### 4. 功能异常
如果某个功能不工作，检查对应的模型配置变量是否正确设置。

## 模型映射表

| 原始硬编码模型 | 对应环境变量 | 推荐 New API 模型 |
|---------------|-------------|------------------|
| claude-3-5-sonnet-latest | NEW_API_SEARCH_QUERY_MODEL | claude-3-5-sonnet |
| claude-3-5-sonnet-20240620 | NEW_API_REFLECTION_MODEL | claude-3-5-sonnet |
| gpt-4o-mini | NEW_API_TITLE_MODEL | gpt-4o-mini |
| gemini-2.0-flash | NEW_API_URL_ANALYSIS_MODEL | gemini-2.0-flash |

这样配置后，所有模型调用都会通过 New API 统一管理，实现成本控制和集中监控。
