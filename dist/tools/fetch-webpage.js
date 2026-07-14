import * as cheerio from "cheerio";
export async function fetchWebpage(url, selector) {
    const response = await fetch(url, {
        headers: {
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.9",
        },
        redirect: "follow",
    });
    if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    const contentType = response.headers.get("content-type") || "";
    // If it's plain text or JSON, return directly
    if (contentType.includes("text/plain") ||
        contentType.includes("application/json")) {
        return await response.text();
    }
    const html = await response.text();
    const $ = cheerio.load(html);
    // Remove non-content elements
    $("script, style, nav, header, footer, iframe, noscript, .ads, .advertisement, .sidebar, [role='banner'], [role='navigation']").remove();
    let content;
    if (selector) {
        // Use the provided CSS selector
        const selected = $(selector);
        if (selected.length === 0) {
            throw new Error(`Selector "${selector}" matched no elements`);
        }
        content = selected.text();
    }
    else {
        // Try common article selectors first
        const articleSelectors = [
            "article",
            '[role="main"]',
            "main",
            ".post-content",
            ".article-content",
            ".entry-content",
            "#content",
            ".content",
        ];
        let found = false;
        for (const sel of articleSelectors) {
            const el = $(sel);
            if (el.length && el.text().trim().length > 200) {
                content = el.text();
                found = true;
                break;
            }
        }
        if (!found) {
            // Fallback to body
            content = $("body").text();
        }
    }
    // Clean up whitespace
    content = content
        .replace(/\s+/g, " ")
        .replace(/\n\s*\n/g, "\n\n")
        .trim();
    // Truncate if extremely long (avoid overwhelming context)
    const maxLength = 50000;
    if (content.length > maxLength) {
        content = content.substring(0, maxLength) + "\n\n[Content truncated...]";
    }
    // Get page title
    const title = $("title").text().trim();
    const header = title ? `# ${title}\n\n` : "";
    return header + content;
}
//# sourceMappingURL=fetch-webpage.js.map