# TGeek

> 记录开发与折腾，分享科技背后的思考与创造。

TGeek 是一个简洁、轻量的纯静态个人博客，专注于记录开发、科技、AI、开源项目以及各种折腾过程。

网站采用 **HTML + CSS + JavaScript + Markdown** 构建，不依赖数据库和传统后端。

## 特点

- 纯静态，无数据库、无服务器
- 使用 Markdown 编写文章
- GitHub 管理代码与文章
- GitHub Actions 自动生成文章索引
- Cloudflare Pages 自动部署
- 支持标签、搜索、归档和 RSS
- 支持移动端访问
- 简洁的黑白 UI 设计

## 工作流程

```text
Markdown
   ↓
GitHub
   ↓
GitHub Actions
   ↓
生成文章索引
   ↓
Cloudflare Pages
   ↓
TGeek
```

写完文章后，只需要将 `.md` 文件放入：

```text
posts/
```

例如：

```text
posts/2026-09-17-my-first-post.md
```

提交到 GitHub 后，GitHub Actions 会自动处理并部署，无需手动修改文章索引。

## 文章格式

```markdown
---
title: 我的第一篇文章
date: 2026-09-17
tags: ["Geek", "Web"]
description: 这是一篇文章简介
---

# 我的第一篇文章

这里开始写正文。

## 标题

文章内容……
```

## 项目结构

```text
TGeek/
├── index.html
├── post.html
├── assets/
├── posts/
├── scripts/
├── .github/
└── README.md
```

## 部署

将项目上传至 GitHub 后，配置 Cloudflare Pages，并在 GitHub Repository Secrets 中添加：

```text
CLOUDFLARE_API_TOKEN
CLOUDFLARE_ACCOUNT_ID
```

之后每次提交代码或文章，GitHub Actions 都会自动部署。

## 本地运行

安装 Python 后，在项目目录执行：

```bash
python3 -m http.server 8000
```

然后访问：

```text
http://localhost:8000
```

## License

MIT License

