-- Keep existing email values in the database, but no longer require or expose them.
ALTER TABLE membro ALTER COLUMN email DROP NOT NULL;
ALTER TABLE membro ADD COLUMN instagram VARCHAR(30);
