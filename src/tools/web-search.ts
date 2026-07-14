import * as cheerio from "cheerio";

export interface SearchResult {
  title: string;
  url: string;
  snippet: string;
}

export async function webSearch(
  query: string,
  maxResults: number = 10
): Promise<SearchResult[]> {
  const encodedQuery = encodeURIComponent(query);
  const url = `https://html.duckduckgo.com/html/?q=${encodedQuery}`;

  const response = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      Accept: "text/html,application/xhtml+xml",
      "Accept-Language": "en-US,en;q=0.9",
    },
  });

  if (!response.ok) {
    throw new Error(`DuckDuckGo returned status ${response.status}`);
  }

  const html = await response.text();
  const $ = cheerio.load(html);
  const results: SearchResult[] = [];

  $(".result").each((_, element) => {
    if (results.length >= maxResults) return false;

    const titleEl = $(element).find(".result__title a");
    const snippetEl = $(element).find(".result__snippet");

    const title = titleEl.text().trim();
    let href = titleEl.attr("href") || "";

    // DuckDuckGo wraps URLs in a redirect - extract the actual URL
    if (href.includes("uddg=")) {
      const match = href.match(/uddg=([^&]+)/);
      if (match) {
        href = decodeURIComponent(match[1]);
      }
    }

    const snippet = snippetEl.text().trim();

    if (title && href) {
      results.push({ title, url: href, snippet });
    }
  });

  if (results.length === 0) {
    // Fallback: try the lite version
    return await webSearchLite(query, maxResults);
  }

  return results;
}

async function webSearchLite(
  query: string,
  maxResults: number
): Promise<SearchResult[]> {
  const encodedQuery = encodeURIComponent(query);
  const url = `https://lite.duckduckgo.com/lite/?q=${encodedQuery}`;

  const response = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      Accept: "text/html",
    },
  });

  if (!response.ok) {
    throw new Error(`DuckDuckGo Lite returned status ${response.status}`);
  }

  const html = await response.text();
  const $ = cheerio.load(html);
  const results: SearchResult[] = [];

  // Lite version has a table-based layout
  $("table")
    .last()
    .find("tr")
    .each((_, row) => {
      if (results.length >= maxResults) return false;

      const link = $(row).find("a.result-link");
      if (link.length) {
        const title = link.text().trim();
        const href = link.attr("href") || "";
        // Get the next row which contains the snippet
        const snippetRow = $(row).next("tr");
        const snippet = snippetRow.find("td.result-snippet").text().trim();

        if (title && href) {
          results.push({ title, url: href, snippet });
        }
      }
    });

  return results;
}
