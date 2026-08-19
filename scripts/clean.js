import 'dotenv/config';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, deleteDoc, doc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID
};

async function clean() {
  console.log("\n========================================================");
  console.log("🧹 RYANZ CLOTHES - FIRESTORE CLEAN / WIPE SCRIPT");
  console.log("========================================================\n");

  if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
    console.error("❌ ERROR: Firebase credentials missing in .env file!");
    process.exit(1);
  }

  console.log(`Connecting to Firebase Project: \x1b[36m${firebaseConfig.projectId}\x1b[0m...`);

  try {
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);

    const collectionsToClear = ['products', 'categories', 'orders', 'reviews'];
    let totalDeleted = 0;

    for (const colName of collectionsToClear) {
      console.log(`\nDeleting documents from '\x1b[33m${colName}\x1b[0m'...`);
      const snap = await getDocs(collection(db, colName));
      for (const docSnap of snap.docs) {
        await deleteDoc(doc(db, colName, docSnap.id));
        console.log(`  ✓ Deleted ${colName}/${docSnap.id}`);
        totalDeleted++;
      }
      console.log(`  Finished cleaning '${colName}' (${snap.docs.length} docs).`);
    }

    console.log("\n========================================================");
    console.log(`🎉 SUCCESS: All Store Data Wiped! (${totalDeleted} total documents deleted)`);
    console.log("Firestore database is now completely clean.");
    console.log("========================================================\n");
    process.exit(0);

  } catch (error) {
    console.error("\n❌ Error wiping Firestore database:", error.message || error);
    process.exit(1);
  }
}

clean();
