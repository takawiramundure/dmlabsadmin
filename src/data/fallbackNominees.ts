export interface Nominee {
    id: string;
    name: string;
    bio: string;
    categories: string[];
    image?: string;
    isWinner?: boolean;
    winnerType?: string;
    winnerAward?: string;
}

export interface AgendaItem {
    time: string;
    title: string;
    details: string[];
}

export interface Speaker {
    id: string;
    name: string;
    role: string;
    bio: string;
    image?: string;
    isKeynote?: boolean;
}

export interface SpeakersData {
    heading: string;
    enabled: boolean;
    keynote: Speaker;
    panelists: Speaker[];
}

export interface Testimonial {
    quote: string;
    author?: string;
}

export const agenda: AgendaItem[] = [
    {
        time: "5:30 PM - 6:30 PM",
        title: "Arrival & Opening Ceremonies",
        details: [
            "5:30 PM - 6:00 PM : Doors Open & Networking (Guest check-in, Vendor tables)",
            "6:00 PM - 6:10 PM : Welcome & Housekeeping (MC welcome, Gala overview)",
            "6:10 PM - 6:15 PM : Libation Ceremony",
            "6:15 PM - 6:25 PM : Spoken Word Performance",
            "6:25 PM - 6:30 PM : Welcome Remarks"
        ]
    },
    {
        time: "6:30 PM - 7:30 PM",
        title: "Keynote & Dinner Service",
        details: [
            "6:30 PM - 6:45 PM : Keynote Address",
            "6:45 PM - 6:55 PM : Grace & Interfaith invocation",
            "6:55 PM - 7:30 PM : Dinner Service Begins (Buffet style)"
        ]
    },
    {
        time: "7:30 PM - 8:40 PM",
        title: "Entertainment & Awards Part 1",
        details: [
            "7:30 PM - 8:00 PM : Live Cultural Performance & Background Music",
            "8:00 PM - 8:40 PM : Awards Presentation - Part 1 (Community Leadership, Arts & Culture, Young Entrepreneur, Health & Wellness, Sports & Athletics)"
        ]
    },
    {
        time: "8:40 PM - 9:45 PM",
        title: "Awards Part 2 & Closing",
        details: [
            "8:40 PM - 8:50 PM : Intermission & Musical Performance",
            "8:50 PM - 9:35 PM : Awards Presentation - Part 2 (Black Business Enterprise, Business & Professional, STEM, Lifetime Achievement)",
            "9:35 PM - 9:45 PM : Closing Remarks & Thank Yous"
        ]
    },
    {
        time: "9:45 PM - 11:30 PM",
        title: "Celebration Dance",
        details: [
            "9:45 PM - 11:30 PM : Celebration Dance (DJ performance, Dance floor opens, Photobooth remains available)",
            "11:30 PM : Event Concludes (Safe travels, Coat check retrieval)"
        ]
    }
];

export const speakers: SpeakersData = {
    heading: "Keynote & Panelists",
    enabled: true,
    keynote: {
        id: "dr-gifty-parker-dejong",
        name: "Dr. Gifty Parker-DeJong",
        role: "Founder and CEO, Parker HR Solutions Inc",
        bio: "Dr. Gifty Parker-DeJong is an educator, and community advocate whose life and work are rooted in advancing Black excellence across generations. As the founder of PARKER HR Solutions and a national and international voice in leadership and talent development, she has dedicated her career to amplifying underrepresented voices, and building systems where Black professionals and entrepreneurs can thrive, not merely participate.\n\nHer journey as a Black woman in leadership fuels her commitment to visibility, representation, and legacy building. She believes excellence within Black communities has always existed, and it simply must be recognized, elevated, and resourced.\n\nAs a keynote speaker for the inaugural Black Excellence Awards Gala 2026, she brings lived experience and leadership insight to this historic moment. Her message calls the community to action: to honor boldly, celebrate unapologetically, and move from early engagement to full participation, ensuring that Black brilliance is acknowledged, documented, and carried forward for the future.\n\nAs the keynote speaker for the inaugural Black Excellence Awards Gala 2026, Dr. Parker-DeJong brings lived experience and leadership insight, inspiring the community to honor boldly, celebrate unapologetically, and ensure Black brilliance is documented and carried forward for future generations.",
        isKeynote: true
    },
    panelists: [
        {
            id: "dr-magnus-mfoafo-mcarthy",
            name: "Dr. Magnus Mfoafo-M’Carthy",
            role: "Moderator | Professor, Wilfrid Laurier University",
            bio: "Dr. Magnus Mfoafo-M’Carthy is a Professor in the Faculty of Social Work at Wilfrid Laurier University and Director of the Manulife Centre for Community Health Research (MCCHR). A scholar and community-engaged researcher, Dr. Mfoafo-M’Carthy focuses on health equity, caregiving, and the wellbeing of Black communities. His work spans international research in the Global South and emphasizes knowledge mobilization that bridges scholarship, policy, and lived experience."
        },
        {
            id: "maedith-radlein",
            name: "Maedith Radlein",
            role: "Chair, Board of Trustees, WRDSB",
            bio: "Maedith Radlein immigrated to Waterloo Region 39 years ago and is a retired elementary school principal. Throughout her career and retirement, she has been actively involved in numerous community initiatives and is a passionate advocate for social justice, with a focus on equity, diversity, and inclusion. In 2022, she was elected as a public school board trustee for Kitchener and currently serves as Chair of the WRDSB Board of Trustees, bringing her experience in education and community leadership to every decision she makes.\n\nAs a panelist, Maedith reflects on the power of legacy, sharing insights from her years of leadership and community engagement, and highlighting how lasting contributions continue to shape and inspire the next generation."
        },
        {
            id: "dr-trevor-charles",
            name: "Dr. Trevor Charles",
            role: "Professor, Scientist and Entrepreneur",
            bio: "Dr. Trevor Charles is a Professor of Biology at the University of Waterloo and a microbiologist whose research spans bacterial molecular genetics, functional metagenomics, and pathogen surveillance. An active entrepreneur, he has co-founded companies including Metagenom Bio Life Science, Healthy Hydroponics, and Earth Microbial. As founder and Executive Director of the Lanterna Black Innovation Hub, he champions Black innovation and entrepreneurship in Waterloo Region and beyond.\n\nAs a panelist, Dr. Charles shares his perspective on living and leading in the present, highlighting how today’s actions and choices create meaningful impact and shape communities in real time."
        },
        {
            id: "robyn-schwarz",
            name: "Robyn E. Schwarz (she/her)",
            role: "Principal Consultant & Co-Founder, Dumbo Octopus",
            bio: "Robyn E. Schwarz (she/her) is the Principal Consultant and Co-Founder of Dumbo Octopus Consulting, a Waterloo Region–based social enterprise that supports nonprofits and grassroots leaders working for equity and community wellbeing. In the last two years, Dumbo Octopus Consulting has helped bring more than $4 million in additional funding to equity-driven organizations by working as a strategic partner and collaborator to ensure resources flow to groups that have historically been excluded from traditional funding systems. Robyn is known for asking critical questions about money, power, and the structures shaping the nonprofit sector, and for helping equity-seeking leaders navigate funding landscapes that were not designed with their communities in mind. She is also an accomplished historical researcher, feminist thinker, and activist whose writing and public speaking explore reproductive justice, disability, and the realities of navigating healthcare systems. Robyn writes candidly about her own experiences accessing reproductive healthcare and ADHD treatment, using her platform to advocate for more equitable and compassionate systems of care."
        },
        {
            id: "melat-gebray",
            name: "Melat Gebray",
            role: "Youth Voice/Student",
            bio: "Melat Gebray is a high school senior and a dedicated Youth Lead at Kind Minds Family Wellness. She began her journey in 2022 through the Black Youth Internship Program (BYIP), where she discovered her passion for leadership and supporting her peers.\n\nAs a panelist for “Igniting the Future”, Melat brings her unique youth perspective, lived experience, and dedication to creating safe, empowering spaces for young people. She represents the next generation of changemakers, inspiring others to imagine and build a more inclusive, equitable, and vibrant future."
        }
    ]
};

export const nominees: Nominee[] = [
    {
        id: "andrea-davis",
        name: "Dr. Andrea Davis",
        bio: "Dr. Andrea Davis is Associate Vice-President: EDI and Professor of Black Canadian Literature at Laurier. An advocate for access to post-secondary education and creator of one of the first Black Studies programs in Canada, she is the recipient of a 3M National Teaching Fellowship, Canada’s highest recognition of educational leadership, and an Honorary Doctor of Laws from Royal Roads University. Arriving at Laurier in 2024, she established an early career research fellowship for Black and Indigenous faculty, supported the creation of a career discovery program for Black and racialized students, organized public lectures in Black Studies, and provided increased institutional support for the Black Brilliance Elementary Conference, hosted by the Tshepo Institute for the Study of Contemporary Africa and the WRDSB.",
        categories: ["COMMUNITY LEADERSHIP & SERVICE", "EDUCATION & MENTORSHIP"]
    },
    {
        id: "brittney-emslie",
        name: "Brittney Emslie",
        bio: "Brittney Emslie is one of the founders and vice-chair of Rhythm & Blues Cambridge, a grassroots, Black women-led organization creating safe, empowering spaces for the Black community. Brittney is currently the Director of Operations at the Kitchener-Waterloo Multicultural Centre and has held several leadership roles within the Waterloo Region Immigration Partnership. Brittney sat on the Ontario Council for Agencies Serving Immigrants Anti-Racism Policy Advisory Board and was Southern-Regional Director at OCASI. Brittney is actively involved in different community-building events and initiatives, such as the KW Multicultural Festival, the Elmira Multicultural Festival, the WR Migration Film Festival, and the #RacialEquityWR public education campaign. She is passionate about advancing social justice, anti-racism, and equity in Waterloo Region.",
        categories: ["COMMUNITY LEADERSHIP & SERVICE", "SOCIAL JUSTICE & ADVOCACY"]
    },
    {
        id: "fabian-fletcher",
        name: "Fabian Fletcher",
        bio: "Fabian Fletcher is a Black, queer-identified community leader advancing health equity for African, Caribbean, and Black (ACB), Indigenous, and racialized communities across Ontario. He currently serves as Director of Programs and Services at Africans in Partnership Against AIDS (APAA), where he leads culturally responsive HIV prevention, education, and support programs for ACB communities. Fabian previously served on the Board of Directors for tri-Pride Community Association, contributing to governance, strategic planning, and community-driven initiatives supporting 2SLGBTQIA+ communities in the Tri-Cities region. Across his leadership roles, he strengthens organizational capacity, advances equity-informed programming, and champions community-led solutions that address systemic barriers and improve long term health outcomes.",
        categories: ["COMMUNITY LEADERSHIP & SERVICE", "SOCIAL JUSTICE & ADVOCACY"]
    },
    {
        id: "faduma-musse",
        name: "Faduma Musse",
        bio: "Faduma Musse is an elementary teacher with the Waterloo Region District School Board and the Executive Director of the Somali Canadian Association of Waterloo Region. As a proud mother of four daughters, she is deeply committed to creating equitable opportunities both in the classroom and in the broader community. With extensive experience in the settlement sector and frontline social services, Faduma has developed a strong understanding of the diverse needs of marginalized communities. Her work is rooted in justice, advocacy, and meaningful social change. She continues to play a vital role in leading community focused initiatives that empower families, newcomers, and racialized communities across the region.",
        categories: ["COMMUNITY LEADERSHIP & SERVICE", "SOCIAL JUSTICE & ADVOCACY"]
    },
    {
        id: "farah-lahens",
        name: "Farah Lahens",
        bio: "Farah Lahens is a Cambridge based Community Service Worker, Certified Peer Support Worker, and Certified Menopause Coach. She is the Founder of MenoThrive Wellness and creator of the Afro-Caribbean Black Mental Health Support Group, providing trauma informed, culturally rooted support for Black women to heal, thrive, and build resilience. Through MenoThrive Wellness, Farah offers holistic, empowering programs for Black and marginalized women navigating the menopause journey, honoring their unique experiences with cultural sensitivity and inclusivity. Her work is centered on advocacy, safe spaces, and community empowerment.",
        categories: ["COMMUNITY LEADERSHIP & SERVICE", "HEALTH & WELLNESS"]
    },
    {
        id: "hans-roach",
        name: "Hans Roach",
        bio: "For over 50 years, Hans Roach has called Waterloo Region home, not just as a resident, but as a mentor, coach, volunteer, and community builder. From leading Waterloo Minor Hockey and coaching at Wilfrid Laurier University, to mentoring youth in the Caribbean community and supporting local food banks like the House of Friendship, Hans’ lifelong commitment has been rooted in lifting others up. Today, as Waterloo’s first and only elected official of colour and a City Councillor, he continues to champion equity, inclusion, and opportunity while supporting initiatives such as Easter Seals Ontario and Special Olympics.",
        categories: ["COMMUNITY LEADERSHIP & SERVICE", "SOCIAL JUSTICE & ADVOCACY"]
    },
    {
        id: "keira-lewis",
        name: "Keira Lewis",
        bio: "Keira Lewis is a passionate community leader with over a decade of experience in service and advocacy. Through her work with Guelph Black Heritage Society, Preston Heights Community Group, House of Friendship, and as a member of the Preston Community Board, she has empowered families, strengthened community connections, and championed equity with unwavering compassion. Keira’s transformative leadership and commitment to social justice have earned her recognition as a nominee for the 2025 YWCA Women of Distinction Award, reflecting her enduring impact on the community she serves.",
        categories: ["COMMUNITY LEADERSHIP & SERVICE"]
    },
    {
        id: "kinya-baker",
        name: "Kinya Baker",
        bio: "Kinya Baker is the Founder and Director of Shades of Humanity Consulting, a Registered Social Worker and DEI strategist who helps organizations across Canada build belonging, trust, and equity through training, coaching, and systems-level change. Her work focuses on practical, trauma informed approaches to reducing harm, interrupting bias, and creating cultures where people can thrive. With experience spanning healthcare, education, municipal government, and nonprofit sectors, Kinya is known for facilitation that is both honest and actionable.",
        categories: ["COMMUNITY LEADERSHIP & SERVICE", "SOCIAL JUSTICE & ADVOCACY"]
    },
    {
        id: "lily-gyamfi-kumanini",
        name: "Lily Gyamfi-Kumanini",
        bio: "Lily Gyamfi-Kumanini is a Ghanaian-Canadian artist, speaker, and community leader dedicated to strengthening Black excellence through storytelling, movement and community rooted leadership. Raised in Waterloo Region and returning after years abroad, she contributes with intention; centering Black, racialized, newcomer, and youth voices with dignity and agency. With over three decades in performance and more than 17 years guiding individuals and communities, Lily bridges creative practice and civic responsibility. She serves as Chair of The Registry Theatre, advancing access, belonging, and meaningful inclusion across the arts.",
        categories: ["COMMUNITY LEADERSHIP & SERVICE", "ARTS & CULTURE"]
    },
    {
        id: "niara-van-gaalen",
        name: "Niara van Gaalen",
        bio: "Niara van Gaalen is an artist and designer of Afro-Surinamese Creole and Dutch descent, born in the Netherlands and raised on the Haldimand Tract in the watershed of the Willow River, in what is now Kitchener, Ontario. She views design as a powerful tool for social and environmental justice, with a deep commitment to community-stewarded land and housing. With four years of experience in sustainability consulting, urban design, and architecture across firms from Vancouver to Amsterdam, Niara combines technical expertise with a collaborative approach to project coordination and public engagement.",
        categories: ["COMMUNITY LEADERSHIP & SERVICE"]
    },
    {
        id: "nicole-brown-faulknor",
        name: "Nicole Brown Faulknor",
        bio: "Nicole Brown Faulknor is a Registered Psychotherapist, Trauma Consultant, Child and Youth Counsellor and Founder & CEO of the Trauma & Embodiment Association of Ontario (TEAO Canada). She is advancing systemic change in mental health by developing trauma-responsive, community-rooted care models that bridge gaps in traditional systems. Nicole leads cross-sector partnerships with public health, education, and corporate stakeholders, and is driving the vision for Canada’s first Trauma Health & Embodiment Centre. Through youth leadership initiatives, community care projects and social innovation, her work expands equitable access to care and strengthens community resilience across the Region.",
        categories: ["COMMUNITY LEADERSHIP & SERVICE", "HEALTH & WELLNESS"]
    },
    {
        id: "rosalind-crocker",
        name: "Rosalind Crocker",
        bio: "Rosalind Crocker was born and raised in Toronto and now resides in Kitchener. She is retired from a provincial government career and works part time as a Tour Director with Great Canadian Holidays. Since 2019, Rosalind has volunteered weekly with Community Justice Initiatives through the STRIDE program at Grand Valley Institution, the federal women’s prison in Kitchener. She dedicates her time to spreading messages of optimism, redemption, and support, maintaining connections with inmates even after their release on parole. Through her volunteer work, Rosalind listens to each individual’s story with respect and empathy.",
        categories: ["COMMUNITY LEADERSHIP & SERVICE", "HEALTH & WELLNESS"]
    },
    {
        id: "zeinab-mana",
        name: "Zeinab Mana",
        bio: "Zeinab Mana is a compassionate leader and fierce advocate for equitable care. As a Client Coordinator and Cultural Interpreter at Community Healthcaring Kitchener-Waterloo (CHCKW), she ensures individuals and families facing systemic barriers access healthcare with dignity and trust. Beyond CHCKW, Zeinab serves as Chairperson of the Arab-Somali Canadian Association and Leader of the Ontario Somali Canadian Advocacy Council, Kitchener-Waterloo. Her leadership uplifts voices, strengthens communities, and exemplifies Black excellence.",
        categories: ["COMMUNITY LEADERSHIP & SERVICE", "SOCIAL JUSTICE & ADVOCACY"]
    },
    {
        id: "zeri-zigeta",
        name: "Zeri Zigeta",
        bio: "Zeri Zigeta is Co-Executive Director of Kinbridge Community Association in Cambridge, ON. With nearly a decade of experience in community development and newcomer services, Zeri has led initiatives that expand youth employment, recreation access, and culturally responsive programming for families across the region. As a first generation Canadian shaped by the immigrant experience, Zeri is deeply committed to strengthening communities by centering dignity, equity, and collaboration. His leadership focuses on empowering youth and newcomers to thrive while cultivating spaces where diverse voices are heard, valued, and celebrated.",
        categories: ["COMMUNITY LEADERSHIP & SERVICE"]
    },
    {
        id: "aaron-tyler-francis",
        name: "Aaron Tyler Francis",
        bio: "Aaron Tyler Francis is a doctoral student at the Balsillie School of International Affairs at the University of Waterloo, researching the influence of Rastafari culture on Jamaican foreign policy. He is also a community archivist, curator, and the founder of Vintage Black Canada, a multidisciplinary creative archive documenting the transnational modern history of the African Diaspora in Canada. Since its founding in 2019, Vintage Black Canada’s art, video, and photographic work has been exhibited at the Art Gallery of Ontario, the University of Waterloo Art Gallery, and featured in Maclean’s magazine.",
        categories: ["EDUCATION & MENTORSHIP", "ARTS & CULTURE"]
    },
    {
        id: "nathan-hughes",
        name: "Nathan Hughes",
        bio: "Nathan Hughes is a Training Specialist with Region of Waterloo Paramedic Services, where he leads the local implementation of the province-wide EVAP (External Violence Against Paramedics) initiative. Rooted in REDI-Reconciliation, Equity, Diversity, and Inclusion, Nathan advances culturally responsive, trauma-informed leadership within emergency services. As a proud Black and gay leader, he is committed to breaking barriers in historically underrepresented spaces and expanding access to the profession. He regularly speaks to high school students exploring post-secondary pathways and careers in paramedicine.",
        categories: ["EDUCATION & MENTORSHIP"]
    },
    {
        id: "roger-caesar",
        name: "Roger Caesar",
        bio: "Roger Caesar is a dynamic speaker, coach, author, and leadership catalyst whose work is rooted in empowering individuals to find their voice, lead with confidence, and create meaningful impact. He believes excellence extends beyond achievement; it is the courage to act, the commitment to serve, and the responsibility to open doors for the next generation. Through transformative presentations, coaching experiences, and community engagement, Roger creates spaces where potential is recognized, cultivated, and celebrated.",
        categories: ["EDUCATION & MENTORSHIP"]
    },
    {
        id: "uchenna-opara",
        name: "Uchenna Opara",
        bio: "Uchenna Opara is committed to helping Canadian families make confident, informed financial decisions that build long term stability. With a gift for breaking down complex topics like life insurance, wealth planning, and financial protection, Uchenna empowers individuals to take practical steps toward creating real security for themselves and the next generation. Guided by honesty, education, and a deep dedication to community wellbeing, Uchenna’s mission is to support families in moving beyond “just getting by” and toward building strong, sustainable financial futures.",
        categories: ["EDUCATION & MENTORSHIP", "BUSINESS & ENTREPRENEURSHIP"]
    },
    {
        id: "teneile-warren",
        name: "Teneile Warren",
        bio: "Teneile Warren is a Black Jamaican-born, nonbinary, and Queer activist, writer, playwright, chef, and educator. Teneile is a recipient of the 2023 Black Excellence in Leadership Award and the 2024 Ken Murray Community Catalyst award. They believe in sustainable futures led by community, not systems. Teneile is a member of the African, Caribbean, and Black Network of Waterloo Region and the Editorial Director of Textile Collective. Teneile lives in Kitchener with their family.",
        categories: ["EDUCATION & MENTORSHIP", "ARTS & CULTURE"]
    },
    {
        id: "anna-adegoke",
        name: "Anna Adegoke",
        bio: "Anna Adegoke is the powerhouse founder and CEO of Naija Chops, the bold snack brand celebrating the unforgettable flavours of her Nigerian roots. After 15 years in Corporate Banking, she followed her true passion, creating food that feels like home. Warm, generous, and instinctively welcoming, Anna brings people together through flavour. Naija Chops reconnects the African community with the tastes they love while introducing the world to Nigeria’s vibrant culinary soul.",
        categories: ["BUSINESS & ENTREPRENEURSHIP"]
    },
    {
        id: "takawira-mundure",
        name: "Takawira Mundure",
        bio: "Takawira Mundure is the Founder and CEO of Digital Maples Labs Inc., a Kitchener-based digital agency specializing in web development, mobile applications, AI automation, and business solutions for small and medium-sized businesses. A self-taught technologist and CSPO-certified product owner, he focuses on making technology more accessible, especially for underrepresented communities and Black-owned businesses. His mission is to use technology as a vehicle for economic empowerment, digital inclusion, and representation.",
        categories: ["BUSINESS & ENTREPRENEURSHIP"]
    },
    {
        id: "vanessas-cuisine",
        name: "Vanessa’s Cuisine",
        bio: "Vanessa’s Cuisine, owned by Vanessa Simon, is a thriving Caribbean food company built on passion, perseverance, and community. Vanessa transformed her love for cooking into a business that now serves families, schools, corporations, and major retailers across the region. Known for her authentic flavors and commitment to excellence, Vanessa has built a brand that brings people together while remaining deeply rooted in its Caribbean heritage.",
        categories: ["BUSINESS & ENTREPRENEURSHIP"]
    },
    {
        id: "aunty-didi",
        name: "Aunty Didi",
        bio: "Aunty Didi is the visionary cultural storytelling brand bringing African folktales to children and families around the world. Through Tales from the Motherland, Aunty Didi preserves and reimagines the rich oral traditions of Africa; teaching resilience, kindness, courage, integrity, and self-belief. Her work creates magical spaces where children see themselves reflected with dignity and pride, celebrating heritage, character, and imagination with every tale.",
        categories: ["ARTS & CULTURE"]
    },
    {
        id: "grace-ibrahima",
        name: "Grace Ibrahima",
        bio: "Grace Ibrahima is an award-winning author whose lifelong work has empowered and uplifted the Black community. Through her writing and presentations, she has created safe spaces for youth and adults to engage in honest dialogue, fostering understanding, dignity, and belonging. Her decades of leadership, advocacy, and education have strengthened generations, leaving a lasting legacy of courage and Black excellence.",
        categories: ["LIFETIME ACHIEVEMENT & LEGACY"]
    },
    {
        id: "edwin-laryea",
        name: "Dr. Edwin W. D. Laryea",
        bio: "Dr. Edwin W. D. Laryea is a distinguished educator, playwright, anti-racism researcher, and longstanding community leader. Originally from Ghana, he has dedicated his career to advancing equitable education and social justice. He has served in major roles, including Lecturer at the University of Toronto and Department Head at Bluevale Collegiate. His leadership spans numerous boards, reflecting a deep commitment to community wellness and policy response for marginalized groups.",
        categories: ["LIFETIME ACHIEVEMENT & LEGACY"]
    },
    {
        id: "barbra-kissa-yeko",
        name: "Barbra Kissa Yeko",
        bio: "Barbra Kissa Yeko is a trauma-informed psychotherapist dedicated to healing and wellness within the Black community. She views mental health as a pathway to liberation and growth, helping individuals uncover the strength they already carry. Through culturally responsive, affirming care, she creates brave spaces where individuals and groups can heal from trauma, reclaim their stories, and reconnect with their identity.",
        categories: ["HEALTH & WELLNESS"]
    },
    {
        id: "christine-brown",
        name: "Christine Brown",
        bio: "Christine Brown is a dedicated Wellness Ambassador and community leader known for her transformative approach to on-site health services. From pioneering seated massage and reflexology programs at senior centres to supporting high-stress corporate environments, Christine’s work bridges the gap between wellness and accessibility. Her commitment to restorative care embodies the spirit of excellence and service to others.",
        categories: ["HEALTH & WELLNESS"]
    },
    {
        id: "ibukun-olagbemiro",
        name: "Ibukun Olagbemiro",
        bio: "Ibukun Olagbemiro MSc, MSW, RSW, is a Registered Therapist who provides compassionate, evidence-informed psychotherapy support. His practice is grounded in culturally aware, trauma-informed, and capacity-enhancing approaches that honour the lived experiences of every client. He works from the belief that clients are not puzzles to be solved, but people to be supported with dignity, collaboration, and care.",
        categories: ["HEALTH & WELLNESS"]
    },
    {
        id: "bello-abdulsalam",
        name: "Bello Abdulsalam",
        bio: "Bello Abdulsalam is a Grade 12 student at Waterloo Collegiate Institute and a dedicated young leader. He volunteers with Kind Minds Family Wellness and several other community organizations, contributing his time to support youth and families. Bello is passionate about creativity and is currently working on his first novel, reflecting his discipline and commitment to personal growth.",
        categories: ["YOUTH LEADERSHIP & INNOVATION"]
    },
    {
        id: "asmanur-negash",
        name: "Asmanur Negash",
        bio: "Asmanur Negash is a Psychology student at University of Waterloo, deeply committed to equity, social justice, and uplifting newcomer and refugee youth. Having arrived in Canada as a refugee, she draws on her lived experience to advocate for marginalized communities. Asmanur has worked with YMCA, Reception House, and House of Friendship, amplifying the voices of Black, Muslim, and newcomer youth.",
        categories: ["YOUTH LEADERSHIP & INNOVATION"]
    },
    {
        id: "kinbridge-association",
        name: "Kinbridge Community Association",
        bio: "Kinbridge Community Association is a foundational community hub in Cambridge that brings people together to build leadership and strengthen neighbourhood connections. For over two decades, Kinbridge has engaged residents in programs that build collective resilience. By working alongside residents to celebrate diversity and respond to local needs, Kinbridge exemplifies community leadership and shared purpose.",
        categories: ["COMMUNITY ALLYSHIP & SOLIDARITY", "EQUITY IN ACTION"]
    },
    {
        id: "wecare-centre",
        name: "WeCare Centre",
        bio: "WeCare Centre is a community-rooted non-profit dedicated to strengthening belonging and collective care for underserved communities. With a deep commitment to supporting immigrants, refugees, and families, WeCare works to ensure that no one faces hardship alone. Their trauma-informed, culturally responsive supports help individuals rebuild stability and confidence.",
        categories: ["COMMUNITY ALLYSHIP & SOLIDARITY", "EQUITY IN ACTION"]
    },
    {
        id: "narine-sookram",
        name: "Dr. Narine Dat Sookram",
        bio: "Dr. Narine Dat Sookram is a researcher, social worker, and psychotherapist known for initiating the Caribbean Dreams Concert and Caribbean Spice Radio. Guyanese-Canadian and highly decorated, he holds over two hundred awards. His career spans social services and mental health, including private practice that has significantly benefited the Black community.",
        categories: ["COMMUNITY ALLYSHIP & SOLIDARITY"]
    },
    {
        id: "afro-org",
        name: "African Family Revival Organization (AFRO)",
        bio: "African Family Revival Organization is a community-centered organization committed to strengthening African families through education, mentorship, and cultural preservation. They create inclusive spaces where families can celebrate their heritage. Their mission promotes unity and resilience, ensuring future generations are equipped with confidence and knowledge to thrive.",
        categories: ["EQUITY IN ACTION"]
    },
    {
        id: "i-sky-consulting",
        name: "I Sky Consulting (Iona Sky)",
        bio: "I Sky Consulting is an EDIA consulting firm founded by Iona Sky, dedicated to building compassionate and human-centred workplaces. Rooted in social work values, the firm centers solidarity and accountability as the foundation for meaningful equity work. They equip leaders with the tools to navigate cultural shifts and foster environments where belonging is lived.",
        categories: ["EQUITY IN ACTION"]
    },
    {
        id: "mona-loffelmann",
        name: "Mona Loffelmann",
        bio: "Mona Loffelmann has spent over a decade ensuring that community members feel valued and included. She leads outreach programs that engage Black and marginalized communities, promoting equity. An accomplished communicator, she serves as Founder and Executive Director of AFRO and as Project Coordinator for the Support Through Generations program.",
        categories: ["EQUITY IN ACTION"]
    }
];

export const testimonials: Testimonial[] = [
    { quote: "The keynote this year sounds incredible! I can’t wait to hear the stories and wisdom being shared." },
    { quote: "Wow! look at this lineup of panelists! So many inspiring leaders in one place. This is going to be amazing." },
    { quote: "The vendors coming are my favorite part, I love supporting Black-owned businesses and seeing what the community has to offer." },
    { quote: "The nominee list is STACKED! Can’t wait to celebrate their hard work, resilience, and creativity." },
    { quote: "This gala is going to be unforgettable; the mix of performances, speakers, and community energy is unmatched." },
    { quote: "So excited to see the incredible stories of success, perseverance, and breaking barriers being honored." },
    { quote: "I have been following the social media pages and wow, the nominations this inaugural year are next level inspiring!" },
    { quote: "Can’t wait to connect with the community, celebrate brilliance, and lift each other up." },
    { quote: "The energy in the room is going to be electric. So many leaders, innovators, and changemakers; I am ready!" },
    { quote: "Seeing all the sponsors behind this event makes me even more excited to attend; they really believe in the nominees!" },
    { quote: "The nominees’ journeys are so inspiring. It’s amazing to see them celebrated on this stage." },
    { quote: "I am truly honored to be nominated in the Business & Entrepreneur category, sponsored by TD! I can’t wait to meet my fellow nominees and celebrate all the incredible talent in our community; this is such an exciting moment!" },
    { quote: "I am so excited to be nominated in the Youth category! I can’t wait to meet my supporters and sponsor and celebrate this amazing moment with everyone at the gala!" }
];

export const teamQuotes = [
    {
        author: "Uzma Bhutto",
        role: "Lead Event & Facilitator",
        quote: "Having worked on every detail of this gala from designing the experience and curating the content, to engaging sponsors and bringing together amazing talent, I can’t wait to see it all come to life. This night is a celebration of brilliance, resilience, and culture, with inspiring performances, spoken poetry, and stories that uplift our community. Don’t miss the chance to witness these achievements and be part of this unforgettable evening, get your tickets today!"
    }
];
