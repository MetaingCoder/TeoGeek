---
title: GitHub Actions：让博客自动更新
date: 2026-09-14
tags: ["GitHub", "Actions", "Dev"]
description: 用一个简单的工作流自动生成文章索引并部署网站。
---

# GitHub Actions：让博客自动更新

GitHub Actions 在这个项目中的职责很明确：扫描文章、生成索引，然后部署。

```text
新增 Markdown
↓
git push
↓
Action
↓
index.json
↓
Cloudflare Pages
```
