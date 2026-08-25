import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc } from 'firebase/firestore';

// Firebase configuration
const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || process.env.FIREBASE_API_KEY || "",
    authDomain: "digital-maples-agency.firebaseapp.com",
    projectId: "digital-maples-agency",
    storageBucket: "digital-maples-agency.firebasestorage.app",
    messagingSenderId: "251751498453",
    appId: "1:251751498453:web:c64b5dd8f02c3be99b3f8a",
    measurementId: "G-HDKPBXMFV6"
};

// Inline Coping Data to avoid TS import issues
const COPING_RESOURCES = [
    {
        id: '1',
        title: "Hospice Niagara Grief Support",
        subtitle: "",
        content: "Hospice Niagara offers a variety of programs and workshops to help adults as well as programs that give children and youth a safe space to explore their feelings of grief and loss.\n\n(905) 984-8766\ninfo@hospiceniagara.ca",
        icon: "heart-outline",
        link: "",
        isActive: true
    },
    {
        id: '2',
        title: "Bereaved Families of Ontario",
        subtitle: "",
        content: "An association of families for parents who have lost a child through death and for children up to 19 years who have lost parents, siblings, or other significant persons through death. One-to-one and telephone support is also available.\n\n905-318-0070",
        icon: "people-outline",
        link: "",
        isActive: true
    },
    {
        id: '3',
        title: "Grief Share: Niagara Life Centre",
        subtitle: "",
        content: "Grief Share is a friendly support group of people who will walk alongside you through one of life’s most difficult experiences. Groups meet weekly to help you face these challenges and move toward rebuilding your life.\n\n905-934-0021",
        icon: "cafe-outline",
        link: "",
        isActive: true
    },
    {
        id: '4',
        title: "CMHA Ontario Bereavement Program",
        subtitle: "",
        content: "Whether you need support for your own grief or you’re supporting someone in theirs, grief is unique and CMHA is available to support you on your journey in a safe and supportive environment.",
        icon: "medkit-outline",
        link: "",
        isActive: true
    },
    {
        id: '5',
        title: "Hope for Wellness Helpline",
        subtitle: "(for Indigenous Peoples)",
        content: "Available to all Indigenous people across Canada. Experienced and culturally competent counsellors are reachable by telephone and online ‘chat’ 24/7.\n\n1-855-242-3310",
        icon: "call-outline",
        link: "",
        isActive: true
    }
];

// Inline Crisis Data
const CRISIS_RESOURCES = [
    { id: '1', name: 'Crisis Outreach (COAST)', color: '#00C2E0', link: 'https://niagara.cmha.ca/brochure/i-am-in-crisis/', isActive: true },
    { id: '2', name: 'Boots on the Ground', color: '#40C4AA', link: 'https://www.bootsontheground.ca/', isActive: true },
    { id: '3', name: 'Distress Centre Niagara', color: '#1B3B8C', link: 'http://www.distresscentreniagara.com/', isActive: true },
    { id: '4', name: 'Pathstone Mental Health', color: '#A5C93F', link: 'https://pathstonementalhealth.ca/', isActive: true },
    { id: '5', name: 'Hope for Wellness', color: '#EE3135', link: 'https://www.hopeforwellness.ca/', isActive: true },
    { id: '6', name: "Jeunesse J'ecoute", color: '#004A41', link: 'https://jeunessejecoute.ca/', isActive: true },
    { id: '7', name: '9-8-8 Suicide Crisis Helpline', color: '#00B5E2', link: 'https://988.ca/', isActive: true },
    { id: '8', name: 'Kids Help Phone', color: '#004F59', link: 'http://www.kidshelpphone.ca/', isActive: true },
    { id: '9', name: 'National Farmers Crisis Line', color: '#BF9B0B', link: 'https://ccaw.ca/national-farmer-wellness-network/', isActive: true }
];

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function seedContent() {
    console.log('🌱 Starting content seeding...\n');

    try {
        // Seed NSPC Coping Content
        console.log('📝 Seeding NSPC Coping with Loss content...');
        const copingDocRef = doc(db, 'nspc_content', 'coping');
        await setDoc(copingDocRef, {
            resources: COPING_RESOURCES,
            lastUpdated: new Date().toISOString(),
            updatedBy: 'seeding-script'
        }, { merge: true });
        console.log('✅ NSPC Coping content seeded successfully!');

        // Seed NSPC Crisis Support Content
        console.log('📝 Seeding NSPC Crisis Support content...');
        const crisisDocRef = doc(db, 'nspc_content', 'crisis_support');
        await setDoc(crisisDocRef, {
            resources: CRISIS_RESOURCES,
            lastUpdated: new Date().toISOString(),
            updatedBy: 'seeding-script'
        }, { merge: true });
        console.log('✅ NSPC Crisis Support content seeded successfully!');
        
        console.log(`\n🎉 All content seeded!`);
        console.log(`- Coping Resources: ${COPING_RESOURCES.length}`);
        console.log(`- Crisis Resources: ${CRISIS_RESOURCES.length}`);
        
        process.exit(0);
    } catch (error) {
        console.error('\n❌ Error seeding content:', error);
        process.exit(1);
    }
}

// Run the seeding function
seedContent();
