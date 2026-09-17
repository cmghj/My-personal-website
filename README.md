# 我的记录

一个公开浏览、单人管理的个人生活档案网站。

- 访客直接浏览首页、文章、相册和标签，不需要账号。
- 只有站主进入 `/studio` 登录，写记录、上传媒体和修改网站设置。
- Vercel 运行网页，Supabase 保存账号、文字数据、照片与视频。
- 你上传的照片和视频统一保存在 Supabase Storage；仓库不作为个人媒体库。
- 仓库中的图标与默认分享图是网站界面素材，不是个人记录附件。

## 日常使用

打开 `/studio` 后可以：

- 在「记录」中新建、修改、发布、归档或移入回收站；
- 在编辑页插入图片/视频、设置封面，并查看或恢复历史版本；
- 在「媒体库」上传文件，填写拍摄日期、地点和说明；
- 在「网站设置」修改网站名称、简介和首页开场白。

媒体库上传的文件默认进入公开相册；文章编辑器内上传的文件默认只作为文章素材，不出现在相册列表。两种文件都位于公开的 `public-media` 存储桶，所以“文章素材”不是私人加密文件。

## 本地运行

复制 `.env.example` 为 `.env.local`，填入 Supabase 项目 URL 与 Publishable Key，然后运行：

```bash
npm install
npm run dev
```

浏览器打开 [http://localhost:3000](http://localhost:3000)。

## 部署

GitHub 仓库连接 Vercel 后，在 Vercel 项目中配置同样的两个环境变量：

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

推送到 GitHub 后，Vercel 会自动构建和发布。

## 数据库

- 当前 Supabase 项目已经完成数据库结构升级，不需要再次运行迁移。
- 以后如果创建一个全新的空 Supabase 项目，只运行 `supabase/migrations/202609160001_initial_archive.sql`。
- `202609170001_finalize_archive.sql` 是当前数据库从旧结构升级而来的正式历史记录，只在另一个仍处于旧结构的项目中运行一次。
- 详细字段、数据流和后台查看位置见 `docs/database-structure.md`。

迁移脚本是正式的数据库结构历史，不是临时开发文件。当前项目已经完成迁移，不需要再操作 SQL Editor。

## 项目结构

```text
src/app/                 页面与工作台
src/components/          公共界面组件
src/lib/                 Supabase、记录、媒体与设置读取逻辑
public/og-default.png    默认分享卡片图片
supabase/migrations/     数据库初始结构与现有项目升级脚本
docs/database-structure.md
```

旧演示图片已清理，项目不再保留本地 Markdown 内容副本或个人照片/视频副本；Supabase 是文章与媒体信息的唯一数据源，避免出现“改了文件却没改网页”或两份数据互相冲突。

## 技术栈

- Next.js 16 / React 19 / TypeScript
- Tailwind CSS 4
- Supabase PostgreSQL / Auth / Storage
- Vercel
