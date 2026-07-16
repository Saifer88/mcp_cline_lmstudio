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
export declare function imageSearch(query: string, page?: number, maxResults?: number): Promise<ImageSearchResponse>;
//# sourceMappingURL=image-search.d.ts.map