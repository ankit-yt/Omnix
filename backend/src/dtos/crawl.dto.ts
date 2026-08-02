export const CRAWLING_STATUSES = [
  'idle',
  'pending',
  'crawling',
  'completed',
  'failed',
] as const;

export type CrawlingStatus = typeof CRAWLING_STATUSES[number];

export interface UpdateCrawlingStatusDto {
  status?: CrawlingStatus;
  lastCrawledAt?: Date | null;
  pagesCrawled?: number;
  errorMessage?: string | null;
}