export interface Site {
  id: string;
  name: string;
  domain: string;
  description?: string;
  databaseId?: string; // Optional: specify a custom Firestore database ID
  ga4PropertyId?: string; // Google Analytics 4 Property ID
  usePrefix?: boolean; // Default true: whether to use `${siteId}_` prefixes for collections
}

export const RAW_SITES: Site[] = [
  {
    id: 'nspc',
    name: 'NSPC',
    domain: 'niagarasuicidepreventioncoalition.ca',
    description: 'Niagara Suicide Prevention Coalition',
    ga4PropertyId: '509768055',
    databaseId: 'nspc-web',
    usePrefix: true
  },
  {
    id: 'bweic',
    name: 'BWEIC',
    domain: 'bweic.netlify.app',
    description: 'Black Women Empowerment Initiative Canada',
    databaseId: 'bweic-web',
    usePrefix: true
  },
  {
    id: 'kmfw',
    name: 'KMFW',
    domain: 'kmfw.org',
    description: 'Kind Minds Family Wellness',
    databaseId: 'kmfw-web',
    usePrefix: true
  },
  {
    id: 'elwg',
    name: 'ELWG',
    domain: 'elwg.ca',
    description: 'Elliot Lake Womens Group',
    databaseId: 'elwg-web', // The user specified this database name
    usePrefix: false // New sites should have clean collection names
  },
  {
    id: 'noel',
    name: 'Noel Construction',
    domain: 'noelconstruction.web.app',
    description: 'High-End Renovation & Woodworking',
    databaseId: 'noel-web',
    usePrefix: true
  },
  {
    id: 'dmlabs',
    name: 'Digital Maples Labs',
    domain: 'dmlabs.framer.website',
    description: 'Digital Innovation & AI Safety',
    databaseId: 'dmlabs-web',
    usePrefix: false
  },
  {
    id: 'phcg',
    name: 'Private Home Care Guru',
    domain: 'privatehomecareguru.ca',
    description: 'Compassionate Senior Care in Ontario',
    databaseId: 'phcg-web',
    usePrefix: false
  },
  {
    id: 'aitasol',
    name: 'Aitasol',
    domain: 'aitasol.com',
    description: 'Education Consultancy & Study Abroad',
    databaseId: 'aitahsol-web', // Matched with aitasol-web/.env PROJECT_ID
    usePrefix: false
  },
  {
    id: 'havens',
    name: "Haven's Social Work",
    domain: 'havenssocialwork.ca',
    description: 'Registered Social Work Services for Long-Term Care',
    databaseId: 'havens-web',
    usePrefix: false
  }
];

// If NEXT_PUBLIC_SINGLE_TENANT_ID is set at build time, isolate configuration exclusively to that tenant
const singleTenantId = process.env.NEXT_PUBLIC_SINGLE_TENANT_ID;
export const SITES: Site[] = singleTenantId
  ? RAW_SITES.filter(site => site.id === singleTenantId)
  : RAW_SITES;

// Runtime cache of dynamically registered sites
export let DYNAMIC_SITES: Site[] = [];

export const registerDynamicSite = (site: Site) => {
  if (!DYNAMIC_SITES.find(s => s.id === site.id)) {
    DYNAMIC_SITES.push(site);
  }
};

export const getSiteById = (id: string): Site | undefined => {
  return SITES.find(site => site.id === id) || DYNAMIC_SITES.find(site => site.id === id);
};

export const getDefaultSite = (): Site => {
  return SITES[0];
};
