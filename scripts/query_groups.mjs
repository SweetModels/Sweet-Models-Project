import { collection, getDocs } from 'firebase/firestore';
import { db } from '../src/firebase.js';

async function main(){
  const snap = await getDocs(collection(db,'groups'));
  const items = snap.docs.map(d=>({id:d.id, ...d.data()}));
  console.log('Total groups:', items.length);
  console.log(JSON.stringify(items, null, 2));
}

main().catch(err=>{ console.error(err); process.exit(1); });
