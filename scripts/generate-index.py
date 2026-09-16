#!/usr/bin/env python3

import os
import json
import html
import re
from datetime import datetime
from pathlib import Path
from email.utils import format_datetime

# =========================
# 基础配置
# =========================

ROOT = Path(__file__).resolve().parent.parent
POSTS_DIR = ROOT / "posts"
INDEX_FILE = POSTS_DIR / "index.json"
RSS_FILE = ROOT / "rss.xml"

SITE_URL = "https://blog.kusteo.com"
SITE_TITLE = "TeoGeek"
SITE_DESCRIPTION = "记录开发与折腾，分享科技背后的思考与创造。"

# =========================
# Front Matter 解析
# =========================

def parse_front_matter(content):
    title = ""
    date = ""
    description = ""
    tags = []

    if content.startswith("---"):
        parts = content.split("---", 2)

        if len(parts) >= 3:
            front_matter = parts[1].strip()

            for line in front_matter.splitlines():
                line = line.strip()

                if line.startswith("title:"):
                    title = line[6:].strip().strip('"').strip("'")

                elif line.startswith("date:"):
                    date = line[5:].strip().strip('"').strip("'")

                elif line.startswith("description:"):
                    description = line[12:].strip().strip('"').strip("'")

                elif line.startswith("tags:"):
                    tag_text = line[5:].strip()

                    # 支持：
                    # tags: ["Geek", "Web"]
                    # tags: ['Geek', 'Web']
                    if tag_text.startswith("[") and tag_text.endswith("]"):
                        tag_text = tag_text[1:-1]

                        tags = [
                            tag.strip().strip('"').strip("'")
                            for tag in tag_text.split(",")
                            if tag.strip()
                        ]

            body = parts[2].strip()
            return title, date, description, tags, body

    return title, date, description, tags, content


# =========================
# Markdown 简单处理
# =========================

def markdown_to_text(markdown):
    text = markdown

    # 删除代码块
    text = re.sub(r"```[\s\S]*?```", "", text)

    # 删除图片
    text = re.sub(r"!\[.*?\]\(.*?\)", "", text)

    # Markdown 链接 → 文字
    text = re.sub(r"\[(.*?)\]\(.*?\)", r"\1", text)

    # 删除标题符号
    text = re.sub(r"^#{1,6}\s*", "", text, flags=re.MULTILINE)

    # 删除粗体、斜体
    text = text.replace("**", "")
    text = text.replace("__", "")
    text = text.replace("*", "")
    text = text.replace("_", "")

    # 删除行内代码
    text = re.sub(r"`([^`]*)`", r"\1", text)

    # 删除 HTML
    text = re.sub(r"<[^>]+>", "", text)

    # 合并空白
    text = re.sub(r"\s+", " ", text)

    return text.strip()


# =========================
# 读取文章
# =========================

def load_posts():
    posts = []

    if not POSTS_DIR.exists():
        print("错误：posts/ 文件夹不存在")
        return posts

    for file in POSTS_DIR.glob("*.md"):

        try:
            content = file.read_text(encoding="utf-8")
        except Exception as e:
            print(f"无法读取 {file}: {e}")
            continue

        title, date, description, tags, body = parse_front_matter(content)

        slug = file.stem

        if not title:
            title = slug

        if not description:
            description = markdown_to_text(body)[:160]

        posts.append({
            "title": title,
            "date": date,
            "tags": tags,
            "description": description,
            "slug": slug,
            "path": f"/posts/{file.name}"
        })

    # 按日期倒序排列
    posts.sort(
        key=lambda x: x.get("date", ""),
        reverse=True
    )

    return posts


# =========================
# 生成 index.json
# =========================

def generate_index(posts):

    INDEX_FILE.write_text(
        json.dumps(
            posts,
            ensure_ascii=False,
            indent=2
        ),
        encoding="utf-8"
    )

    print(f"✓ 已生成 {INDEX_FILE}")
    print(f"✓ 共发现 {len(posts)} 篇文章")


# =========================
# RSS 日期处理
# =========================

def rss_date(date_string):

    try:
        dt = datetime.strptime(date_string, "%Y-%m-%d")

        # 使用 UTC
        dt = dt.replace(hour=0, minute=0, second=0)

        return format_datetime(dt, usegmt=True)

    except Exception:
        return format_datetime(
            datetime.now(),
            usegmt=True
        )


# =========================
# 生成 RSS
# =========================

def generate_rss(posts):

    items = []

    for post in posts:

        title = html.escape(post["title"])
        description = html.escape(
            post.get("description", "")
        )

        slug = post["slug"]

        link = f"{SITE_URL}/post?slug={slug}"

        pub_date = rss_date(
            post.get("date", "")
        )

        tags = post.get("tags", [])

        categories = ""

        for tag in tags:
            categories += (
                f"<category>{html.escape(tag)}</category>\n"
            )

        item = f"""
    <item>
      <title>{title}</title>
      <link>{html.escape(link)}</link>
      <guid isPermaLink="true">{html.escape(link)}</guid>
      <description>{description}</description>
      <pubDate>{pub_date}</pubDate>
      {categories}
    </item>
"""

        items.append(item)

    rss_content = f"""<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">

  <channel>

    <title>{html.escape(SITE_TITLE)}</title>

    <link>{SITE_URL}</link>

    <description>{html.escape(SITE_DESCRIPTION)}</description>

    <language>zh-CN</language>

    <generator>TeoGeek</generator>

    <lastBuildDate>{rss_date(
        posts[0]["date"] if posts else ""
    )}</lastBuildDate>

    {''.join(items)}

  </channel>

</rss>
"""

    RSS_FILE.write_text(
        rss_content.strip() + "\n",
        encoding="utf-8"
    )

    print(f"✓ 已生成 {RSS_FILE}")


# =========================
# 主程序
# =========================

def main():

    print("================================")
    print("        TeoGeek Generator")
    print("================================")

    posts = load_posts()

    generate_index(posts)

    generate_rss(posts)

    print("================================")
    print("✓ index.json 生成完成")
    print("✓ rss.xml 生成完成")
    print("✓ 全部处理完成")
    print("================================")


if __name__ == "__main__":
    main()
