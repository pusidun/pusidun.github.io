# pusidun's Blog

个人技术博客，基于 Jekyll 构建，部署在 GitHub Pages。

## 功能特性

- 顶部导航栏 + Banner + 双栏布局（文章列表 + 侧边栏）
- **专题下拉菜单**：按主题分类浏览文章（Muduo / Linux / C++ / Java / Redis / 设计模式）
- **站内搜索**：按标题和标签模糊匹配，快捷键 `S` 聚焦
- 侧边栏：个人信息卡片 + 标签分类统计
- 黑猫主题鼠标指针
- Valine 评论系统
- 百度统计 + 不蒜子访问计数
- 响应式设计，适配移动端

## 目录结构

```
_posts/
  muduo/           # Muduo 源码分析 (6篇)
  linux/           # Linux 系统编程 (5篇)
  cpp/             # C++ 进阶 (2篇)
  java/            # Java (2篇)
  redis/           # Redis (1篇)
  design-pattern/  # 设计模式 (1篇)
_data/
  topics.yml       # 专题导航下拉菜单配置
_layouts/
  default.html     # 基础布局：navbar + banner + 双栏 + footer
  post.html        # 文章详情页
  page.html        # 静态页面
  topic.html       # 专题列表页
_includes/
  navbar.html      # 顶部导航栏（含搜索框、专题下拉）
  sidebar.html     # 右侧边栏（个人卡片 + 标签）
  footer.html      # 页脚
topics/            # 各专题入口页
css/main.css       # 全局样式
js/main.js         # 搜索、移动端菜单等交互逻辑
search.json        # 构建时自动生成的文章索引
```

## 本地开发

### 环境准备

```bash
# macOS 使用 Homebrew 安装 Ruby
brew install ruby
export PATH="/opt/homebrew/opt/ruby/bin:/opt/homebrew/lib/ruby/gems/4.0.0/bin:$PATH"

# 安装依赖
gem install jekyll jekyll-paginate jekyll-sitemap kramdown-parser-gfm redcarpet
```

### 启动开发服务器

```bash
jekyll serve
# 访问 http://localhost:4000/
```

## 新增文章

在对应专题目录下创建 Markdown 文件：

```bash
_posts/muduo/2026-04-26-new-post.md
```

Front matter 模板：

```yaml
---
layout: post
categories: muduo
title: 文章标题
date: 2026-04-26
tags: 标签1 标签2
---
```

`categories` 字段需与 `_data/topics.yml` 中的 `category` 值一致，文章才会出现在对应专题页。

## 新增专题

1. 在 `_data/topics.yml` 中添加一项
2. 在 `topics/` 下创建对应入口页（参考已有文件）
3. 在 `_posts/` 下创建对应子目录

