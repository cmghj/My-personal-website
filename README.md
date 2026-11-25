# 我的记录

一个用 Next.js、React、TypeScript 和 Tailwind CSS 写的个人网站。访客可以读文章、翻相册、按标签找记录。站主在工作台写作、预览、发布和管理媒体。[正式网站](https://liaopan.vercel.app/) · [站主工作台](https://liaopan.vercel.app/studio)

## 换电脑继续开发

**1. 拉取代码并安装依赖。** 安装 Git 和 Node.js 24.x（本地开发版本见 `.nvmrc`），然后在终端运行下面三条命令。

```sh
git clone https://github.com/cmghj/My-personal-website.git
cd My-personal-website
npm ci
```

`npm ci` 按仓库里的 `package-lock.json` 安装依赖。[npm ci 文档](https://docs.npmjs.com/cli/v11/commands/npm-ci/)

**2. 连接现有 Supabase 项目。** 在仓库根目录把 `.env.example` 复制为 `.env.local`。在 Windows PowerShell 中运行下面的命令。

```powershell
Copy-Item .env.example .env.local
```

macOS 或 Linux 可以运行 `cp .env.example .env.local`。打开你网站所用 Supabase 项目的 **Connect**，选择 Next.js，将下面两个值填入 `.env.local`。[Supabase 项目地址与 API 密钥](https://supabase.com/docs/guides/getting-started/api-keys)

| 变量 | 填什么 |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Project URL，形如 `https://项目编号.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Publishable key，形如 `sb_publishable_…` |

文章、照片和站主账号都在 Supabase。连接同一个项目，本地工作台和正式网站读写同一份内容，可以继续使用原来的站主账号。换电脑只需配置连接，数据库已经就绪。

**3. 启动网站。**

```sh
npm run dev
```

浏览器打开 [本地首页](http://localhost:3000) 或 [本地工作台](http://localhost:3000/studio)。

## 日常维护与发布

- **同步代码**　已有本地仓库时，在 `main` 上运行 `git pull --ff-only`。拉取到新的锁文件后再运行 `npm ci`。
- **升级依赖**　用 npm 安装目标版本，将 `package.json` 和 `package-lock.json` 的改动一起提交。
- **提交前检查**　运行 `npm run lint` 和 `npm run build`。构建通过后，可用 `npm start` 在本地查看生产版本。
- **发布**　把验证过的提交推送到 GitHub 的 `main`。已连接的 Vercel 项目 `my-personal-website` 会部署正式网站。部署使用 Vercel 上的环境变量，Git 只跟踪配置模板 `.env.example`。

## 从哪里改

| 目录 | 用途 |
| --- | --- |
| `src/app/` | 首页、文章、相册、标签、关于页，以及布局和样式 |
| `src/app/studio/` | 站主后台。文章编辑和预览在 `entries/`，保存、发布等服务端操作在 `actions.ts` |
| `src/components/` | 导航、相册查看器、文章正文等公用界面 |
| `src/lib/` | Supabase 客户端、数据读写辅助函数、Markdown 排版和媒体上传 |
| `src/proxy.ts` | 工作台请求的登录会话检查 |
| `public/` | 默认分享图。站点图标按 Next.js 约定位于 `src/app/` |
| `supabase/` | 数据库结构、访问规则与 SQL 脚本 |

需要查某个字段、初始化空数据库或升级表结构时，见 [Supabase 维护说明](supabase/README.md)。
