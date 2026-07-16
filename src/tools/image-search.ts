export interface ImageResult {
  title: string;
  imageUrl: string;
  thumbnailUrl: string;
  sourceUrl: string;
  width?: number;
  height?: number;
}

export interface ImageSearchResponse {
  results: ImageResult[];
  page: number;
  totalResults: number;
  hasNextPage: boolean;
}

/**
 * Search for images using DuckDuckGo image search.
 * Supports pagination via the `page` parameter (1-based).
 */
export async function imageSearch(
  query: string,
  page: number = 1,
  maxResults: number = 10
): Promise<ImageSearchResponse> {
  const vqd = await getVqd(query);

  // Calculate offset for pagination (each page = maxResults items)
  const offset = (page - 1) * maxResults;

  const params = new URLSearchParams({
    l: "wt-wt",
    o: "json",
    q: query,
    vqd: vqd,
    f: ",,,,,",
    p: "1",
    s: offset.toString(),
  });

  const url = `https://duckduckgo.com/i.js?${params.toString()}`;

  const response = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      Accept: "application/json",
      Referer: "https://duckduckgo.com/",
    },
  });

  if (!response.ok) {
    throw new Error(
      `DuckDuckGo image search returned status ${response.status}`
    );
  }

  const data = (await response.json()) as DdgImageResponse;

  const results: ImageResult[] = (data.results || [])
    .slice(0, maxResults)
    .map((item) => ({
      title: item.title || "",
      imageUrl: item.image || "",
      thumbnailUrl: item.thumbnail || "",
      sourceUrl: item.url || "",
      width: item.width,
      height: item.height,
    }));

  return {
    results,
    page,
    totalResults: results.length,
    hasNextPage: !!data.next,
  };
}

/**
 * Get the vqd token required for DuckDuckGo image API calls.
 * Tries multiple extraction strategies as DuckDuckGo changes patterns.
 */
async function getVqd(query: string): Promise<string> {
  const encodedQuery = encodeURIComponent(query);

  // Strategy 1: fetch the images search page and extract vqd from HTML
  const url = `https://duckduckgo.com/?q=${encodedQuery}&iax=images&ia=images`;

  const response = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      Accept: "text/html,application/xhtml+xml",
    },
  });

  if (!response.ok) {
    throw new Error(
      `Failed to get DuckDuckGo token: status ${response.status}`
    );
  }

  const html = await response.text();

  // Pattern: vqd='...' or vqd="..."
  const vqdMatch = html.match(/vqd=['"]([^'"]+)['"]/);
  if (vqdMatch) {
    return vqdMatch[1];
  }

  // Pattern: vqd=4-123456...
  const vqdMatch2 = html.match(/vqd=([\d]+-[\d]+)/);
  if (vqdMatch2) {
    return vqdMatch2[1];
  }

  // Strategy 2: simpler page request
  const simpleResponse = await fetch(
    `https://duckduckgo.com/?q=${encodedQuery}&ia=images`,
    {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
    }
  );

  if (simpleResponse.ok) {
    const simpleHtml = await simpleResponse.text();
    const simpleMatch = simpleHtml.match(/vqd=['"]?([^'"&\s]+)/);
    if (simpleMatch) {
      return simpleMatch[1];
    }
  }

  throw new Error(
    "Could not extract DuckDuckGo search token. The service may be temporarily unavailable."
  );
}

// Internal types for DuckDuckGo image response
interface DdgImageResult {
  title?: string;
  image?: string;
  thumbnail?: string;
  url?: string;
  width?: number;
  height?: number;
  source?: string;
}

interface DdgImageResponse {
  results?: DdgImageResult[];
  next?: string;
}
