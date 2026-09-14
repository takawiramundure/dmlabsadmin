
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, getDocs, deleteDoc } from 'firebase/firestore';
import { getAuth, signInAnonymously } from 'firebase/auth';

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || process.env.FIREBASE_API_KEY || "",
  authDomain: "nspc-web.firebaseapp.com",
  projectId: "nspc-web",
  storageBucket: "nspc-web.firebasestorage.app",
  messagingSenderId: "272421073172",
  appId: "1:272421073172:web:7250912c8b371828ff1201",
  measurementId: "G-Q5VQCL2QKW"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

const PRODUCTS = [
    {
        name: "BWEIC Signature T-Shirt",
        description: "Premium cotton t-shirt featuring the BWEIC logo. Available in various sizes. Represent the community in style and comfort.",
        price: 35.00,
        category: "Apparel",
        image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&q=80&w=800",
        published: true,
        order: 1,
        featured: true,
        type: "physical",
        buyLink: "", 
    },
    {
        name: "Empowerment Journal",
        description: "A beautifully designed journal for your daily thoughts, goals, and reflections. Hardcover with 200 lined pages.",
        price: 25.00,
        category: "Stationery",
        image: "https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&q=80&w=800",
        published: true,
        order: 2,
        featured: false,
        type: "physical",
        buyLink: "",
    },
    {
        name: "BWEIC Coffee Mug",
        description: "Start your day with inspiration. Ceramic mug with the BWEIC emblem and empowerment quote.",
        price: 15.00,
        category: "Accessories",
        image: "https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?auto=format&fit=crop&q=80&w=800",
        published: true,
        order: 3,
        featured: false,
        type: "physical",
        buyLink: "",
    },
    {
        name: "Financial Literacy for Women (E-Book)",
        description: "A comprehensive guide to financial freedom, written by BWEIC experts. Digital download.",
        price: 19.99,
        category: "Books",
        image: "https://images.unsplash.com/photo-1589829085413-56de8ae18c73?auto=format&fit=crop&q=80&w=800",
        published: true,
        order: 4,
        featured: true,
        type: "digital",
        buyLink: "",
    },
    {
        name: "Community Hoodie",
        description: "Warm and cozy hoodie perfect for Canadian winters. Embroidered BWEIC logo on the chest.",
        price: 65.00,
        category: "Apparel",
        image: "https://images.unsplash.com/photo-1556906781-9a412961d28c?auto=format&fit=crop&q=80&w=800",
        published: true,
        order: 5,
        featured: false,
        type: "physical",
        buyLink: "",
    },
    {
        name: "BWEIC Tote Bag",
        description: "Eco-friendly canvas tote bag for your everyday essentials. Durable and stylish.",
        price: 20.00,
        category: "Accessories",
        image: "https://images.unsplash.com/photo-1597484661643-2f5fef640dd1?auto=format&fit=crop&q=80&w=800",
        published: true,
        order: 6,
        featured: false,
        type: "physical",
        buyLink: "",
    }
];

async function seedProducts() {
  console.log("Seeding BWEIC products...");
  
  try {
    console.log("Attempting anonymous sign-in...");
    await signInAnonymously(auth);
    console.log("Signed in anonymously.");
  } catch (e) {
    console.error("Auth failed:", e.message);
    // Continue anyway, maybe rules are public (unlikely given previous error)
  }

  const collectionRef = collection(db, 'bweic_products');

  // CLEANUP: Delete existing products
  console.log("Cleaning up existing products...");
  try {
    const existingDocs = await getDocs(collectionRef);
    if (!existingDocs.empty) {
        const deletePromises = existingDocs.docs.map(doc => deleteDoc(doc.ref));
        await Promise.all(deletePromises);
        console.log(`Deleted ${existingDocs.size} existing products.`);
    }
  } catch (e) {
      console.error("Error reading/deleting products (check permissions):", e.message);
      process.exit(1);
  }

  // ADD NEW PRODUCTS
  for (const product of PRODUCTS) {
      try {
        const payload = {
            ...product,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        const docRef = await addDoc(collectionRef, payload);
        console.log(`Added product: ${product.name} (ID: ${docRef.id})`);
      } catch (e) {
          console.error(`Error adding product ${product.name}:`, e.message);
      }
  }

  console.log("Done seeding products.");
  process.exit(0);
}

seedProducts().catch((e) => {
    console.error("Unhandled error:", e);
    process.exit(1);
});
