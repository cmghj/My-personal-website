# 我的记录 · 个人网站

一个记录生活、照片与影像的个人小站。用 **Next.js + React** 搭建，写文章只需要新建一个 Markdown 文件，`git push` 后自动上线。

- 🌐 线上地址：https://my-personal-website-7x01iazik-cmghjwei.vercel.app
- 📦 代码仓库：https://github.com/cmghj/My-personal-website

核心就三件事：**写内容、放照片、放视频**。

---

## 📁 文件结构

```
site/
├─ content/
│  └─ posts/              📝 我的记录（每篇一个 Markdown 文件）
│     ├─ hello.md
│     └─ walk.md
│
├─ public/                🖼️ 静态资源
│  └─ photos/             照片和视频都放这里（相册页会自动展示）
│
├─ src/
│  ├─ app/                🧩 网站的所有页面
│  │  ├─ layout.tsx       全站外框：页头导航 + 页脚
│  │  ├─ page.tsx         首页：简介 + 记录列表
│  │  ├─ globals.css      配色 + 字体 + 文章排版
│  │  ├─ about/page.tsx   「关于」页
│  │  ├─ gallery/page.tsx 「相册」页
│  │  ├─ tags/            「标签」页（总览 + 每个标签）
│  │  └─ posts/[slug]/    文章详情页（自动套用到每篇记录）
│  │
│  ├─ components/         🔧 可复用的界面组件（导航、列表、相册）
│  └─ lib/
│     ├─ posts.ts         读取文章 + 标签
│     └─ media.ts         读取相册里的照片/视频
│
├─ next.config.ts         Next.js 配置
├─ package.json           项目依赖清单
└─ （其余为工具配置，一般不用动）
```

> 日常最常碰的只有两个地方：**`content/posts/`（写文章）** 和 **`public/photos/`（放照片、视频）**。

---

## ✍️ 怎么发一篇新记录

1. 在 `content/posts/` 里新建一个 `.md` 文件，文件名用英文/数字（如 `2026-07-01.md`），它会成为网址的一部分。
2. 文件开头照抄下面这段「信息头」，再往下写正文：

```markdown
---
title: 标题写这里
date: "2026-07-01"
excerpt: 一句话摘要，会显示在首页列表
cover: ""
tags: [生活, 随笔]
---

正文用 Markdown 写，空一行表示分段。

## 小标题

- 列表项一
- 列表项二

> 这是一段引用。
```

3. 保存即可。本地预览刷新就能看到；推送到 GitHub 后网站会自动更新。

---

## 📷 放照片、🎬 放视频（写法完全一样）

1. 把照片或视频放进 `public/photos/`，例如：
   - 照片 `public/photos/sunset.jpg`
   - 视频 `public/photos/walk.mp4`（推荐 mp4 格式，兼容性最好）
2. 在文章正文里，用同一种写法插入（路径从 `/photos/` 开头，**不要写 public**）：

```markdown
![傍晚的天空](/photos/sunset.jpg)

![散步的片段](/photos/walk.mp4)
```

- 结尾是 `.jpg/.png` 等 → 显示为**图片**
- 结尾是 `.mp4/.webm` 等 → 自动变成**可播放的视频**

> 另外：**凡是放进 `public/photos/` 的照片和视频，都会自动出现在「相册」页**，按网格展示，点照片可放大查看。

---

## 🏷️ 标签

在文章信息头里写 `tags: [生活, 随笔]` 即可。之后：

- 每篇文章下方会显示它的标签
- 「标签」页汇总所有标签，点一下能看该标签下的全部记录

---

## 💻 本地预览（在自己电脑上边改边看）

```bash
# 进入项目目录（如果你已经在 site 文件夹里就跳过这步）
cd site

# 首次使用先安装依赖（只需一次）
npm install

# 启动本地预览
npm run dev
```

然后用浏览器打开 [http://localhost:3000](http://localhost:3000)。

- 本地预览只有你自己能看到，改动实时生效。
- 关闭：在终端窗口按 `Ctrl + C`。

---

## 🚀 更新线上网站

本项目托管在 **Vercel**，已和 GitHub 仓库绑定。只要把改动推送到 GitHub，Vercel 会自动重新构建并上线：

```bash
git add -A
git commit -m "新增一篇记录"
git push
```

推送后不用做任何额外操作，线上网站会自动更新。

---

## 🛠️ 技术栈

| 用途 | 采用 |
|------|------|
| 框架 | Next.js 16（App Router）+ React 19 |
| 样式 | Tailwind CSS v4（暖色文艺配色）|
| 文章 | Markdown（`gray-matter` 解析信息头，`marked` 转 HTML，图片/视频通用写法）|
| 托管 | Vercel（免费、自动 HTTPS、推送即部署）|

---

## ❓ 常见疑问

- **为什么线上网站不用我一直开着电脑？**
  部署时 Vercel 已把每个页面预先生成成固定的 HTML 文件，由 Vercel 的服务器 24 小时对外提供。你的电脑只在本地预览时才需要运行。

- **本地页面左下角那个小按钮是什么？**
  是 Next.js 的开发者调试工具，只在 `npm run dev` 时出现，线上网站和访客都看不到，不用管它。

- **`public/photos/` 里的 sample-*.svg 是什么？**
  是我放的几张示例「照片」，用来演示相册效果。你可以随时删掉，换成自己的照片。
