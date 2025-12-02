import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../src/firebase.js';

async function main() {
  try {
    const docRef = await addDoc(collection(db, 'groups'), {
      name: 'Grupo Demo - Prueba',
      platform: 'Chaturbate',
      moderator: 'demoModerator',
      models: ['AndreaDemo', 'LuciaDemo'],
      members_count: 3,
      tokens: 12000,
      createdAt: serverTimestamp(),
    });
    console.log('Grupo creado con ID:', docRef.id);
  } catch (err) {
    console.error('Error creando grupo:', err);
    process.exit(1);
  }
}

main();
