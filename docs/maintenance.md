# 站点维护

## 履历与联系方式

`/cv` 的工作经历、`/about` 的联系方式和公众号二维码都不在页面源码里，而是以 XOR 混淆后的 base64 存放在 `src/data/private-profile.ts`，由浏览器在加载时解码。

**这只是防明文抓取的混淆，不是加密、也不是访问控制。** 任何人打开开发者工具都能还原，所以不要往里面放任何真正的密钥。

修改内容不要手写这个文件，用编码脚本：

```bash
node scripts/encode-private-profile.mjs --contacts private/contacts.json
```

三个 `--contacts` / `--career` / `--qr` 参数都可以单独使用，没传的部分会沿用当前内容；每次运行都会换一个新的随机 key。数据格式：

- `contacts`：`[{ "label": "邮箱", "value": "...", "href": "mailto:..." }]`
- `career`：`[{ "start": "2020", "end": "2023", "company": "...", "companyZh": "...", "current": true }]`（字段定义见 `src/data/cv.ts`）
- `qr`：一个 JPEG 图片文件

仓库根目录的 `private/` 已加入 `.gitignore`，用于存放明文输入文件；不要使用强制添加命令将其提交。

## 界面文案与翻译

站点以中文撰写、默认显示英文，所有界面文案都要在 `src/i18n/translations.ts` 里有对应的英文。固定界面文案缺少英文翻译时，`npm run build` 会失败并指出对应文案。

文章标题、摘要和自由标签属于内容，不受固定界面文案的缺译检查约束。标签有现成译文时使用译文，没有时显示原文。

## 设计规范

`design.md` 是这个站点的设计规范，`src/styles/global.css` 顶部的 CSS 变量与它一一对应。改样式前先看一眼——尤其是配色、字号阶梯和「不要做什么」那一节。

