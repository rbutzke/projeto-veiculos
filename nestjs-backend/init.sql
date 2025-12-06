
-- Tabela de veículos
CREATE TABLE vehicle  (
    id SERIAL PRIMARY KEY,
    placa VARCHAR(7) NOT NULL UNIQUE,
    chassi VARCHAR(17) NOT NULL UNIQUE,
    renavam VARCHAR(11) NOT NULL UNIQUE,
    modelo VARCHAR(50) NOT NULL,
    marca VARCHAR(30) NOT NULL,
    ano INTEGER NOT NULL CHECK (ano >= 1886 AND ano <= EXTRACT(YEAR FROM CURRENT_DATE) + 1),
    data_cadastro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_alteracao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índice para busca por placa, marca e modelo
CREATE INDEX idx_veiculos_placa ON vehicle(placa);
CREATE INDEX idx_veiculos_marca_modelo ON vehicle(marca, modelo);



-- Tabela de usuários
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índice para busca por email
CREATE INDEX idx_users_email ON users(email);


-- Usuário admin inicial (senha: admin123)
INSERT INTO users (email, password_hash, name, role) 
VALUES ('admin@example.com', '$2b$10$XCy5nS7UrjSvVMHFVudL9u4kYW4rWkD8PND7GB0Q2aZxKoVsuZEtK', 'Admin', 'admin');



-- Tabela de Pagamentos
CREATE TABLE payments (
    id SERIAL PRIMARY KEY,
    clientId VARCHAR(100) NOT NULL,
    description VARCHAR(300) NOT NULL,
    amount NUMERIC(10, 2) NOT NULL,
    currency VARCHAR(10) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índice para busca por clientId
CREATE INDEX idx_payments_clientId ON payments(clientId);



