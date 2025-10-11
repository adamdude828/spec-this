import { buildSourceUrl } from '@/lib/services/url-builder';

interface Provider {
  code: 'github' | 'azure_devops' | 'gitlab' | 'bitbucket';
  fileUrlPattern: string;
  lineUrlPattern: string;
}

interface FileLinkProps {
  filePath: string;
  repoUrl: string | null;
  provider: Provider | null;
  className?: string;
  showIcon?: boolean;
}

export default function FileLink({
  filePath,
  repoUrl,
  provider,
  className = '',
  showIcon = true,
}: FileLinkProps) {
  // Build source URL if provider is available
  const sourceUrl = repoUrl && provider
    ? buildSourceUrl({
        repository: { repoUrl, provider },
        filePath,
      })
    : null;

  if (!sourceUrl) {
    return <code className={className}>{filePath}</code>;
  }

  return (
    <a
      href={sourceUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center gap-1 hover:underline text-blue-600 ${className}`}
      title={`View ${filePath} in source`}
    >
      <code>{filePath}</code>
      {showIcon && (
        <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
          />
        </svg>
      )}
    </a>
  );
}
