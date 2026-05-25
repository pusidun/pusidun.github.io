---
title: "Agent 行为审计与敏感数据保护"
date: 2026-05-24
type: 技术
tags: ["智能体安全", "安全审计", "数据保护"]
summary: "讨论 Agent 终端侧如何建设行为审计、敏感数据识别、日志脱敏、凭证保护和企业安全运营闭环。"
---

Agent 在终端侧执行任务时，会产生大量行为数据。

这些数据对安全很有价值：可以追踪命令、定位风险、复盘事件。但它们本身也可能包含敏感信息。如果审计设计不好，日志反而会变成新的泄露点。

所以 Agent 终端安全里的审计目标是：

> 行为可追溯，敏感数据不可见。

## 一、为什么 Agent 审计特殊

传统终端审计关注进程、文件、网络等系统事件。Agent 审计还要关注更上层的语义链路：

- 用户给了什么任务
- 模型如何规划
- 准备调用什么工具
- 工具参数是什么
- 策略引擎如何判断
- 用户是否审批
- 实际执行结果是什么
- 模型是否基于结果继续行动

这类信息能解释“为什么发生”，而不只是记录“发生了什么”。

## 二、应该记录什么

建议审计字段包括：

- task id
- session id
- user id
- device id
- workspace 路径摘要
- 模型动作类型
- 工具名称
- 工具参数摘要
- 命令行摘要
- 文件访问路径
- 网络目标
- 插件名称和版本
- 策略评估结果
- 用户审批结果
- 执行时间
- 退出码
- 风险标签

注意，这里多次使用“摘要”，因为原始内容可能包含敏感数据。

例如命令：

```bash
curl -H "Authorization: Bearer ghp_xxx" https://api.example.com
```

审计时应该变成：

```text
curl -H "Authorization: Bearer [REDACTED]" https://api.example.com
```

## 三、敏感数据类型

Agent 容易接触的敏感数据包括：

- API Key
- OAuth Token
- SSH 私钥
- GPG 私钥
- 数据库密码
- 云厂商凭证
- Cookie
- Session
- 个人身份信息
- 企业内部域名和接口
- 源代码片段
- 业务日志

不同数据处理策略不同。

例如 token 应该直接脱敏，私钥应该阻断读取，源码片段是否可记录则要看企业策略。

## 四、Secret 检测

Secret 检测可以结合多种方式：

- 正则规则
- 熵值检测
- 前缀识别
- 文件名识别
- 上下文识别
- 已知 token 格式

常见规则：

- `AKIA` 开头的 AWS Key
- `ghp_` 开头的 GitHub Token
- `-----BEGIN OPENSSH PRIVATE KEY-----`
- `-----BEGIN RSA PRIVATE KEY-----`
- `xoxb-` Slack Token
- `.env` 文件中的 `SECRET`、`TOKEN`、`PASSWORD`

但不能只靠正则。比如很多内部 token 没有固定前缀，需要结合变量名、文件路径和熵值判断。

## 五、日志脱敏策略

脱敏策略要覆盖：

- 用户输入
- 模型输出
- 工具参数
- 命令行
- stdout
- stderr
- 文件 diff
- 插件返回结果
- 网络请求头

常见脱敏方式：

- 全量替换为 `[REDACTED]`
- 保留前后少量字符用于排查
- 只记录 hash
- 只记录变量名不记录变量值
- 对高敏数据直接丢弃

例如：

```text
OPENAI_API_KEY=sk-proj-abc123456789
```

可以记录为：

```text
OPENAI_API_KEY=[REDACTED:sha256:8f14e45f]
```

这样既能定位同一个 secret 是否反复出现，又不会暴露原文。

## 六、敏感路径保护

某些路径默认就应该被视为高敏：

- `~/.ssh`
- `~/.gnupg`
- `~/.aws`
- `~/.kube`
- `~/Library/Keychains`
- `.env`
- `.npmrc`
- `.pypirc`
- shell history
- 浏览器用户数据目录

保护策略可以分成三类：

1. 默认阻断
2. 用户一次性审批
3. 企业策略永久禁止

对企业终端来说，第三类很重要。比如企业可以规定 Agent 永远不能读取 SSH 私钥，即使用户同意也不行。

## 七、行为关联检测

单个行为不一定危险，组合行为才危险。

例如：

- 读取 `.env`
- 打包项目目录
- 连接未知外部域名

单独看每一步都有可能合理，但连续发生就应该触发高危告警。

可以设计行为链规则：

```text
SensitiveFileRead + ArchiveCreate + ExternalUpload => High Risk
```

类似规则还包括：

- SecretRead + ClipboardWrite
- SSHKeyRead + NetworkConnect
- ShellProfileWrite + ProcessExecute
- DependencyInstall + UnknownPostinstall
- PluginInstall + HighPrivilegeRequest

Agent 安全检测要从“单点规则”逐步升级到“行为链分析”。

## 八、企业安全运营

企业版需要把审计接入安全运营体系：

- 日志上报 SIEM
- 告警分级
- 事件工单
- 设备隔离
- 插件禁用
- 策略回滚
- 安全事件复盘
- 风险报表

告警要能回答：

- 哪个用户触发
- 哪台设备触发
- 哪个 Agent 任务触发
- 访问了什么敏感资源
- 是否外传
- 是否被用户批准
- 后续如何处置

这样安全团队才能真正闭环。

## 九、Roadmap 中的位置

在 AI 终端安全 Roadmap 里，审计和敏感数据保护是运营闭环的基础：

> 我会围绕 Agent 的任务、模型、工具、插件、命令、文件和网络行为建立统一审计链路，并在日志进入存储前做敏感数据检测和脱敏。对于 SSH Key、云凭证、`.env`、Keychain 等高敏资源默认阻断或审批；对于读取敏感文件后上传外部域名等组合行为做行为链检测；企业侧把告警接入 SIEM 和处置流程，形成可追溯、可治理、可闭环的安全运营能力。

核心不是“记录所有东西”，而是记录正确的信息，并保护好这些信息。
