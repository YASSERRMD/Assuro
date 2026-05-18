-- +goose Up

-- Add description and published date to frameworks
ALTER TABLE frameworks
    ADD COLUMN IF NOT EXISTS description text,
    ADD COLUMN IF NOT EXISTS published_at date,
    ADD COLUMN IF NOT EXISTS region text;

-- Add article_ref, obligation_level and tags to requirements for richer browsing
ALTER TABLE framework_requirements
    ADD COLUMN IF NOT EXISTS article_ref text,
    ADD COLUMN IF NOT EXISTS obligation_level text DEFAULT 'mandatory'
        CHECK (obligation_level IN ('mandatory', 'recommended', 'informative')),
    ADD COLUMN IF NOT EXISTS tags text[] NOT NULL DEFAULT '{}';

-- Add tags and guidance to controls
ALTER TABLE controls
    ADD COLUMN IF NOT EXISTS tags text[] NOT NULL DEFAULT '{}',
    ADD COLUMN IF NOT EXISTS guidance text;

CREATE INDEX IF NOT EXISTS idx_framework_requirements_fw_ref
    ON framework_requirements (framework_id, ref_code);

CREATE INDEX IF NOT EXISTS idx_controls_domain ON controls (domain);

-- +goose Down
DROP INDEX IF EXISTS idx_controls_domain;
DROP INDEX IF EXISTS idx_framework_requirements_fw_ref;
ALTER TABLE controls DROP COLUMN IF EXISTS guidance, DROP COLUMN IF EXISTS tags;
ALTER TABLE framework_requirements
    DROP COLUMN IF EXISTS tags,
    DROP COLUMN IF EXISTS obligation_level,
    DROP COLUMN IF EXISTS article_ref;
ALTER TABLE frameworks
    DROP COLUMN IF EXISTS region,
    DROP COLUMN IF EXISTS published_at,
    DROP COLUMN IF EXISTS description;
