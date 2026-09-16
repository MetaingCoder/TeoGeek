---
title: Cloudflare Pages 部署完全指南
date: 2026-09-15
tags: ["Cloudflare", "Deploy"]
description: 使用 GitHub Actions 将静态博客部署到 Cloudflare Pages。
---

# Cloudflare Pages 部署完全指南

首页只读取 `posts/index.json`，用户打开具体文章以后，再读取对应 Markdown 文件。

这样即使文章数量不断增长，也不会在首页一次性加载全部正文。
