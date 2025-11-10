import * as cheerio from 'cheerio';

export interface FetchedUrlContent {
  url: string;
  title: string;
  content: string;
  success: boolean;
  error?: string;
}

/**
 * Fetches and extracts text content from a URL
 * @param url - The URL to fetch
 * @param timeout - Request timeout in milliseconds (default: 10000)
 * @returns Extracted content including title and text
 */
export async function fetchUrlContent(
  url: string,
  timeout: number = 10000
): Promise<FetchedUrlContent> {
  try {
    // Validate URL
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url);
    } catch {
      return {
        url,
        title: '',
        content: '',
        success: false,
        error: 'Invalid URL format',
      };
    }

    // Fetch the URL with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; SpecThis/1.0; +http://spec-this.com)',
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return {
        url,
        title: '',
        content: '',
        success: false,
        error: `HTTP ${response.status}: ${response.statusText}`,
      };
    }

    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('text/html') && !contentType.includes('text/plain')) {
      return {
        url,
        title: '',
        content: '',
        success: false,
        error: `Unsupported content type: ${contentType}`,
      };
    }

    const html = await response.text();

    // Parse HTML with cheerio
    const $ = cheerio.load(html);

    // Remove script, style, and other non-content elements
    $('script, style, nav, header, footer, iframe, noscript').remove();

    // Extract title
    const title = $('title').text().trim() ||
                  $('h1').first().text().trim() ||
                  parsedUrl.hostname;

    // Extract main content
    // Try to find main content area
    let content = '';
    const mainSelectors = ['main', 'article', '[role="main"]', '.content', '#content', 'body'];

    for (const selector of mainSelectors) {
      const element = $(selector).first();
      if (element.length > 0) {
        content = element.text();
        break;
      }
    }

    // Clean up the content
    content = content
      .replace(/\s+/g, ' ') // Replace multiple spaces with single space
      .replace(/\n+/g, '\n') // Replace multiple newlines with single newline
      .trim();

    if (!content) {
      return {
        url,
        title,
        content: '',
        success: false,
        error: 'No content could be extracted from the page',
      };
    }

    return {
      url,
      title,
      content,
      success: true,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return {
      url,
      title: '',
      content: '',
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Truncates content to a maximum length while trying to preserve sentence boundaries
 * @param content - The content to truncate
 * @param maxLength - Maximum length in characters (default: 8000)
 * @returns Truncated content
 */
export function truncateContent(content: string, maxLength: number = 8000): string {
  if (content.length <= maxLength) {
    return content;
  }

  // Try to truncate at a sentence boundary
  const truncated = content.substring(0, maxLength);
  const lastPeriod = truncated.lastIndexOf('.');
  const lastNewline = truncated.lastIndexOf('\n');

  const cutPoint = Math.max(lastPeriod, lastNewline);

  if (cutPoint > maxLength * 0.8) {
    // If we found a good break point in the last 20% of the truncated content
    return truncated.substring(0, cutPoint + 1).trim();
  }

  // Otherwise just truncate at maxLength
  return truncated.trim() + '...';
}
