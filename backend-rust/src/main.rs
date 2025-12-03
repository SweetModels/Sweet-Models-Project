// ============================================================================
// SWEET MODELS ADMIN - BACKEND API (Rust + Axum + PostgreSQL)
// ============================================================================
use axum::{
    extract::{Json, State},
    http::{HeaderValue, Method, StatusCode},
    response::IntoResponse,
    routing::{get, post},
    Router,
};
use serde::{Deserialize, Serialize};
use sqlx::{postgres::PgPoolOptions, PgPool};
use std::sync::Arc;
use tower_http::cors::{Any, CorsLayer};
use tracing::{error, info};
use tracing_subscriber;
use uuid::Uuid;

// ============================================================================
// CONFIGURATION & STATE
// ============================================================================

#[derive(Clone)]
struct AppState {
    db: PgPool,
    jwt_secret: String,
}

// ============================================================================
// DATA MODELS (DTOs)
// ============================================================================

#[derive(Debug, Serialize, Deserialize)]
struct LoginRequest {
    email: String,
    password: String,
}

#[derive(Debug, Serialize)]
struct LoginResponse {
    token: String,
    user: UserResponse,
}

#[derive(Debug, Serialize, sqlx::FromRow)]
struct UserResponse {
    id: Uuid,
    email: String,
    role: String,
    display_name: Option<String>,
}

#[derive(Debug, Serialize, sqlx::FromRow)]
struct Device {
    id: Uuid,
    name: String,
    mac_address: String,
    status: String,
    assigned_to_user_id: Option<Uuid>,
    location: Option<String>,
    last_seen_at: Option<chrono::DateTime<chrono::Utc>>,
    created_at: chrono::DateTime<chrono::Utc>,
}

#[derive(Debug, Deserialize)]
struct CreateDeviceRequest {
    name: String,
    mac_address: String,
    status: Option<String>,
    assigned_to_user_id: Option<Uuid>,
    location: Option<String>,
}

#[derive(Debug, Serialize)]
struct ErrorResponse {
    error: String,
    message: String,
}

// ============================================================================
// API HANDLERS
// ============================================================================

/// Health check endpoint
async fn health_check() -> impl IntoResponse {
    Json(serde_json::json!({
        "status": "ok",
        "service": "Sweet Models API",
        "version": "1.0.0"
    }))
}

/// POST /login - Authenticate user and return JWT token
async fn login_handler(
    State(state): State<Arc<AppState>>,
    Json(payload): Json<LoginRequest>,
) -> Result<Json<LoginResponse>, (StatusCode, Json<ErrorResponse>)> {
    info!("Login attempt for email: {}", payload.email);

    // Query user from database
    let user_result = sqlx::query_as::<_, UserResponse>(
        "SELECT id, email, role, display_name FROM users WHERE email = $1"
    )
    .bind(&payload.email)
    .fetch_optional(&state.db)
    .await;

    let user = match user_result {
        Ok(Some(user)) => user,
        Ok(None) => {
            error!("User not found: {}", payload.email);
            return Err((
                StatusCode::UNAUTHORIZED,
                Json(ErrorResponse {
                    error: "INVALID_CREDENTIALS".to_string(),
                    message: "Email o contraseña incorrectos".to_string(),
                }),
            ));
        }
        Err(e) => {
            error!("Database error during login: {}", e);
            return Err((
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ErrorResponse {
                    error: "DATABASE_ERROR".to_string(),
                    message: "Error al consultar la base de datos".to_string(),
                }),
            ));
        }
    };

    // TODO: Verify password hash with bcrypt
    // For now, we're doing a simple mock authentication
    // In production, add: bcrypt::verify(&payload.password, &password_hash)?

    // Generate JWT token (mock for now - implement with jsonwebtoken crate)
    let token = format!("mock_jwt_token_for_{}", user.id);

    info!("Login successful for user: {} ({})", user.email, user.role);

    Ok(Json(LoginResponse { token, user }))
}

/// GET /devices - List all devices
async fn list_devices_handler(
    State(state): State<Arc<AppState>>,
) -> Result<Json<Vec<Device>>, (StatusCode, Json<ErrorResponse>)> {
    info!("Fetching all devices");

    let devices_result = sqlx::query_as::<_, Device>(
        "SELECT id, name, mac_address, status, assigned_to_user_id, location, last_seen_at, created_at 
         FROM devices 
         ORDER BY created_at DESC"
    )
    .fetch_all(&state.db)
    .await;

    match devices_result {
        Ok(devices) => {
            info!("Found {} devices", devices.len());
            Ok(Json(devices))
        }
        Err(e) => {
            error!("Database error fetching devices: {}", e);
            Err((
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ErrorResponse {
                    error: "DATABASE_ERROR".to_string(),
                    message: "Error al consultar dispositivos".to_string(),
                }),
            ))
        }
    }
}

/// POST /devices - Create a new device
async fn create_device_handler(
    State(state): State<Arc<AppState>>,
    Json(payload): Json<CreateDeviceRequest>,
) -> Result<(StatusCode, Json<Device>), (StatusCode, Json<ErrorResponse>)> {
    info!("Creating new device: {}", payload.name);

    let device_result = sqlx::query_as::<_, Device>(
        "INSERT INTO devices (name, mac_address, status, assigned_to_user_id, location) 
         VALUES ($1, $2, $3, $4, $5) 
         RETURNING id, name, mac_address, status, assigned_to_user_id, location, last_seen_at, created_at"
    )
    .bind(&payload.name)
    .bind(&payload.mac_address)
    .bind(payload.status.unwrap_or_else(|| "active".to_string()))
    .bind(payload.assigned_to_user_id)
    .bind(payload.location)
    .fetch_one(&state.db)
    .await;

    match device_result {
        Ok(device) => {
            info!("Device created successfully: {} ({})", device.name, device.id);
            Ok((StatusCode::CREATED, Json(device)))
        }
        Err(e) => {
            error!("Database error creating device: {}", e);
            
            // Check for duplicate MAC address (unique constraint violation)
            let error_msg = if e.to_string().contains("duplicate key") {
                "Esta dirección MAC ya está registrada".to_string()
            } else {
                "Error al crear dispositivo".to_string()
            };

            Err((
                StatusCode::BAD_REQUEST,
                Json(ErrorResponse {
                    error: "CREATE_FAILED".to_string(),
                    message: error_msg,
                }),
            ))
        }
    }
}

// ============================================================================
// MAIN APPLICATION
// ============================================================================

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    // Initialize tracing (logging)
    tracing_subscriber::fmt()
        .with_target(false)
        .compact()
        .init();

    info!("🚀 Starting Sweet Models API Server...");

    // Load environment variables
    dotenvy::dotenv().ok();
    let database_url = std::env::var("DATABASE_URL")
        .expect("DATABASE_URL must be set in .env file");
    let jwt_secret = std::env::var("JWT_SECRET")
        .expect("JWT_SECRET must be set in .env file");
    let server_host = std::env::var("SERVER_HOST")
        .unwrap_or_else(|_| "127.0.0.1".to_string());
    let server_port = std::env::var("SERVER_PORT")
        .unwrap_or_else(|_| "8080".to_string());
    let frontend_url = std::env::var("FRONTEND_URL")
        .unwrap_or_else(|_| "http://localhost:5173".to_string());

    // Create database connection pool
    info!("📦 Connecting to PostgreSQL database...");
    let pool = PgPoolOptions::new()
        .max_connections(5)
        .connect(&database_url)
        .await?;

    info!("✅ Database connection established");

    // Create shared application state
    let state = Arc::new(AppState {
        db: pool,
        jwt_secret,
    });

    // Configure CORS to allow frontend access
    let cors = CorsLayer::new()
        .allow_origin(frontend_url.parse::<HeaderValue>().unwrap())
        .allow_methods([Method::GET, Method::POST, Method::PUT, Method::DELETE])
        .allow_headers(Any);

    // Build API routes
    let app = Router::new()
        .route("/", get(health_check))
        .route("/health", get(health_check))
        .route("/login", post(login_handler))
        .route("/devices", get(list_devices_handler))
        .route("/devices", post(create_device_handler))
        .layer(cors)
        .with_state(state);

    // Start server
    let addr = format!("{}:{}", server_host, server_port);
    let listener = tokio::net::TcpListener::bind(&addr).await?;

    info!("🎯 Server listening on http://{}", addr);
    info!("📡 CORS enabled for: {}", frontend_url);
    info!("✨ Ready to accept requests!");

    axum::serve(listener, app).await?;

    Ok(())
}

