CREATE TABLE membro (
    id        BIGSERIAL PRIMARY KEY,
    nome      VARCHAR(120) NOT NULL,
    email     VARCHAR(150) NOT NULL,
    telefone  VARCHAR(20),
    CONSTRAINT uk_membro_email UNIQUE (email)
);

CREATE TABLE evento (
    id         BIGSERIAL PRIMARY KEY,
    titulo     VARCHAR(150) NOT NULL,
    data_hora  TIMESTAMP    NOT NULL,
    local      VARCHAR(200) NOT NULL,
    cancelado  BOOLEAN      NOT NULL DEFAULT FALSE
);

CREATE TABLE presenca (
    id             BIGSERIAL PRIMARY KEY,
    membro_id      BIGINT    NOT NULL REFERENCES membro (id),
    evento_id      BIGINT    NOT NULL REFERENCES evento (id),
    data_registro  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_presenca_membro_evento UNIQUE (membro_id, evento_id)
);

CREATE INDEX idx_presenca_evento ON presenca (evento_id);
CREATE INDEX idx_evento_data_hora ON evento (data_hora);

