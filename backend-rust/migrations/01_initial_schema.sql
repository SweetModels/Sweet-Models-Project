-- ============================================================================
-- SWEET MODELS ADMIN - DATABASE SCHEMA (PostgreSQL/Supabase)
-- ============================================================================
-- INSTRUCCIONES PARA EJECUTAR EN SUPABASE:
-- 1. Ve a https://supabase.com/dashboard/project/YOUR_PROJECT/editor
-- 2. Copia y pega este script completo en el SQL Editor
-- 3. Click en "Run" (o presiona Ctrl+Enter)
-- 4. Verifica que las tablas se crearon en "Table Editor"
-- ============================================================================

-- Habilitar extensión UUID (si no está habilitada)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- TABLA 1: USERS (Usuarios del sistema)
-- ============================================================================
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,  -- Almacena hash bcrypt, NO contraseña plain
    role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'moderator', 'model')),
    display_name VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índice para búsquedas rápidas por email
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Índice para filtrar por rol
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Comentarios para documentación
COMMENT ON TABLE users IS 'Usuarios del sistema Sweet Models (Admin, Moderators, Models)';
COMMENT ON COLUMN users.password_hash IS 'Hash bcrypt de la contraseña (NUNCA almacenar contraseñas en texto plano)';
COMMENT ON COLUMN users.role IS 'Rol del usuario: admin (acceso total), moderator (gestiona grupos), model (solo visualiza sus datos)';

-- ============================================================================
-- TABLA 2: GROUPS (Grupos de trabajo/salas)
-- ============================================================================
CREATE TABLE IF NOT EXISTS groups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    platform VARCHAR(100) NOT NULL CHECK (platform IN ('Chaturbate', 'MyFreeCams', 'Stripchat', 'BongaCams')),
    moderator_id UUID REFERENCES users(id) ON DELETE SET NULL,  -- FK a users (moderador asignado)
    tokens INTEGER NOT NULL DEFAULT 0 CHECK (tokens >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índice para búsquedas por moderador
CREATE INDEX IF NOT EXISTS idx_groups_moderator ON groups(moderator_id);

-- Índice para filtrar por plataforma
CREATE INDEX IF NOT EXISTS idx_groups_platform ON groups(platform);

-- Comentarios para documentación
COMMENT ON TABLE groups IS 'Grupos de trabajo (salas de streaming) con asignación de moderadores';
COMMENT ON COLUMN groups.platform IS 'Plataforma de streaming (Chaturbate, MyFreeCams, Stripchat, BongaCams)';
COMMENT ON COLUMN groups.tokens IS 'Total de tokens generados por este grupo';
COMMENT ON COLUMN groups.moderator_id IS 'ID del usuario moderador asignado (NULL si no tiene)';

-- ============================================================================
-- TABLA 3: DEVICES (Dispositivos registrados)
-- ============================================================================
CREATE TABLE IF NOT EXISTS devices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    mac_address VARCHAR(17) UNIQUE NOT NULL CHECK (mac_address ~ '^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$'),  -- Formato MAC: XX:XX:XX:XX:XX:XX
    status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'maintenance', 'blocked')),
    assigned_to_user_id UUID REFERENCES users(id) ON DELETE SET NULL,  -- FK a users (usuario asignado)
    location VARCHAR(255),  -- Ubicación física del dispositivo (opcional)
    last_seen_at TIMESTAMPTZ,  -- Última vez que el dispositivo se conectó
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índice para búsquedas rápidas por MAC address
CREATE INDEX IF NOT EXISTS idx_devices_mac ON devices(mac_address);

-- Índice para filtrar por estado
CREATE INDEX IF NOT EXISTS idx_devices_status ON devices(status);

-- Índice para búsquedas por usuario asignado
CREATE INDEX IF NOT EXISTS idx_devices_assigned_user ON devices(assigned_to_user_id);

-- Comentarios para documentación
COMMENT ON TABLE devices IS 'Dispositivos (laptops, tablets, etc.) registrados en el sistema';
COMMENT ON COLUMN devices.mac_address IS 'Dirección MAC única del dispositivo (formato XX:XX:XX:XX:XX:XX)';
COMMENT ON COLUMN devices.status IS 'Estado del dispositivo: active, inactive, maintenance, blocked';
COMMENT ON COLUMN devices.assigned_to_user_id IS 'ID del usuario (model) al que está asignado el dispositivo';

-- ============================================================================
-- TABLA 4: GROUP_MODELS (Relación Many-to-Many entre Groups y Users/Models)
-- ============================================================================
CREATE TABLE IF NOT EXISTS group_models (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    model_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(group_id, model_id)  -- Evitar duplicados (un model no puede estar 2 veces en el mismo grupo)
);

-- Índices para búsquedas bidireccionales
CREATE INDEX IF NOT EXISTS idx_group_models_group ON group_models(group_id);
CREATE INDEX IF NOT EXISTS idx_group_models_model ON group_models(model_id);

COMMENT ON TABLE group_models IS 'Relación Many-to-Many: Un grupo puede tener múltiples models, un model puede estar en múltiples grupos';

-- ============================================================================
-- FUNCIÓN: Actualizar campo updated_at automáticamente
-- ============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Aplicar trigger a todas las tablas con updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_groups_updated_at BEFORE UPDATE ON groups
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_devices_updated_at BEFORE UPDATE ON devices
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- DATOS DE EJEMPLO (OPCIONAL - Comentar si no quieres datos de prueba)
-- ============================================================================

-- Usuario Admin de prueba (contraseña: "admin123" hasheada con bcrypt)
-- NOTA: En producción, crea usuarios con contraseñas seguras usando tu API
INSERT INTO users (email, password_hash, role, display_name) VALUES
('admin@sweetmodels.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5lAq0hJp5Vvra', 'admin', 'Administrador Principal')
ON CONFLICT (email) DO NOTHING;

-- Moderador de ejemplo
INSERT INTO users (email, password_hash, role, display_name) VALUES
('moderator@sweetmodels.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5lAq0hJp5Vvra', 'moderator', 'Moderador Sala 1')
ON CONFLICT (email) DO NOTHING;

-- Modelo de ejemplo
INSERT INTO users (email, password_hash, role, display_name) VALUES
('model1@sweetmodels.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5lAq0hJp5Vvra', 'model', 'María González')
ON CONFLICT (email) DO NOTHING;

-- ============================================================================
-- VERIFICACIÓN FINAL
-- ============================================================================
-- Verifica que todo se creó correctamente ejecutando estas queries:
-- SELECT * FROM users;
-- SELECT * FROM groups;
-- SELECT * FROM devices;
-- SELECT * FROM group_models;

-- ============================================================================
-- NOTAS DE SEGURIDAD IMPORTANTES:
-- ============================================================================
-- 1. RLS (Row Level Security): Habilita RLS en Supabase para cada tabla
--    y configura políticas que restrinjan acceso por rol.
-- 2. API Keys: Usa la API Key de Supabase en tu backend Rust (nunca expongas en frontend).
-- 3. JWT Tokens: Configura JWT con expiración corta (15min - 1h).
-- 4. HTTPS: En producción, SIEMPRE usa HTTPS para todas las conexiones.
-- 5. Backups: Configura backups automáticos en Supabase (Settings > Database > Backups).
