(() => {
    const DATA = "/posts/index.json";
    const SIZE = 12;

    const $ = (s) => document.querySelector(s);

    let posts = [];
    let filtered = [];
    let page = 1;

    const esc = (s) =>
        String(s ?? "").replace(/[&<>"']/g, (c) => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        }[c]));

    function inline(s) {
        let x = esc(s);

        x = x.replace(
            /\[([^\]]+)\]\(([^)\s]+)\)/g,
            (_, a, u) =>
                `<a href="${esc(u)}" target="_blank" rel="noopener">${a}</a>`
        );

        x = x
            .replace(/`([^`]+)`/g, "<code>$1</code>")
            .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
            .replace(/\*([^*]+)\*/g, "<em>$1</em>");

        return x;
    }

    function md(raw) {
        const lines = raw.replace(/\r\n/g, "\n").split("\n");

        const output = [];

        let code = false;
        let buffer = [];
        let list = null;

        const closeList = () => {
            if (list) {
                output.push("</" + list + ">");
                list = null;
            }
        };

        for (const line of lines) {

            if (line.startsWith("```")) {

                if (!code) {
                    closeList();
                    code = true;
                    buffer = [];
                } else {
                    output.push(
                        "<pre><code>" +
                        esc(buffer.join("\n")) +
                        "</code></pre>"
                    );

                    code = false;
                }

                continue;
            }

            if (code) {
                buffer.push(line);
                continue;
            }

            if (!line.trim()) {
                closeList();
                continue;
            }

            let match;

            // 标题
            if (match = line.match(/^(#{1,3})\s+(.+)$/)) {
                closeList();

                const level = match[1].length;

                output.push(
                    `<h${level}>${inline(match[2])}</h${level}>`
                );

                continue;
            }

            // 分割线
            if (/^---+$/.test(line.trim())) {
                closeList();
                output.push("<hr>");
                continue;
            }

            // 引用
            if (match = line.match(/^>\s?(.*)$/)) {
                closeList();

                output.push(
                    "<blockquote>" +
                    inline(match[1]) +
                    "</blockquote>"
                );

                continue;
            }

            // 列表
            if (
                (match = line.match(/^\s*[-*+]\s+(.+)$/)) ||
                (match = line.match(/^\s*\d+\.\s+(.+)$/))
            ) {
                const type = /^\s*\d+\./.test(line)
                    ? "ol"
                    : "ul";

                if (list !== type) {
                    closeList();

                    output.push("<" + type + ">");

                    list = type;
                }

                output.push(
                    "<li>" +
                    inline(match[1]) +
                    "</li>"
                );

                continue;
            }

            closeList();

            output.push(
                "<p>" +
                inline(line) +
                "</p>"
            );
        }

        closeList();

        if (code) {
            output.push(
                "<pre><code>" +
                esc(buffer.join("\n")) +
                "</code></pre>"
            );
        }

        return output.join("\n");
    }

    // =========================
    // 首页
    // =========================

    function render() {

        const element = $("#articleList");

        if (!element) return;

        if (!filtered.length) {

            element.innerHTML =
                '<div class="error">没有找到相关文章。</div>';

            $("#pagination").innerHTML = "";

            return;
        }

        const start = (page - 1) * SIZE;
        const end = page * SIZE;

        const slice = filtered.slice(start, end);

        element.innerHTML = slice.map((post) => {

            return `
                <a
                    class="article"
                    href="/post.html?slug=${encodeURIComponent(post.slug)}"
                >
                    <span class="article-icon">▣</span>

                    <span class="article-title">
                        ${esc(post.title)}
                    </span>

                    <span class="article-info">

                        <span class="article-tags">
                            ${(post.tags || [])
                                .map(tag => "#" + esc(tag))
                                .join(" ")
                            }
                        </span>

                        <span class="article-date">
                            ${esc(post.date)}
                        </span>

                    </span>
                </a>
            `;

        }).join("");

        // 分页

        const totalPages = Math.ceil(
            filtered.length / SIZE
        );

        const pages = [];

        for (let i = 1; i <= totalPages; i++) {

            if (
                i === 1 ||
                i === totalPages ||
                Math.abs(i - page) <= 1
            ) {
                pages.push(`
                    <button
                        class="${i === page ? "current" : ""}"
                        data-p="${i}"
                    >
                        ${i}
                    </button>
                `);
            } else if (
                pages[pages.length - 1] !== "…"
            ) {
                pages.push("…");
            }
        }

        $("#pagination").innerHTML = pages.join("");

        $("#pagination")
            .querySelectorAll("button")
            .forEach((button) => {

                button.onclick = () => {

                    page = Number(
                        button.dataset.p
                    );

                    render();

                    scrollTo({
                        top: 0,
                        behavior: "smooth"
                    });
                };

            });
    }

    // =========================
    // 归档
    // =========================

    function archive() {

        const element = $("#archiveList");

        if (!element) return;

        const groups = {};

        posts.forEach((post) => {

            const year =
                (post.date || "0000").slice(0, 4);

            if (!groups[year]) {
                groups[year] = [];
            }

            groups[year].push(post);
        });

        element.innerHTML =
            Object.keys(groups)
                .sort()
                .reverse()
                .map((year) => {

                    return `
                        <div class="archive-year">
                            ${year}
                        </div>

                        ${groups[year]
                            .map((post) => `
                                <a
                                    class="archive-item"
                                    href="/post.html?slug=${encodeURIComponent(post.slug)}"
                                >
                                    <span>
                                        ${esc(post.title)}
                                    </span>

                                    <span class="archive-date">
                                        ${esc(post.date)}
                                    </span>
                                </a>
                            `)
                            .join("")
                        }
                    `;

                })
                .join("");
    }

    // =========================
    // 加载首页文章
    // =========================

    async function home() {

        try {

            const response =
                await fetch(DATA);

            if (!response.ok) {
                throw new Error(
                    "无法加载文章索引"
                );
            }

            posts = await response.json();

            posts.sort((a, b) =>
                (b.date || "")
                    .localeCompare(a.date || "")
            );

            filtered = posts;

            const count = $("#postCount");

            if (count) {
                count.textContent =
                    posts.length + " 篇";
            }

            render();

            archive();

        } catch (error) {

            console.error(
                "文章索引加载失败:",
                error
            );

            $("#articleList").innerHTML =
                `<div class="error">
                    文章索引加载失败。
                </div>`;
        }
    }

    // =========================
    // 加载文章
    // =========================

    async function post() {

        const slug =
            new URLSearchParams(
                location.search
            ).get("slug");

        if (!slug) return;

        try {

            /*
             * 先读取 index.json，
             * 找到对应文章的真实 path。
             */

            const indexResponse =
                await fetch(DATA);

            if (!indexResponse.ok) {
                throw new Error(
                    "无法加载文章索引"
                );
            }

            const posts =
                await indexResponse.json();

            const article =
                posts.find(
                    (item) => item.slug === slug
                );

            if (!article) {
                throw new Error(
                    "文章不存在"
                );
            }

            /*
             * 使用 index.json 中的 path
             */

            const articleResponse =
                await fetch(article.path);

            if (!articleResponse.ok) {
                throw new Error(
                    "无法加载文章内容"
                );
            }

            let raw =
                await articleResponse.text();

            /*
             * Front Matter
             */

            const match =
                raw.match(
                    /^---\s*\n([\s\S]*?)\n---\s*\n?/
                );

            let meta = {};

            if (match) {

                match[1]
                    .split("\n")
                    .forEach((line) => {

                        const index =
                            line.indexOf(":");

                        if (index === -1) return;

                        const key =
                            line.slice(
                                0,
                                index
                            ).trim();

                        const value =
                            line.slice(
                                index + 1
                            ).trim();

                        meta[key] = value;

                    });

                raw =
                    raw.slice(
                        match[0].length
                    );
            }

            const title =
                meta.title ||
                article.title ||
                slug;

            const date =
                meta.date ||
                article.date ||
                "";

            const tags =
                article.tags || [];

            document.title =
                title + " · TeoGeek";

            $("#postContent").innerHTML = `

                <h1 class="post-title">
                    ${esc(title)}
                </h1>

                <div class="post-meta">

                    <span>
                        ${esc(date)}
                    </span>

                    <span>
                        ${tags
                            .map(
                                tag =>
                                    "#" + esc(tag)
                            )
                            .join(" ")
                        }
                    </span>

                </div>

                <div class="markdown">
                    ${md(raw)}
                </div>
            `;

        } catch (error) {

            console.error(
                "文章加载失败:",
                error
            );

            $("#postContent").innerHTML = `
                <div class="error">
                    文章加载失败，请稍后再试。
                </div>
            `;
        }
    }

    // =========================
    // 基础
    // =========================

    const year = $("#year");

    if (year) {
        year.textContent =
            new Date().getFullYear();
    }

    // 搜索按钮

    $("#searchBtn")?.addEventListener(
        "click",
        () => {

            const panel =
                $("#searchPanel");

            panel.hidden =
                !panel.hidden;

            $("#searchInput")?.focus();
        }
    );

    // 清除搜索

    $("#clearSearch")?.addEventListener(
        "click",
        () => {

            $("#searchInput").value = "";

            filtered = posts;

            page = 1;

            render();
        }
    );

    // 搜索

    $("#searchInput")?.addEventListener(
        "input",
        (event) => {

            const query =
                event.target.value
                    .trim()
                    .toLowerCase();

            filtered =
                posts.filter((post) => {

                    const content = [
                        post.title,
                        post.description,
                        ...(post.tags || [])
                    ]
                        .join(" ")
                        .toLowerCase();

                    return content.includes(
                        query
                    );
                });

            page = 1;

            render();
        }
    );

    // =========================
    // 判断页面
    // =========================

    if (
        location.pathname.endsWith(
            "/post.html"
        )
    ) {
        post();
    } else {
        home();
    }

})();
