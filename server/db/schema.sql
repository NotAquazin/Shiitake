CREATE TABLE users (
    user_id UUID PRIMARY KEY,
    username VARCHAR(20) NOT NULL CHECK (username ~ '^[a-zA-Z0-9]+$'),
    email VARCHAR UNIQUE NOT NULL,
    password_hash VARCHAR NOT NULL,
    failed_login_attempts INTEGER DEFAULT 0 NOT NULL,
    description TEXT
);
