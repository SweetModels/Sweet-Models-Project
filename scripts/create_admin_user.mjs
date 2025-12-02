import { createUserWithEmailAndPassword } from 'firebase/auth';
import { setDoc, doc } from 'firebase/firestore';
import { auth, db } from '../src/firebase.js';

/**
 * Script para crear tu primer usuario Admin en Firebase.
 * 
 * INSTRUCCIONES:
 * 1. Edita las variables EMAIL y PASSWORD abajo con tus credenciales.
 * 2. Ejecuta: node scripts/create_admin_user.mjs
 * 3. Si se crea correctamente, tu cuenta será Admin.
 * 
 * SEGURIDAD:
 * - Este script es solo para desarrollo.
 * - En producción, usa Firebase Console o un endpoint seguro.
 * - No commits este script con credenciales reales.
 */

const EMAIL = 'karber.pacheco007@gmail.com';      // 📝 EDITA CON TU EMAIL
const PASSWORD = 'Isaias..20-26.'; // 📝 EDITA CON TU CONTRASEÑA
const ROLE = 'admin';                   // Siempre 'admin' para este script

async function createAdminUser() {
  try {
    console.log(`\n🔐 Creando usuario Admin con email: ${EMAIL}`);

    // Crear usuario en Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(auth, EMAIL, PASSWORD);
    const uid = userCredential.user.uid;
    console.log(`✅ Usuario creado en Auth. UID: ${uid}`);

    // Crear documento en colección 'users' con rol 'admin'
    await setDoc(doc(db, 'users', uid), {
      email: EMAIL,
      role: ROLE,
      createdAt: new Date().toISOString(),
      displayName: 'Administrador',
    });
    console.log(`✅ Documento 'users' creado con rol: ${ROLE}`);

    console.log(`
✅ ¡Excelente! Tu cuenta Admin está lista:
   📧 Email: ${EMAIL}
   🔑 Contraseña: ${PASSWORD}
   👤 Rol: ${ROLE}

📌 Próximos pasos:
   1. Inicia sesión en la app con estas credenciales.
   2. El dashboard se cargará con acceso total (Admin).
   3. Para crear otros usuarios (Moderator/Model):
      - Usa el email del usuario como "Moderador" en los formularios
      - O crea manualmente los documentos en 'users' con sus IDs
    `);

    process.exit(0);
  } catch (err) {
    console.error(`\n❌ Error creando usuario Admin:`, err.message);
    console.error(`\n📌 Soluciones comunes:`);
    console.error(`   - Si email ya existe: usa otro email o elimina primero desde Firebase Console`);
    console.error(`   - Si contraseña es débil: usa al menos 6 caracteres`);
    console.error(`   - Si falla la conexión: revisa tu conexión a internet`);
    process.exit(1);
  }
}

createAdminUser();
