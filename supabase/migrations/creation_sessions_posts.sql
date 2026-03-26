
CREATE TABLE IF NOT EXISTS sessions (
    id BIGSERIAL PRIMARY KEY, 
    pseudo TEXT NOT NULL, 
    code TEXT NOT NULL UNIQUE,
    titre TEXT,
    ville TEXT, 
    sujet TEXT,
    institut TEXT, 
    date_debut DATE,
    date_retour DATE,
    bio TEXT
);

CREATE TABLE IF NOT EXISTS posts (
    id BIGSERIAL PRIMARY KEY, 
    session_id TEXT NOT NULL,
    photos TEXT, 
    description TEXT, 
    commentaire TEXT, 
);

CREATE INDEX IF NOT EXISTS idx_sessions_code ON sessions(code);



