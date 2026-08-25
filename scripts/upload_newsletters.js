
import { initializeApp } from 'firebase/app';
import { getStorage, ref, uploadBytes } from 'firebase/storage';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Load environment variables from admin-portal/.env
dotenv.config({ path: path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../.env') });

const firebaseConfig = {
    apiKey: process.env.VITE_FIREBASE_API_KEY,
    authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const storage = getStorage(app);

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicPath = path.resolve(__dirname, '../../kmfw-web/public/newsletters');
const files = ['Summer-2024.pdf', 'Fall-2024.pdf', 'Inaugural-Newsletter.pdf'];

async function uploadFiles() {
    console.log("Starting newsletter upload to Firebase Storage...");
    
    for (const fileName of files) {
        const filePath = path.join(publicPath, fileName);
        if (!fs.existsSync(filePath)) {
            console.error(`File not found: ${filePath}`);
            continue;
        }

        const fileBuffer = fs.readFileSync(filePath);
        const storageRef = ref(storage, `kmfw/newsletters/${fileName}`);

        try {
            console.log(`Uploading ${fileName}...`);
            await uploadBytes(storageRef, fileBuffer, { contentType: 'application/pdf' });
            console.log(`✅ Success: ${fileName} uploaded to kmfw/newsletters/`);
        } catch (error) {
            console.error(`❌ Error uploading ${fileName}:`, error.message);
        }
    }
}

uploadFiles().then(() => {
    console.log("Upload process complete.");
    process.exit(0);
}).catch(err => {
    console.error("Fatal error:", err);
    process.exit(1);
});
