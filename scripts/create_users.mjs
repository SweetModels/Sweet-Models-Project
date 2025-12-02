import { createUserWithEmailAndPassword } from 'firebase/auth';
import { setDoc, doc } from 'firebase/firestore';
import { auth, db } from '../src/firebase.js';

/**
 * Script para crear usuarios con roles Moderator o Model.
 * 
 * INSTRUCCIONES:
 * 1. Edita USER_CONFIG abajo con los datos de los usuarios a crear.
 * 2. Ejecuta: node scripts/create_users.mjs
 * 3. Cada usuario podrá iniciar sesión con sus credenciales.
 * 
 * EJEMPLO:
 * const USER_CONFIG = [
 *   { email: 'moderador1@example.com', password: 'Pass123!', role: 'moderator' },
 *   { email: 'model1@example.com', password: 'Pass123!', role: 'model' },
 * ];
 */

const USER_CONFIG = [
  // 📝 EDITA Y DESCOMENTA LOS USUARIOS QUE QUIERAS CREAR:
  // { email: 'moderador1@example.com', password: 'Pass123!', role: 'moderator' },
  // { email: 'modelo1@example.com', password: 'Pass123!', role: 'model' },
];

async function createUsers() {
  if (USER_CONFIG.length === 0) {
    console.log('⚠️  USER_CONFIG está vacío. Edita el script y añade usuarios a crear.');
    process.exit(0);
  }

  console.log(`\n🔐 Creando ${USER_CONFIG.length} usuario(s)...\n`);

  for (const userConfig of USER_CONFIG) {
    const { email, password, role } = userConfig;
    try {
      console.log(`  📧 Creando: ${email} (${role})...`);

      // Crear usuario en Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const uid = userCredential.user.uid;

      // Crear documento en colección 'users' con su rol
      await setDoc(doc(db, 'users', uid), {
        email,
        role,
        createdAt: new Date().toISOString(),
        displayName: email.split('@')[0],
      });

      console.log(`     ✅ Creado con éxito. UID: ${uid}\n`);
    } catch (err) {
      console.error(`     ❌ Error: ${err.message}\n`);
    }
  }

  console.log(`✅ Proceso completado.`);
  process.exit(0);
}

createUsers();
