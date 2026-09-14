// Uses CommonJS require to work with firebase-admin
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

const admin = require('/Volumes/DigitalMaplesD1/Sites/DigitalMaplesAgency/apps/admin-portal/node_modules/firebase-admin/lib/index.js');

const app = admin.initializeApp({
  credential: admin.credential.applicationDefault(),
  projectId: 'nspc-web',
});

const db = admin.firestore();

const seedData = {
  title: 'Careers',
  sections: {
    hero: {
      heading: 'Current Job Postings',
      content: 'Join our dedicated team of professionals committed to equity, empowerment, and excellence in community wellness.',
      enabled: true,
      sidebarContent: {
        showNews: true,
        showDonate: true,
        showSocials: true
      },
      order: 0
    },
    listings: {
      heading: 'Current Openings',
      enabled: true,
      order: 10
    },
    job_1: { heading: 'Addiction Counsellor (RAAM)', location: 'Kitchener, ON, Canada', jobType: 'Full Time', pdfUrl: '#', enabled: true, order: 20 },
    job_2: { heading: 'Addiction Counsellor (CC)', location: 'Kitchener, ON, Canada', jobType: 'Contract', pdfUrl: '#', enabled: true, order: 30 },
    job_3: { heading: 'Overnight Attendant (CLT)', location: 'Cambridge, ON, Canada', jobType: 'Part Time', pdfUrl: '#', enabled: true, order: 40 },
    job_4: { heading: 'Landscape Labourer - Canada Summer Jobs', location: 'Kitchener, ON, Canada', jobType: 'Contract', externalLink: 'https://www.jobbank.gc.ca/', enabled: true, order: 50 },
    job_5: { heading: 'Supervisor, Addiction Services (CLT)', location: 'Cambridge, ON, Canada', jobType: 'Contract', pdfUrl: '#', enabled: true, order: 60 },
    job_6: { heading: 'Donor Relations & Grants Coordinator', location: 'Kitchener, ON, Canada', jobType: 'Full Time', externalLink: 'https://linktr.ee/kmfw', enabled: true, order: 70 },
    job_7: { heading: 'ShelterCare Support Worker, Nights Relief', location: 'Waterloo, ON, Canada', jobType: 'Part Time', pdfUrl: '#', enabled: true, order: 80 },
    job_8: { heading: 'Manager, Addiction Services (ACSS)', location: 'Kitchener, ON, Canada', jobType: 'Full Time', pdfUrl: '#', enabled: true, order: 90 },
    job_9: { heading: 'General Applications', location: 'Waterloo Region, ON, Canada', jobType: 'Other', buttonUrl: 'mailto:careers@kindmindsfamilywellness.org', buttonText: 'Inquire via Email', enabled: true, order: 100 }
  },
  lastUpdated: new Date().toISOString()
};

async function seed() {
  try {
    console.log('Seeding KMFW Careers...');
    await db.collection('kmfw_content').doc('careers').set(seedData);
    console.log('✅ Successfully seeded careers!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

seed();
