/**
 * URL Builder Service for generating source code links
 * Supports GitHub, Azure DevOps, GitLab, and Bitbucket
 */

export interface Repository {
  repoUrl: string | null;
  provider?: {
    code: 'github' | 'azure_devops' | 'gitlab' | 'bitbucket';
    fileUrlPattern: string;
    lineUrlPattern: string;
  } | null;
}

export interface SourceLinkParams {
  repository: Repository;
  filePath: string;
  branch?: string;
  startLine?: number;
  endLine?: number;
}

/**
 * Builds a URL to a source file in the repository provider
 *
 * @param params - Parameters for building the URL
 * @returns The generated URL or null if unable to generate
 *
 * @example
 * // GitHub file link
 * buildSourceUrl({
 *   repository: { repoUrl: 'https://github.com/user/repo', provider: githubProvider },
 *   filePath: 'src/index.ts'
 * })
 * // Returns: https://github.com/user/repo/blob/main/src/index.ts
 *
 * @example
 * // GitHub with line range
 * buildSourceUrl({
 *   repository: { repoUrl: 'https://github.com/user/repo', provider: githubProvider },
 *   filePath: 'src/index.ts',
 *   startLine: 10,
 *   endLine: 20
 * })
 * // Returns: https://github.com/user/repo/blob/main/src/index.ts#L10-L20
 */
export function buildSourceUrl(params: SourceLinkParams): string | null {
  const { repository, filePath, branch = 'main', startLine, endLine } = params;

  // Validate required fields
  if (!repository.repoUrl || !repository.provider || !filePath) {
    return null;
  }

  const { repoUrl, provider } = repository;

  // Clean the repo URL - remove authentication credentials if present
  // e.g., https://username@dev.azure.com/... -> https://dev.azure.com/...
  const cleanedRepoUrl = repoUrl.replace(/^(https?:\/\/)[^@]+@/, '$1');

  // Remove leading slash from filePath if present
  const normalizedFilePath = filePath.startsWith('/') ? filePath.slice(1) : filePath;

  // Choose the appropriate URL pattern based on whether line numbers are provided
  const hasLineNumbers = startLine !== undefined;
  const pattern = hasLineNumbers ? provider.lineUrlPattern : provider.fileUrlPattern;

  // Replace placeholders in the pattern
  let url = pattern
    .replace('{repoUrl}', cleanedRepoUrl)
    .replace('{branch}', branch)
    .replace('{filePath}', normalizedFilePath);

  // Replace line number placeholders if present
  if (hasLineNumbers && startLine !== undefined) {
    url = url
      .replace('{startLine}', startLine.toString())
      .replace('{endLine}', (endLine ?? startLine).toString());
  }

  return url;
}

/**
 * Detects the provider from a repository URL
 * Useful for auto-detecting provider when creating repositories
 *
 * @param repoUrl - The repository URL
 * @returns The provider code or null if not detected
 *
 * @example
 * detectProviderFromUrl('https://github.com/user/repo')
 * // Returns: 'github'
 */
export function detectProviderFromUrl(repoUrl: string): 'github' | 'azure_devops' | 'gitlab' | 'bitbucket' | null {
  if (!repoUrl) return null;

  const url = repoUrl.toLowerCase();

  if (url.includes('github.com')) {
    return 'github';
  } else if (url.includes('dev.azure.com') || url.includes('visualstudio.com')) {
    return 'azure_devops';
  } else if (url.includes('gitlab.com') || url.includes('gitlab.')) {
    return 'gitlab';
  } else if (url.includes('bitbucket.org') || url.includes('bitbucket.')) {
    return 'bitbucket';
  }

  return null;
}

/**
 * Validates if a file path is valid for URL generation
 *
 * @param filePath - The file path to validate
 * @returns True if valid, false otherwise
 */
export function isValidFilePath(filePath: string): boolean {
  if (!filePath || typeof filePath !== 'string') {
    return false;
  }

  // Check for potentially malicious patterns
  const maliciousPatterns = ['../', '..\\', '<', '>', '|', '\0'];
  return !maliciousPatterns.some(pattern => filePath.includes(pattern));
}
