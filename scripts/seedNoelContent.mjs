/**
 * seedNoelContent.mjs
 * Seeds ALL frontend content for Noel Construction into Firestore (noel_content collection).
 * Collections written:
 *   noel_content/services       → Service cards + full detail pages
 *   noel_content/projects       → Portfolio project cards
 *   noel_content/reviews        → Client testimonials
 *   noel_content/hero_slider    → Homepage hero slides
 *   noel_content/home           → Homepage section config
 *   noel_content/before_after   → Before & After page items
 *   noel_content/gallery        → Gallery page images (empty shell — user fills images)
 *   noel_content/footer         → Footer contact, nav & developer credit
 *
 * Run: node scripts/seedNoelContent.mjs
 */

import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const admin = require('firebase-admin');

// ── Firebase Admin SDK — uses Application Default Credentials ─────────────────
// Credentials source: ~/.config/gcloud/application_default_credentials.json
if (!admin.apps.length) {
  admin.initializeApp({
    projectId: 'nspc-web',
    credential: admin.credential.applicationDefault(),
  });
}

const db = admin.firestore(); // (default) database
// Firestore Admin SDK bypasses security rules — full write access

const COL = 'noel_content'; // noel site with usePrefix:true → noel_content

// ─────────────────────────────────────────────────────────────────────────────
// DATA
// ─────────────────────────────────────────────────────────────────────────────

const SERVICES = [
  {
    id: 'svc-exterior',
    category: 'Exterior Work',
    title: 'Precision Exterior Solutions',
    description: 'Protect and beautify your home with premium siding, windows, and structural enhancements that stand up to every season.',
    fullDescription: "A home's exterior envelope is its first line of defense. We don't just hang siding; we build a fully integrated rainscreen system. Our process includes installing Tyvek housewrap with taped seams, custom-fabricated aluminum window flashings to shed water, and heavy-duty fiber cement or premium cedar siding. We focus on proper drainage cavities and ventilation at the soffits and starter strips to prevent trapped moisture, mold, and dry rot.",
    imageUrl: 'https://images.unsplash.com/photo-1628744448840-55bdb2497bd4?q=80&w=800&auto=format&fit=crop',
    beforeImage: 'https://images.unsplash.com/photo-1590060419632-68c37ed55f26?q=80&w=800&auto=format&fit=crop',
    afterImage: 'https://images.unsplash.com/photo-1628744448840-55bdb2497bd4?q=80&w=800&auto=format&fit=crop',
    icon: 'home',
    isFeatured: true,
    isActive: true,
    order: 1,
    struggles: [
      "Incorrectly installed housewrap causing moisture entrapment and frame rot.",
      "Improper window flashing resulting in hidden sill leaks and drywall damage.",
      "Warped or buckled siding due to tight nailing and lack of thermal expansion gaps.",
      "Poor soffit ventilation leading to ice damming and attic condensation in winter.",
    ],
    processSteps: [
      { step: "01", title: "Site Prep & Teardown", desc: "Strip old siding, inspect the sheathing for rot, and repair structural framing." },
      { step: "02", title: "Weatherization", desc: "Install premium weather-resistant barriers and seal all window/door penetrations with flashing tape." },
      { step: "03", title: "Framing Rainscreen", desc: "Attach vertical furring strips to create a dedicated 3/4-inch drainage and ventilation cavity." },
      { step: "04", title: "Siding Installation", desc: "Fasten premium siding with stainless steel fasteners and seal joints with color-matched sealant." },
    ],
  },
  {
    id: 'svc-gardens',
    category: 'Sustainability',
    title: 'Food Security & Gardens',
    description: 'Specialized vegetable gardens and custom yard setups designed for maximum yield and lasting durability.',
    fullDescription: "Growing your own food requires more than just soil; it requires built-to-last agricultural carpentry. We construct high-yield raised beds using rot-resistant rough-sawn 2-inch Western Red Cedar, held together with heavy-duty structural timber screws. We line each bed with non-woven geotextile fabric to prevent weed invasion while maintaining optimal drainage. Our setups include integrated drip irrigation lines with automatic solar-powered timers and custom pest-barrier fencing.",
    imageUrl: 'https://images.unsplash.com/photo-1592150621344-22d7688860bc?q=80&w=800&auto=format&fit=crop',
    beforeImage: 'https://images.unsplash.com/photo-1558905619-172542012737?q=80&w=800&auto=format&fit=crop',
    afterImage: 'https://images.unsplash.com/photo-1592150621344-22d7688860bc?q=80&w=800&fit=crop',
    icon: 'leaf',
    isFeatured: true,
    isActive: true,
    order: 2,
    struggles: [
      "Soil pressure bowing and cracking thin, stapled pine garden boxes within one season.",
      "Direct ground contact leading to premature timber rot and chemical leaching into soil.",
      "Uneven watering cycles drying out root zones or drowning crops in poor draining clay.",
      "Pest invasions from uncovered ground access points destroying harvests.",
    ],
    processSteps: [
      { step: "01", title: "Site Assessment", desc: "Evaluate sun exposure, soil quality, drainage grades, and available water access points." },
      { step: "02", title: "Frame Construction", desc: "Craft raised bed frames using thick, rough-sawn Western Red Cedar timber for maximum longevity." },
      { step: "03", title: "Liner & Fill", desc: "Install geotextile weed barrier, fill with custom blended topsoil, compost, and perlite mix." },
      { step: "04", title: "Irrigation Install", desc: "Set up drip lines, auto-timers, and pest-protection fencing around the completed garden." },
    ],
  },
  {
    id: 'svc-decks',
    category: 'Decks & Patios',
    title: 'Custom Decks & Outdoor Living',
    description: 'Custom-designed decks using the finest materials, built to withstand the elements and last for decades.',
    fullDescription: "A Noel Construction deck is an extension of your primary living space. We use premium cedar and sustainable composite materials to craft multi-level outdoor oasis spaces. Our signature includes hidden fastening systems, custom-built stairs, and integrated ambient lighting. Every joint is precision-cut to ensure your outdoor sanctuary remains structural and stunning through generations of seasonal changes.",
    imageUrl: 'https://images.unsplash.com/photo-1590060419632-68c37ed55f26?q=80&w=800&auto=format&fit=crop',
    beforeImage: 'https://images.unsplash.com/photo-1591825729269-caeb344f6df2?q=80&w=800&auto=format&fit=crop',
    afterImage: 'https://images.unsplash.com/photo-1590060419632-68c37ed55f26?q=80&w=800&fit=crop',
    icon: 'sun',
    isFeatured: true,
    isActive: true,
    order: 3,
    struggles: [
      "Shallow deck footings shifting and heaving during winter freeze-thaw cycles.",
      "Water pooling on top of flat joists causing joist rot and loose deck boards.",
      "Warped deck surfaces and split wood ends from cheap top-screwing techniques.",
      "Corrosion of standard fasteners causing structural connection failure over time.",
    ],
    processSteps: [
      { step: "01", title: "Frost-Line Footings", desc: "Dig footings to 4-foot depths, install Sonotubes, and pour structural concrete piers." },
      { step: "02", title: "Ledger & Joist Framing", desc: "Mount ledger boards with heavy-duty lag shields and flash them to prevent wall rot." },
      { step: "03", title: "Joist Protection", desc: "Apply asphalt flashing tape along the tops of all joists to prevent water intrusion." },
      { step: "04", title: "Hidden Fastening", desc: "Install premium cedar or composite boards with hidden clips for a smooth, high-end finish." },
    ],
  },
  {
    id: 'svc-stairs',
    category: 'Stairs & Railings',
    title: 'Architectural Staircases',
    description: 'Custom-built stairs and railings that blend structural integrity with artistic design for a truly striking interior.',
    fullDescription: "Bespoke staircases are the centerpieces of any high-end interior. We specialize in grand architectural stairs and precision railings that combine solid hardwood with modern glass or steel elements. Our process involves detailed structural engineering and traditional joinery techniques, resulting in a safe, silent, and visually arresting transition between the levels of your home.",
    imageUrl: 'https://images.unsplash.com/photo-1506974210746-9b43936660dc?q=80&w=800&auto=format&fit=crop',
    beforeImage: 'https://images.unsplash.com/photo-1581850518616-bcb81881443e?q=80&w=800&auto=format&fit=crop',
    afterImage: 'https://images.unsplash.com/photo-1506974210746-9b43936660dc?q=80&w=800&auto=format&fit=crop',
    icon: 'layers',
    isFeatured: true,
    isActive: true,
    order: 4,
    struggles: [
      "Squeaking and creaking stairs caused by dry wood joints rubbing against unglued nails.",
      "Wobbly handrails and loose balusters from direct mounting onto drywall or thin subfloors.",
      "Uneven riser heights leading to dangerous trip hazards and failed building inspections.",
      "Cracked treads from selecting soft woods or failing to allow for humidity changes.",
    ],
    processSteps: [
      { step: "01", title: "Digital Layout", desc: "Measure total rise and run, calculate exact tread-riser ratios, and route stringers." },
      { step: "02", title: "Under-Structure Carriage", desc: "Install double structural center stringers to eliminate any middle sag or deflection." },
      { step: "03", title: "Assembly & Joinery", desc: "Pocket-glue, wedge, and screw treads and risers together to create a monolithic wood structure." },
      { step: "04", title: "Railing Anchor", desc: "Thru-bolt newel posts directly into floor joists for rock-solid railing stability." },
    ],
  },
  {
    id: 'svc-reno',
    category: 'Renovations',
    title: 'Whole-Home Modernization',
    description: 'Comprehensive renovation services including basement upgrades, kitchen transformations, and full interior remodels.',
    fullDescription: "Our full-home renovations are holistic transformations. We manage the entire lifecycle from structural modifications to fine interior finishes. Whether it's expanding a basement into a luxury executive suite or modernizing a heritage home, we maintain the integrity of the original structure while introducing contemporary efficiencies, high-end materials, and premium aesthetics tailored to your lifestyle.",
    imageUrl: 'https://images.unsplash.com/photo-1484154218962-a197022b5858?q=80&w=800&auto=format&fit=crop',
    beforeImage: 'https://images.unsplash.com/photo-1581850518616-bcb81881443e?q=80&w=800&auto=format&fit=crop',
    afterImage: 'https://images.unsplash.com/photo-1484154218962-a197022b5858?q=80&w=800&auto=format&fit=crop',
    icon: 'tool',
    isFeatured: true,
    isActive: true,
    order: 5,
    struggles: [
      "Sagging ceilings and cracked door frames from removing load-bearing walls without proper support.",
      "Undiagnosed mold, water damage, or structural rot covered up by hasty cosmetic updates.",
      "Drafty rooms and high utility bills due to cheap fiberglass insulation and poor vapor seals.",
      "Wavy walls and visible drywall joints from rushed mudding and sanding work.",
    ],
    processSteps: [
      { step: "01", title: "Structural Demo", desc: "Erect temporary shoring walls, strip drywall, and remove old structural partitions." },
      { step: "02", title: "Load Transfers", desc: "Hoist and bolt Laminated Veneer Lumber (LVL) beams and install support columns." },
      { step: "03", title: "Mechanical Rough-ins", desc: "Coordinate licensed plumbing, electrical, HVAC layouts, and add soundproofing insulation." },
      { step: "04", title: "Drywall & Finish Trim", desc: "Install mold-resistant drywall, mud to Level 4 finish, and nail premium baseboards." },
    ],
  },
  {
    id: 'svc-woodworking',
    category: 'Woodworking',
    title: 'Traditional Woodworking',
    description: 'Custom cabinetry, built-in units, and fine finish carpentry that adds timeless value and character to your home.',
    fullDescription: "True custom cabinetry is about more than just storage; it's about defining the soul of a residence. We specialize in traditional dovetail joinery, hand-turned details, and bespoke finishes that highlight the natural grain of premium timbers. From heirloom-quality libraries to modern minimalist kitchens, our woodwork is tailored to the exact dimensions of your life and home.",
    imageUrl: 'https://images.unsplash.com/photo-1505691938895-1758d7eaa511?q=80&w=800&auto=format&fit=crop',
    beforeImage: 'https://images.unsplash.com/photo-1533090161767-e6ffed986c88?q=80&w=800&auto=format&fit=crop',
    afterImage: 'https://images.unsplash.com/photo-1505691938895-1758d7eaa511?q=80&w=800&auto=format&fit=crop',
    icon: 'hammer',
    isFeatured: true,
    isActive: true,
    order: 6,
    struggles: [
      "Bending and sagging cabinet shelves due to thin particleboard materials and wide spans.",
      "Sticking drawers and doors that sag over time from cheap roller slides and hinge hardware.",
      "Chipping, peeling, and yellowing finishes from using standard wall paint on cabinetry.",
      "Built-in units that don't fit flush against uneven plaster walls and crooked floors.",
    ],
    processSteps: [
      { step: "01", title: "Precision Measurement", desc: "Use laser levels to map wall plumbness, floor levelness, and cabinet boundaries." },
      { step: "02", title: "Cabinet Bench-Build", desc: "Construct cabinet cases using dado joints and assemble solid-wood drawer boxes." },
      { step: "03", title: "Shop Lacquer Finish", desc: "Sand wood surfaces and apply two coats of high-durability catalyzed lacquer finish." },
      { step: "04", title: "Scribe & Installation", desc: "Fit cabinet units on-site, scribing face frames to sit perfectly flush against crooked walls." },
    ],
  },
  {
    id: 'svc-bathroom',
    category: 'Renovations',
    title: 'Luxury Bathroom Remodels',
    description: 'From tile-to-ceiling wet walls to custom vanities, we deliver spa-quality bathroom transformations that last a lifetime.',
    fullDescription: "A bathroom renovation from Noel Construction begins with a waterproofed, structurally sound substrate—no shortcuts. We install Schluter KERDI membranes or Wedi board systems before a single tile is set, ensuring a leak-proof substrate for decades. Our process includes in-floor radiant heating, large-format porcelain tile installation with minimal grout joints, custom solid-wood vanities with soft-close hardware, and built-in niches for a clean, luxury finish.",
    imageUrl: 'https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?q=80&w=800&auto=format&fit=crop',
    beforeImage: 'https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?q=80&w=800&auto=format&fit=crop',
    afterImage: 'https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?q=80&w=800&auto=format&fit=crop',
    icon: 'droplet',
    isFeatured: true,
    isActive: true,
    order: 7,
    struggles: [
      "Tile grout cracking and falling out from installing over a flexing, non-rigid subfloor.",
      "Black mold growing behind walls from failed caulk and missing vapor barriers.",
      "Running out of hot water due to an undersized water heater for the renovated bathroom.",
      "Poorly sealed shower niches allowing water to seep into the wall cavity over time.",
    ],
    processSteps: [
      { step: "01", title: "Demo & Waterproof", desc: "Strip to studs, inspect subfloor, and install a full waterproofing membrane system." },
      { step: "02", title: "Plumbing Rough-In", desc: "Relocate or upgrade supply and drain lines with a licensed plumber for new fixture layout." },
      { step: "03", title: "Tile & Shower Build", desc: "Install cement board, heated floor mat, and set large-format tiles with precision leveling clips." },
      { step: "04", title: "Fixtures & Finishing", desc: "Hang custom vanity, set freestanding tub, install fixtures, and seal all penetrations." },
    ],
  },
  {
    id: 'svc-water',
    category: 'Exterior Work',
    title: 'Water Management Systems',
    description: 'Advanced drainage and waterproofing solutions that protect your property\'s foundation from costly moisture damage.',
    fullDescription: "Unmanaged water is the number one enemy of a home's structural longevity. We design and install comprehensive water management systems including French drains, weeping tiles, sump pump pits, window well drains, and positive-grade grading corrections. On the interior side, we apply crystalline waterproofing compounds to foundation walls and install interior drain tile systems connected to redundant sump pumps with battery backups.",
    imageUrl: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?q=80&w=800&auto=format&fit=crop',
    beforeImage: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?q=80&w=800&auto=format&fit=crop',
    afterImage: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?q=80&w=800&auto=format&fit=crop',
    icon: 'shield',
    isFeatured: false,
    isActive: true,
    order: 8,
    struggles: [
      "Wet basement floors after every heavy rain due to positive slope toward the foundation.",
      "Efflorescence and white mineral deposits signaling active hydrostatic pressure through the wall.",
      "Flooding window wells during spring thaw, leading to mold in finished basement spaces.",
      "Sump pump running constantly without managing to keep up with water infiltration.",
    ],
    processSteps: [
      { step: "01", title: "Drainage Audit", desc: "Assess grading, downspout discharge, and window well drainage at the perimeter." },
      { step: "02", title: "Excavation", desc: "Dig along the affected foundation wall to expose the footing and weeping tile." },
      { step: "03", title: "Drain Tile Install", desc: "Lay new perforated pipe in washed gravel, wrapped in filter sock, with an inspection port." },
      { step: "04", title: "Backfill & Grade", desc: "Backfill with granular material, waterproof the wall face, and restore positive grading." },
    ],
  },
];

const PROJECTS = [
  {
    id: 'proj-lakeside-deck',
    title: 'Modern Lakeside Deck',
    category: 'Decks & Patios',
    description: 'A multi-level cedar deck with integrated ambient lighting, architectural glass railings, and built-in bench seating.',
    coverImage: 'https://images.unsplash.com/photo-1590060419632-68c37ed55f26?q=80&w=800&auto=format&fit=crop',
    client: 'Private Residence',
    year: '2023',
    location: 'Kitchener, ON',
    featured: true,
    isFeatured: true,
    order: 1,
  },
  {
    id: 'proj-walnut-kitchen',
    title: 'Custom Walnut Kitchen',
    category: 'Woodworking',
    description: 'Solid walnut cabinetry with hand-cut dovetail joinery, custom bronze hardware, and a matching solid island.',
    coverImage: 'https://images.unsplash.com/photo-1505691938895-1758d7eaa511?q=80&w=800&auto=format&fit=crop',
    client: 'Gourmet Chef Residence',
    year: '2024',
    location: 'Waterloo, ON',
    featured: true,
    isFeatured: true,
    order: 2,
  },
  {
    id: 'proj-estate-exterior',
    title: 'Luxury Estate Entrance',
    category: 'Exterior Work',
    description: 'Full exterior renovation including new fiber cement siding, stone accent columns, and a dramatic custom entry door system.',
    coverImage: 'https://images.unsplash.com/photo-1628744448840-55bdb2497bd4?q=80&w=800&auto=format&fit=crop',
    client: 'Private Estate',
    year: '2023',
    location: 'Cambridge, ON',
    featured: true,
    isFeatured: true,
    order: 3,
  },
  {
    id: 'proj-floating-stairs',
    title: 'Minimalist Floating Staircase',
    category: 'Stairs & Railings',
    description: 'A structurally engineered floating white oak staircase with 10mm tempered glass railings and concealed LED strip lighting.',
    coverImage: 'https://images.unsplash.com/photo-1506974210746-9b43936660dc?q=80&w=800&auto=format&fit=crop',
    client: 'Modern Home Build',
    year: '2024',
    location: 'Guelph, ON',
    featured: true,
    isFeatured: true,
    order: 4,
  },
  {
    id: 'proj-master-suite',
    title: 'Full Master Suite Renovation',
    category: 'Renovations',
    description: 'Complete bedroom and ensuite transformation featuring a spa bathroom, custom walk-in closet, and coffered ceiling.',
    coverImage: 'https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?q=80&w=800&auto=format&fit=crop',
    client: 'Family Residence',
    year: '2024',
    location: 'Kitchener, ON',
    featured: false,
    isFeatured: false,
    order: 5,
  },
  {
    id: 'proj-garden-beds',
    title: 'Premium Raised Garden System',
    category: 'Sustainability',
    description: 'Six interconnected Western Red Cedar raised beds with drip irrigation, auto-timers, and an integrated herb spiral.',
    coverImage: 'https://images.unsplash.com/photo-1592150621344-22d7688860bc?q=80&w=800&auto=format&fit=crop',
    client: 'Urban Homesteader',
    year: '2023',
    location: 'Waterloo, ON',
    featured: false,
    isFeatured: false,
    order: 6,
  },
];

const REVIEWS = [
  {
    id: 'rev-1',
    clientName: 'James Wilson',
    projectType: 'Full Kitchen Renovation',
    rating: 5,
    quote: 'Noel and his team transformed our outdated kitchen into a modern masterpiece. Their attention to detail is truly unmatched — every cabinet is perfectly level and the finish is flawless.',
    date: '2023-11-15',
    isActive: true,
  },
  {
    id: 'rev-2',
    clientName: 'Sarah Miller',
    projectType: 'Custom Decking',
    rating: 5,
    quote: 'Professional, punctual, and highly skilled. The new deck is exactly what we wanted for our summer entertaining. We get compliments from every guest.',
    date: '2024-02-10',
    isActive: true,
  },
  {
    id: 'rev-3',
    clientName: 'Robert Chen',
    projectType: 'Exterior Work',
    rating: 5,
    quote: 'The stonework and new siding on our entrance is breathtaking. We get compliments from every neighbor. Extremely professional crew who cleaned up every single day.',
    date: '2023-09-22',
    isActive: true,
  },
  {
    id: 'rev-4',
    clientName: 'Elena Rodriguez',
    projectType: 'Architectural Staircase',
    rating: 5,
    quote: 'Hand-crafted floating stairs that are truly a work of art. The precision and finish are absolutely perfect. Our home looks like it belongs in a design magazine.',
    date: '2024-04-05',
    isActive: true,
  },
  {
    id: 'rev-5',
    clientName: 'Michael Thompson',
    projectType: 'Bathroom Remodel',
    rating: 5,
    quote: 'Our master ensuite is now a luxury spa. Noel\'s team waterproofed everything properly before tiling — no shortcuts. The radiant floor heating was worth every penny.',
    date: '2024-01-18',
    isActive: true,
  },
  {
    id: 'rev-6',
    clientName: 'Patricia Nguyen',
    projectType: 'Custom Cabinetry',
    rating: 5,
    quote: 'The built-in library they crafted for our study is stunning. Real dovetail joints, the wood grain is gorgeous, and the shelves are dead-straight. Exceptional quality.',
    date: '2023-07-30',
    isActive: true,
  },
];

const HERO_SLIDER = {
  slides: [
    {
      id: 'slide-1',
      title: 'Focused on Quality Work',
      subtitle: 'We deliver high-quality home renovation solutions designed with a strong focus on craftsmanship and lasting results.',
      cta: 'Explore Services',
      link: '/services',
      imageUrl: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
      isActive: true,
      order: 1,
    },
    {
      id: 'slide-2',
      title: 'Master Craftsmanship Since 1989',
      subtitle: 'Over 35 years of woodworking, exterior renovations, and custom builds across the Kitchener-Waterloo region.',
      cta: 'View Our Portfolio',
      link: '/portfolio',
      imageUrl: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=1200&q=80',
      isActive: true,
      order: 2,
    },
    {
      id: 'slide-3',
      title: 'Transform Your Living Space',
      subtitle: 'From luxury bathrooms to architectural staircases — every project is handled with the precision you deserve.',
      cta: 'Get a Free Quote',
      link: '/contact',
      imageUrl: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?auto=format&fit=crop&w=1200&q=80',
      isActive: true,
      order: 3,
    },
  ],
};

const HOME_PAGE = {
  title: 'Home',
  sections: {
    hero: { enabled: true, order: 1 },
    services: {
      heading: 'Our Specialized Services',
      subtitle: 'EXPERT CRAFTSMANSHIP',
      enabled: true,
      order: 2,
    },
    our_story: {
      heading: 'A Legacy of Craftsmanship',
      subtitle: 'OUR STORY',
      content: `<p>Noel's journey in woodworking began at the age of 15, mastering traditional hand tools in his home country of El Salvador. Twenty-two years ago, he brought that passion to the Kitchener-Waterloo region, establishing a reputation for excellence in the local construction industry.</p><p>With a deep foundation in cabinetmaking and general construction, Noel completed his formal apprenticeship at Conestoga College in 2008. Today, with over 35 years of experience, he combines old-world craftsmanship with modern building standards to deliver results that are both budget-friendly and uncompromising in quality.</p>`,
      stat1Value: '35+',
      stat1Label: 'Years Experience',
      stat2Value: '2008',
      stat2Label: 'College Certified',
      enabled: true,
      order: 3,
    },
    projects: {
      heading: 'Featured Craftsmanship',
      subtitle: 'RECENT PROJECTS',
      enabled: true,
      order: 4,
    },
    reviews: {
      heading: 'What Our Clients Say',
      subtitle: 'TESTIMONIALS',
      enabled: true,
      order: 5,
    },
  },
};

const BEFORE_AFTER = {
  items: [
    {
      id: 'ba-1',
      name: 'Luxury Bathroom Remodel',
      desc: 'A complete modernization featuring large-format marble tiles, gold fixtures, and a new open-concept layout.',
      before: 'https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?q=80&w=800&auto=format&fit=crop',
      after: 'https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?q=80&w=800&auto=format&fit=crop',
      category: 'Renovations',
      order: 1,
      isActive: true,
    },
    {
      id: 'ba-2',
      name: 'Precision Exterior Solutions',
      desc: 'High-end exterior upgrades with premium fiber cement siding, new windows, and architectural trim that improve durability and curb appeal.',
      before: 'https://images.unsplash.com/photo-1590060419632-68c37ed55f26?q=80&w=800&auto=format&fit=crop',
      after: 'https://images.unsplash.com/photo-1628744448840-55bdb2497bd4?q=80&w=800&auto=format&fit=crop',
      category: 'Exterior Work',
      order: 2,
      isActive: true,
    },
    {
      id: 'ba-3',
      name: 'Raised Garden System',
      desc: 'Transforming bare yard areas into meticulously built, productive raised-bed garden retreats with integrated irrigation.',
      before: 'https://images.unsplash.com/photo-1558905619-172542012737?q=80&w=800&auto=format&fit=crop',
      after: 'https://images.unsplash.com/photo-1592150621344-22d7688860bc?q=80&w=800&auto=format&fit=crop',
      category: 'Sustainability',
      order: 3,
      isActive: true,
    },
    {
      id: 'ba-4',
      name: 'Outdoor Luxury Living',
      desc: 'Custom cedar decks and patios designed for premium outdoor entertaining and four-season enjoyment.',
      before: 'https://images.unsplash.com/photo-1591825729269-caeb344f6df2?q=80&w=800&auto=format&fit=crop',
      after: 'https://images.unsplash.com/photo-1590060419632-68c37ed55f26?q=80&w=800&auto=format&fit=crop',
      category: 'Decks & Patios',
      order: 4,
      isActive: true,
    },
    {
      id: 'ba-5',
      name: 'Architectural Staircases',
      desc: 'Custom-built floating staircases combining structural integrity with elegant hardwood and glass design.',
      before: 'https://images.unsplash.com/photo-1581850518616-bcb81881443e?q=80&w=800&auto=format&fit=crop',
      after: 'https://images.unsplash.com/photo-1506974210746-9b43936660dc?q=80&w=800&auto=format&fit=crop',
      category: 'Stairs & Railings',
      order: 5,
      isActive: true,
    },
    {
      id: 'ba-6',
      name: 'Whole-Home Modernisation',
      desc: 'Comprehensive interior renovations updating the home\'s entire aesthetic, flow, and structural integrity.',
      before: 'https://images.unsplash.com/photo-1581850518616-bcb81881443e?q=80&w=800&auto=format&fit=crop',
      after: 'https://images.unsplash.com/photo-1484154218962-a197022b5858?q=80&w=800&auto=format&fit=crop',
      category: 'Renovations',
      order: 6,
      isActive: true,
    },
    {
      id: 'ba-7',
      name: 'Water Management',
      desc: 'Advanced drainage and waterproofing solutions that protect your property\'s foundation from costly moisture damage.',
      before: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?q=80&w=800&auto=format&fit=crop',
      after: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?q=80&w=800&auto=format&fit=crop',
      category: 'Exterior Work',
      order: 7,
      isActive: true,
    },
  ],
};

const GALLERY = {
  images: [
    {
      id: 'gal-1',
      url: 'https://images.unsplash.com/photo-1590060419632-68c37ed55f26?q=80&w=800&auto=format&fit=crop',
      caption: 'Multi-level Cedar Deck — Kitchener',
      category: 'Decks & Patios',
      order: 1,
    },
    {
      id: 'gal-2',
      url: 'https://images.unsplash.com/photo-1505691938895-1758d7eaa511?q=80&w=800&auto=format&fit=crop',
      caption: 'Solid Walnut Cabinetry — Waterloo',
      category: 'Woodworking',
      order: 2,
    },
    {
      id: 'gal-3',
      url: 'https://images.unsplash.com/photo-1628744448840-55bdb2497bd4?q=80&w=800&auto=format&fit=crop',
      caption: 'Luxury Estate Entrance — Cambridge',
      category: 'Exterior Work',
      order: 3,
    },
    {
      id: 'gal-4',
      url: 'https://images.unsplash.com/photo-1506974210746-9b43936660dc?q=80&w=800&auto=format&fit=crop',
      caption: 'Floating White Oak Staircase — Guelph',
      category: 'Stairs & Railings',
      order: 4,
    },
    {
      id: 'gal-5',
      url: 'https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?q=80&w=800&auto=format&fit=crop',
      caption: 'Master Suite Spa Bathroom — Kitchener',
      category: 'Renovations',
      order: 5,
    },
    {
      id: 'gal-6',
      url: 'https://images.unsplash.com/photo-1592150621344-22d7688860bc?q=80&w=800&auto=format&fit=crop',
      caption: 'Premium Raised Garden System — Waterloo',
      category: 'Sustainability',
      order: 6,
    },
    {
      id: 'gal-7',
      url: 'https://images.unsplash.com/photo-1484154218962-a197022b5858?q=80&w=800&auto=format&fit=crop',
      caption: 'Full Kitchen Renovation — Kitchener',
      category: 'Renovations',
      order: 7,
    },
    {
      id: 'gal-8',
      url: 'https://images.unsplash.com/photo-1533090161767-e6ffed986c88?q=80&w=800&auto=format&fit=crop',
      caption: 'Custom Built-in Library — Cambridge',
      category: 'Woodworking',
      order: 8,
    },
  ],
  useFolderMapping: false,
  folderPaths: [],
};

const FOOTER = {
  tagline: 'High-end craftsmanship and professional construction services for your home and business.',
  phone: '(519) 555-0182',
  email: 'info@noelconstruction.ca',
  address_line1: '123 Craftsman Way',
  address_line2: 'Kitchener, ON N2G 1A1',
  appointment_only: false,
  show_contact: true,
  copyright_text: `© ${new Date().getFullYear()} Noel Construction. All rights reserved.`,
  developer_text: 'Website by Digital Maples Labs',
  developer_url: 'https://digitalmaples.ca',
  nav_columns: [
    {
      heading: 'Services',
      links: [
        { label: 'Exterior Work', url: '/services/svc-exterior' },
        { label: 'Decks & Patios', url: '/services/svc-decks' },
        { label: 'Whole-Home Reno', url: '/services/svc-reno' },
        { label: 'Woodworking', url: '/services/svc-woodworking' },
        { label: 'Staircases', url: '/services/svc-stairs' },
      ],
    },
    {
      heading: 'Company',
      links: [
        { label: 'Portfolio', url: '/portfolio' },
        { label: 'Before & After', url: '/before-after' },
        { label: 'Client Reviews', url: '/reviews' },
        { label: 'Contact Us', url: '/contact' },
      ],
    },
  ],
  policy_links: [
    { label: 'Privacy Policy', url: '/privacy' },
    { label: 'Terms of Service', url: '/terms' },
  ],
};

const SERVICES_PAGE = {
  seo: {
    title: 'Construction & Renovation Services | Noel Construction',
    description: 'Expert woodworking, exterior renovations, decks, staircases, and full-home remodels in the Kitchener-Waterloo region. Over 35 years of master craftsmanship.',
    image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
  },
  services: SERVICES,
};

// ─────────────────────────────────────────────────────────────────────────────
// SEED FUNCTION
// ─────────────────────────────────────────────────────────────────────────────

async function seed() {
  console.log('\n🌱 Seeding Noel Construction content to Firestore...\n');
  console.log(`  Collection prefix: ${COL}\n`);

  const writes = [
    { id: 'services',     label: '⚙️  Services (8 items)',    data: SERVICES_PAGE },
    { id: 'projects',     label: '🏗️  Projects (6 items)',    data: { projects: PROJECTS } },
    { id: 'reviews',      label: '⭐ Reviews (6 items)',      data: { reviews: REVIEWS } },
    { id: 'hero_slider',  label: '🎠 Hero Slider (3 slides)', data: HERO_SLIDER },
    { id: 'home',         label: '🏠 Home Page Config',       data: HOME_PAGE },
    { id: 'before_after', label: '↔️  Before & After (7)',   data: BEFORE_AFTER },
    { id: 'gallery',      label: '🖼️  Gallery (8 images)',    data: GALLERY },
    { id: 'footer',       label: '📋 Footer & Contact',       data: FOOTER },
  ];

  let successCount = 0;

  for (const { id, label, data } of writes) {
    try {
      await db.collection(COL).doc(id).set({ ...data, _seededAt: new Date().toISOString() }, { merge: true });
      console.log(`  ✅ ${label}`);
      successCount++;
    } catch (err) {
      console.error(`  ❌ Failed to seed '${id}':`, err.message || err);
    }
  }

  console.log(`\n🎉 Seeded ${successCount}/${writes.length} documents successfully!`);
  console.log('\nFirestore paths written:');
  writes.forEach(w => console.log(`  → ${COL}/${w.id}`));
  console.log('\nOpen the admin portal and switch to the "Noel Construction" site to see all seeded content.');
  process.exit(0);
}

seed().catch(err => {
  console.error('\n💥 Fatal error:', err);
  process.exit(1);
});
