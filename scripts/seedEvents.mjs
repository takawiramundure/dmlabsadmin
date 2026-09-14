
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, Timestamp } from 'firebase/firestore';

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

const EVENTS = [
  {
    title: "Healing & Wellness Circle: Winter Gathering",
    formattedDate: "Feb 15, 2025",
    timeRange: "6:00 PM - 9:00 PM EST",
    location: "Toronto, ON",
    category: "Healing & Wellness",
    imageUrl: "https://images.unsplash.com/photo-1573164713347-970b2ae74516?q=80&w=800&auto=format&fit=crop",
    description: "Join us for an evening of healing, storytelling, and community connection. This trauma-informed gathering creates a safe space for Black women to rest and reclaim their power.",
    registrationUrl: "#",
    date: new Date("2025-02-15T18:00:00")
  },
  {
    title: "Leadership Development Workshop: Finding Your Voice",
    formattedDate: "Feb 28, 2025",
    timeRange: "10:00 AM - 4:00 PM EST",
    location: "Virtual Event",
    category: "Empowerment",
    imageUrl: "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?q=80&w=800&auto=format&fit=crop",
    description: "A full-day intensive focused on building confidence, developing leadership skills, and creating actionable strategies for career advancement and self-advocacy.",
    registrationUrl: "#",
    date: new Date("2025-02-28T10:00:00")
  },
  {
    title: "Annual Gala: Celebrating Black Women's Excellence",
    formattedDate: "Mar 8, 2025",
    timeRange: "7:00 PM - 10:00 PM EST",
    location: "Vancouver, BC",
    category: "Community",
    imageUrl: "https://images.unsplash.com/photo-1511632765486-a01980e01a18?q=80&w=800&auto=format&fit=crop",
    description: "Our flagship event honoring Black women leaders and celebrating the community's achievements. Join us for an evening of inspiration, networking, and empowerment.",
    registrationUrl: "#",
    date: new Date("2025-03-08T19:00:00")
  },
  {
    title: "Spring Equinox Refresh",
    formattedDate: "Mar 20, 2025",
    timeRange: "5:30 PM - 8:00 PM EST",
    location: "Montreal, QC",
    category: "Wellness",
    imageUrl: "https://images.unsplash.com/photo-1519834785169-98be25ec3f84?q=80&w=800&auto=format&fit=crop",
    description: "Celebrate the arrival of spring with a rejuvenating evening of meditation, gentle movement, and plant-based nutrition.",
    registrationUrl: "#",
    date: new Date("2025-03-20T17:30:00")
  },
  {
    title: "Financial Freedom Masterclass",
    formattedDate: "Apr 5, 2025",
    timeRange: "1:00 PM - 3:30 PM EST",
    location: "Virtual Event",
    category: "Empowerment",
    imageUrl: "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?q=80&w=800&auto=format&fit=crop",
    description: "Learn the fundamentals of investing, debt management, and wealth building in this exclusive masterclass for BWEIC members.",
    registrationUrl: "#",
    date: new Date("2025-04-05T13:00:00")
  },
  {
    title: "Community Networking Mixer",
    formattedDate: "Apr 18, 2025",
    timeRange: "6:00 PM - 9:00 PM EST",
    location: "Halifax, NS",
    category: "Community",
    imageUrl: "https://images.unsplash.com/photo-1528605248644-14dd04022da1?q=80&w=800&auto=format&fit=crop",
    description: "Connect with fellow entrepreneurs, professionals, and creatives in your local community. Light refreshments provided.",
    registrationUrl: "#",
    date: new Date("2025-04-18T18:00:00")
  }
];

async function seedEvents() {
  console.log("Seeding BWEIC events...");
  const collectionRef = collection(db, 'bweic_events');

  for (const event of EVENTS) {
    try {
        const payload = {
            ...event,
            date: Timestamp.fromDate(event.date) // Convert JS Date to Firestore Timestamp
        };
        const docRef = await addDoc(collectionRef, payload);
        console.log(`Added event: ${event.title} (ID: ${docRef.id})`);
    } catch (e) {
        console.error(`Error adding event ${event.title}:`, e);
    }
  }

  console.log("Done seeding events.");
  process.exit(0);
}

seedEvents().catch(console.error);
