# Supabase 维护说明

站主账号在 **Authentication → Users**，文章和文件信息在 **Table Editor → public**，照片与视频原件在 **Storage → public-media**。本地运行和部署步骤见 [项目 README](../README.md)。

## 七张业务表

| 表 | 保存的内容 | 对应页面或关系 |
| --- | --- | --- |
| `entries` | 一条记录的标题、正文、摘要、封面和发布状态 | 工作台「记录」，公开页 `/posts/[slug]` |
| `entry_revisions` | 修改指定记录字段前的内容快照 | 编辑页「历史版本」，通过 `entry_id` 关联记录 |
| `tags` | 标签的 `id`、唯一的 `name` 和创建时间 | 标签索引与文章页 |
| `entry_tags` | `entry_id` 与 `tag_id` 的对应关系，两列组成主键 | 一篇文章可有多个标签，一个标签可用于多篇文章 |
| `media` | 文件网址、存储路径、用途及拍摄信息 | 媒体库、公开相册、编辑器选图 |
| `site_settings` | 网站名称 `site_title`、简介 `site_description`、首页开场白 `home_intro` | 工作台「网站设置」。唯一一行的 `id` 为 `true`，`updated_by` 和 `updated_at` 记录修改人和时间 |
| `site_owners` | 站主的 Auth 用户 `user_id` 与授权时间 `created_at` | 工作台检查当前账号的管理权限 |

### 文章与历史版本

- `entries.id` 是文章的内部 UUID，`slug` 是文章网址中可编辑的名称。
- `kind` 是记录类型。编辑器将标题、摘要、Markdown 正文和封面网址分别写入 `title`、`excerpt`、`content_markdown` 和 `cover_url`。地点与心情对应 `location` 和 `mood`。
- `occurred_at` 是事情发生的日期，`published_at` 是发布时间，`created_at` 和 `updated_at` 是数据库时间。公开列表优先显示 `is_pinned` 的记录，再按 `occurred_at` 排序。
- `status` 有草稿 `draft`、已发布 `published` 和归档 `archived`。已发布记录的 `visibility` 决定它出现在公开列表（`public`），还是通过文章链接访问（`unlisted`）。
- `owner_id` 关联创建者。移入回收站会写入 `deleted_at`，恢复会清空它。
- 标题、正文、发布状态等文章字段变化时，数据库触发器会把修改前的字段和当时的标签写入 `entry_revisions.snapshot`。版本还有 `id`、`entry_id`、`snapshot_at` 和 `snapshot_by`。编辑页可以选一个版本恢复。

### 媒体文件

上传会在 `public-media` 桶中保存文件，在 `media` 表中登记一行。表内的 `storage_path` 指向桶中的对象，`public_url` 是网页使用的网址。

| 字段 | 含义 |
| --- | --- |
| `id`、`owner_id` | 文件 UUID 和上传者 |
| `kind`、`mime_type`、`size_bytes`、`original_name` | 图片或视频、文件格式、字节数和原始文件名 |
| `caption`、`captured_at`、`location` | 说明、拍摄日期和地点 |
| `purpose` | `gallery` 列在公开相册，`article` 供文章使用 |
| `created_at`、`updated_at` | 上传与修改时间 |

媒体库上传默认进入公开相册，编辑器上传默认作为文章素材。选为封面会将网址写入 `entries.cover_url`，插入正文会将网址写入 Markdown。两种用途的文件都使用公开存储网址。

### 访问规则

表启用了行级安全策略（RLS）。访客可读已发布且未进回收站的文章，以及公开相册的媒体信息。站主登录后，工作台用 `is_site_owner()` 校验 `site_owners` 里的授权，允许管理内容和查看历史版本。

## 数据库初始化与升级

**接着维护现有网站**时，把本地环境变量指向现有 Supabase 项目即可。以后调整表、策略或触发器，把增量 SQL 作为新文件提交到 `migrations/`，并在目标项目的 SQL Editor 中执行尚未应用的改动。推送网页代码和执行数据库升级是两个独立操作。

**创建全新的空 Supabase 项目**时，在 SQL Editor 执行一次 [初始化脚本](migrations/202609160001_initial_archive.sql)。它创建上述表、触发器、访问规则、存储桶和一行默认网站设置。然后在 **Authentication → Users** 创建站主账号，将该用户的 UUID 填入 **Table Editor → site_owners → user_id**。网站首次登录使用这个账号。

[一次性结构升级脚本](migrations/202609170001_finalize_archive.sql) 仅适用于仍以 `site_settings.key/value` 存储设置的数据库。脚本开头列出了存储桶的前置条件。初始化脚本已经提供升级后的结构，空项目只运行初始化脚本。
