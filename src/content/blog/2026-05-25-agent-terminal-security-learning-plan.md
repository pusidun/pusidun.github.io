---
title: "AI 终端安全技术栈学习 Roadmap"
date: 2026-05-25
type: 技术
tags: ["智能体安全", "学习路线", "终端安全"]
summary: "面向 AI 终端安全方向的分阶段学习 Roadmap，覆盖系统安全基础、Agent 威胁建模、沙箱运行时、插件供应链、审计与企业治理。"
---

如果要学习 AI 终端安全，路线不能只按传统终端安全来走。

这个方向要求你既懂 Windows/macOS 终端安全，又懂 Agent 的执行方式，还要能把安全策略落到产品和工程里。

我建议按六个阶段学习。

## 第一阶段：终端安全基础

时间：1 到 2 个月

目标：理解 Windows 和 macOS 的权限边界。

Windows 重点：

- 用户、组、管理员权限
- UAC
- Access Token
- Integrity Level
- ACL
- Windows Service
- Task Scheduler
- PowerShell
- Event Log
- Sysmon

macOS 重点：

- 用户、组、root、sudo
- TCC
- SIP
- Gatekeeper
- Code Signing
- Notarization
- Keychain
- LaunchAgent
- LaunchDaemon
- Unified Logging

实践任务：

- 用 Sysmon 记录进程创建和网络连接
- 在 Windows 上观察 PowerShell 日志
- 在 macOS 上查看 App 签名和 entitlements
- 分析 LaunchAgent 持久化方式
- 梳理 `.ssh`、`.aws`、`.env` 等敏感路径

这个阶段的目标不是成为系统内核专家，而是知道 Agent 在终端上能做什么、能绕过什么。

## 第二阶段：Agent 安全基础

时间：1 个月

目标：理解 Agent 为什么比普通客户端更危险。

学习内容：

- Agent 感知、规划、执行、反馈流程
- Tool Calling
- Function Calling
- 本地命令执行
- 远程控制
- 插件和 Skill
- MCP Server
- Prompt Injection
- Tool Injection
- Workspace 隔离
- Human-in-the-loop 审批

实践任务：

- 画出一个 Coding Agent 的执行链路
- 标注模型、工具、插件、工作区之间的信任边界
- 收集 10 个 Agent 可能执行的高危命令
- 分析恶意 README 如何诱导 Agent 读取私钥

这一阶段要形成一个关键认知：

> 模型输出不是权限凭证，工具执行必须由运行时独立判断。

## 第三阶段：威胁建模

时间：2 到 3 周

目标：能系统分析 Agent 终端侧风险。

学习内容：

- 资产识别
- 攻击者建模
- 信任边界
- 攻击路径
- 风险分级
- 缓解措施

建议重点分析这些场景：

- 越权访问用户目录
- 读取和上传 `.env`
- 读取 SSH Key
- 恶意插件执行脚本
- 依赖安装时执行 postinstall
- 远程任务重放
- 审计日志泄露 token
- shell profile 被写入恶意命令

实践任务：

- 写一份 Agent 终端安全威胁建模文档
- 设计风险分级表
- 为每个高风险攻击路径设计缓解方案

输出物可以包括：

- 资产清单
- 信任边界图
- 攻击路径表
- 风险分级规则
- 安全控制矩阵

## 第四阶段：运行时防护与沙箱

时间：2 到 3 个月

目标：能落地一个最小可用的 Agent 安全运行时。

学习内容：

- 命令解析
- 子进程管控
- 文件访问控制
- 网络访问控制
- 环境变量清洗
- 权限 capability 模型
- 用户审批流
- 审计日志
- Docker 沙箱
- Windows Job Object
- macOS App Sandbox

实践项目：Agent Terminal Security Gateway

功能建议：

- 接收 Agent 要执行的命令
- 对命令做风险分级
- 阻断敏感路径读取
- 阻断危险删除命令
- 对网络上传行为要求审批
- 清洗子进程环境变量
- 记录审计日志
- 对日志做 token 脱敏

可以先从命令执行代理做起：

```text
agent request -> policy engine -> approval -> sandbox executor -> audit log
```

这个项目非常适合作为阶段性实践项目。

## 第五阶段：插件与供应链安全

时间：1 到 2 个月

目标：能设计插件安全体系。

学习内容：

- 插件 manifest
- 插件权限声明
- 插件签名
- 安装脚本风险
- npm/pip 供应链攻击
- SCA
- SBOM
- 动态行为分析
- 插件市场审核
- 插件更新安全

实践任务：

- 设计一个 Agent 插件 manifest
- 写一个插件扫描器原型
- 检测高危 API
- 检测 postinstall 脚本
- 检测敏感路径访问
- 检测未知域名请求

插件扫描器可以先支持这些规则：

- 是否调用 `child_process`
- 是否读取 `process.env`
- 是否访问 `.ssh`、`.env`
- 是否发起网络请求
- 是否动态加载远程代码

## 第六阶段：企业治理和运营

时间：1 个月

目标：从单机安全能力升级到企业级安全方案。

学习内容：

- 企业策略下发
- 终端分组管理
- 插件白名单
- 审计日志上报
- SIEM 对接
- 告警分级
- 事件响应
- 策略灰度
- 策略回滚
- 风险报表

实践任务：

- 设计企业 Agent 安全策略模板
- 设计高危事件告警规则
- 设计安全事件处置流程
- 模拟一次“Agent 读取 `.env` 并尝试上传”的事件响应

企业安全最看重闭环：

```text
发现风险 -> 触发告警 -> 定位任务 -> 阻断行为 -> 处置设备 -> 修正规则 -> 复盘沉淀
```

## 推荐阅读和练习方向

系统安全：

- Windows Internals 相关资料
- Microsoft Sysmon 文档
- PowerShell 安全日志
- Apple Platform Security
- macOS Code Signing 和 TCC 资料

Agent 安全：

- Prompt Injection 案例
- Tool Calling 安全设计
- LLM Agent 威胁建模
- 插件系统权限模型
- MCP Server 安全边界

工程实践：

- 写命令风险分类器
- 写 Secret 检测器
- 写插件 manifest 校验器
- 写安全审计日志模块
- 写策略引擎原型

## Roadmap 输出清单

完成这条学习路线后，至少应该沉淀这些内容：

- 一份 Agent 终端安全威胁模型
- 一套权限 capability 设计
- 一套命令风险分级规则
- 一个插件安全 manifest 示例
- 一个审计和脱敏方案
- 一个企业安全运营闭环设计
- 一个可演示的小项目

如果只能做一个综合实践项目，我建议做：

> Agent Terminal Security Gateway

它可以覆盖 AI 终端安全最核心的能力：运行时防护、权限隔离、敏感数据保护、审计和安全策略。

## 总结

这个方向最重要的不是会背多少安全名词，而是能把 Agent 的高风险能力拆解成可治理的工程边界。

学习时可以始终围绕三个问题：

1. Agent 能接触什么敏感资产？
2. Agent 可能通过什么路径越权或泄密？
3. 我能用什么机制在不影响使用的前提下限制它？

能把这三个问题讲清楚，并做出一个小型原型，就能形成比较完整的 AI 终端安全知识闭环。
