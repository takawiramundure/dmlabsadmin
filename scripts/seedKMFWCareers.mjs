import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc } from 'firebase/firestore';

// Firebase config
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

const seedData = {
    hero: {
        heading: "Current Job Postings",
        content: "Join our dedicated team of professionals committed to equity, empowerment, and excellence in community wellness.",
        enabled: true,
        sidebarContent: {
            showNews: true,
            showDonate: true,
            showSocials: true
        }
    },
    listings: {
        enabled: true
    },
    job_1: {
        heading: "Addiction Counsellor (RAAM)",
        location: "Kitchener, ON, Canada",
        jobType: "Full Time",
        pdfUrl: "https://kindmindsfamilywellness.org/wp-content/uploads/2024/02/Addiction-Counsellor-RAAM.pdf",
        enabled: true,
        order: 1
    },
    job_2: {
        heading: "Addiction Counsellor (CC)",
        location: "Kitchener, ON, Canada",
        jobType: "Contract",
        pdfUrl: "https://kindmindsfamilywellness.org/wp-content/uploads/2024/02/Addiction-Counsellor-CC.pdf",
        enabled: true,
        order: 2
    },
    job_3: {
        heading: "Overnight Attendant (CLT)",
        location: "Cambridge, ON, Canada",
        jobType: "Part Time",
        pdfUrl: "https://kindmindsfamilywellness.org/wp-content/uploads/2024/02/Overnight-Attendant-CLT.pdf",
        enabled: true,
        order: 3
    },
    job_4: {
        heading: "Landscape Labourer - Canada Summer Jobs",
        location: "Kitchener, ON, Canada",
        jobType: "Contract",
        externalLink: "https://www.jobbank.gc.ca/",
        enabled: true,
        order: 4
    },
    job_5: {
        heading: "Supervisor, Addiction Services (CLT)",
        location: "Cambridge, ON, Canada",
        jobType: "Contract",
        pdfUrl: "https://kindmindsfamilywellness.org/wp-content/uploads/2024/02/Supervisor-Addiction-Services.pdf",
        enabled: true,
        order: 5
    },
    job_6: {
        heading: "Donor Relations & Grants Coordinator",
        location: "Kitchener, ON, Canada",
        jobType: "Full Time",
        externalLink: "https://linktr.ee/kmfw",
        enabled: true,
        order: 6
    },
    job_7: {
        heading: "ShelterCare Support Worker, Nights Relief",
        location: "Waterloo, ON, Canada",
        jobType: "Part Time",
        pdfUrl: "https://kindmindsfamilywellness.org/wp-content/uploads/2024/02/ShelterCare-Support-Worker.pdf",
        enabled: true,
        order: 7
    },
    job_8: {
        heading: "Manager, Addiction Services (ACSS)",
        location: "Kitchener, ON, Canada",
        jobType: "Full Time",
        pdfUrl: "https://kindmindsfamilywellness.org/wp-content/uploads/2024/02/Manager-Addiction-Services.pdf",
        enabled: true,
        order: 8
    },
    job_9: {
        heading: "General Applications",
        location: "Waterloo Region, ON, Canada",
        jobType: "Other",
        buttonUrl: "mailto:careers@kindmindsfamilywellness.org",
        buttonText: "Inquire via Email",
        enabled: true,
        order: 9
    }
};

async function seedKMFWCareers() {
    console.log('Starting to seed KMFW Careers content...');
    try {
        const docRef = doc(db, 'kmfw_content', 'careers');
        await setDoc(docRef, seedData);
        console.log('✅ Successfully seeded KMFW Careers content!');
    } catch (error) {
        console.error('❌ Error seeding KMFW Careers:', error);
    }
}

seedKMFWCareers();
