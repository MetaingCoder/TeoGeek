async function post(){
    const slug = new URLSearchParams(location.search).get("slug");

    if (!slug) return;

    try {
        // 先读取文章索引
        const indexResponse = await fetch("/posts/index.json");

        if (!indexResponse.ok) {
            throw new Error("无法加载文章索引");
        }

        const posts = await indexResponse.json();

        // 根据 slug 找到文章
        const article = posts.find(p => p.slug === slug);

        if (!article) {
            throw new Error("文章不存在");
        }

        // 使用 index.json 中记录的真实路径
        const articleResponse = await fetch(article.path);

        if (!articleResponse.ok) {
            throw new Error("无法加载文章内容");
        }

        let raw = await articleResponse.text();

        // 读取 Markdown Front Matter
        const match = raw.match(/^---\s*\n([\s\S]*?)\n---\s*\n?/);

        let meta = {};

        if (match) {
            match[1].split("\n").forEach(line => {
                const index = line.indexOf(":");

                if (index > -1) {
                    const key = line.slice(0, index).trim();
                    const value = line.slice(index + 1).trim();

                    meta[key] = value;
                }
            });

            raw = raw.slice(match[0].length);
        }

        const title = meta.title || article.title || slug;
        const date = meta.date || article.date || "";
        const tags = article.tags || [];

        document.title = title + " · TeoGeek";

        $("#postContent").innerHTML = `
            <h1 class="post-title">${esc(title)}</h1>

            <div class="post-meta">
                <span>${esc(date)}</span>
                <span>${tags.map(tag => "#" + esc(tag)).join(" ")}</span>
            </div>

            <div class="markdown">
                ${md(raw)}
            </div>
        `;

    } catch (error) {
        console.error("文章加载失败:", error);

        $("#postContent").innerHTML = `
            <div class="error">
                文章加载失败，请稍后再试。
            </div>
        `;
    }
}
