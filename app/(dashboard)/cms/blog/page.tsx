"use client";

import { useState, useEffect } from "react";
import { Timestamp } from "firebase/firestore";
import PageMeta from "@/components/common/PageMeta";
import Button from "@/components/ui/button/Button";
import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import Alert from "@/components/ui/alert/Alert";
import { Modal } from "@/components/ui/modal";
import { FirestoreService, PageContent } from "@/services/firestore";
import { useSite } from "@/context/SiteContext";
import MediaLibrary from "@/components/common/MediaLibrary";
import RichTextEditor from "@/components/form/RichTextEditor";
import { Search, Sparkles } from 'lucide-react';
import SEOEditor from "@/components/form/SEOEditor";
import { SEED_DATA } from "@/config/seedData";
import { useDialog } from "@/context/DialogContext";
import AiBlogGeneratorModal from "@/components/common/AiBlogGeneratorModal";
import {
    UserIcon,
    CalenderIcon,
    PencilIcon,
    TrashBinIcon,
    FolderIcon,
    PlusIcon,
} from "@/icons";
import VersionHistoryManager from "@/components/cms/VersionHistoryManager";

interface Article {
    id: string;
    title: string;
    slug: string;
    author: string;
    date: any; // Timestamp or Date
    category: string;
    imageUrl: string;
    excerpt: string;
    content: string;
    published: boolean;
    videoUrl?: string;
    seo?: {
        title?: string;
        description?: string;
        image?: string;
    };
    createdAt?: string;
    updatedAt?: string;
}

interface BlogPageContent extends PageContent {
    seo?: {
        title?: string;
        description?: string;
        image?: string;
    };
    sections?: {
        hero?: {
            heading: string;
            content: string;
            enabled?: boolean;
            order?: number;
        };
    };
}

export default function BlogManager() {
    const { currentSite } = useSite();
    const { confirm, alert: dialogAlert } = useDialog();
    const [articles, setArticles] = useState<Article[]>([]);
    const [pageContent, setPageContent] = useState<BlogPageContent | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [pageSaving, setPageSaving] = useState(false);
    const [error, setError] = useState("");
    const [successMsg, setSuccessMsg] = useState("");

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isAiModalOpen, setIsAiModalOpen] = useState(false);
    const [isMediaLibraryOpen, setIsMediaLibraryOpen] = useState(false);
    const [currentArticleId, setCurrentArticleId] = useState<string | null>(null);

    const handleAiGenerated = (data: {
        title: string;
        excerpt: string;
        content: string;
        seoTitle: string;
        seoDescription: string;
        tags: string[];
    }) => {
        const autoSlug = data.title
            .toLowerCase()
            .replace(/[^\w\s-]/g, '')
            .replace(/\s+/g, '-');

        setCurrentArticleId(null);
        setFormData({
            title: data.title,
            slug: autoSlug,
            author: currentSite.name + " Team",
            category: "General",
            imageUrl: "",
            excerpt: data.excerpt,
            content: data.content,
            published: false,
            videoUrl: "",
            date: new Date(),
            seo: {
                title: data.seoTitle,
                description: data.seoDescription,
            }
        });
        setIsModalOpen(true);
        setSuccessMsg("Article draft generated with AI! Review and publish when ready.");
    };

    // Form Data
    const [formData, setFormData] = useState<Partial<Article>>({
        title: "",
        slug: "",
        author: "",
        category: "",
        imageUrl: "",
        excerpt: "",
        content: "",
        published: false,
        videoUrl: "",
        date: new Date(),
        seo: {
            title: "",
            description: "",
            image: ""
        }
    });

    useEffect(() => {
        loadArticles();
        loadPageContent();
    }, [currentSite.id]);

    const loadPageContent = async () => {
        try {
            const data: any = await FirestoreService.getPageContent("blog", currentSite.id);
            if (data) {
                setPageContent(data);
            } else {
                const siteSeed = SEED_DATA[currentSite.id as keyof typeof SEED_DATA];
                setPageContent({
                    seo: siteSeed?.blog?.seo || {},
                    sections: siteSeed?.blog?.sections || {
                        hero: { heading: "Blog", content: "Latest updates and insights." }
                    }
                } as any);
            }
        } catch (err) {
            console.error(err);
        }
    };

    const loadArticles = async () => {
        setLoading(true);
        try {
            const data = await FirestoreService.getArticles(currentSite.id);
            // Sort by date descending
            const sorted = data.sort((a: any, b: any) => {
                const getTime = (d: any) => {
                    if (!d) return 0;
                    if (d.seconds) return d.seconds * 1000;
                    if (d instanceof Date) return d.getTime();
                    const parsed = new Date(d);
                    return isNaN(parsed.getTime()) ? 0 : parsed.getTime();
                };
                return getTime(b.date) - getTime(a.date);
            });
            setArticles(sorted as Article[]);
        } catch (err) {
            console.error(err);
            setError("Failed to load articles.");
        } finally {
            setLoading(false);
        }
    };

    const generateSlug = (title: string) => {
        return title
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '');
    };

    const handlePageSave = async () => {
        setPageSaving(true);
        setError("");
        setSuccessMsg("");
        try {
            await FirestoreService.savePageContent("blog", pageContent!, currentSite.id);
            setSuccessMsg("Blog page settings saved successfully!");
            setTimeout(() => setSuccessMsg(""), 3000);
        } catch (err) {
            console.error(err);
            setError("Failed to save blog page settings.");
        } finally {
            setPageSaving(false);
        }
    };

    const handlePageSEOChange = (field: string, value: string) => {
        setPageContent((prev: any) => ({
            ...prev,
            seo: { ...prev?.seo, [field]: value }
        }));
    };
    
    const handleArticleSEOChange = (field: string, value: string) => {
        setFormData((prev: any) => ({
            ...prev,
            seo: { ...prev?.seo, [field]: value }
        }));
    };

    const handleSave = async () => {
        if (!formData.title || !formData.author) {
            setError("Title and Author are required.");
            return;
        }

        setSaving(true);
        setError("");
        setSuccessMsg("");

        try {
            // Auto-generate slug if empty
            const slug = formData.slug || generateSlug(formData.title);

            const articleData = {
                ...formData,
                slug,
                date: typeof formData.date === 'string' ? new Date(formData.date) : formData.date
            };

            await FirestoreService.saveArticle(currentSite.id, articleData, currentArticleId || undefined);

            setSuccessMsg(currentArticleId ? "Article updated successfully!" : "Article created successfully!");
            setIsModalOpen(false);
            loadArticles();

            setTimeout(() => setSuccessMsg(""), 3000);
        } catch (err) {
            console.error(err);
            setError("Failed to save article.");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        const isConfirmed = await confirm({
            title: "Delete Article",
            message: "Are you sure you want to delete this article? This action cannot be undone.",
            variant: "danger",
            confirmLabel: "Delete"
        });

        if (!isConfirmed) return;

        try {
            await FirestoreService.deleteArticle(currentSite.id, id);
            setArticles(articles.filter(a => a.id !== id));
            setSuccessMsg("Article deleted successfully.");
            setTimeout(() => setSuccessMsg(""), 3000);
        } catch (err) {
            console.error(err);
            setError("Failed to delete article.");
        }
    };

    const formatDateForInput = (date: any) => {
        if (!date) return "";
        const d = date.toDate ? date.toDate() : new Date(date);
        if (isNaN(d.getTime())) return "";
        
        const pad = (num: number) => num.toString().padStart(2, '0');
        const year = d.getFullYear();
        const month = pad(d.getMonth() + 1);
        const day = pad(d.getDate());
        const hours = pad(d.getHours());
        const minutes = pad(d.getMinutes());
        
        return `${year}-${month}-${day}T${hours}:${minutes}`;
    };

    const openNewArticleModal = () => {
        setCurrentArticleId(null);
        setFormData({
            title: "",
            slug: "",
            author: "",
            category: "",
            imageUrl: "",
            excerpt: "",
            content: "",
            published: false,
            videoUrl: "",
            date: new Date(),
        });
        setIsModalOpen(true);
    };

    const openEditModal = (article: Article) => {
        setCurrentArticleId(article.id);
        const dateObj = article.date?.toDate ? article.date.toDate() : new Date(article.date);

        setFormData({
            ...article,
            date: dateObj
        });
        setIsModalOpen(true);
    };

    const handleImageSelect = (url: string) => {
        setFormData({ ...formData, imageUrl: url });
        setIsMediaLibraryOpen(false);
    };

    const handleSeedArticles = async () => {
        const isBWEIC = currentSite.id === 'bweic';
        const isAitasol = currentSite.id === 'aitasol';
        const isKMFW = currentSite.id === 'kmfw';
        
        let siteName = "DMLabs";
        if (isBWEIC) siteName = "BWEIC";
        if (isAitasol) siteName = "Aitasol";
        if (isKMFW) siteName = "KMFW";

        const isConfirmed = await confirm({
            title: "Seed Default Data",
            message: `Seed default ${siteName} blog articles into Firestore for "${currentSite.name}"? Existing articles will not be deleted.`,
            variant: "warning",
            confirmLabel: "Seed Data"
        });

        if (!isConfirmed) return;
        setSaving(true);
        setError("");
        setSuccessMsg("");
        try {
            const aitasolArticles = [
                { 
                    id: 'study-in-canada-2024', 
                    title: 'Ultimate Guide to Studying in Canada for 2024', 
                    slug: 'ultimate-guide-to-studying-in-canada-2024', 
                    author: 'Aitasol Admissions', 
                    category: 'Canada', 
                    date: new Date('2024-04-10'), 
                    imageUrl: 'https://images.unsplash.com/photo-1503614472-8c93d56e92ce?q=80&w=800&fit=crop', 
                    excerpt: 'Everything you need to know about the latest visa changes, university rankings, and post-study work permits in Canada.', 
                    content: '<h2>Why Canada?</h2><p>Canada remains a top choice for international students due to its high-quality education and welcoming policies. In 2024, the government has introduced several updates that every student should know...</p><h3>New Visa Regulations</h3><p>The IRCC has implemented a new attestation letter system to ensure sustainable growth in the international student sector. While this adds a step, it also ensures that students who receive visas are coming to reputable institutions with guaranteed support.</p>', 
                    published: true 
                },
                { 
                    id: 'scholarship-success-tips', 
                    title: 'Top 5 Tips for a Successful Scholarship Application', 
                    slug: 'top-5-tips-for-a-successful-scholarship-application', 
                    author: 'Aitasol Counselors', 
                    category: 'Scholarships', 
                    date: new Date('2024-03-25'), 
                    imageUrl: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?q=80&w=800&fit=crop', 
                    excerpt: 'Securing financial aid is a competitive process. Learn how to craft a compelling essay and build a profile that stands out to scholarship committees.', 
                    content: '<h2>Winning the Scholarship Game</h2><p>Financial barriers shouldn\'t stop you from global education. Many universities offer fully-funded or partial scholarships based on merit and need. Here is how you can maximize your chances...</p>', 
                    published: true 
                }
            ];

            const kmfwArticles = [
                { 
                    id: 'kmfw-four-years-strong', 
                    title: 'Kind Minds Family Wellness is Four Years Strong!', 
                    slug: 'kmfw-four-years-strong', 
                    author: 'Ajirioghene Evi', 
                    category: 'Anniversary', 
                    date: new Date('2024-08-20'), 
                    imageUrl: 'https://images.unsplash.com/photo-1513151233558-d860c5398176?q=80&w=800&fit=crop', 
                    excerpt: '🎉 Celebrating 4 incredible years of making a difference! A message from our Founder and Executive Director.', 
                    content: '<p>🎉 Celebrating 4 incredible years of making a difference! 🎉</p><p>Here is a message from our Founder and Executive Director, Ajirioghene Evi.</p><blockquote>"I am thrilled to celebrate Kind Minds Family Wellness\'s fourth anniversary! As the inaugural Executive Director, it has been an honor to witness the incredible work we have accomplished as an organization. Over the years, we have touched countless lives, providing short—and long-term support to individuals and families. Our program evaluations and outreach efforts have strengthened communities and continue to address the disproportionate challenges they face through advocacy and system navigation."</blockquote><p>To read more, please look through the slides on our post.</p><p>#Anniversary #4years #nonprofit #gratitude</p>', 
                    published: true 
                },
                { 
                    id: 'kmfw-4th-anniversary-fundraiser', 
                    title: 'Kind Minds Family Wellness 4th Anniversary Fundraiser', 
                    slug: 'kmfw-4th-anniversary-fundraiser', 
                    author: 'Olusegun Isioye', 
                    category: 'Fundraiser', 
                    date: new Date('2024-06-12'), 
                    imageUrl: 'https://images.unsplash.com/photo-1532629345422-7515f3d16bb6?q=80&w=800&fit=crop', 
                    excerpt: 'Our Goal: $40,000 by August 20, 2024. Join us in making a difference and building a brighter future.', 
                    content: '<p>Celebrating four years of dedicated service to the racialized community means the world to us, but it means even more to the individuals whose lives we\'ve touched. This year, we have supported and engaged with more individuals than ever before, surpassing last year\'s numbers.</p><p>Our growth is evident, and our mission is to continue expanding our workforce and enhancing our services to transform the lives of those in the Waterloo Region.</p><h3>Our comprehensive services include:</h3><ul><li>Culturally Grounded Counseling</li><li>Culturally Informed Educational Programs & Groups</li><li>Advocacy</li><li>Training & Education</li><li>Research & Consultancy</li><li>Community Support & Engagement</li><li>Systems Navigation</li><li>Career Services & Employment Support</li></ul><p><strong>Our Goal: $40,000 by August 20, 2024</strong></p><p>We are aiming to raise $40,000, and we need your help. We encourage donations of $4-$40 or more. Together, we can transform our community into a better society. With food inflation at an all-time high, many individuals struggle to afford essential items, especially pricier African foods. Additionally, newcomers face significant challenges in navigating the job market due to disparities in their previous experiences.</p><p>Partner with us as we expand our services to meet the daily needs of our community. Together, we can create lasting change and build a brighter future for all. Donate today and become a vital part of the work we do.</p><p>E-transfers can be sent to <strong>payments@kindmindsfamilywellness.org</strong>.</p><p>Thank you for your support!</p><p><strong>Olusegun Isioye</strong><br/>Manager of Client Services & Program Coordination</p>', 
                    published: true 
                },
                { 
                    id: 'celebrating-fathers-day-2024', 
                    title: 'Celebrating Father\'s Day', 
                    slug: 'celebrating-fathers-day-2024', 
                    author: 'Olusegun Isioye', 
                    category: 'Community', 
                    date: new Date('2024-06-14'), 
                    imageUrl: 'https://images.unsplash.com/photo-1550133730-695473e510b0?q=80&w=800&fit=crop', 
                    excerpt: 'Fatherhood is a calling to leadership within the smallest unit of society. We celebrate every father and father figure in our community.', 
                    content: '<p>Fatherhood is a calling to leadership within the smallest unit of society, ensuring that our children can contribute positively to the growth and development of our communities. As John C. Maxwell aptly states, "Leadership is influence," and this is precisely what every father needs to thrive in their role.</p><p>Guiding young minds to believe in the family\'s vision and inspiring them to act is pivotal. Achieving these great feats requires exceptional care for children, nurturing a strong culture, effective communication, exemplary parenting styles, and collaborations within the nuclear family, extended family, and society at large.</p><p>Though Father’s Day may not receive as much fanfare, we choose to celebrate every father and father figure, including stepfathers, fathers-in-law, guardians, and family friends who have significantly contributed to guiding children towards creating bright futures for themselves and society. Despite facing societal pressures, these men remain resilient, consistently exceeding their daily responsibilities.</p><p>Love is a vital component of performing optimally, and those leaders who embody this trait succeed not only in their families but also in their businesses and countries, gaining worldwide recognition. We encourage you to celebrate any father figure in your life as we honor all the fathers in our community.</p><p>Happy Father’s Day!</p><p><strong>Olusegun Isioye</strong><br/>Manager of Client Services & Program Coordination<br/>BDS, EMBA</p>', 
                    published: true 
                },
                { 
                    id: 'black-history-month-markers-of-the-past', 
                    title: 'Black History Month: MARKERS OF THE PAST', 
                    slug: 'black-history-month-markers-of-the-past', 
                    author: 'Olusegun Isioye', 
                    category: 'History', 
                    date: new Date('2024-02-01'), 
                    imageUrl: 'https://images.unsplash.com/photo-1614030424754-24d9e97f0229?q=80&w=800&fit=crop', 
                    excerpt: 'Reflections on Black History Month: Exploring the "markers of the past" to mold a shared and promising future.', 
                    content: '<p>Greetings everyone, I am Olusegun Isioye, Manager of Client Services and Program Coordination. I am here to share my reflections as we commemorate Black History Month in our communities.</p><p>In our pursuit of a shared and promising future, it is essential to delve into the factors that have molded our present—what I refer to as the "markers of the past." The Government of Canada notes that over 400 years ago, the first person of African heritage arrived in what is now Canada. In 1628, Oliver Lejeune became the first recorded enslaved African to live in Canada, his birth name lost to history.</p><p>While slavery was officially abolished in 1833, its impact lingers, particularly in the realm of identity. Identity, encompassing names, origin, culture, individuality, and the unity of the Black community, bears a significant gap in collaboration. I urge that these collaborations must extend beyond music into science, technology, economics, healthcare, and other sectors to amplify the greatness within us and to heal the scars of colonization.</p><h3>Coping with the impact of scars from anti-Black racism:</h3><ol><li><strong>Seek Support:</strong> Surround yourself with a supportive community that understands and validates your experiences.</li><li><strong>Therapy and Counseling:</strong> Professional therapy can be a valuable resource for processing emotions and developing coping strategies.</li><li><strong>Self-Care Practices:</strong> Prioritize self-care to nurture your mental, emotional, and physical well-being.</li><li><strong>Educate Yourself and Others:</strong> Knowledge is empowering. Understanding the roots of racism can provide context and combat isolation.</li><li><strong>Advocacy and Activism:</strong> Channeling your energy into creating positive change can be empowering.</li></ol><p>At Kind Minds Family Wellness, we are committed to nurturing leadership capabilities not only within our organization but also among our clients. We aim to foster leaders capable of solving problems, envisioning change, and empowering Black communities.</p>', 
                    published: true 
                },
                { 
                    id: 'kmfw-happy-new-year-2024', 
                    title: 'HAPPY NEW YEAR!', 
                    slug: 'kmfw-happy-new-year-2024', 
                    author: 'Kind Minds Family Wellness', 
                    category: 'Greetings', 
                    date: new Date('2024-01-01'), 
                    imageUrl: 'https://images.unsplash.com/photo-1467810563316-b5476525c0f9?q=80&w=800&fit=crop', 
                    excerpt: 'Happy New Year from Kind Minds Family Wellness! A look back at our impact in 2023 and our vision for 2024.', 
                    content: '<p>Happy New Year from Kind Minds Family Wellness! As we joyfully usher in the new year, we want to express our deepest gratitude to all our stakeholders who have been an integral part of our journey.</p><p>In 2023, we worked tirelessly to foster empowerment and resilience within our community. We offered specialized Afrocentric counselling, educational and psychoeducational programs, and research advocacy to address anti-Black racism and systemic oppression.</p><h3>A glimpse of the impact we have made together in 2023:</h3><ul><li><strong>Culturally Grounded Counseling:</strong> Tailored support promoting well-being and healing.</li><li><strong>Research & Consultancy:</strong> Understanding and addressing the needs of racialized groups.</li><li><strong>Culturally Informed Educational Programs:</strong> Specialized groups for children to seniors.</li><li><strong>Advocacy and Education:</strong> Workshops on anti-Black racism and Black history.</li><li><strong>Community Support and Engagement:</strong> Standing alongside newcomers and facilitating youth activities.</li><li><strong>Career Services and Employment Support:</strong> Coaching, mentorship, and financial literacy.</li></ul><p>As we step into 2024, we are excited about the possibilities and look forward to continued collaboration. Together, we will build on the foundation laid in 2023 and strive for an even more significant positive impact.</p><p>#HappyNewYear #KindMinds2024 #CommunityStrengths</p>', 
                    published: true 
                },
                { 
                    id: 'kmfw-fathers-day-message-2023', 
                    title: 'HAPPY FATHER\'S DAY: A Message from the Heart', 
                    slug: 'kmfw-fathers-day-message-2023', 
                    author: 'Ajirioghene Evi', 
                    category: 'Greetings', 
                    date: new Date('2023-06-18'), 
                    imageUrl: 'https://images.unsplash.com/photo-1590073242678-70ee3fc28e8e?q=80&w=800&fit=crop', 
                    excerpt: 'A message from our Executive Director to all the father figures invested in the lives of our community.', 
                    content: '<p>Happy Father\'s Day to all fathers and those stepping in as father figures 🙌🏾</p><p>Our leadership team has this message for you 👇🏽</p><blockquote>"To all the father figures out there who are invested in the lives of children and youth whose identities are pushed to the margins, I want you to know you are powerful, resilient, and deeply valued. Your role in the lives of our children, youth and loved ones is immeasurable and essential."</blockquote><p>In a world that may sometimes attempt to diminish your worth or challenge your abilities, remember that you are a beacon of strength and inspiration. By being present in their lives, you are breaking down barriers and defying stereotypes.</p><p>Continue to be a guiding light, a source of inspiration, and an unwavering force of love in the lives of your/our children and youth. Your presence makes a difference, and your impact is immeasurable. The world is a better place because of you, and the future is brighter because of the love and guidance you provide.</p><p>With utmost respect and admiration,<br/><strong>Ajirioghene on behalf of KMFW!</strong></p>', 
                    published: true 
                },
                { 
                    id: 'kmfw-black-women-cambridge-event', 
                    title: 'Celebration and learning from Black Women in our community event', 
                    slug: 'kmfw-black-women-cambridge-event', 
                    author: 'Kind Minds Family Wellness', 
                    category: 'Event', 
                    date: new Date('2023-04-09'), 
                    imageUrl: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?q=80&w=800&fit=crop', 
                    excerpt: 'Reflections from the Community Care: Black Women\'s Mental Health event in the city of Cambridge.', 
                    content: '<p>On March 31, 2023, our Executive Director and two outstanding speakers, <strong>@wounds2wings</strong> and <strong>Suzanne Trotman</strong>, participated in the "celebration and learning" from Black Women in our community event.</p><p>The event was one of the new series for Community Care: Black Women\'s Mental Health hosted by <strong>@porchlightcnd</strong> and <strong>@rhythmandbluescambridge</strong>.</p><p>KMFW is grateful for the platform and opportunity to answer and speak to the following:</p><ul><li><strong>Sisterhood:</strong> Does sistering offer a lifeline of support and validation?</li><li><strong>Black women in leadership:</strong> Why their authority may be met with reluctance by stakeholders with implicit biases that lead them to doubt leadership qualities.</li></ul><p>Enjoy these photos and well-captured moments with the organizers and speakers 🤗</p><p>#communityengagememt #blackwomen #mentalhealth #community #speakers #notforprofit #leadership #sisterhood #sistering #support #learning</p>', 
                    published: true 
                },
                { 
                    id: 'kmfw-growing-diversity-research', 
                    title: 'The growing diversity of Black-identified persons in our region', 
                    slug: 'kmfw-growing-diversity-research', 
                    author: 'Grace Okusanya', 
                    category: 'Research', 
                    date: new Date('2023-04-09'), 
                    imageUrl: 'https://images.unsplash.com/photo-1551288049-bbdac8626ad1?q=80&w=800&fit=crop', 
                    excerpt: 'Research analysis of municipal, provincial, and federal data for our region between 2016 and 2021.', 
                    content: '<p>The growing diversity of Black-identified persons in our region has been well captured by one of our Research Coordinators, <strong>Grace Okusanya</strong>, who is also a Master of Public Health Student at the University of Waterloo.</p><p>Grace\'s research revolves around increasing access to mental health for Black, Indigenous, and Racialized persons. Analyzing municipal, provincial, and federal data for our region, Grace compared numbers between 2016 and 2021.</p><h3>How does this inform our work at KMFW?</h3><p><strong>Vision:</strong> Equity, inclusiveness, and community engagement.</p><p><strong>Mission:</strong> To transform the personal narratives of Black persons and support them as they navigate systems to attain positive Self-actualization and Holistic wellness.</p><p><strong>Values:</strong> Respect. Equity. Inclusivity. Openness. Diversity. Dignity and Self-determination.</p><p><strong>Commitment:</strong> We are committed to providing equitable and culturally sensitive programs and services within evidence-based practice.</p><p>This data validates the need for all Black-serving organizations to intentionally ensure equitable practices inform their services. Want to discuss this further? Contact us at <strong>info@kindmindsfamilywellness.org</strong></p><p>#research #statistics #regionofwaterloo #growth #blackcommunities #equity #inclusive #culture #practice #censuscanada</p><p><small>References: Statistics Canada</small></p>', 
                    published: true 
                },
                { 
                    id: 'kmfw-coop-community-collaboration', 
                    title: 'KMFW collaborates on the Co-op for Community program', 
                    slug: 'kmfw-coop-community-collaboration', 
                    author: 'Kind Minds Family Wellness', 
                    category: 'Collaboration', 
                    date: new Date('2023-04-09'), 
                    imageUrl: 'https://images.unsplash.com/photo-1541339907198-e08759dfc3ef?q=80&w=800&fit=crop', 
                    excerpt: 'KMFW is grateful for the ongoing impact of the Co-op for Community program on the demographics we serve.', 
                    content: '<p>KMFW is grateful for the ongoing impact of the Co-op for Community program on the demographics we serve 🫶🏾</p><p>Thank you, <strong>United Way Waterloo Region Communities</strong>.</p><p>Here is what United Way Waterloo Region Communities had to say about our collaboration:</p><blockquote>"Co-op for Community is a program that we are EXTREMELY grateful for! Not only do Co-operative and Experiential Education at University of Waterloo students bring energy and knowledge to their co-op placements, but they get the opportunity to support other local nonprofits alongside their work at United Way."</blockquote><p>This term students from the program are supporting UWWRC, Crow Shield Lodge, Kind Minds Family Wellness, Peace for All Canada, and Child Witness Centre doing all kinds of work like event support, data entry and analysis, program design and evaluation and research.</p><p>#WRAwesome #locallove #UWaterlooCoop #HireWaterloo</p>', 
                    published: true 
                },
                { 
                    id: 'kmfw-health-inequities-awareness', 
                    title: 'Social Determinants and Inequities in health for Black Canadians', 
                    slug: 'kmfw-health-inequities-awareness', 
                    author: 'Kind Minds Family Wellness', 
                    category: 'Awareness', 
                    date: new Date('2023-02-15'), 
                    imageUrl: 'https://images.unsplash.com/photo-1576091160550-2173dad99a01?q=80&w=800&fit=crop', 
                    excerpt: 'Social, economic, and political factors shape the conditions in which individuals grow, live, work, and age.', 
                    content: '<p>Did you know: Social, economic, and political factors share the conditions in which individuals grow, live, work, and age and are vitally important for health and well-being.</p><p>These should be the starting points for you to reflect on how racism and discrimination may contribute to how Black-identified individuals experience them 🤔</p><p>In other words, <strong>racism is increasingly recognized as an essential driver of inequitable health outcomes</strong> for Black and racialized Canadians!</p><p>Discrimination against Black people is deeply entrenched and normalized in Canadian institutions, policies, and practices and is often invisible to those who do not feel its effects 😔</p><p>Today, Black Canadians experience health and social inequities linked to processes of discrimination at multiple levels of society. Visit <strong>www.Canada.ca</strong> to read more about the Social Determinants and Inequities in health for Black Canadians.</p><p>#kmfw #awareness #ourstotell #health #inequities #communityengagement #blackhistory #canada</p>', 
                    published: true 
                },
                { 
                    id: 'kmfw-black-history-profile-spectrum', 
                    title: 'BLACK HISTORY MONTH PROFILE', 
                    slug: 'kmfw-black-history-profile-spectrum', 
                    author: 'Kind Minds Family Wellness', 
                    category: 'Profile', 
                    date: new Date('2023-02-02'), 
                    imageUrl: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?q=80&w=800&fit=crop', 
                    excerpt: 'We are honored to have our Executive Director featured in SPECTRUM Waterloo Region\'s Rainbow Community Space\'s weekly blog.', 
                    content: '<p>We are honored to have our Executive Director, <strong>Ajirioghene Evi’s profile</strong> featured in SPECTRUM Waterloo Region\'s Rainbow Community Space\'s weekly blog in February.</p><p>The featured profiles are one of their initiatives to do more community engagement with Black, Indigenous, and racialized queer folks in our region. This month, you can read profiles of African, Caribbean, and Black folks making a difference in the queer community!</p><p>KMFW is thrilled to know that <strong>KOJO Institute</strong> is working with the team at Spectrum through its program, <em>The Foundation of Equity and Anti-Black Racism</em> 🙌🏾</p><p>Thank you for the feature, SPECTRUM Waterloo Region\'s Rainbow Community Space 🙌🏾</p><p>Please visit the link below to read the full profile:</p><p><a href="https://www.ourspectrum.com/2023/02/01/black-history-month-profile-on-ajirioghene-evi-cobbina/" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline"><strong>READ ARTICLE HERE</strong></a></p><p>#kmfw #queer #equity #intersectionality #justice #2slgbtq+ #inclusion #commumityengagement #blackhistory #february</p>', 
                    published: true 
                },
                { 
                    id: 'kmfw-we-are-black-history-2023', 
                    title: 'We are Black History!', 
                    slug: 'kmfw-we-are-black-history-2023', 
                    author: 'KMFW Team', 
                    category: 'History', 
                    date: new Date('2023-01-31'), 
                    imageUrl: 'https://images.unsplash.com/photo-1614030424754-24d9e97f0229?q=80&w=800&fit=crop', 
                    excerpt: 'Happy Black History Month! The 2023 theme is Black Resistance. Join us in celebrating excellence all year round.', 
                    content: '<p>As we welcome the month of February tomorrow, we wish to say Happy Black History Month!! ✊🏾</p><p>The 2023 theme is <strong>Black Resistance</strong> 🙌🏾</p><p>Kind Minds Family Wellness celebrates Black history and excellence every day of the year. Therefore, we would like to hearten you to embrace the following acts throughout the year:</p><h3>For Individuals:</h3><ul><li><strong>Support Black-Owned Businesses:</strong> Make an intentional effort to buy Black.</li><li><strong>Learn about local Black History:</strong> Remain updated on current affairs and systemic exclusions.</li><li><strong>Donate:</strong> Reach out to underfunded Black-led initiatives in our region.</li><li><strong>Volunteer:</strong> Your skills and experience are well-regarded and needed.</li><li><strong>Celebrate:</strong> Honor Black literature, authors, artists, and professionals!</li></ul><h3>For Organizations:</h3><ul><li><strong>Organize Diversity Events:</strong> Promote conversations that bring change to workplaces and shared spaces.</li></ul><p>For the next 28 days and beyond, remember that Black history is Canadian History. We will continue to highlight Black excellence of the past, present, and future leaders! 🤎</p><p>#nonprofitorganization #activism #blackhistorymonth #blackexcellence #blackpride</p>', 
                    published: true 
                },
                { 
                    id: 'kmfw-organic-leadership-esther', 
                    title: 'Organic Leadership', 
                    slug: 'kmfw-organic-leadership-esther', 
                    author: 'Kind Minds Family Wellness', 
                    category: 'Leadership', 
                    date: new Date('2022-09-05'), 
                    imageUrl: 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?q=80&w=800&fit=crop', 
                    excerpt: 'Introducing Mama Esther Kowai, an initiator who enjoys planning, organizing, and directing joint efforts for the happiness of others.', 
                    content: '<p>We have numerous Organic Leaders in our community, and we are confident you also know a few.</p><p>Today, we introduce you to <strong>Mama Esther Kowai</strong>, a resident of our Region and a member of our Wazee Senior Group. Mama Esther is an initiator who enjoys planning, organizing, and directing joint efforts for the happiness of others.</p><p>She would appreciate the donation of the following items (ongoing):</p><ul><li>Used clothing (summer and spring items only) and shoes for all ages</li><li>Writing materials and school supplies for school-aged children</li><li>Toiletries (soap, shampoo, deodorant, toothpaste, etc.)</li></ul><p>You can communicate directly with her via her email address at <strong>estherkowai073@gmail.com</strong>. Thank you as you support her initiatives!!</p><p>#leadership #community #donations #givingback #growth #africa #sierraleon #kwregion</p>', 
                    published: true 
                },
                { 
                    id: 'kmfw-racial-diversity-cycling', 
                    title: 'Reflections: Racial Diversity in Cycling', 
                    slug: 'kmfw-racial-diversity-cycling', 
                    author: 'Shirley G', 
                    category: 'Community', 
                    date: new Date('2022-08-06'), 
                    imageUrl: 'https://images.unsplash.com/photo-1541625602330-2277a1c4b6c3?q=80&w=800&fit=crop', 
                    excerpt: 'Shirley G shares hard-to-accept facts on Racial Diversity in Cycling and organizations supporting inclusivity.', 
                    content: '<p>We share a great reflection following a community Bike Festivities sponsored by the City and hosted by us and some organizations serving racialized communities in the Region of Waterloo.</p><blockquote>"Generally, the bike industry defaults to this lens of a white, cisgender, heterosexual, non-disabled man with class privilege." - Kara Fallon, Bikes Together</blockquote><p>An equity view around inclusiveness means cities need an intersectional approach to planning and promoting racial diversity in cycling. Organizations working to encourage diversity include:</p><ul><li><strong>Ontario Cycling:</strong> Women in Cycling Steering Committee</li><li><strong>Everyone Rides Initiative (Hamilton):</strong> Removing barriers to biking.</li><li><strong>The Culture Link (Bike Host):</strong> Matching Newcomers with mentors.</li><li><strong>ManDem Cycling (Toronto):</strong> Diverse and inclusive cycling community.</li></ul><p>#RepresentationMatters. We recommend reading the article by Tamika Butler titled, <em>Why We Must Talk About Race When We Talk About Bikes</em>.</p>', 
                    published: true 
                },
                { 
                    id: 'kmfw-lgbtq-newcomers-support', 
                    title: 'The need for more supports for LGBTQ+ newcomers within Ontario', 
                    slug: 'kmfw-lgbtq-newcomers-support', 
                    author: 'Britney Andrews', 
                    category: 'Advocacy', 
                    date: new Date('2022-06-29'), 
                    imageUrl: 'https://images.unsplash.com/photo-1573055419107-1e531818c156?q=80&w=800&fit=crop', 
                    excerpt: 'Settlement organizations in Canada are not doing enough to illustrate their support of LGBTQ2S+ newcomers.', 
                    content: '<p>Content analyses indicate that youth-serving and settlement organizations in Canada are not doing enough to illustrate their support of LGBTQ2S+ newcomers.</p><p>In a study focusing on 34 immigrant-serving organizations in Ontario, it was found that only 9% offered specific resources for LGBTQ Newcomers. This suggests that these organizations do not have an adequate understanding of the unique needs of the population they serve.</p><h3>Organizations offering support:</h3><ul><li><strong>Rainbow Community Council:</strong> Addressing gaps in services for LGBTQ+ Newcomers.</li><li><strong>OK2BME:</strong> Supportive services for children, teens, and adults in Waterloo Region.</li><li><strong>SPECTRUM:</strong> Transgender peer support and multicultural connect groups.</li><li><strong>The Black Queer Youth Initiative (BQY):</strong> Safe space for Black, African, and Caribbean youth in Toronto.</li></ul><p>Kind Minds Family Wellness is happy to support any LGBTQ Newcomers in connecting and navigating these resources.</p>', 
                    published: true 
                },
                { 
                    id: 'kmfw-self-care-kids-tips', 
                    title: 'Self-Care for Kids: Tips to Help Your Family Recharge', 
                    slug: 'kmfw-self-care-kids-tips', 
                    author: 'Anya Willis', 
                    category: 'Wellness', 
                    date: new Date('2022-02-22'), 
                    imageUrl: 'https://images.unsplash.com/photo-1510154221590-ff63e90a136f?q=80&w=800&fit=crop', 
                    excerpt: 'Practical ways you can help your child develop a healthy self-care routine to unwind and reset.', 
                    content: '<p>Kids are busy these days. School, household chores, and social pressures take a lot of time and energy. Without balance, even kids can become overly stressed!</p><h3>Practical ways to help:</h3><ul><li><strong>Practice It Yourself:</strong> Be a self-care role model. Build strong routines for eating, sleep, and hobbies.</li><li><strong>Boost Your Home Atmosphere:</strong> A tidy, clutter-free home sets a peaceful tone.</li><li><strong>Try Yoga:</strong> Helps children regulate emotions and anxiety while improving concentration.</li><li><strong>Weekly Family Movie Night:</strong> Build bonds and spark imagination together.</li><li><strong>Encourage Puzzling:</strong> Sudoku, jigsaws, and crosswords offer cognitive and emotional benefits.</li></ul><p>Self-care is required for all people to live a balanced and healthy life. Teach your child what they can do to improve their physical, mental, and emotional well-being.</p>', 
                    published: true 
                },
                { 
                    id: 'kmfw-islamophobia-remembrance-2022', 
                    title: 'National Day of Remembrance and Action Against Islamophobia', 
                    slug: 'kmfw-islamophobia-remembrance-2022', 
                    author: 'Kind Minds Family Wellness', 
                    category: 'Advocacy', 
                    date: new Date('2022-01-29'), 
                    imageUrl: 'https://images.unsplash.com/photo-1596131397999-90d560934091?q=80&w=800&fit=crop', 
                    excerpt: 'Remembering the lives lost in the Quebec Mosque massacre. We stand against Islamophobia.', 
                    content: '<p>Today we remember the lives lost in the Quebec Mosque massacre on Jan 29. Islamophobia is real. Hate is real. It has cost us too much already. This needs to stop!</p><h3>What you can do to make a difference:</h3><ol><li>Take a moment to learn about Islamophobia in Canada.</li><li>Join the action against Bill 21 (Laicité Law) that promotes state-sanctioned discrimination.</li><li>Seek support or report hate crimes at <strong>www.reportinghate.ca</strong>.</li></ol><p>#QuebecMosqueShooting #WeRememberJan29 #WRagainstislamophobia #Islamophobia #StopIslamophobia</p>', 
                    published: true 
                },
                { 
                    id: 'kmfw-international-day-education-2022', 
                    title: 'Today is the International Day of Education', 
                    slug: 'kmfw-international-day-education-2022', 
                    author: 'United Nations', 
                    category: 'Education', 
                    date: new Date('2022-01-24'), 
                    imageUrl: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?q=80&w=800&fit=crop', 
                    excerpt: 'Education is a human right, a public good and a public responsibility.', 
                    content: '<blockquote>"Without inclusive and equitable quality education and lifelong opportunities for all, countries will not succeed in achieving gender equality and breaking the cycle of poverty." - UNESCO</blockquote><p>Today, 258 million children and youth still do not attend school. Their right to education is being violated and it is unacceptable. This year’s International Day of Education is a platform to realize everyone’s fundamental right to education.</p><p>#educationisahumanright #transformingeducation #educationday</p>', 
                    published: true 
                },
                { 
                    id: 'kmfw-region-waterloo-grant-2021', 
                    title: 'KMFW Comments on Recently awarded grant by The Region of Waterloo', 
                    slug: 'kmfw-region-waterloo-grant-2021', 
                    author: 'Ajirioghene Evi-Cobbinnah', 
                    category: 'Grant', 
                    date: new Date('2021-11-20'), 
                    imageUrl: 'https://images.unsplash.com/photo-1526628953301-3e589a6a8b74?q=80&w=800&fit=crop', 
                    excerpt: 'Leadership Skills Development and Pathway to Youth Entrepreneurship program grant.', 
                    content: '<p>I am so happy to commence work on this program that will run for 24 months and will create a culturally inclusive environment for Black youth in our region.</p><p>Participants will learn hands-on planning, budgeting, and foundational skills in running a small business. The instructors and mentors are professionals invested in contributing to the growth of Black identifying youth.</p><blockquote>"No greater place to be than in a leadership position to lead young minds to prosperity" - Darrius Garrett</blockquote><p>Thank you to the Region of Waterloo for the grant to move this work forward in our community!</p><p>#youthleadership #communitydevelopment #blackyouth #notforprofit</p>', 
                    published: true 
                },
                { 
                    id: 'kmfw-restorative-region-panel', 
                    title: 'KMFW Leadership in Restorative Work', 
                    slug: 'kmfw-restorative-region-panel', 
                    author: 'Kind Minds Family Wellness', 
                    category: 'Event', 
                    date: new Date('2021-11-11'), 
                    imageUrl: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?q=80&w=800&fit=crop', 
                    excerpt: 'KMFW is thrilled to be a panelist in the upcoming conversation on becoming a Restorative Region.', 
                    content: '<p>KMFW is thrilled to be a panelist in the upcoming conversation on November 25th: <em>Our Community In Transformation: Next Steps Towards Becoming a Restorative Region.</em></p><p>The conversation will be moderated by Mike Farwell, and the panel will deconstruct principles of restorative justice and transformative justice. Panelists include Chris Cowie (ED of CJI), Tafadzwa Takaendesa (KMFW), and MPP Laura Mae Lindo.</p><p>Register for free at: <strong>https://www.eventbrite.ca/e/our-community-in-transformation-tickets-178881548527</strong></p>', 
                    published: true 
                }
            ];

            const bweicArticles = [
                {
                    id: 'reclaiming-rest-somatic-healing',
                    title: 'Reclaiming Rest: Somatic Healing Practices for Black Women',
                    slug: 'reclaiming-rest-somatic-healing',
                    author: 'BWEIC Wellness Circle',
                    category: 'Wellness & Healing',
                    date: new Date('2026-10-14'),
                    imageUrl: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=800&h=600&fit=crop',
                    excerpt: 'Why rest is not a luxury, but a foundational pillar of community sovereignty and emotional longevity.',
                    content: '<h2>Rest as a Form of Sovereignty</h2><p>For Black women, burnout has often been normalized through systemic expectations of continuous labor. At BWEIC, our somatic healing spaces emphasize that rest is a vital requirement for emotional and physical wellness.</p><h3>Somatic Grounding Practices</h3><p>Connecting mind and body through guided breathwork, gentle restorative movement, and trauma-informed dialogue allows us to release stored stress and reclaim our collective peace.</p><h3>Creating Community Safe Spaces</h3><p>Our monthly circles offer a confidential, nurturing environment where women can share lived experiences without explanation or justification.</p>',
                    published: true
                },
                {
                    id: 'navigating-executive-leadership',
                    title: 'Navigating Executive Leadership Across Corporate Canada',
                    slug: 'navigating-executive-leadership',
                    author: 'Amelia K. Hamilton',
                    category: 'Leadership',
                    date: new Date('2026-09-28'),
                    imageUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=800&h=600&fit=crop',
                    excerpt: 'Key lessons from our leadership cohort on breaking systemic barriers while preserving authentic identity.',
                    content: '<h2>Authentic Leadership in Complex Systems</h2><p>Stepping into executive roles requires more than technical acumen; it requires strategic community networks and unwavering self-advocacy.</p><h3>Mentorship & Intergenerational Guidance</h3><p>Bridging established leaders with rising professionals creates sustainable pathways to senior leadership and corporate boardrooms.</p>',
                    published: true
                },
                {
                    id: 'building-generational-wealth',
                    title: 'Building Generational Wealth Through Community Cooperatives',
                    slug: 'building-generational-wealth',
                    author: 'BWEIC Economic Empowerment',
                    category: 'Economic Power',
                    date: new Date('2026-09-10'),
                    imageUrl: 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=800&h=600&fit=crop',
                    excerpt: 'How collective economics and transparent funding structures are transforming Black women-led ventures.',
                    content: '<h2>Economic Sovereignty & Capital Access</h2><p>Financial literacy and cooperative funding mechanisms empower founders to scale sustainable, impactful enterprises across Canada.</p>',
                    published: true
                }
            ];

            const dmlabsArticles = [
                { 
                    id: 'future-of-ai', 
                    title: 'The Future of AI: Opportunities and Challenges', 
                    slug: 'the-future-of-ai-opportunities-and-challenges', 
                    author: 'Digital Maples Labs', 
                    category: 'Inspiration', 
                    date: new Date('2024-04-01'), 
                    imageUrl: 'https://images.unsplash.com/photo-1677442135703-3ee67f47e3e5?q=80&w=2940&auto=format&fit=crop', 
                    excerpt: 'Exploring the transformative potential of artificial intelligence and the ethical considerations that come with it.', 
                    content: '<h2>The AI Revolution</h2><p>Artificial intelligence is no longer a futuristic concept; it is reshaping every industry at an unprecedented pace. From healthcare diagnostics to personalized education, the opportunities for innovation are vast. However, with great power comes the substantial responsibility of ethical deployment.</p><h3>Defining Human-Centric AI</h3><p>At Digital Maples Labs, we believe that technology should serve humanity. Human-centric AI focuses on systems that amplify human capabilities rather than replace them. This involves designing interfaces that are intuitive and ensuring that the underlying algorithms prioritized transparency and fairness.</p><h3>The Ethical Imperative</h3><p>The key is not to fear AI, but to understand it deeply enough to deploy it responsibly. This means auditing for algorithmic bias, ensuring data privacy, and maintaining clear accountability for AI-driven decisions. As we move forward, the most successful organizations will be those that align their technological advancement with core human values.</p><p>Ultimately, the future of AI depends on our collective ability to foster trust through transparency and to use these tools to solve the world\'s most pressing challenges.</p>', 
                    published: true 
                },
                { 
                    id: 'resilient-business', 
                    title: 'Strategies for Building a Resilient Business', 
                    slug: 'strategies-for-building-a-resilient-business', 
                    author: 'Digital Maples Labs', 
                    category: 'Creative', 
                    date: new Date('2024-03-15'), 
                    imageUrl: 'https://images.unsplash.com/photo-1552664730-d307ca884978?q=80&w=2940&auto=format&fit=crop', 
                    excerpt: 'How to navigate uncertainty and build a business that can withstand and thrive in changing times.', 
                    content: '<h2>Building for Tomorrow</h2><p>Business resilience is more than just surviving hard times—it\'s about architecting your organization to adapt, pivot, and thrive regardless of external shocks. In an era of constant change, the ability to respond to disruption is a critical competitive advantage.</p><h3>Digital Agility as a Foundation</h3><p>The most resilient companies we\'ve worked with share one common trait: they invested in digital infrastructure before they actually needed it. Digital agility allows for rapid shifts in operational models, enabling businesses to reach customers through new channels almost overnight. This involves cloud-based collaboration tools, robust data analytics, and scalable e-commerce platforms.</p><h3>The Human Element</h3><p>Resilience is not just about technology; it\'s about culture. A resilient business fosters an environment where employees feel empowered to innovate and take calculated risks. Strategic communication and transparent leadership are essential for maintaining morale during uncertain periods.</p><p>By combining technological maturity with a flexible, supportive internal culture, businesses can transform challenges into opportunities for growth and long-term sustainability.</p>', 
                    published: true 
                },
                { 
                    id: 'effective-communication', 
                    title: 'The Art of Effective Communication in the Workplace', 
                    slug: 'the-art-of-effective-communication-in-the-workplace', 
                    author: 'Digital Maples Labs', 
                    category: 'Innovation', 
                    date: new Date('2024-02-28'), 
                    imageUrl: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=2940&auto=format&fit=crop', 
                    excerpt: 'Mastering the interpersonal skills necessary for clear, impactful, and collaborative professional environments.', 
                    content: '<h2>Communication as a Core Competency</h2><p>In the digital age, how we communicate defines how we succeed. Clear, empathetic, and intentional communication is no longer a soft skill—it\'s a strategic capability that separates high-performing teams from the rest. As workplaces become increasingly distributed, the quality of our interactions becomes even more paramount.</p><h3>Active Listening and Empathy</h3><p>True communication is a two-way street. It begins with active listening—the practice of fully concentrating, understanding, and responding to what is being said. Empathy allows leaders and team members to navigate conflicting perspectives and build a foundation of mutual respect and trust.</p><h3>Digital Literacy in Communication</h3><p>Mastering the art of workplace communication also means understanding the nuances of different digital platforms. Knowing when to send a quick message versus scheduling a video call can significantly impact team efficiency and relationship building. Clarity in written communication is particularly crucial in preventing misunderstandings.</p><p>By prioritizing intentionality and empathy in every interaction, organizations can foster a collaborative culture that drives innovation and employee satisfaction.</p>', 
                    published: true 
                },
                { 
                    id: 'digital-transformation', 
                    title: 'Digital Transformation: Navigating the New Normal', 
                    slug: 'digital-transformation-navigating-the-new-normal', 
                    category: 'Technology', 
                    date: new Date('2024-02-01'), 
                    imageUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2864&auto=format&fit=crop', 
                    excerpt: 'Exploring how artificial intelligence is transforming industries and societal norms.', 
                    content: '<h2>The Rise of Intelligent Systems</h2><p>Artificial intelligence is no longer the domain of science fiction. From automated operations in healthcare to generative interfaces transforming creative industries, AI is systematically reshaping every layer of the modern economy.</p><h3>Opportunities Ahead</h3><p>The efficiency gains unlocked by autonomous systems enable organizations to scale high-impact initiatives with smaller teams. Predictive intelligence can identify community health trends before outbreaks occur, optimize municipal resource allocation, and democratize access to world-class educational tools.</p><h3>Ethical Considerations</h3><p>However, the rapid acceleration of AI deployment introduces profound risks: algorithmic bias, systemic exclusion, and the concentration of computational power. Building ethical guardrails and transparent evaluation frameworks is the defining challenge of our generation.</p><p>As technologists, our responsibility is to ensure that these powerful tools serve humanity, reduce inequities, and safeguard user autonomy.</p>', 
                    published: true 
                },
                { 
                    id: 'scaling-remote-teams', 
                    title: 'Building and Scaling Remote-First Teams', 
                    slug: 'building-and-scaling-remote-first-teams', 
                    author: 'Digital Maples Labs', 
                    category: 'Inspiration', 
                    date: new Date('2024-01-15'), 
                    imageUrl: 'https://images.unsplash.com/photo-1552664730-d307ca884978?q=80&w=2940&auto=format&fit=crop', 
                    excerpt: 'Key principles for managing distributed teams effectively in a globalized workforce.', 
                    content: '<h2>The Remote-First Mindset</h2><p>Remote work is not a compromise—it\'s a massive competitive advantage when executed correctly. The teams we\'ve seen succeed in distributed environments share common practices: asynchronous-first communication, radical documentation, and deep trust in process over presence.</p><h3>Trust and Accountability</h3><p>In a remote setting, visibility into "hours worked" is replaced by visibility into "outcomes achieved." This transition requires a high level of trust and clear accountability frameworks. Managers must shift from monitoring tasks to supporting the growth and productivity of their team members.</p><h3>Building Culture Across Distances</h3><p>Creating a sense of belonging in a remote team requires intentionality. Regular virtual huddles, informal digital social spaces, and clear shared values help maintain a cohesive culture. Using the right collaboration tools—from project management platforms to instant messaging—is essential for keeping everyone aligned and engaged.</p><p>When done right, remote work allows organizations to tap into global talent and offers employees the flexibility to build lives and careers that truly integrate.</p>', 
                    published: true 
                },
            ];

            let articlesToSeed = dmlabsArticles;
            if (isBWEIC) articlesToSeed = bweicArticles;
            if (isAitasol) articlesToSeed = aitasolArticles;
            if (isKMFW) articlesToSeed = kmfwArticles;

            for (const article of articlesToSeed) {
                await FirestoreService.saveArticle(currentSite.id, article, article.id);
            }
            setSuccessMsg(`✅ Seeded ${articlesToSeed.length} articles successfully! Refreshing...`);
            await loadArticles();
        } catch (err) {
            console.error(err);
            setError('Failed to seed articles: ' + (err instanceof Error ? err.message : String(err)));
        } finally {
            setSaving(false);
        }
    };

    return (
        <>
            <PageMeta title="Blog Manager | CMS" description="Manage blog articles" />

            <div className="p-6">
                {error && <div className="mb-4"><Alert variant="error" title="Error" message={error} /></div>}
                {successMsg && <div className="mb-4"><Alert variant="success" title="Success" message={successMsg} /></div>}

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-12">
                     {/* SEO Settings */}
                    <div className="p-6 border border-indigo-500/20 bg-indigo-500/5 rounded-xl shadow-sm">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <Search size={20} className="text-indigo-500" />
                                <h3 className="text-lg font-bold text-gray-800 dark:text-white">Blog Search SEO</h3>
                            </div>
                            <VersionHistoryManager documentId="blog" siteId={currentSite.id} />
                            <Button size="sm" onClick={handlePageSave} loading={pageSaving}>Save SEO</Button>
                        </div>
                        <SEOEditor 
                            data={pageContent?.seo || {}} 
                            onChange={handlePageSEOChange}
                        />
                    </div>

                    {/* Blog Hero Settings */}
                    <div className="p-6 border border-gray-200 bg-white dark:bg-gray-800/50 dark:border-gray-700 rounded-xl shadow-sm">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-bold text-gray-800 dark:text-white">Blog Hero Section</h3>
                            <Button size="sm" onClick={handlePageSave} loading={pageSaving}>Save Hero</Button>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <Label>Hero Heading (Supports HTML)</Label>
                                <Input 
                                    value={pageContent?.sections?.hero?.heading || ""} 
                                    onChange={(e) => setPageContent({
                                        ...pageContent!,
                                        sections: {
                                            ...pageContent?.sections,
                                            hero: { ...pageContent?.sections?.hero!, heading: e.target.value }
                                        }
                                    })}
                                />
                            </div>
                            <div>
                                <Label>Hero Content (Rich Text)</Label>
                                <RichTextEditor 
                                    value={pageContent?.sections?.hero?.content || ""}
                                    onChange={(val) => setPageContent({
                                        ...pageContent!,
                                        sections: {
                                            ...pageContent?.sections,
                                            hero: { ...pageContent?.sections?.hero!, content: val }
                                        }
                                    })}
                                    placeholder="Enter blog hero description..."
                                    minHeight="100px"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col gap-4 mb-6 md:flex-row md:items-center md:justify-between pt-8 border-t border-gray-100 dark:border-gray-700">
                    <div>
                        <h2 className="text-xl font-bold text-gray-800 dark:text-white">Recent Articles</h2>
                        <p className="text-gray-500 mt-1">Manage individual blog posts below.</p>
                    </div>
                    <div className="flex gap-3 flex-wrap">
                        <Button
                            variant="primary"
                            onClick={() => setIsAiModalOpen(true)}
                            className="bg-gradient-to-r from-purple-600 via-indigo-600 to-primary text-white shadow-md hover:opacity-90 flex items-center gap-2"
                        >
                            <Sparkles size={16} />
                            Generate with AI
                        </Button>
                        <Button requireSuperAdmin variant="outline" onClick={handleSeedArticles} disabled={saving} className="border-blue-300 text-blue-600 hover:bg-blue-50">
                            🌱 Seed Default Articles
                        </Button>
                        <Button onClick={openNewArticleModal} startIcon={<PlusIcon className="w-5 h-5" />}>
                            New Article
                        </Button>
                    </div>
                </div>

                <div className="mb-6 p-4 border rounded-lg bg-blue-50 text-blue-800 border-blue-100 dark:bg-blue-900/20 dark:text-blue-200 dark:border-blue-800">
                    <h4 className="font-semibold mb-1">Image Upload Guidelines:</h4>
                    <ul className="list-disc pl-5 space-y-1 text-sm">
                        <li><strong>Standard Images (Articles):</strong> Recommended 800x600 px (4:3) or 800x800 px (1:1).</li>
                        <li><strong>Format:</strong> JPG or WebP. Max size: 2MB.</li>
                    </ul>
                </div>

                {error && <div className="mb-4"><Alert variant="error" title="Error" message={error} /></div>}
                {successMsg && <div className="mb-4"><Alert variant="success" title="Success" message={successMsg} /></div>}

                {loading ? (
                    <div className="flex justify-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500"></div>
                    </div>
                ) : articles.length === 0 ? (
                    <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                        <p className="text-gray-500 mb-4">No articles found. Click "New Article" to create one, or seed the default articles.</p>
                        <Button requireSuperAdmin variant="outline" onClick={handleSeedArticles} disabled={saving} className="border-blue-300 text-blue-600 hover:bg-blue-50">
                            🌱 Seed Default Articles
                        </Button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {articles.map((article) => (
                            <div key={article.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                                <div className="h-48 bg-gray-200 relative">
                                    {article.imageUrl ? (
                                        <img src={article.imageUrl} alt={article.title} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                                            <CalenderIcon className="w-12 h-12" />
                                        </div>
                                    )}
                                    <div className="absolute top-2 right-2 flex gap-2">
                                        {article.published ? (
                                            (article.date && new Date(article.date?.toDate ? article.date.toDate() : article.date) > new Date()) ? (
                                                <div className="bg-blue-500 text-white px-2 py-1 rounded text-xs font-semibold">
                                                    Scheduled
                                                </div>
                                            ) : (
                                                <div className="bg-green-500 text-white px-2 py-1 rounded text-xs font-semibold">
                                                    Published
                                                </div>
                                            )
                                        ) : (
                                            <div className="bg-gray-500 text-white px-2 py-1 rounded text-xs font-semibold">
                                                Draft
                                            </div>
                                        )}
                                    </div>
                                    {article.category && (
                                        <div className="absolute top-2 left-2 bg-white/90 dark:bg-black/80 px-2 py-1 rounded text-xs font-semibold">
                                            {article.category}
                                        </div>
                                    )}
                                </div>
                                <div className="p-4">
                                    <h3 className="font-bold text-lg text-gray-900 dark:text-white line-clamp-2 mb-2">{article.title}</h3>

                                    <div className="flex items-center text-sm text-gray-500 mb-2">
                                        <UserIcon className="w-4 h-4 mr-2" />
                                        {article.author}
                                    </div>

                                    <div className="flex items-center text-sm text-gray-500 mb-4">
                                        <CalenderIcon className="w-4 h-4 mr-2" />
                                        {article.date ? (
                                            article.date.seconds 
                                                ? new Date(article.date.seconds * 1000).toLocaleDateString() 
                                                : new Date(article.date).toLocaleDateString()
                                        ) : 'No Date'}
                                    </div>

                                    {article.excerpt && (
                                        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-4">{article.excerpt}</p>
                                    )}

                                    <div className="flex gap-2 mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                                        <Button variant="outline" size="sm" onClick={() => openEditModal(article)} className="flex-1">
                                            <PencilIcon className="w-4 h-4 mr-2" /> Edit
                                        </Button>
                                        <Button variant="outline" size="sm" onClick={() => handleDelete(article.id)} className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200">
                                            <TrashBinIcon className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Edit/Create Modal */}
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} size="7xl" className="h-[95vh] flex flex-col">
                <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-white dark:bg-gray-800 rounded-t-3xl">
                    <h2 className="text-xl font-bold">{currentArticleId ? "Edit Article" : "Create New Article"}</h2>
                    <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                        <span className="text-2xl">&times;</span>
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 bg-gray-50 dark:bg-gray-900/50">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div className="col-span-1 md:col-span-2">
                            <Label>Article Title</Label>
                            <Input
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                placeholder="e.g. Healing Circles: Creating Safe Spaces"
                            />
                        </div>

                        <div className="col-span-1 md:col-span-2">
                            <Label>URL Slug (auto-generated if empty)</Label>
                            <Input
                                value={formData.slug || ""}
                                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                                placeholder="e.g. healing-circles-creating-safe-spaces"
                            />
                        </div>

                        <div>
                            <Label>Author</Label>
                            <Input
                                value={formData.author || ""}
                                onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                                placeholder="e.g. Jane Doe"
                            />
                        </div>

                        <div>
                            <Label>Publish Date</Label>
                            <Input
                                type="datetime-local"
                                value={formatDateForInput(formData.date)}
                                onChange={(e) => setFormData({ ...formData, date: new Date(e.target.value) })}
                            />
                        </div>

                        <div>
                            <Label>Category</Label>
                            <Input
                                value={formData.category || ""}
                                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                placeholder="e.g. Wellness, Empowerment"
                            />
                        </div>

                        <div>
                            <Label>Publishing Status</Label>
                            <select
                                className="mt-2 block w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:border-brand-500 focus:ring-brand-500"
                                value={
                                    !formData.published 
                                        ? "draft" 
                                        : (formData.date && new Date(formData.date) > new Date()) 
                                            ? "scheduled" 
                                            : "published"
                                }
                                onChange={(e) => {
                                    const val = e.target.value;
                                    if (val === 'draft') {
                                        setFormData({ ...formData, published: false });
                                    } else if (val === 'published') {
                                        // Set published true and date to now if it was scheduled in the future
                                        const now = new Date();
                                        setFormData({ 
                                            ...formData, 
                                            published: true,
                                            date: (formData.date && new Date(formData.date) > now) ? now : formData.date 
                                        });
                                    } else if (val === 'scheduled') {
                                        // Set published true but ensure the date is in the future
                                        // The user will pick the future date in the Publish Date field
                                        setFormData({ ...formData, published: true });
                                    }
                                }}
                            >
                                <option value="draft">Draft (Hidden)</option>
                                <option value="published">Published (Live Now)</option>
                                <option value="scheduled">Scheduled (Publishes at Date)</option>
                            </select>
                        </div>

                        <div className="col-span-1 md:col-span-2">
                            <Label>Featured Image</Label>
                            <div className="flex gap-4 items-start">
                                <div className="flex-1">
                                    <div className="flex gap-2">
                                        <Input
                                            value={formData.imageUrl || ""}
                                            onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                                            placeholder="https://..."
                                            className="flex-1"
                                        />
                                        <Button variant="outline" onClick={() => setIsMediaLibraryOpen(true)}>
                                            <FolderIcon className="w-5 h-5" />
                                        </Button>
                                    </div>
                                </div>
                                {formData.imageUrl && (
                                    <div className="w-32 h-24 bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
                                        <img src={formData.imageUrl} alt="Preview" className="w-full h-full object-cover" />
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="col-span-1 md:col-span-2">
                            <Label>Featured Video URL (YouTube, Vimeo, or Direct MP4)</Label>
                            <Input
                                value={formData.videoUrl || ""}
                                onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
                                placeholder="https://www.youtube.com/watch?v=... or https://example.com/video.mp4"
                            />
                            <p className="text-xs text-gray-500 mt-1">If provided, this will be shown instead of the featured image.</p>
                        </div>

                        <div className="col-span-1 md:col-span-2">
                            <Label>Excerpt (Short Description)</Label>
                            <textarea
                                value={formData.excerpt || ""}
                                onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                                placeholder="Brief summary of the article..."
                                rows={3}
                                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                            />
                        </div>

                        <div className="col-span-1 md:col-span-2">
                            <Label>Article Content</Label>
                            <RichTextEditor
                                label=""
                                value={formData.content || ""}
                                onChange={(val) => setFormData({ ...formData, content: val })}
                            />
                        </div>

                        {/* Article SEO Section */}
                        <div className="col-span-1 md:col-span-2 pt-6 border-t border-gray-200 dark:border-gray-700 mt-6">
                            <div className="flex items-center gap-3 mb-6">
                                <Search size={20} className="text-indigo-500" />
                                <h3 className="text-lg font-bold text-gray-800 dark:text-white">Article SEO Metadata</h3>
                            </div>
                            <SEOEditor 
                                data={formData.seo || {}} 
                                onChange={handleArticleSEOChange}
                            />
                        </div>
                    </div>
                </div>

                <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-b-3xl flex justify-end gap-3">
                    <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                    <Button onClick={handleSave} disabled={saving}>
                        {saving ? "Saving..." : (currentArticleId ? "Update Article" : "Create Article")}
                    </Button>
                </div>
            </Modal>

            {/* Media Library Modal */}
            <MediaLibrary
                isOpen={isMediaLibraryOpen}
                onSelect={handleImageSelect}
                basePath={currentSite.id}
                onClose={() => setIsMediaLibraryOpen(false)}
            />

            {/* AI Blog Generator Modal */}
            <AiBlogGeneratorModal
                isOpen={isAiModalOpen}
                onClose={() => setIsAiModalOpen(false)}
                onGenerated={handleAiGenerated}
            />
        </>
    );
}
