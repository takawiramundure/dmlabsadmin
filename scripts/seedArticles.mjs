import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, Timestamp } from 'firebase/firestore';

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

// Use environment variables for flexibility
const COLLECTION_NAME = process.env.COLLECTION_NAME || 'bweic_articles';
const DATABASE_ID = process.env.DATABASE_ID || '(default)';

console.log(`Using Database: ${DATABASE_ID}`);
console.log(`Using Collection: ${COLLECTION_NAME}`);

const db = getFirestore(app, DATABASE_ID);

const articles = [
    {
        title: "Healing Circles: Creating Safe Spaces for Black Women",
        slug: "healing-circles-creating-safe-spaces",
        author: "Dr. Amara Johnson",
        date: Timestamp.fromDate(new Date('2025-01-15')),
        category: "Wellness",
        imageUrl: "https://images.unsplash.com/photo-1573164713988-8665fc963095?q=80&w=1200&auto=format&fit=crop",
        excerpt: "Discover how our trauma-informed healing circles provide culturally safe environments where Black women can heal, rest, and reclaim their emotional wellbeing.",
        content: `<p>In a world that often demands Black women to be strong, resilient, and endlessly giving, our healing circles offer something revolutionary: permission to rest, to feel, and to heal.</p>

<h2>What Are Healing Circles?</h2>
<p>Healing circles are trauma-informed, culturally safe spaces designed specifically for Black women. These gatherings create an environment where participants can share their experiences, process emotions, and find community support without judgment or the burden of explanation.</p>

<h2>The Power of Collective Healing</h2>
<p>Research shows that collective healing practices are particularly effective for addressing intergenerational trauma. When Black women gather in circles, they tap into ancestral wisdom and contemporary solidarity simultaneously.</p>

<h3>Key Elements of Our Circles</h3>
<ul>
<li>Trauma-informed facilitation by trained professionals</li>
<li>Culturally relevant practices and rituals</li>
<li>Confidential and judgment-free environment</li>
<li>Integration of traditional and contemporary healing modalities</li>
</ul>

<h2>Impact and Outcomes</h2>
<p>Participants in our healing circles report significant improvements in mental health, increased sense of community, and greater capacity for self-care. These circles become spaces where Black women can shed the armor of the "strong Black woman" stereotype and embrace their full humanity.</p>

<p>Join us in creating spaces where healing is not just possible—it's celebrated.</p>`,
        published: true
    },
    {
        title: "Leadership Development: Building Confidence and Capacity",
        slug: "leadership-development-building-confidence",
        author: "Michelle Thompson",
        date: Timestamp.fromDate(new Date('2025-01-10')),
        category: "Empowerment",
        imageUrl: "https://images.unsplash.com/photo-1529070538774-1843cb3265df?q=80&w=1200&auto=format&fit=crop",
        excerpt: "Learn about our leadership programs designed to build confidence, financial literacy, and self-advocacy skills for navigating professional systems.",
        content: `<p>Black women face unique challenges in professional environments—from microaggressions to systemic barriers. Our leadership development programs equip participants with the tools, knowledge, and confidence to not just navigate these systems, but to transform them.</p>

<h2>Our Approach to Leadership</h2>
<p>We believe leadership isn't just about climbing corporate ladders. It's about building capacity for self-advocacy, financial independence, and community impact.</p>

<h3>Program Components</h3>
<ul>
<li>Financial literacy and wealth-building strategies</li>
<li>Negotiation and self-advocacy skills</li>
<li>Navigating workplace dynamics and microaggressions</li>
<li>Building and leveraging professional networks</li>
<li>Strategic career planning and goal-setting</li>
</ul>

<h2>Real Stories, Real Impact</h2>
<p>Our participants have gone on to secure promotions, negotiate significant salary increases, start their own businesses, and become advocates for systemic change within their organizations.</p>

<p>Leadership development is not just about individual success—it's about collective empowerment and creating pathways for the next generation.</p>`,
        published: true
    },
    {
        title: "The Sovereignty Circle: Our New Mentorship Hub",
        slug: "sovereignty-circle-mentorship-hub",
        author: "Kendra Williams",
        date: Timestamp.fromDate(new Date('2024-12-28')),
        category: "Community",
        imageUrl: "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?q=80&w=1200&auto=format&fit=crop",
        excerpt: "Introducing our new support and access hub providing peer support, mentorship matching, and resource navigation for Black women across Canada.",
        content: `<p>We're thrilled to announce the launch of The Sovereignty Circle—a comprehensive mentorship and support hub designed to connect Black women across Canada with the resources, guidance, and community they need to thrive.</p>

<h2>What is The Sovereignty Circle?</h2>
<p>The Sovereignty Circle is more than a mentorship program. It's a holistic support ecosystem that recognizes the multifaceted needs of Black women navigating personal, professional, and community spaces.</p>

<h3>Core Features</h3>
<ul>
<li>One-on-one mentorship matching based on goals and interests</li>
<li>Peer support groups for shared experiences</li>
<li>Resource navigation assistance</li>
<li>Skill-building workshops and webinars</li>
<li>Networking events and community gatherings</li>
</ul>

<h2>How to Get Involved</h2>
<p>Whether you're seeking mentorship or ready to become a mentor yourself, The Sovereignty Circle welcomes you. Our matching process ensures meaningful connections that honor both mentors' expertise and mentees' aspirations.</p>

<p>Join us in building a network of empowered Black women supporting each other's sovereignty and success.</p>`,
        published: true
    },
    {
        title: "Understanding Intergenerational Trauma in Black Communities",
        slug: "understanding-intergenerational-trauma",
        author: "Dr. Simone Baptiste",
        date: Timestamp.fromDate(new Date('2024-12-20')),
        category: "Wellness",
        imageUrl: "https://images.unsplash.com/photo-1544027993-37dbfe43562a?q=80&w=1200&auto=format&fit=crop",
        excerpt: "Exploring the impact of intergenerational trauma and pathways to healing for Black women and their families.",
        content: `<p>Intergenerational trauma—the transmission of trauma from one generation to the next—is a reality that many Black communities face. Understanding this phenomenon is the first step toward breaking cycles and creating new narratives of healing.</p>

<h2>What is Intergenerational Trauma?</h2>
<p>Intergenerational trauma occurs when the psychological and emotional effects of traumatic experiences are passed down through families and communities. For Black communities, this includes the ongoing impacts of slavery, colonization, systemic racism, and discrimination.</p>

<h2>Signs and Symptoms</h2>
<p>Intergenerational trauma can manifest in various ways, including heightened stress responses, difficulty trusting others, patterns of self-sacrifice, and challenges with emotional expression.</p>

<h3>Pathways to Healing</h3>
<ul>
<li>Acknowledging and naming the trauma</li>
<li>Creating spaces for storytelling and truth-telling</li>
<li>Engaging in culturally relevant therapeutic practices</li>
<li>Building strong community connections</li>
<li>Practicing self-compassion and boundary-setting</li>
</ul>

<h2>Breaking the Cycle</h2>
<p>Healing from intergenerational trauma is both a personal and collective journey. By doing our own healing work, we create new possibilities for future generations.</p>`,
        published: true
    },
    {
        title: "Financial Literacy for Black Women: Building Generational Wealth",
        slug: "financial-literacy-building-wealth",
        author: "Jasmine Carter",
        date: Timestamp.fromDate(new Date('2024-12-15')),
        category: "Empowerment",
        imageUrl: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?q=80&w=1200&auto=format&fit=crop",
        excerpt: "Practical strategies for financial empowerment and wealth-building in Black communities.",
        content: `<p>Financial literacy is a critical tool for empowerment and liberation. Our financial education programs are designed to demystify money management and create pathways to generational wealth for Black women and their families.</p>

<h2>Why Financial Literacy Matters</h2>
<p>The wealth gap between Black and white families in Canada is significant and growing. Financial literacy education is one way to address this disparity and create economic sovereignty.</p>

<h3>Key Topics We Cover</h3>
<ul>
<li>Budgeting and money management basics</li>
<li>Understanding credit and debt management</li>
<li>Investment strategies for beginners</li>
<li>Homeownership and real estate</li>
<li>Entrepreneurship and business planning</li>
<li>Estate planning and wealth transfer</li>
</ul>

<h2>Building Wealth, Building Power</h2>
<p>Financial empowerment is about more than individual security—it's about building collective power and creating opportunities for future generations. Join our workshops and start your journey to financial sovereignty today.</p>`,
        published: true
    },
    {
        title: "Self-Care is Not Selfish: Reclaiming Rest as Resistance",
        slug: "self-care-rest-as-resistance",
        author: "Nia Robinson",
        date: Timestamp.fromDate(new Date('2024-12-08')),
        category: "Wellness",
        imageUrl: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?q=80&w=1200&auto=format&fit=crop",
        excerpt: "Why rest and self-care are revolutionary acts for Black women in a culture of overwork and self-sacrifice.",
        content: `<p>For Black women, rest is often seen as a luxury we can't afford. But what if rest is actually a form of resistance? What if caring for ourselves is a revolutionary act?</p>

<h2>The Myth of the Strong Black Woman</h2>
<p>The "strong Black woman" stereotype demands endless strength, resilience, and self-sacrifice. While strength is admirable, this narrative often comes at the cost of our health, wellbeing, and joy.</p>

<h2>Rest as Resistance</h2>
<p>When systems are designed to extract our labor and energy, choosing to rest becomes an act of resistance. Rest allows us to heal, to dream, and to imagine new possibilities beyond survival.</p>

<h3>Practical Self-Care Strategies</h3>
<ul>
<li>Setting and maintaining boundaries</li>
<li>Saying no without guilt or explanation</li>
<li>Creating rituals for rest and renewal</li>
<li>Building support systems and asking for help</li>
<li>Honoring your body's needs and signals</li>
</ul>

<h2>Permission to Rest</h2>
<p>You don't need to earn rest. You don't need to be productive to deserve care. Your existence is enough. Give yourself permission to rest, to heal, and to thrive.</p>`,
        published: true
    },
    {
        title: "Navigating Microaggressions in the Workplace",
        slug: "navigating-workplace-microaggressions",
        author: "Tasha Greene",
        date: Timestamp.fromDate(new Date('2024-12-01')),
        category: "Empowerment",
        imageUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=1200&auto=format&fit=crop",
        excerpt: "Strategies for recognizing, addressing, and healing from workplace microaggressions faced by Black women.",
        content: `<p>Microaggressions—subtle, often unintentional acts of discrimination—are a daily reality for many Black women in professional spaces. Learning to recognize and address them is crucial for workplace wellbeing.</p>

<h2>What Are Microaggressions?</h2>
<p>Microaggressions are brief, commonplace indignities that communicate hostile or derogatory messages. Examples include being asked to speak for all Black people, having your hair touched without permission, or being mistaken for support staff.</p>

<h3>Common Workplace Microaggressions</h3>
<ul>
<li>Being interrupted or spoken over in meetings</li>
<li>Having your ideas dismissed or attributed to others</li>
<li>Being subjected to tone policing</li>
<li>Facing assumptions about your role or capabilities</li>
<li>Experiencing exclusion from informal networks</li>
</ul>

<h2>Strategies for Response</h2>
<p>There's no one-size-fits-all approach to addressing microaggressions. Sometimes direct confrontation is appropriate; other times, documenting incidents and seeking support from HR or allies is more strategic.</p>

<h2>Healing and Community</h2>
<p>Experiencing microaggressions takes a toll. Building community with other Black women, seeking therapy, and practicing self-care are all important aspects of healing and resilience.</p>`,
        published: true
    },
    {
        title: "Celebrating Black Joy: Why Happiness is Revolutionary",
        slug: "celebrating-black-joy",
        author: "Zara Mitchell",
        date: Timestamp.fromDate(new Date('2024-11-25')),
        category: "Community",
        imageUrl: "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?q=80&w=1200&auto=format&fit=crop",
        excerpt: "Exploring the power and importance of Black joy as an act of resistance and affirmation.",
        content: `<p>In a world that often centers Black pain and trauma, choosing to celebrate Black joy is a radical act. Joy is not frivolous—it's essential, revolutionary, and deeply political.</p>

<h2>What is Black Joy?</h2>
<p>Black joy is the full, unapologetic expression of happiness, pleasure, and delight in Black life. It's dancing, laughing, creating, loving, and thriving despite—and in defiance of—systems designed to diminish us.</p>

<h2>Why Joy Matters</h2>
<p>Joy is not just a feeling—it's fuel for resistance and resilience. It reminds us what we're fighting for and sustains us through difficult times. Joy is a form of hope made visible.</p>

<h3>Ways to Cultivate Joy</h3>
<ul>
<li>Create and participate in cultural celebrations</li>
<li>Spend time with people who affirm and uplift you</li>
<li>Engage in activities that bring you pleasure</li>
<li>Document and share moments of joy</li>
<li>Practice gratitude and appreciation</li>
</ul>

<h2>Joy as Resistance</h2>
<p>When we choose joy, we refuse to be defined solely by our struggles. We claim our full humanity and create spaces where Black life can flourish. Let's celebrate our joy—loudly, proudly, and unapologetically.</p>`,
        published: true
    },
    {
        title: "Building Community: The Power of Black Women's Networks",
        slug: "power-of-black-womens-networks",
        author: "Imani Davis",
        date: Timestamp.fromDate(new Date('2024-11-18')),
        category: "Community",
        imageUrl: "https://images.unsplash.com/photo-1573164574572-cb89e39749b4?q=80&w=1200&auto=format&fit=crop",
        excerpt: "How Black women's networks create opportunities, provide support, and drive collective empowerment.",
        content: `<p>Black women's networks are more than professional associations—they're lifelines, support systems, and engines of collective power. These networks create spaces where Black women can connect, collaborate, and thrive together.</p>

<h2>The Importance of Community</h2>
<p>Isolation is one of the most significant challenges Black women face in professional and personal spaces. Networks combat this isolation by creating communities of belonging and mutual support.</p>

<h3>Benefits of Black Women's Networks</h3>
<ul>
<li>Access to mentorship and guidance</li>
<li>Professional development opportunities</li>
<li>Emotional support and validation</li>
<li>Resource sharing and collaboration</li>
<li>Collective advocacy and power-building</li>
</ul>

<h2>Creating and Sustaining Networks</h2>
<p>Building strong networks requires intentionality, reciprocity, and commitment. It means showing up for each other, sharing resources generously, and prioritizing collective success over individual achievement.</p>

<h2>Join the Movement</h2>
<p>Whether you're joining an existing network or starting your own, remember: we are stronger together. Let's build communities where every Black woman can thrive.</p>`,
        published: true
    },
    {
        title: "Mental Health Matters: Breaking Stigma in Black Communities",
        slug: "mental-health-breaking-stigma",
        author: "Dr. Aisha Campbell",
        date: Timestamp.fromDate(new Date('2024-11-10')),
        category: "Wellness",
        imageUrl: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?q=80&w=1200&auto=format&fit=crop",
        excerpt: "Addressing mental health stigma and increasing access to culturally competent care for Black women.",
        content: `<p>Mental health challenges affect Black women at significant rates, yet stigma and lack of access to culturally competent care create barriers to healing. It's time to change that narrative.</p>

<h2>The Mental Health Crisis</h2>
<p>Black women experience high rates of depression, anxiety, and trauma-related disorders, often compounded by experiences of racism, sexism, and economic stress. Yet we're less likely to seek help due to stigma and systemic barriers.</p>

<h3>Breaking Down Barriers</h3>
<ul>
<li>Normalizing conversations about mental health</li>
<li>Increasing access to Black therapists and counselors</li>
<li>Addressing financial barriers to care</li>
<li>Integrating cultural practices and healing modalities</li>
<li>Building peer support networks</li>
</ul>

<h2>Culturally Competent Care</h2>
<p>Finding a therapist who understands the unique experiences of Black women—who doesn't require you to explain racism or code-switching—can make all the difference in the healing journey.</p>

<h2>You Deserve Support</h2>
<p>Seeking help is not weakness—it's wisdom. Your mental health matters, and you deserve access to care that honors your full humanity. Let's break the stigma together.</p>`,
        published: true
    }
];

async function seedArticles() {
    console.log('Starting to seed blog articles...');
    
    try {
        for (const article of articles) {
            const docRef = await addDoc(collection(db, COLLECTION_NAME), {
                ...article,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            });
            console.log(`✓ Added article: "${article.title}" with ID: ${docRef.id}`);
        }
        
        console.log('\n✅ Successfully seeded all blog articles!');
        console.log(`Total articles added: ${articles.length}`);
    } catch (error) {
        console.error('❌ Error seeding articles:', error);
    }
}

seedArticles();
