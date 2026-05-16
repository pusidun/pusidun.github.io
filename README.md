# pusidun.github.io

> Persona 5 Royal 风格的个人作品集站点 · CV · Blog · Projects · About

基于 [Astro](https://astro.build/) 构建的静态站点，视觉参考 *Persona 5 Royal* 的高反差、动感、漫画式 UI。

## 技术栈

| 项 | 选择 |
| --- | --- |
| SSG | Astro 4.x |
| UI 组件 | Astro `.astro` + Svelte（用于客户端交互岛屿） |
| 样式 | Tailwind CSS 3 + 自定义 P5R 主题 CSS |
| 字体 | Anton / Bebas Neue / Playfair Display Italic / Noto Sans SC |
| 滚动动画 | GSAP + ScrollTrigger |
| 路由切换 | Astro View Transitions |
| Markdown | Astro Content Collections (类型安全 frontmatter) |
| 代码高亮 | Shiki |
| 部署 | Render.com Static Site |

## 站点结构

```
src/
├── pages/
│   ├── index.astro                 # 主页：Start Screen + Arcana + Latest
│   ├── cv.astro                    # 工作时间轴
│   ├── projects.astro              # GitHub Pinned 项目占位
│   ├── about.astro                 # 联系方式 + 开源项目
│   ├── 404.astro
│   └── blog/
│       ├── index.astro             # type/tag 双维度筛选列表
│       └── [...slug].astro         # 单篇文章动态路由
├── content/
│   ├── config.ts                   # Content Collections schema
│   └── blog/*.md                   # 17 篇博客文章
├── layouts/
│   ├── BaseLayout.astro            # <html> + meta + View Transitions
│   └── PostLayout.astro            # 单篇博文壳
├── components/
│   ├── start/
│   │   ├── StartScreen.astro       # 主页 hero
│   │   ├── MenuButton.astro        # 4 个斜切菜单按钮
│   │   ├── BgPattern.astro         # 背景：halftone + 斜条 + 大面具
│   │   ├── CharacterSilhouette.astro  # 手绘 SVG 战士剪影
│   │   ├── Preloader.svelte        # 予告状（Calling Card）加载器
│   │   ├── ArcanaSection.astro     # 4 张塔罗牌区
│   │   ├── ArcanaCard.astro        # 单张塔罗牌（带 SVG 符号）
│   │   └── LatestPosts.astro       # 最新 3 篇文章
│   ├── nav/TopNav.astro            # 内页顶栏（含面具 logo）
│   ├── cv/Timeline.astro           # 工作时间轴
│   ├── blog/
│   │   ├── BlogFilter.svelte       # 客户端筛选器（type + tag）
│   │   └── PostCard.astro
│   └── shared/
│       ├── Mask.astro              # 怪盗团面具 SVG
│       └── VertKana.astro          # 竖排日文装饰
├── data/cv.ts                      # CV 数据（公司 + 年份）
├── scripts/scroll-anim.ts          # GSAP ScrollTrigger 初始化
└── styles/
    ├── global.css                  # 重置 + Tailwind + CSS 变量
    ├── persona.css                 # P5R 工具类（halftone/wedge/burst/...）
    └── markdown.css                # 博文正文排版
public/
├── images/, assets/                # 博文中引用的图片
└── favicon.svg
scripts/migrate-posts.mjs           # 一次性 Jekyll → Astro 迁移脚本
```

## 本地开发

需要 Node.js 18+。

```bash
npm install            # 安装依赖
npm run dev            # 启动 dev server → http://localhost:4321
npm run build          # 构建到 dist/
npm run preview        # 预览构建产物
```

## 新增博文

在 `src/content/blog/` 下新建 `.md` 文件。文件名建议 `YYYY-MM-DD-slug.md`。Frontmatter：

```yaml
---
title: "文章标题"
date: 2026-05-16
type: 技术             # 技术 / 生活 / 读书 / 随笔
tags: [cpp, muduo]     # 自由标签
summary: 可选的简短摘要
draft: false           # 设 true 不会被发布
---
```

Schema 在 [`src/content/config.ts`](src/content/config.ts)。`type` 限定枚举，编译时校验。

## 自定义

| 想改 | 改哪里 |
| --- | --- |
| 工作经历（公司/年份） | [`src/data/cv.ts`](src/data/cv.ts) |
| 主页 4 个菜单按钮 | [`src/components/start/StartScreen.astro`](src/components/start/StartScreen.astro) → `menu` 数组 |
| 塔罗牌的对应模块 | [`src/components/start/ArcanaSection.astro`](src/components/start/ArcanaSection.astro) → `cards` 数组 |
| 关于页内容（联系方式 / 开源项目） | [`src/pages/about.astro`](src/pages/about.astro) |
| 颜色 / 字体 | [`tailwind.config.mjs`](tailwind.config.mjs) + [`src/styles/global.css`](src/styles/global.css) |
| Persona 工具类（斜切 / 阴影 / halftone） | [`src/styles/persona.css`](src/styles/persona.css) |
| 滚动动画时序 | [`src/scripts/scroll-anim.ts`](src/scripts/scroll-anim.ts) |
| Preloader 时序 / 文案 / 震动幅度 | [`src/components/start/Preloader.svelte`](src/components/start/Preloader.svelte) |
| 人物剪影姿势 | [`src/components/start/CharacterSilhouette.astro`](src/components/start/CharacterSilhouette.astro) (SVG bezier paths) |

## 关键特性

### 1. 予告状（Calling Card）Preloader
首屏右下角的小卡片，承担页面加载进度指示。0% → 100% 期间锁定滚动条；到 100% 后晃动 3 次（每次中间缩到 90% 停顿）然后淡出消失。给 GSAP ScrollTrigger 留出充足的加载与初始化时间。

### 2. 塔罗牌「逐张展示」
**桌面端**（≥ 1024px）：Arcana 区被 pin 到视口顶，4 张牌随滚动条进度依次翻入（GSAP scrub 模式）。
**移动端**：不 pin，每张牌单独的 ScrollTrigger，进入视口即触发。

### 3. Blog 双维度筛选
type（技术/生活/读书/随笔）+ tag（自由标签）双维度。Svelte 岛屿做客户端筛选，URL 参数同步（`/blog?type=技术&tag=cpp`）。

### 4. 容错滚动动画
所有元素默认 CSS 可见。GSAP 初始化时检测元素位置：
- 已在视口 / 已滚过 → 直接设为最终态
- 仍在下方 → 隐藏并附加 ScrollTrigger

即便 GSAP 加载失败、preloader 卡死，**内容永远不会消失**。

## 部署

仓库根目录的 [`render.yaml`](render.yaml) 已配置好 Render.com Static Site：

```yaml
buildCommand: npm ci && npm run build
staticPublishPath: ./dist
```

Render Dashboard 连接 GitHub 仓库即可自动构建。每次 push 到 `master` 都会重新部署。

## 历史

本仓库前身是 Jekyll 博客（2018-2026），2026 年 5 月迁移到 Astro 并加入作品集功能。原有 17 篇文章通过 [`scripts/migrate-posts.mjs`](scripts/migrate-posts.mjs) 一次性转换。

## License

MIT
