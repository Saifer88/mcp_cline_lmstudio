export interface SearchResult {
    title: string;
    url: string;
    snippet: string;
}
export declare function webSearch(query: string, maxResults?: number): Promise<SearchResult[]>;
//# sourceMappingURL=web-search.d.ts.map