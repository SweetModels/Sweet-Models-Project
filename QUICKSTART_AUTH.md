# 🚀 Quick Start - Firebase Auth

## ⚡ En 5 Minutos

### 1. Crear Admin (Una sola vez)
```powershell
# Abre PowerShell en la carpeta del proyecto
cd "C:\Users\USUARIO\Desktop\Project SweetModels\sweet-models-admin"

# Ejecuta el script
node scripts/create_admin_user.mjs
```

Anota tus credenciales:
```
📧 Email: admin@example.com
🔑 Contraseña: SecurePassword123!
```

### 2. Iniciar el Servidor
```powershell
npm run dev
```

Abre: http://localhost:5173/

### 3. Login
- Email: `admin@example.com`
- Contraseña: `SecurePassword123!`

¡Listo! 🎉

---

## 📖 Documentación Completa

Ver: `AUTH_GUIDE.md`

---

## 🎯 Cambios Principales

| ¿Qué? | ¿Dónde? |
|-------|--------|
| Login | `src/components/Login.jsx` |
| Auth Setup | `src/firebase.js` |
| Dashboard | `src/App.jsx` |
| Crear Admin | `scripts/create_admin_user.mjs` |
| Crear Usuarios | `scripts/create_users.mjs` |

---

## 💡 Tips

- Conserva tus credenciales Admin en lugar seguro
- Cambia la contraseña por default después del primer login
- Usa emails reales (Firestore puede validar luego)
- Para dev/test, usa reglas permisivas en Firestore

---

## 🔐 Primera Vez Setup Checklist

- [ ] Ejecuté `create_admin_user.mjs`
- [ ] Tengo mis credenciales Admin
- [ ] Servidor dev está corriendo (npm run dev)
- [ ] Accedí a http://localhost:5173/
- [ ] Pude iniciar sesión
- [ ] Veo el Dashboard Admin

¡Ahora todo listo! 🎊
