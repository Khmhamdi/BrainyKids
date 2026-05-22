-- Add unique constraint on numero_inscription (NULL values are excluded by DB automatically)
CREATE UNIQUE INDEX IF NOT EXISTS "Student_numero_inscription_key" ON "Student"("numero_inscription");
