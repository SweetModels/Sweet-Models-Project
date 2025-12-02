# 🔐 Sistema de Autenticación Firebase - Guía Completa

## ✅ Implementación Completada

Tu aplicación ahora tiene un sistema profesional de autenticación con roles basados en Firestore.

---

## 📋 Características Implementadas

### 1. **Autenticación con Email/Contraseña**
   - Login seguro con Firebase Auth
   - Registro de nuevos usuarios
   - Manejo de errores personalizado

### 2. **Sistema de Roles Basado en Firestore**
   - Colección `users` almacena el rol de cada usuario
   - Roles disponibles: `admin`, `moderator`, `model`
   - Cada usuario ve solo los datos según su rol

### 3. **Flujo de Autenticación**
   ```
   No Autenticado → Pantalla de Login
   Autenticado → Fetch rol desde Firestore
   Rol Obtenido → Dashboard personalizado
   ```

### 4. **Componentes Nuevos**
   - `src/components/Login.jsx` - Pantalla de login/registro
   - Actualizado `src/firebase.js` - Inicializa Auth
   - Actualizado `src/App.jsx` - Maneja estado de auth y roles

---

## 🚀 Primer Inicio - Crear tu cuenta Admin

### Paso 1: Editar el Script de Semilla
Edita `/scripts/create_admin_user.mjs` y cambia:
```javascript
const EMAIL = 'admin@example.com';      // 👈 Tu email
const PASSWORD = 'SecurePassword123!'; // 👈 Tu contraseña (mín. 6 caracteres)
```

### Paso 2: Ejecutar el Script
```powershell
cd "C:\Users\USUARIO\Desktop\Project SweetModels\sweet-models-admin"
node scripts/create_admin_user.mjs
```

Salida esperada:
```
✅ ¡Excelente! Tu cuenta Admin está lista:
   📧 Email: admin@example.com
   🔑 Contraseña: SecurePassword123!
   👤 Rol: admin
```

### Paso 3: Iniciar Sesión
1. Abre http://localhost:5173/
2. Ingresa tu email y contraseña
3. ¡Dashboard Admin cargado! 🎉

---

## 👥 Crear Otros Usuarios (Moderator/Model)

### Opción A: Script Automático
Edita `/scripts/create_users.mjs`:
```javascript
const USER_CONFIG = [
  { email: 'moderador1@example.com', password: 'Pass123!', role: 'moderator' },
  { email: 'modelo1@example.com', password: 'Pass123!', role: 'model' },
];
```

Ejecuta:
```powershell
node scripts/create_users.mjs
```

### Opción B: Manual desde Firebase Console
1. Ve a [Firebase Console](https://console.firebase.google.com)
2. Selecciona tu proyecto `sweet-models-db`
3. **Authentication** → Crea un nuevo usuario
4. **Firestore** → Colección `users` → Crea documento:
   ```json
   {
     "email": "moderador@example.com",
     "role": "moderator",
     "createdAt": "2025-12-02",
     "displayName": "Tu Nombre"
   }
   ```

---

## 🎯 Comportamiento por Rol

### 🔴 Admin
- ✅ Editar TRM del día
- ✅ Crear grupos
- ✅ Editar tokens de grupos
- ✅ Eliminar grupos
- ✅ Ver todos los grupos

### 🟡 Moderador
- ✅ Ver solo sus grupos (donde son moderador)
- ✅ Ver tokens y cálculos
- ❌ No puede crear/editar/eliminar

### 🟢 Modelo
- ✅ Ver solo grupos donde están registradas
- ✅ Ver su ganancia estimada
- ❌ No puede crear/editar/eliminar

---

## 📁 Estructura de Firestore

### Colección: `users`
```
users/
  {uid}/
    ├── email: string
    ├── role: 'admin' | 'moderator' | 'model'
    ├── createdAt: timestamp
    └── displayName: string (opcional)
```

### Colección: `groups`
```
groups/
  {groupId}/
    ├── name: string
    ├── platform: 'Chaturbate' | 'Stripchat' | 'Camsoda'
    ├── moderator: string
    ├── models: array<string>
    ├── tokens: number
    ├── members_count: number
    └── createdAt: timestamp
```

---

## 🔒 Seguridad - Próximos Pasos (Importante)

En producción, configura Firestore Security Rules. Ejemplo:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Solo el usuario puede leer/escribir su documento
    match /users/{userId} {
      allow read, write: if request.auth.uid == userId;
    }

    // Admins leen/escriben grupos; otros solo leen
    match /groups/{groupId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
                      get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
  }
}
```

---

## 🧪 Pruebas Rápidas

### Test 1: Login Fallido
1. Pantalla de Login
2. Email incorrecto → Error: "El correo no está registrado"
3. Contraseña incorrecta → Error: "Contraseña incorrecta"

### Test 2: Admin Dashboard
1. Login con tu cuenta Admin
2. Deberías ver formulario "Crear Grupo"
3. Edita TRM y crea un grupo de prueba

### Test 3: Moderador Vista
1. Crea un usuario moderator
2. Login con esa cuenta
3. Solo ve grupos donde es moderador

### Test 4: Cierre de Sesión
1. Click en botón "🚪 Cerrar Sesión"
2. Regresa a pantalla de Login

---

## 🛠️ Archivos Modificados

| Archivo | Cambios |
|---------|---------|
| `src/firebase.js` | ✅ Agregada inicialización de Auth |
| `src/App.jsx` | ✅ Reescrito con auth flow y roles |
| `src/components/Login.jsx` | ✅ Nuevo componente de login |
| `scripts/create_admin_user.mjs` | ✅ Seed para primer admin |
| `scripts/create_users.mjs` | ✅ Seed para crear múltiples usuarios |

---

## ❓ Troubleshooting

### "No estoy logueado pero veo el login"
→ Limpia cookies del navegador (Ctrl+Shift+Del)

### "Error: Usuario no encontrado"
→ Revisa que creaste el usuario con el script o en Firebase Console

### "El rol no aparece"
→ Revisa que el documento en colección `users` tiene el campo `role`

### "Firestore rechaza la escritura"
→ Temporalmente, usa reglas: `allow read, write: if true;` (⚠️ solo dev)

---

## 📞 Soporte

Para problemas:
1. Revisa la consola del navegador (F12)
2. Revisa las logs en Firebase Console
3. Verifica que Firestore colecciones existen: `users` y `groups`

---

## 🎉 ¡Listo!

Tu sistema de autenticación profesional está operativo. 

**Próximos pasos opcionales:**
- [ ] Configurar Firestore Security Rules
- [ ] Añadir foto de perfil
- [ ] Implementar cambio de contraseña
- [ ] Añadir 2FA (autenticación de dos factores)
- [ ] Dashboard de estadísticas

¡Éxito! 🚀
