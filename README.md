# 我的记录 · 个人网站

一个记录生活、照片与感想的个人小站。用 **Next.js + React** 搭建，写文章只需要新建一个 Markdown 文件，`git push` 后自动上线。

- 🌐 线上地址：https://my-personal-website-7x01iazik-cmghjwei.vercel.app
- 📦 代码仓库：https://github.com/cmghj/My-personal-website

---

## 📁 文件结构

```
site/
├─ content/
│  └─ posts/              📝 我的记录（每篇一个 Markdown 文件）
│     ├─ hello.md
│     └─ walk.md
│
├─ public/                🖼️ 静态资源（图片直接放这里）
│  └─ photos/             存放文章配图
│
├─ src/
│  ├─ app/                🧩 网站的所有页面
│  │  ├─ layout.tsx       全站外框：页头导航 + 页脚（每页共用）
│  │  ├─ page.tsx         首页：简介 + 记录列表
│  │  ├─ globals.css      全站样式 + 文章排版
│  │  ├─ about/
│  │  │  └─ page.tsx      「关于」页
│  │  └─ posts/
│  │     └─ [slug]/
│  │        └─ page.tsx   文章详情页（自动套用到每篇记录）
│  │
│  └─ lib/
│     └─ posts.ts         读取 content/posts/ 里的 Markdown 并转成网页
│
├─ next.config.ts         Next.js 配置
├─ package.json           项目依赖清单
└─ （其余为工具配置，一般不用动）
```

> 日常最常碰的只有两个地方：**`content/posts/`（写文章）** 和 **`public/photos/`（放图片）**。

---

## ✍️ 怎么发一篇新记录

1. 在 `content/posts/` 里新建一个 `.md` 文件，文件名会成为网址的一部分（用英文/数字，如 `2026-07-01.md`）。
2. 文件开头照抄下面这段「信息头」，再往下写正文：

```markdown
---
title: 标题写这里
date: "2026-07-01"
excerpt: 一句话摘要，会显示在首页列表
cover: ""
---

正文用 Markdown 写，空一行表示分段。

## 小标题

- 列表项一
- 列表项二

> 这是一段引用。
```

3. 保存即可。本地预览时刷新页面就能看到；推送到 GitHub 后网站会自动更新。

### 在文章里放照片

把图片放进 `public/photos/`，比如 `public/photos/sunset.jpg`，然后在正文里写：

```markdown
![傍晚的天空](/photos/sunset.jpg)
```

（路径从 `/photos/` 开头，不要写 `public`。）

---

## 💻 本地预览（在自己电脑上边改边看）

```bash
# 进入项目目录
cd site

# 首次使用先安装依赖（只需一次）
npm install

# 启动本地预览
npm run dev
```

然后用浏览器打开 **http://localhost:3000**。

- 本地预览只有你自己能看到，改动实时生效。
- 关闭：在终端窗口按 `Ctrl + C`。

---

## 🚀 更新线上网站

本项目托管在 **Vercel**，已和 GitHub 仓库绑定。只要把改动推送到 GitHub，Vercel 会自动重新构建并上线，几十秒后生效：

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
| 样式 | Tailwind CSS v4 |
| 文章 | Markdown 文件（`gray-matter` 解析信息头，`marked` 转 HTML）|
| 托管 | Vercel（免费、自动 HTTPS、推送即部署）|

---

## ❓ 常见疑问

- **为什么线上网站不用我一直开着电脑？**
  部署时 Vercel 已把每个页面预先生成成固定的 HTML 文件，由 Vercel 的服务器 24 小时对外提供。你的电脑只在本地预览时才需要运行。

- **本地页面左下角那个小按钮是什么？**
  是 Next.js 的开发者调试工具，只在 `npm run dev` 时出现，线上网站和访客都看不到，不用管它。
