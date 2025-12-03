# 🚀 Sweet Models Backend (Rust + Axum + PostgreSQL/Supabase)

Backend API seguro para Sweet Models Admin Dashboard.

## 📋 Requisitos Previos

- **Rust** (1.70+): [Instalar Rust](https://www.rust-lang.org/tools/install)
- **PostgreSQL** o cuenta en **Supabase**: [Supabase.com](https://supabase.com)
- **Git** para control de versiones

## 🛠️ Instalación y Configuración

### 1. Configurar Base de Datos en Supabase

#### Paso 1: Crear Proyecto en Supabase
1. Ve a [supabase.com/dashboard](https://supabase.com/dashboard)
2. Click en **"New Project"**
3. Nombre: `sweet-models-db`
4. Contraseña: Guarda la contraseña del proyecto (la necesitarás)
5. Región: Selecciona la más cercana (ej: `South America`)
6. Click en **"Create new project"** (tarda ~2 minutos)

#### Paso 2: Ejecutar Script SQL
1. En tu proyecto Supabase, ve a: **SQL Editor** (en el menú lateral)
2. Click en **"New query"**
3. Copia y pega TODO el contenido de `migrations/01_initial_schema.sql`
4. Click en **"Run"** (o presiona `Ctrl+Enter`)
5. Verifica que aparezca: ✅ **"Success. No rows returned"**

#### Paso 3: Verificar Tablas Creadas
1. Ve a **"Table Editor"** en el menú lateral
2. Deberías ver 4 tablas:
   - ✅ `users` (con 3 usuarios de ejemplo)
   - ✅ `groups`
   - ✅ `devices`
   - ✅ `group_models`

#### Paso 4: Obtener Connection String
1. Ve a **"Settings"** → **"Database"**
2. Busca la sección **"Connection string"**
3. Selecciona **"URI"** (no Transaction Pooling por ahora)
4. Copia el string que empieza con: `postgresql://postgres:[YOUR-PASSWORD]@...`
5. Reemplaza `[YOUR-PASSWORD]` con la contraseña de tu proyecto

### 2. Configurar Variables de Entorno

```bash
# Copia el archivo de ejemplo
cp .env.example .env

# Edita .env con tus credenciales reales
# - DATABASE_URL: Connection string de Supabase
# - JWT_SECRET: Genera uno seguro con: openssl rand -base64 32
```

**Ejemplo de `.env`:**
```env
DATABASE_URL=postgresql://postgres.abcdefghijklmnop:TU_PASSWORD@aws-0-us-west-1.pooler.supabase.com:6543/postgres
JWT_SECRET=xK9mP2vN8jL5qR1wE4tY7uI0oP3aS6dF9gH2jK5lZ8xC1vB4nM7qW0eR3tY6uI9o
SERVER_HOST=127.0.0.1
SERVER_PORT=8080
FRONTEND_URL=http://localhost:5173
```

### 3. Instalar Dependencias

```bash
# Actualiza el archivo de lock con las nuevas dependencias
cargo build
```

### 4. Ejecutar el Servidor

```bash
# Modo desarrollo (con logs detallados)
cargo run

# Modo producción (optimizado)
cargo run --release
```

**Salida esperada:**
```
🚀 Starting Sweet Models API Server...
📦 Connecting to PostgreSQL database...
✅ Database connection established
🎯 Server listening on http://127.0.0.1:8080
📡 CORS enabled for: http://localhost:5173
✨ Ready to accept requests!
```

## 🧪 Probar los Endpoints

### 1. Health Check
```bash
curl http://localhost:8080/health
```

**Respuesta:**
```json
{
  "status": "ok",
  "service": "Sweet Models API",
  "version": "1.0.0"
}
```

### 2. Login (POST)
```bash
curl -X POST http://localhost:8080/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@sweetmodels.com",
    "password": "admin123"
  }'
```

**Respuesta:**
```json
{
  "token": "mock_jwt_token_for_...",
  "user": {
    "id": "uuid-here",
    "email": "admin@sweetmodels.com",
    "role": "admin",
    "display_name": "Administrador Principal"
  }
}
```

### 3. Listar Dispositivos (GET)
```bash
curl http://localhost:8080/devices
```

**Respuesta:**
```json
[]
```

### 4. Crear Dispositivo (POST)
```bash
curl -X POST http://localhost:8080/devices \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Laptop Sala 1",
    "mac_address": "AA:BB:CC:DD:EE:FF",
    "status": "active",
    "location": "Cucuta - Studio 1"
  }'
```

**Respuesta:**
```json
{
  "id": "uuid-here",
  "name": "Laptop Sala 1",
  "mac_address": "AA:BB:CC:DD:EE:FF",
  "status": "active",
  "assigned_to_user_id": null,
  "location": "Cucuta - Studio 1",
  "last_seen_at": null,
  "created_at": "2025-12-03T12:00:00Z"
}
```

## 📚 Estructura del Proyecto

```
backend-rust/
├── Cargo.toml              # Dependencias Rust
├── .env                    # Variables de entorno (NO COMMITEAR)
├── .env.example            # Ejemplo de configuración
├── migrations/
│   └── 01_initial_schema.sql  # Script SQL inicial
├── src/
│   └── main.rs             # API completa (Axum + PostgreSQL)
└── README.md               # Esta documentación
```

## 🔐 Seguridad

### Usuarios de Prueba (creados automáticamente por el SQL)
| Email                      | Contraseña | Rol       |
|----------------------------|------------|-----------|
| admin@sweetmodels.com      | admin123   | admin     |
| moderator@sweetmodels.com  | admin123   | moderator |
| model1@sweetmodels.com     | admin123   | model     |

⚠️ **IMPORTANTE:** Cambia estas contraseñas en producción.

### Próximos Pasos de Seguridad
1. **Implementar verificación de contraseñas con bcrypt**
   - Actualmente el login NO verifica contraseñas (solo busca el usuario)
   - Agregar: `bcrypt::verify(&password, &password_hash)?`

2. **Generar JWT tokens reales**
   - Actualmente retorna `mock_jwt_token_for_...`
   - Implementar con la crate `jsonwebtoken`

3. **Middleware de autenticación**
   - Proteger endpoints con JWT validation
   - Verificar roles (admin, moderator, model)

4. **Rate Limiting**
   - Limitar intentos de login por IP
   - Usar crate `tower-governor` o `axum-governor`

5. **HTTPS en producción**
   - Usar certificados SSL/TLS
   - Configurar reverse proxy (Nginx/Caddy)

## 🐛 Troubleshooting

### Error: "DATABASE_URL must be set"
- Verifica que el archivo `.env` exista en la raíz del proyecto
- Verifica que `DATABASE_URL` esté configurado correctamente

### Error: "Connection refused" al conectar a base de datos
- Verifica que tu connection string de Supabase sea correcto
- Asegúrate de que tu IP esté permitida en Supabase (Settings → Database → Connection pooling)
- Prueba la conexión directa desde un cliente SQL

### Error: "CORS policy" en el frontend
- Verifica que `FRONTEND_URL` en `.env` coincida con el puerto de tu frontend
- Revisa los logs del servidor Rust para ver si el CORS está configurado

### Error al ejecutar `cargo run`
- Ejecuta `cargo clean` y luego `cargo build`
- Asegúrate de tener Rust 1.70+ (`rustc --version`)

## 📞 Soporte

Para problemas con:
- **Supabase:** [docs.supabase.com](https://supabase.com/docs)
- **Rust/Axum:** [docs.rs/axum](https://docs.rs/axum/latest/axum/)
- **SQLx:** [docs.rs/sqlx](https://docs.rs/sqlx/latest/sqlx/)

## 📄 Licencia

Código propietario - Sweet Models Studio © 2025
