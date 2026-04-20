CREATE TABLE IF NOT EXISTS commentaires (
    id BIGSERIAL PRIMARY KEY,
    post_id BIGINT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    auteur_id TEXT NOT NULL,
    contenu TEXT NOT NULL,
    date_creation TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_commentaires_post_id ON commentaires(post_id);