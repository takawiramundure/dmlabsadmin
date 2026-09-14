import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, addDoc, collection } from 'firebase/firestore';

// Firebase config for BWEIC
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

const siteId = 'bweic';

// Page Content Data
const pageContents = {
    'who-we-are': {
        title: 'Who We Are',
        sections: {
            hero: {
                heading: 'Our Story',
                content: 'From Survival to Sovereignty'
            },
            mission: {
                heading: 'Mission',
                content: 'To create safe, affirming spaces where Black women in Canada can heal, grow, and reclaim their power—emotionally, economically, and socially—through community, education, advocacy, and storytelling.'
            },
            vision: {
                heading: 'Vision',
                content: 'A Canada where Black women are thriving, supported, and leading with confidence, dignity, and shared purpose.'
            },
            story: {
                heading: 'How We Began',
                content: `Black Women Empowerment Initiative Canada (BWEIC) was created in response to a simple but urgent truth: Black women in Canada are doing extraordinary work to survive and succeed—often without spaces that truly see, support, or protect them.

Across systems shaped by inequity, many Black women experience isolation, burnout, and barriers to culturally safe care, mentorship, and resources. BWEIC exists to bridge those gaps.

We are a Black women–led, community-centered initiative grounded in lived experience and collective care. Our work centers healing, empowerment, and belonging—creating spaces where Black women can rest, reconnect, build confidence, and access support without having to explain or justify their experiences.

At the heart of BWEIC is The Sovereignty Circle—a support and access hub rooted in peer connection, mentorship, and practical resource navigation. Through this work, we support Black women in moving beyond survival and toward sovereignty—defined by dignity, agency, and shared purpose.

This is more than a program. It is a growing community committed to seeing Black women thrive.`
            },
            founderNote: {
                heading: "Founder's Note",
                content: `BWEIC was not created from theory—it was born from lived experience, deep listening, and the quiet understanding of how often Black women are expected to carry everything alone.

I have witnessed the strength of Black women across communities, professions, and life stages. I have also witnessed the gaps—the moments when support is fragmented, when systems feel inaccessible, and when healing is postponed in the name of survival. BWEIC exists because Black women deserve more than resilience; we deserve rest, access, and spaces that honour our full humanity.

This initiative is rooted in the belief that healing is not separate from leadership, and that community is not a luxury—it is essential. Through culturally safe programming, mentorship, and The Sovereignty Circle, BWEIC is building pathways that support Black women as they reclaim agency, confidence, and connection on their own terms.

BWEIC is not about fixing Black women. It is about creating conditions where Black women can thrive—supported by community, strengthened by shared experience, and empowered by access.

Thank you for being part of this growing circle. The work is intentional. The pace is sustainable. And the vision is collective.

With care and purpose,
Esther Umazi Rongoma
Founder, Black Women Empowerment Initiative Canada`
            }
        }
    },
    'our-work': {
        title: 'Our Work',
        sections: {
            hero: {
                heading: 'Our Work',
                content: 'Creating pathways from survival to sovereignty through healing, empowerment, and community.'
            },
            overview: {
                heading: 'Integrated Support',
                content: 'BWEIC delivers integrated programming across four key areas, each designed to support Black women in moving beyond survival and toward sovereignty—defined by dignity, agency, and shared purpose. Our programs are grounded in lived experience, trauma-informed practices, and culturally responsive approaches that honor the full humanity of Black women.'
            }
        }
    },
    'healing-wellness': {
        title: 'Healing & Wellness',
        sections: {
            hero: {
                heading: 'Healing & Wellness',
                content: 'Creating trauma-informed, culturally safe spaces where Black women can prioritize their mental and emotional wellbeing.'
            },
            overview: {
                heading: 'Our Approach',
                content: 'We create trauma-informed, culturally safe spaces where Black women can prioritize their mental and emotional wellbeing. Through guided conversations, mental health awareness, rest-centered practices, and resilience-building activities, participants strengthen coping skills, reduce isolation, and access clear pathways to culturally responsive mental health supports when needed.'
            }
        }
    },
    'empowerment': {
        title: 'Empowerment & Capacity Building',
        sections: {
            hero: {
                heading: 'Empowerment & Capacity Building',
                content: 'Building confidence, leadership, and practical skills for navigating work, education, finances, and advocacy spaces.'
            },
            overview: {
                heading: 'Our Approach',
                content: 'We build confidence, leadership, and self-advocacy through programs focused on professional and personal development. Participants engage in leadership training, financial literacy, and system navigation support, integrating mental health–informed approaches to reduce stress and enhance capacity for decision-making and self-determination.'
            }
        }
    },
    'community': {
        title: 'Community & Belonging',
        sections: {
            hero: {
                heading: 'Community & Belonging',
                content: 'Reducing isolation and fostering connection through peer support, storytelling, and collective care.'
            },
            overview: {
                heading: 'Why Community Matters',
                content: 'We reduce isolation and foster connection through peer support, storytelling, collective care, and intergenerational dialogue. These spaces strengthen emotional wellbeing, identity affirmation, and shared purpose, providing the relational foundation that allows Black women to thrive together.'
            }
        }
    },
    'sovereignty-circle': {
        title: 'The Sovereignty Circle',
        sections: {
            hero: {
                heading: 'The Sovereignty Circle',
                content: 'A support and access hub bridging gaps in care, mentorship, and resources for Black women across Canada.'
            },
            overview: {
                heading: 'Our Approach',
                content: "The Sovereignty Circle is BWEIC's structured support and access hub, bridging gaps in care, mentorship, and resources for Black women across Canada. It offers peer support spaces, mentorship matching, and guided navigation to trusted programs and services, complementing community-based connection while helping women move from survival to sovereignty with dignity and agency."
            }
        }
    },
    'take-action': {
        title: 'Take Action',
        sections: {
            hero: {
                heading: 'Take Action',
                content: 'Join us in creating spaces where Black women can heal, grow, and thrive.'
            },
            overview: {
                heading: 'Ways to Get Involved',
                content: `There are many ways to support BWEIC's mission and contribute to building sovereignty for Black women across Canada.`
            }
        }
    },
    'shop': {
        title: 'Shop',
        sections: {
            hero: {
                heading: 'BWEIC Shop',
                content: `Support our mission while celebrating Black women's empowerment.`
            },
            comingSoon: {
                heading: 'Coming Soon',
                content: `We're building our online shop to offer merchandise, publications, and resources that celebrate and support Black women's empowerment across Canada.`
            }
        }
    }
};

// Videos Data
const videos = [
    {
        title: "Welcome to BWEIC",
        description: "An introduction to Black Women Empowerment Initiative Canada and our mission.",
        thumbnail: "https://images.unsplash.com/photo-1573164713988-8665fc963095?q=80&w=800&auto=format&fit=crop",
        videoUrl: "https://www.youtube.com/watch?v=example1",
        published: true,
        order: 1
    },
    {
        title: "Healing Circles: Creating Safe Spaces",
        description: "Learn about our trauma-informed healing circles and how they support Black women's wellbeing.",
        thumbnail: "https://images.unsplash.com/photo-1529070538774-1843cb3265df?q=80&w=800&auto=format&fit=crop",
        videoUrl: "https://www.youtube.com/watch?v=example2",
        published: true,
        order: 2
    },
    {
        title: "The Sovereignty Circle",
        description: "Discover our mentorship and support hub designed for Black women across Canada.",
        thumbnail: "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?q=80&w=800&auto=format&fit=crop",
        videoUrl: "https://www.youtube.com/watch?v=example3",
        published: true,
        order: 3
    }
];

// Partners Data
const partners = [
    {
        name: "Digital Maples",
        type: "Digital Partner",
        description: "Digital Maples is our technology and digital strategy partner, providing web development, digital infrastructure, and technical support to amplify BWEIC's mission and reach.",
        website: "https://www.digitalmaples.ca",
        logo: "https://images.unsplash.com/photo-1599305445671-ac291c95aaa9?q=80&w=400&auto=format&fit=crop",
        services: ["Web Development", "Digital Strategy", "Technical Support"],
        published: true,
        order: 1
    },
    {
        name: "Black Women's Publishing Collective",
        type: "Publishing Partner",
        description: "Our publishing partner helps amplify Black women's voices through storytelling, research dissemination, and community-informed publications.",
        website: "#",
        logo: "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?q=80&w=400&auto=format&fit=crop",
        services: ["Publishing Support", "Editorial Services", "Content Distribution"],
        published: true,
        order: 2
    }
];

async function seedPageContent() {
    console.log('Starting to seed page content...');
    
    try {
        for (const [pageId, content] of Object.entries(pageContents)) {
            const docRef = doc(db, `${siteId}_content`, pageId);
            await setDoc(docRef, {
                ...content,
                siteId,
                lastUpdated: new Date().toISOString(),
                updatedBy: 'system'
            });
            console.log(`✓ Seeded page: ${pageId}`);
        }
        console.log('✅ All page content seeded successfully!');
    } catch (error) {
        console.error('❌ Error seeding page content:', error);
    }
}

async function seedVideos() {
    console.log('\nStarting to seed videos...');
    
    try {
        const videosRef = collection(db, `${siteId}_videos`);
        for (const video of videos) {
            await addDoc(videosRef, {
                ...video,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            });
            console.log(`✓ Seeded video: ${video.title}`);
        }
        console.log('✅ All videos seeded successfully!');
    } catch (error) {
        console.error('❌ Error seeding videos:', error);
    }
}

async function seedPartners() {
    console.log('\nStarting to seed partners...');
    
    try {
        const partnersRef = collection(db, `${siteId}_partners`);
        for (const partner of partners) {
            await addDoc(partnersRef, {
                ...partner,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            });
            console.log(`✓ Seeded partner: ${partner.name}`);
        }
        console.log('✅ All partners seeded successfully!');
    } catch (error) {
        console.error('❌ Error seeding partners:', error);
    }
}

async function seedAll() {
    await seedPageContent();
    await seedVideos();
    await seedPartners();
    console.log('\n🎉 All data seeded successfully!');
    process.exit(0);
}

seedAll();
