-- Update Azure DevOps URL patterns to work without branch specification
-- This makes the links simpler and works better with authentication-prefixed URLs
UPDATE providers
SET
  file_url_pattern = '{repoUrl}?path=/{filePath}',
  line_url_pattern = '{repoUrl}?path=/{filePath}&line={startLine}&lineEnd={endLine}'
WHERE code = 'azure_devops';
