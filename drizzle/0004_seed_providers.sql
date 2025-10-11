-- Seed providers table with initial data for GitHub, Azure DevOps, GitLab, and Bitbucket

-- GitHub
INSERT INTO providers (name, code, base_url_pattern, file_url_pattern, line_url_pattern)
VALUES (
  'GitHub',
  'github',
  '{repoUrl}',
  '{repoUrl}/blob/{branch}/{filePath}',
  '{repoUrl}/blob/{branch}/{filePath}#L{startLine}-L{endLine}'
)
ON CONFLICT (code) DO NOTHING;

-- Azure DevOps
INSERT INTO providers (name, code, base_url_pattern, file_url_pattern, line_url_pattern)
VALUES (
  'Azure DevOps',
  'azure_devops',
  '{repoUrl}',
  '{repoUrl}?path=/{filePath}',
  '{repoUrl}?path=/{filePath}&line={startLine}&lineEnd={endLine}'
)
ON CONFLICT (code) DO NOTHING;

-- GitLab
INSERT INTO providers (name, code, base_url_pattern, file_url_pattern, line_url_pattern)
VALUES (
  'GitLab',
  'gitlab',
  '{repoUrl}',
  '{repoUrl}/-/blob/{branch}/{filePath}',
  '{repoUrl}/-/blob/{branch}/{filePath}#L{startLine}-{endLine}'
)
ON CONFLICT (code) DO NOTHING;

-- Bitbucket
INSERT INTO providers (name, code, base_url_pattern, file_url_pattern, line_url_pattern)
VALUES (
  'Bitbucket',
  'bitbucket',
  '{repoUrl}',
  '{repoUrl}/src/{branch}/{filePath}',
  '{repoUrl}/src/{branch}/{filePath}#lines-{startLine}:{endLine}'
)
ON CONFLICT (code) DO NOTHING;
