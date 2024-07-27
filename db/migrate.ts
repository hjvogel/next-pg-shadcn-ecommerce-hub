CREATE EXTENSION IF NOT EXISTS vector;

CREATE INDEX IF NOT EXISTS "embeddingIndex" ON "product" USING hnsw (embedding vector_cosine_ops);
