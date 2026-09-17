# 网站数据与存储结构

## 一眼看懂

网站长期数据全部放在一个 Supabase 项目中，但按用途分成三部分：

```text
Supabase
├─ Authentication：唯一站主的邮箱、密码哈希和登录会话
├─ PostgreSQL：文章、标签、媒体说明、网站设置、历史版本
└─ Storage / public-media：照片与视频文件本体
```

Vercel 运行网页代码；GitHub 保存项目代码；它们都不是日常内容数据库。

## 最终保留的 7 张表

### `site_owners`

认定哪个 Authentication 用户是站主。

| 字段 | 含义 |
|---|---|
| `user_id` | 对应 `auth.users.id`，也是主键 |
| `created_at` | 授权时间 |

邮箱和密码不在这张表里，它们只由 Supabase Authentication 管理。

### `site_settings`

全站只有一行设置，工作台「网站设置」页面会直接修改它。

| 字段 | 含义 |
|---|---|
| `id` | 固定为 `true`，保证整张表只有一行 |
| `site_title` | 导航、页脚、浏览器标题中的网站名称 |
| `site_description` | 页脚、搜索与分享说明 |
| `home_intro` | 首页大标题下的开场白 |
| `updated_by` | 最近修改设置的站主 |
| `updated_at` | 最近修改时间 |

### `entries`

每一行是一篇生活记录。

| 字段 | 含义 |
|---|---|
| `id` | 内部 UUID |
| `slug` | `/posts/hello` 中的 `hello` |
| `kind` | 文章、随手记、照片故事、视频记录或年度回顾 |
| `title` / `excerpt` / `content_markdown` | 标题、摘要、Markdown 正文 |
| `occurred_at` | 事情发生日期 |
| `status` | `draft` 草稿、`published` 发布、`archived` 归档 |
| `visibility` | `public` 出现在列表、`unlisted` 仅链接可见 |
| `cover_url` | 封面图片网址 |
| `location` / `mood` | 地点与心情 |
| `is_pinned` | 是否首页置顶 |
| `owner_id` | 创建者 |
| `published_at` | 首次发布时间 |
| `created_at` / `updated_at` | 创建与修改时间 |
| `deleted_at` | 回收站时间；为空表示未删除 |

### `tags`

标签字典。字段只有 `id`、唯一的 `name` 和 `created_at`。旧的 `slug` 没有被网址使用，已移除。

### `entry_tags`

文章和标签的连接表，只有 `entry_id` 与 `tag_id`。它让一篇文章拥有多个标签，也让同一标签属于多篇文章。

### `media`

媒体档案卡，不保存文件二进制。

| 字段 | 含义 |
|---|---|
| `id` | 媒体 UUID |
| `kind` | `image` 或 `video` |
| `storage_path` | 文件在 `public-media` 中的内部路径 |
| `public_url` | 网页使用的公开网址 |
| `original_name` | 上传前文件名 |
| `mime_type` | 文件格式，例如 `image/png` |
| `size_bytes` | 文件大小 |
| `caption` | 照片/视频说明 |
| `captured_at` | 拍摄日期 |
| `location` | 拍摄地点 |
| `purpose` | `gallery` 公开相册，`article` 文章素材 |
| `owner_id` | 上传者 |
| `created_at` / `updated_at` | 上传与修改时间 |

旧结构中的 `bucket`、`width`、`height`、`duration_seconds`、`alt_text`、`deleted_at` 没有被当前产品使用，已经移除。只有一个存储桶，所以 `bucket` 也不必在每一行重复保存。

### `entry_revisions`

文章每次保存修改前，数据库触发器会自动把旧内容存成一个版本。

| 字段 | 含义 |
|---|---|
| `id` | 版本编号 |
| `entry_id` | 属于哪篇文章 |
| `snapshot` | 当时完整的可编辑内容、状态和标签快照 |
| `snapshot_at` | 快照时间 |
| `snapshot_by` | 修改人 |

编辑页的「历史版本」可以查看并恢复。恢复前，当前内容也会自动成为新版本，因此可以撤回一次恢复。

## 文件上传后去了哪里

```text
选择照片
├─ 文件本体 → Storage / public-media / 用户ID/随机ID-文件名
├─ 文件说明 → public.media 新增一行
├─ 设为封面 → entries.cover_url 保存公开网址
└─ 插入正文 → entries.content_markdown 保存 Markdown 图片网址
```

`purpose = article` 只表示“不在公开相册列出”，不是访问加密。因为网站本身是公开网站，文章内使用的图片必须能被访客打开，所以统一放在公开 bucket。

## 已移除的预留项

- `albums` 与 `album_media`：没有数据也没有产品界面；现有相册已经有时间、类型和地点筛选。
- `private-media`：上传流程从未使用；本项目也不提供“访客登录后看私人文件”的能力。
- 本地 `content/posts`：曾作为 Markdown 后备数据源，现在已移除，Supabase 是唯一来源。
- 未使用的媒体尺寸、时长、替代文字和软删除字段：避免表中长期堆放永远为空的数据。

早期演示图片已清理，不再作为个人内容存放在网站仓库中。你上传的个人照片和视频统一保存在 Supabase Storage；仓库只放网站图标与默认分享图等界面素材。

## 权限规则（RLS）

- 未登录访客只能读取已发布、未删除的文章和 `purpose = gallery` 的媒体档案。
- `unlisted` 文章不出现在列表，但知道网址的人可以打开。
- 只有登录且存在于 `site_owners` 的用户能新增、修改或删除内容。
- 历史版本只能由站主读取。
- 即使有人绕过网页直接请求 Supabase，也仍要经过这些规则。

## 在 Supabase 后台查看

- 表与字段：`Table Editor → public`
- 站主登录账号：`Authentication → Users`
- 照片/视频文件：`Storage → public-media`
- 权限规则：表的 `RLS policies`
- 结构升级：`SQL Editor`

最终 `public` schema 应只看到这 7 张业务表：

```text
site_owners
site_settings
entries
tags
entry_tags
media
entry_revisions
```
