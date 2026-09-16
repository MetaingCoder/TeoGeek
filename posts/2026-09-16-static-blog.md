---
title: 如何搭建一个属于自己的静态博客
date: 2026-09-16
tags: ["Web", "Static", "Cloudflare"]
description: 从 Markdown 到 Cloudflare Pages，搭建一个轻量的纯静态博客。
---

# 如何搭建一个属于自己的静态博客

这是 TeoGeek 的示例文章。

## 技术架构

文章使用 Markdown 保存，网站前端负责读取并渲染。

```text
Markdown → GitHub → GitHub Actions → Cloudflare Pages → 浏览器
```

## 为什么这样做

博客没有数据库，也没有运行时后端，部署完成后本质上就是一组静态文件。

> 简单的东西，更容易长期维护。
