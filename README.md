# pusidun's 个人 blog

记录技术学习、工程实践与开源项目的个人博客。

## 部署方式

需要 Node.js 22.12.0 或更高版本。

```bash
npm ci
npm run dev      # 本地开发预览
npm run build    # 构建静态文件到 dist/
npm run preview  # 预览构建结果
```

### GitHub Pages

仓库已配置 `.github/workflows/deploy.yml`：推送到 `master` 后自动构建并部署，也可手动触发工作流。仓库的 Pages 发布源需设为 GitHub Actions。

### Render

仓库提供 `render.yaml`，可通过 Blueprint 导入；也可连接仓库创建 Static Site，设置：

- 构建命令：`npm ci && npm run build`
- 发布目录：`dist`

使用其他域名时，同步修改 `astro.config.mjs` 中的 `site`。

## 发表新 post 和项目

### 新文章

在 `src/content/blog/` 新建 Markdown 文件，例如 `2026-09-06-my-post.md`：

```markdown
---
title: "文章标题"
date: 2026-09-06
type: 技术
tags: [Linux, 系统编程]
summary: "文章的简短摘要。"
draft: false
---

## 正文标题

这里开始写正文。
```

- `title`、`date` 必填。
- `type` 可选：技术、生活、读书、随笔，默认为技术。
- `tags` 默认为空数组，`summary` 可省略。
- `draft: true` 表示草稿，不会出现在列表或生成文章页面；发布时改为 `false`。
- 图片放在 `public/assets/images/`，正文使用 `![说明](/assets/images/example.png)` 引用。

文章会按日期倒序展示，访问路径为 `/blog/2026-09-06-my-post/`。

### 新项目

在 `src/data/projects.ts` 的 `projects` 数组中新增一项：

```typescript
{
  name: 'my-project',
  href: 'https://github.com/pusidun/my-project',
  description: '项目解决的问题与主要功能。',
  language: 'TypeScript',
  status: '开发中',
},
```

项目按数组顺序展示在项目页，名称也会同步到关于页。

文章或项目修改完成后，运行 `npm run dev` 预览、`npm run build` 检查，再提交并推送到部署分支；GitHub Pages 对应 `master`，Render 以服务配置的分支为准。
