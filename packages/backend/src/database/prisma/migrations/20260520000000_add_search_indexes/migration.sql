-- Add full-text search indexes for issues
CREATE INDEX IF NOT EXISTS idx_issues_search ON issues USING gin(
  to_tsvector('english', COALESCE(title, '') || ' ' || COALESCE(description, ''))
);

-- Add full-text search indexes for documents
CREATE INDEX IF NOT EXISTS idx_documents_search ON documents USING gin(
  to_tsvector('english', COALESCE(title, '') || ' ' || COALESCE(content, ''))
);

-- Add full-text search indexes for bugs
CREATE INDEX IF NOT EXISTS idx_bugs_search ON bugs USING gin(
  to_tsvector('english', COALESCE(title, '') || ' ' || COALESCE(description, '') || ' ' || COALESCE(steps_to_reproduce, ''))
);
