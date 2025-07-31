
import { storage } from "./storage";

const resourcesData = [
  {
    category: 'healthcare' as const,
    name: 'California Consortium for Urban Indian Health (CCUIH)',
    description: 'Health advocacy, wellness support & culturally centered services, useful for returning Native American individuals.',
    eligibility: 'Native American individuals exiting incarceration',
    geo: {
      zip: '95815',
      city: 'Sacramento',
      county: 'Sacramento',
      state: 'CA'
    },
    contact: {
      phone: '(916) 285‑5824'
    },
    website: 'https://ccuih.org',
    languages: ['en'],
    status: 'active' as const,
    tags: ['health', 'wellness', 'cultural support']
  },
  {
    category: 'housing' as const,
    name: 'Travelers Aid Society',
    description: 'Affordable housing assistance, case management, transitional support.',
    eligibility: 'Formerly incarcerated Sacramento County residents',
    geo: {
      zip: '95822',
      city: 'Sacramento',
      county: 'Sacramento',
      state: 'CA'
    },
    contact: {
      phone: '916‑399‑9646'
    },
    languages: ['en'],
    status: 'active' as const,
    tags: ['housing', 'case management', 'affordable']
  },
  {
    category: 'housing' as const,
    name: 'Sacramento Housing & Redevelopment Agency',
    description: 'Rental assistance, transitional housing referrals, case management.',
    eligibility: 'Low‑income formerly incarcerated adults',
    geo: {
      zip: '95814',
      city: 'Sacramento',
      county: 'Sacramento',
      state: 'CA'
    },
    contact: {
      phone: '916‑444‑9210'
    },
    languages: ['en'],
    status: 'active' as const,
    tags: ['housing', 'rental assistance', 'case management']
  },
  {
    category: 'housing' as const,
    name: 'Sacramento Self Help Housing',
    description: 'Supportive housing programs, case management, transitional shelters.',
    eligibility: 'Homeless or formerly incarcerated low‑income adults',
    geo: {
      zip: '95818',
      city: 'Sacramento',
      county: 'Sacramento',
      state: 'CA'
    },
    contact: {
      phone: '916‑341‑0593'
    },
    languages: ['en'],
    status: 'active' as const,
    tags: ['housing', 'supportive housing']
  },
  {
    category: 'housing' as const,
    name: 'Mercy Housing California',
    description: 'Transitional and permanent affordable housing for low‑income residents.',
    eligibility: 'Low‑income adults in Sacramento County',
    geo: {
      zip: '95833',
      city: 'Sacramento',
      county: 'Sacramento',
      state: 'CA'
    },
    website: 'https://www.mercyhousing.org/california',
    languages: ['en'],
    status: 'active' as const,
    tags: ['housing', 'affordable housing']
  }
];

async function seedResources() {
  console.log('Starting resource seeding...');
  
  try {
    for (const resourceData of resourcesData) {
      console.log(`Creating resource: ${resourceData.name}`);
      await storage.createResource(resourceData);
    }
    
    console.log(`Successfully seeded ${resourcesData.length} resources`);
  } catch (error) {
    console.error('Error seeding resources:', error);
  }
}

if (require.main === module) {
  seedResources().then(() => {
    console.log('Resource seeding complete');
    process.exit(0);
  }).catch((error) => {
    console.error('Resource seeding failed:', error);
    process.exit(1);
  });
}

export { seedResources, resourcesData };
