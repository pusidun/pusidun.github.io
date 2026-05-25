---
title: "Agent 运行时防护：沙箱、权限模型与命令拦截"
date: 2026-05-22
type: 技术
tags: ["智能体安全", "沙箱", "运行时防护"]
summary: "从工程落地角度设计 Agent 运行时防护系统，包括权限模型、命令风险分级、文件系统隔离、网络控制、用户审批和审计闭环。"
---

Agent 安全不能只依赖模型自觉。

模型可以生成计划，也可以解释风险，但真正决定能不能执行命令的，必须是运行时安全层。

这篇文章讨论一个 Agent 运行时防护系统应该怎么设计。

## 一、核心原则

运行时防护的核心原则是：

> 模型负责提出动作，安全运行时负责判断动作是否允许。

也就是说，即使模型说“这个命令是安全的”，运行时仍然要独立检查。

一个基本执行链路可以设计成：

1. Agent 生成工具调用
2. 运行时解析工具参数
3. 策略引擎评估风险
4. 低风险直接执行
5. 中风险记录并执行或提示
6. 高风险要求用户审批
7. 禁止行为直接阻断
8. 结果进入审计日志

## 二、权限模型

Agent 的权限不应该是“全有或全无”，而应该拆成细粒度 capability。

常见 capability 包括：

- `filesystem.read`
- `filesystem.write`
- `process.execute`
- `network.connect`
- `plugin.invoke`
- `secret.read`
- `remote.control`
- `system.modify`

每个 capability 都可以绑定范围。

例如文件权限：

```json
{
  "filesystem.read": {
    "allow": ["$WORKSPACE/**"],
    "deny": ["$HOME/.ssh/**", "$HOME/.aws/**", "**/.env"]
  },
  "filesystem.write": {
    "allow": ["$WORKSPACE/**"],
    "deny": ["$WORKSPACE/.git/**", "$HOME/**"]
  }
}
```

网络权限：

```json
{
  "network.connect": {
    "allow": ["github.com", "registry.npmjs.org"],
    "confirm": ["*.internal.company.com"],
    "deny": ["unknown"]
  }
}
```

命令权限：

```json
{
  "process.execute": {
    "allow": ["git status", "npm test", "npm run build"],
    "confirm": ["npm install", "pip install", "curl", "brew"],
    "deny": ["sudo", "rm -rf /", "launchctl", "schtasks"]
  }
}
```

实际工程里不能只做字符串匹配，最好解析命令结构。

## 三、命令风险分级

命令可以按风险分成四类。

### 低风险

一般只读、可逆、限定在工作区：

- `ls`
- `pwd`
- `git status`
- `git diff`
- `npm test`
- `npm run lint`

### 中风险

可能修改工作区或安装依赖：

- `npm install`
- `pip install`
- `cargo update`
- `git checkout`
- `git clean`
- 修改配置文件

### 高风险

可能影响系统、凭证或外部数据：

- `sudo`
- `curl | sh`
- `chmod -R`
- `rm -rf`
- `launchctl`
- `schtasks`
- 读取 `.env`
- 读取 `~/.ssh`
- 上传压缩包

### 禁止

明显破坏性或无法合理解释的行为：

- 删除根目录
- 读取并上传私钥
- 绕过系统安全策略
- 禁用审计
- 修改安全工具配置

高风险不一定全部禁止，但必须给用户明确上下文：

- Agent 想做什么
- 为什么需要做
- 会访问哪些文件
- 会连接哪个网络地址
- 是否可回滚

## 四、文件系统隔离

Agent 的默认工作范围应该是 workspace，而不是整个用户目录。

文件系统策略建议分层：

1. 默认允许当前工作区读
2. 默认允许当前工作区写
3. 默认拒绝工作区外写
4. 默认拒绝敏感目录读
5. 特殊目录需要用户授权

敏感路径包括：

- `~/.ssh`
- `~/.gnupg`
- `~/.aws`
- `~/.kube`
- `~/Library/Keychains`
- `%USERPROFILE%\.ssh`
- `%APPDATA%`
- `.env`
- `.npmrc`
- `.pypirc`
- shell history

文件隔离不能只发生在 UI 层。因为 Agent 可能通过子进程间接访问文件，运行时需要在命令执行前做预判，在执行中做监控。

## 五、网络出站控制

数据外泄通常需要网络。

Agent 的网络控制可以按目标域名、端口、进程和插件维度做策略：

- 允许访问包管理器和代码托管平台
- 内网地址按企业策略控制
- 未知外部域名触发审批
- 上传行为触发更高风险评级
- 插件网络权限单独授权

需要重点识别：

- `curl`
- `wget`
- `scp`
- `rsync`
- `nc`
- 自定义脚本发请求
- npm/pip postinstall 网络请求

如果能做到网络代理层统一审计，会比只拦命令更可靠。

## 六、用户审批设计

审批不是弹窗越多越安全。

好的审批应该具备三个特点：

1. 解释清楚风险
2. 给出最小授权范围
3. 支持一次性授权

例如：

```text
Agent 请求读取 /Users/me/project/.env
原因：运行测试需要数据库连接配置
风险：该文件可能包含密钥
授权范围：
- 仅本次读取
- 仅允许读取变量名，不显示变量值
- 拒绝
```

审批要避免“永久允许所有操作”。这会让权限模型失效。

## 七、审计闭环

运行时防护不仅要拦，还要记。

审计日志建议包含：

- task id
- 用户 id
- 模型请求
- 工具名称
- 工具参数
- 策略评估结果
- 用户审批结果
- 执行开始和结束时间
- 退出码
- 脱敏后的输出摘要

日志要能回答两个问题：

- 安全事件发生时，发生了什么？
- 产品误拦时，为什么会拦？

这对安全运营和产品体验都很重要。

## 八、工程架构

一个简化架构可以是：

```text
Agent Planner
    |
Tool Call Request
    |
Security Runtime
    |-- Command Parser
    |-- Policy Engine
    |-- Secret Detector
    |-- Approval Manager
    |-- Audit Logger
    |
Sandbox Executor
    |
Tool Result
```

其中 Security Runtime 是核心边界。任何工具调用都应该经过它。

## 九、Roadmap 中的位置

在 AI 终端安全 Roadmap 里，运行时防护是从“风险认知”走向“工程控制”的关键层：

> 我会把 Agent 的执行权限拆成文件、进程、网络、插件、凭证、远程控制等 capability，由运行时安全层统一拦截工具调用。模型只负责提出动作，策略引擎独立判断是否允许。低风险动作自动执行，高风险动作要求用户审批，敏感路径和危险命令默认阻断。同时对命令、文件、网络和插件调用做审计，并对日志进行脱敏。

这层能力决定了 AI Agent 能否在真实终端环境里既可用又可控。
