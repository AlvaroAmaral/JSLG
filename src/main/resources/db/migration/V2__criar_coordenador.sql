CREATE TABLE coordenador (
    id         BIGSERIAL PRIMARY KEY,
    usuario    VARCHAR(80) NOT NULL UNIQUE,
    senha_hash VARCHAR(100) NOT NULL,
    ativo      BOOLEAN NOT NULL DEFAULT TRUE
);
