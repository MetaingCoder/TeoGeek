# TeoGeek

黑白极简纯静态 Markdown 博客。

## 写文章

在 `posts/` 新建：

```markdown
---
title: 我的新文章
date: 2026-09-16
tags: ["AI", "Geek"]
description: 一句话描述
---

# 我的新文章

正文……
```

然后 `git add . && git commit -m "new post" && git push`。

GitHub Actions 会自动扫描 Markdown、生成 `posts/index.json`、生成 RSS，并部署到 Cloudflare Pages。

前端运行时不会访问 GitHub API。

## Cloudflare / GitHub Secrets

在 GitHub Repository → Settings → Secrets and variables → Actions 添加：

- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`

并把 `scripts/generate-index.py` 里的 `https://example.com` 改成你的真实域名。

Cloudflare Pages 项目名默认是 `teogeek`。

## 本地预览

不要直接双击 HTML。运行：

```bash
python3 -m http.server 8000
```

然后打开 `http://localhost:8000`。

## 设计

黑白、无彩色 Badge、`#Tag` 右侧信息栏、细分割线、大留白、移动端适配、无前端框架、无数据库、无 GitHub API。
