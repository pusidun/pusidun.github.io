---
title: "Windows 与 macOS：智能体终端安全的系统基础"
date: 2026-05-21
type: 技术
tags: ["Windows安全", "macOS安全", "智能体安全"]
summary: "梳理 AI 终端安全需要掌握的 Windows 和 macOS 系统安全机制，包括权限模型、代码签名、系统审计、沙箱隔离和凭证保护。"
---

智能体终端安全绕不开操作系统。

Agent 最终要在 Windows 或 macOS 上执行命令、启动子进程、读写文件、调用系统 API。产品层面的权限模型如果不了解底层系统机制，很容易变成“看起来限制了，实际能绕过”。

这篇文章梳理 Windows 和 macOS 两侧最重要的系统安全基础。

## 一、为什么系统基础重要

Agent 安全有一个很现实的问题：

> Agent 不一定直接做危险动作，它可以借助系统已有能力间接完成危险动作。

比如：

- 通过 PowerShell 读取和上传文件
- 通过 WMI 启动进程
- 通过 AppleScript 控制其他应用
- 通过 LaunchAgent 做持久化
- 通过 shell profile 注入启动脚本
- 通过包管理器 postinstall 执行任意命令

所以安全工程师不能只看 Agent 的 UI 或 prompt，还要看它在系统里的实际执行权限。

## 二、Windows 权限模型

Windows 侧最先要理解的是 Access Token。

一个进程启动后，会携带访问令牌，令牌中包含：

- 用户 SID
- 用户组
- Privileges
- Integrity Level
- 是否提升为管理员
- 是否可 impersonate 其他身份

Agent 启动子进程时，子进程通常会继承 Agent 主进程的权限。如果 Agent 主进程本身拥有过高权限，所有工具调用都会变危险。

需要关注：

- 是否以管理员身份运行
- 是否继承完整环境变量
- 是否可以访问用户凭证
- 是否可以写系统目录
- 是否可以创建服务或计划任务

## 三、Windows 上的高风险能力

常见高风险能力包括：

- `powershell.exe`
- `cmd.exe`
- `wscript.exe`、`cscript.exe`
- `mshta.exe`
- `rundll32.exe`
- `reg.exe`
- `schtasks.exe`
- `sc.exe`
- WMI
- 远程桌面和 WinRM

这些工具常被称作 LOLBins。它们本身是系统合法工具，但也常被攻击者利用。

Agent 产品需要对这些命令做风险识别。不是所有调用都禁止，但至少应该分级：

- 查看信息：低到中风险
- 修改注册表：高风险
- 创建计划任务：高风险
- 下载并执行脚本：高风险
- 绕过 PowerShell 执行策略：高风险

## 四、Windows 审计能力

Windows 侧常用审计能力：

- Windows Event Log
- PowerShell Script Block Logging
- ETW
- Sysmon
- Defender for Endpoint
- WDAC 事件
- AppLocker 事件

对 Agent 安全而言，建议至少记录：

- 进程创建事件
- 父子进程关系
- 命令行参数
- 网络连接
- 文件创建和删除
- PowerShell 脚本内容摘要
- 高危工具调用

这样才能在安全事件发生后回答：

- Agent 当时执行了什么？
- 是哪个任务触发的？
- 调用了哪个插件？
- 访问了哪些文件？
- 是否有外联？

## 五、macOS 权限模型

macOS 基础权限来自 Unix 模型：

- 用户
- 用户组
- 文件权限
- root
- sudo

但现代 macOS 还有额外安全机制：

- TCC
- SIP
- Gatekeeper
- Notarization
- Code Signing
- App Sandbox
- Entitlements

这些机制共同决定了应用能访问什么、能控制什么、能否被系统信任。

## 六、TCC 与隐私权限

TCC 是 macOS 上非常关键的隐私权限系统。

它控制应用访问：

- 桌面
- 文档
- 下载
- 摄像头
- 麦克风
- 通讯录
- 日历
- 辅助功能
- 屏幕录制
- 自动化控制
- 完全磁盘访问

Agent 产品最危险的是申请过宽权限。

比如一旦拥有完全磁盘访问，应用就可能读取大量用户隐私文件。拥有辅助功能权限后，又可能控制其他应用界面。拥有自动化控制权限后，可以通过 AppleScript 驱动 Finder、Terminal、浏览器等应用。

安全设计上应该遵循：

- 默认只访问工作区
- 需要额外目录时按需授权
- 敏感权限给出明确用途
- 权限使用行为进入审计
- 企业版支持统一禁用高危权限

## 七、代码签名与插件安全

Windows 和 macOS 都有代码签名机制，但 Agent 插件系统经常会绕开传统应用分发链路。

插件可能是：

- npm 包
- Python 包
- 本地脚本
- MCP Server
- 二进制工具
- WebView 扩展

因此，主程序签名不代表插件安全。

需要单独设计插件校验：

- 插件来源校验
- 插件包签名
- manifest 权限声明
- 版本锁定
- 更新校验
- 依赖扫描
- 安装脚本审计

## 八、系统沙箱能力

Windows 可参考：

- AppContainer
- Job Object
- Low Integrity Process
- WDAC
- AppLocker
- Windows Sandbox

macOS 可参考：

- App Sandbox
- Seatbelt sandbox profile
- Entitlements
- Endpoint Security Framework
- System Extension

但很多 Agent 产品因为开发体验和兼容性，不会一开始就使用强系统沙箱。这时可以先做产品层运行时隔离：

- 工作区路径限制
- 命令执行代理
- 环境变量清洗
- 网络代理
- 插件权限控制
- 高危行为审批

之后再逐步叠加系统级能力。

## 九、凭证保护

终端环境里最敏感的是凭证。

常见位置包括：

- `~/.ssh`
- `~/.gnupg`
- `~/.aws`
- `~/.kube`
- `.env`
- shell history
- Git credential store
- Keychain
- Windows Credential Manager
- 浏览器配置目录

Agent 默认不应该读取这些位置。即使用户任务看似需要，也应该明确说明原因并让用户审批。

同时，子进程环境变量需要做最小化处理，避免把 `GITHUB_TOKEN`、`OPENAI_API_KEY`、`AWS_SECRET_ACCESS_KEY` 之类的敏感变量无差别传给所有工具。

## 十、学习建议

如果要补齐 AI 终端安全的系统基础，建议按这个顺序学习：

1. 先理解 Windows Access Token、UAC、Event Log、PowerShell 日志
2. 再理解 macOS TCC、SIP、Code Signing、Keychain
3. 然后学习进程、文件、网络三类审计
4. 最后把系统机制映射到 Agent 的工具调用和插件调用

学习时不要只看文档，可以做几个小实验：

- 记录一个 Agent 子进程的父子进程关系
- 观察命令执行时继承了哪些环境变量
- 在 macOS 上查看应用 entitlements
- 在 Windows 上用 Sysmon 记录 PowerShell 命令
- 尝试检测访问 `.ssh` 或 `.env` 的行为

这些实验会让系统安全知识真正变成工程能力。
