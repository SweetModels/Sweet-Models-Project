import { collection, getDocs } from 'firebase/firestore';
import { db } from '../src/firebase.js';

async function main(){
  const snap = await getDocs(collection(db,'groups'));
  const items = snap.docs.map(d=>({id:d.id, ...d.data()}));

  const moderator = 'demoModerator';
  const moderatorGroups = items.filter(g => (g.moderator||'').toLowerCase() === moderator.toLowerCase());

  const model = 'AndreaDemo';
  const modelGroups = items.filter(g => (g.models||[]).map(m=>m.toLowerCase()).includes(model.toLowerCase()));

  console.log('Moderator view for', moderator, '->', moderatorGroups.length, 'groups');
  console.log(JSON.stringify(moderatorGroups, null, 2));

  console.log('\nModel view for', model, '->', modelGroups.length, 'groups');
  console.log(JSON.stringify(modelGroups, null, 2));
}

main().catch(err=>{ console.error(err); process.exit(1); });
