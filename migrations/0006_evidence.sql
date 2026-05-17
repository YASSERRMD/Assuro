-- +goose Up
CREATE TABLE evidence (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id uuid NOT NULL REFERENCES organizations(id),
    title text NOT NULL,
    description text,
    file_key text NOT NULL,
    content_hash text NOT NULL,
    mime_type text,
    size_bytes bigint NOT NULL DEFAULT 0,
    uploaded_by uuid REFERENCES users(id),
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE evidence_links (
    evidence_id uuid NOT NULL REFERENCES evidence(id),
    target_type text NOT NULL CHECK (target_type IN ('control','assessment','response')),
    target_id uuid NOT NULL,
    PRIMARY KEY (evidence_id, target_type, target_id)
);

CREATE INDEX idx_evidence_org_id ON evidence(org_id);
CREATE INDEX idx_evidence_links_target ON evidence_links(target_type, target_id);

-- +goose Down
DROP TABLE IF EXISTS evidence_links;
DROP TABLE IF EXISTS evidence;
