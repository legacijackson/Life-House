
import { db } from "./db";
import { resources } from "@shared/schema";
import { eq } from "drizzle-orm";

interface RawResource {
  name: string;
  description: string;
  tags: string;
  languagesSupported: string;
  eligibilityRequirements: string;
  serviceArea: string;
  contactInfo: string;
  website?: string;
  category?: string;
  phone?: string;
  email?: string;
  address?: string;
  zip?: string;
  city?: string;
  county?: string;
  state?: string;
}

const rawResources: RawResource[] = [
  // Sacramento Resources
  {
    name: "California Consortium for Urban Indian Health (CCUIH)",
    description: "Health advocacy, wellness support & culturally centered services, useful for returning Native American individuals.",
    tags: "health; wellness; cultural support",
    languagesSupported: "EN",
    eligibilityRequirements: "Native American individuals exiting incarceration",
    serviceArea: "95815, Sacramento, Sacramento, CA",
    contactInfo: "(916) 285‑5824",
    website: "https://ccuih.org",
    category: "healthcare"
  },
  {
    name: "Travelers Aid Society",
    description: "Affordable housing assistance, case management, transitional support.",
    tags: "housing; case management; affordable",
    languagesSupported: "EN",
    eligibilityRequirements: "Formerly incarcerated Sacramento County residents",
    serviceArea: "95822, Sacramento, Sacramento, CA",
    contactInfo: "916‑399‑9646",
    website: "",
    category: "housing"
  },
  {
    name: "Sacramento Housing & Redevelopment Agency",
    description: "Rental assistance, transitional housing referrals, case management.",
    tags: "housing; rental assistance; case management",
    languagesSupported: "EN",
    eligibilityRequirements: "Low‑income formerly incarcerated adults",
    serviceArea: "95814, Sacramento, Sacramento, CA",
    contactInfo: "916‑444‑9210",
    website: "",
    category: "housing"
  },
  {
    name: "Sacramento Self Help Housing",
    description: "Supportive housing programs, case management, transitional shelters.",
    tags: "housing; supportive housing",
    languagesSupported: "EN",
    eligibilityRequirements: "Homeless or formerly incarcerated low‑income adults",
    serviceArea: "95818, Sacramento, Sacramento, CA",
    contactInfo: "916‑341‑0593",
    website: "",
    category: "housing"
  },
  {
    name: "Mercy Housing California",
    description: "Transitional and permanent affordable housing for low‑income residents.",
    tags: "housing; affordable housing",
    languagesSupported: "EN",
    eligibilityRequirements: "Low‑income adults in Sacramento County",
    serviceArea: "95833, Sacramento, Sacramento, CA",
    contactInfo: "",
    website: "https://www.mercyhousing.org/california",
    category: "housing"
  },
  {
    name: "Saint John's Program for Real Change",
    description: "Provides transitional housing, job training, mental health support, and child care for formerly incarcerated women and children.",
    tags: "housing; job training; mental health; women; child care",
    languagesSupported: "EN; ES",
    eligibilityRequirements: "Formerly incarcerated women with children; must be sober",
    serviceArea: "95811, Sacramento, Sacramento, CA",
    contactInfo: "916-453-1482",
    website: "https://saintjohnsprogram.org",
    category: "housing"
  },
  {
    name: "Volunteers of America - Mather Community Campus",
    description: "Offers transitional housing, employment services, and case management for homeless individuals including those recently released from incarceration.",
    tags: "housing; employment; case management; homeless; reentry",
    languagesSupported: "EN",
    eligibilityRequirements: "Adults recently released from incarceration; homeless; must commit to case plan",
    serviceArea: "95655, Mather, Sacramento, CA",
    contactInfo: "916-228-3100",
    website: "https://www.voa-ncnn.org/mather-community-campus",
    category: "housing"
  },
  {
    name: "Wind Youth Services",
    description: "Serves youth ages 12–24, including reentry youth, with shelter, counseling, and educational support.",
    tags: "youth; shelter; counseling; education; reentry",
    languagesSupported: "EN",
    eligibilityRequirements: "Youth ages 12-24; includes youth on probation or post-incarceration",
    serviceArea: "95814, Sacramento, Sacramento, CA",
    contactInfo: "916-504-3313",
    website: "https://www.windyouth.org",
    category: "housing"
  },
  {
    name: "Sacramento County Office of Education - Reentry Services",
    description: "Supports reentry with vocational training, high school diploma/GED services, and job placement.",
    tags: "education; GED; job placement; vocational training",
    languagesSupported: "EN; ES",
    eligibilityRequirements: "Reentry youth and adults; Sacramento County",
    serviceArea: "Sacramento, Sacramento, CA",
    contactInfo: "916-228-2500",
    website: "https://www.scoe.net",
    category: "education"
  },
  {
    name: "My Sister's House",
    description: "Shelter and legal advocacy for Asian and Pacific Islander women survivors of domestic violence, human trafficking, and incarceration.",
    tags: "domestic violence; legal aid; housing; women; AAPI",
    languagesSupported: "EN; ES; Various Asian languages",
    eligibilityRequirements: "Women; survivors of DV, HT, or incarceration",
    serviceArea: "95811, Sacramento, Sacramento, CA",
    contactInfo: "916-428-3271",
    website: "https://www.my-sisters-house.org",
    category: "legal"
  },

  // Bay Area Resources
  {
    name: "East Oakland Community Project (EOCP)",
    description: "Emergency and transitional housing, meals, case management for formerly incarcerated adults, veterans, and people with disabilities.",
    tags: "housing; case management; meals; veterans; disability",
    languagesSupported: "EN",
    eligibilityRequirements: "Formerly incarcerated, low-income",
    serviceArea: "94621, Oakland, Alameda, CA",
    contactInfo: "510-532-3211",
    website: "https://www.eocp.net/residential-services/",
    category: "housing"
  },
  {
    name: "Men of Valor Academy",
    description: "Transitional housing for adult males on probation/parole, includes education, mentorship, spiritual & life skills growth.",
    tags: "housing; education; parole; mentorship",
    languagesSupported: "EN",
    eligibilityRequirements: "Adult males on probation/parole",
    serviceArea: "Oakland, Alameda, CA",
    contactInfo: "510-567-1308",
    website: "",
    category: "housing"
  },
  {
    name: "Reentry Success Center (Richmond)",
    description: "Integrated hub offering housing assistance, legal aid, workforce entry, peer mentoring, family services.",
    tags: "housing; legal aid; workforce; peer mentoring",
    languagesSupported: "EN",
    eligibilityRequirements: "Formerly incarcerated adults",
    serviceArea: "Richmond, Contra Costa, CA",
    contactInfo: "925-679-2122",
    website: "",
    category: "housing"
  },
  {
    name: "Bay Area Community Resources (BACR)",
    description: "Workforce & Reentry programs across Bay Area. Offers court advocacy, job readiness, job placement, case management.",
    tags: "workforce; job training; court advocacy",
    languagesSupported: "EN",
    eligibilityRequirements: "Justice-involved individuals",
    serviceArea: "Bay Area, CA",
    contactInfo: "",
    website: "https://www.bacr.org/workforce-and-reentry",
    category: "employment"
  },
  {
    name: "Root & Rebound",
    description: "Free legal services, reentry hotline, workshops, housing rights and expungement help.",
    tags: "legal aid; expungement; housing law; hotline",
    languagesSupported: "EN",
    eligibilityRequirements: "Formerly incarcerated individuals",
    serviceArea: "Statewide, CA",
    contactInfo: "510-279-4662",
    website: "https://www.rootandreboundsc.org",
    category: "legal"
  },
  {
    name: "California Reentry Program (CRI)",
    description: "Parole planning, release prep, advising, referrals for individuals exiting prison.",
    tags: "parole planning; advising; referrals",
    languagesSupported: "EN",
    eligibilityRequirements: "Incarcerated or recently released individuals",
    serviceArea: "Statewide, CA",
    contactInfo: "",
    website: "",
    category: "legal"
  },
  {
    name: "Five Keys Charter School – Home Free Program",
    description: "Transitional housing and job training for formerly incarcerated women, with wraparound support.",
    tags: "housing; women; job training; case management",
    languagesSupported: "EN",
    eligibilityRequirements: "Formerly incarcerated women",
    serviceArea: "San Francisco, CA",
    contactInfo: "",
    website: "https://www.fivekeyscharter.org/program-reentry",
    category: "housing"
  },
  {
    name: "The Last Mile",
    description: "Tech education and job placement for incarcerated and recently released individuals.",
    tags: "education; tech training; job placement",
    languagesSupported: "EN",
    eligibilityRequirements: "Incarcerated or recently released",
    serviceArea: "Statewide, CA",
    contactInfo: "",
    website: "https://thelastmile.org",
    category: "education"
  },
  {
    name: "Legal Aid of Alameda County",
    description: "Free legal services for low‑income individuals including expungement, family law, and housing issues.",
    tags: "expungement; family law; housing law; free",
    languagesSupported: "EN; ES",
    eligibilityRequirements: "Income below 125% of the federal poverty level.",
    serviceArea: "94612, Oakland, Alameda, CA",
    contactInfo: "(510) 555‑0127",
    website: "https://legalaid-alameda.org",
    category: "legal"
  },
  {
    name: "Bay Area Housing Coalition",
    description: "Provides rental assistance and housing navigation services for individuals transitioning from homelessness.",
    tags: "rental assistance; permanent housing; navigation",
    languagesSupported: "EN; ES",
    eligibilityRequirements: "Must be chronically homeless or at risk; income below 50% Area Median Income.",
    serviceArea: "94607, Oakland, Alameda, CA",
    contactInfo: "(510) 555‑0123",
    website: "https://bayareahousing.org",
    category: "housing"
  },

  // Additional comprehensive resources from all counties
  {
    name: "Abode Services",
    description: "Permanent & transitional housing placements and support services across East Bay.",
    tags: "housing; transitional; permanent",
    languagesSupported: "EN",
    eligibilityRequirements: "Low‑income formerly incarcerated adults",
    serviceArea: "Hayward / Oakland area, Alameda, CA",
    contactInfo: "510‑657‑7409",
    website: "https://www.abodeservices.org",
    category: "housing"
  },
  {
    name: "Building Opportunities for Self‑Sufficiency (BOSS)",
    description: "Employment and transitional housing services, court advocacy, job training.",
    tags: "employment; housing; court advocacy",
    languagesSupported: "EN",
    eligibilityRequirements: "Justice‑impacted individuals, AB109 referrals",
    serviceArea: "East Bay, Alameda, CA",
    contactInfo: "510‑649‑1930",
    website: "https://self‑sufficiency.org",
    category: "employment"
  },
  {
    name: "Center for Employment Opportunities (CEO)",
    description: "Employment readiness & placement exclusively for people with criminal records supervised by probation/parole.",
    tags: "job placement; job readiness",
    languagesSupported: "EN",
    eligibilityRequirements: "AB109 or parole referrals",
    serviceArea: "Oakland, Alameda, CA",
    contactInfo: "510‑251‑2240",
    website: "http://ceoworks.org",
    category: "employment"
  },
  {
    name: "Oakland Private Industry Council Inc.",
    description: "Career counseling, job search assistance, pre‑employment & life‑skills training.",
    tags: "employment; counseling; training",
    languagesSupported: "EN",
    eligibilityRequirements: "Adult reentry individuals, US eligible",
    serviceArea: "Oakland, Alameda, CA",
    contactInfo: "510‑768‑4400",
    website: "https://www.oaklandpic.org",
    category: "employment"
  },
  {
    name: "East Bay Community Law Center (EBCLC)",
    description: "Walk‑in legal clinic, Clean Slate expungement, housing law, public benefits.",
    tags: "legal aid; expungement; housing law; free",
    languagesSupported: "EN",
    eligibilityRequirements: "Low‑income formerly incarcerated adults",
    serviceArea: "Oakland / Dublin, Alameda, CA",
    contactInfo: "510‑548‑4064",
    website: "https://www.ebclc.org",
    category: "legal"
  },
  {
    name: "Bay Area Legal Aid",
    description: "Free legal services for issues including expungement, public benefits, housing, driver's license restoration.",
    tags: "legal aid; expungement; benefits; housing",
    languagesSupported: "EN;ES",
    eligibilityRequirements: "Low‑income residents including formerly incarcerated",
    serviceArea: "Alameda County, CA",
    contactInfo: "510‑250‑5270",
    website: "https://www.baylegal.org",
    category: "legal"
  },
  {
    name: "Rubicon Programs – Center of Re‑Entry Excellence (CORE)",
    description: "Offers free, integrated services for justice‑impacted individuals and families, including family support, financial planning, education and training, employment assistance, health and wellness, housing referrals, legal services, public benefits, coaching and peer support.",
    tags: "family services; financial planning; education and training; employment assistance; health services; housing referrals; legal services; public benefits; peer support",
    languagesSupported: "EN",
    eligibilityRequirements: "Justice‑impacted individuals living in Alameda County or people in custody within six months of release.",
    serviceArea: "94621, Oakland, Alameda, CA",
    contactInfo: "800‑214‑9687 / 510‑346‑5290",
    website: "https://rubiconprograms.org",
    category: "family"
  }
];

function parseServiceArea(serviceArea: string) {
  const parts = serviceArea.split(',').map(s => s.trim());
  let zip = '', city = '', county = '', state = '';
  
  if (parts.length >= 1) {
    const firstPart = parts[0];
    if (/^\d{5}/.test(firstPart)) {
      zip = firstPart.replace(/^\d+\s+/, '').trim();
      city = parts[1] || '';
      county = parts[2] || '';
      state = parts[3] || 'CA';
    } else {
      city = firstPart;
      county = parts[1] || '';
      state = parts[2] || 'CA';
    }
  }
  
  return { zip, city, county, state };
}

function parseContact(contactInfo: string) {
  const phoneRegex = /\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/;
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
  
  const phone = contactInfo.match(phoneRegex)?.[0] || '';
  const email = contactInfo.match(emailRegex)?.[0] || '';
  
  return { phone, email };
}

function categorizeResource(tags: string, description: string): string {
  const tagLower = tags.toLowerCase();
  const descLower = description.toLowerCase();
  
  if (tagLower.includes('housing') || tagLower.includes('shelter') || tagLower.includes('transitional')) {
    return 'housing';
  }
  if (tagLower.includes('employment') || tagLower.includes('job') || tagLower.includes('workforce')) {
    return 'employment';
  }
  if (tagLower.includes('legal') || tagLower.includes('expungement') || tagLower.includes('court')) {
    return 'legal';
  }
  if (tagLower.includes('health') || tagLower.includes('mental') || tagLower.includes('medical')) {
    return 'healthcare';
  }
  if (tagLower.includes('education') || tagLower.includes('training') || tagLower.includes('GED')) {
    return 'education';
  }
  if (tagLower.includes('food') || tagLower.includes('meals')) {
    return 'food';
  }
  if (tagLower.includes('transport')) {
    return 'transport';
  }
  if (tagLower.includes('family') || tagLower.includes('children')) {
    return 'family';
  }
  if (tagLower.includes('money') || tagLower.includes('financial')) {
    return 'money';
  }
  if (tagLower.includes('emergency')) {
    return 'emergency';
  }
  if (tagLower.includes('id') || tagLower.includes('document')) {
    return 'id_docs';
  }
  if (tagLower.includes('substance') || tagLower.includes('addiction') || tagLower.includes('recovery')) {
    return 'sud_mh_referral';
  }
  
  return 'other';
}

export async function seedResources() {
  console.log('Starting resource seeding...');
  
  // Clear existing resources
  await db.delete(resources);
  
  const processedResources = new Map<string, any>();
  
  for (const raw of rawResources) {
    // Create a key for deduplication based on name and location
    const { city, county, state } = parseServiceArea(raw.serviceArea);
    const key = `${raw.name.toLowerCase().trim()}-${city.toLowerCase()}-${county.toLowerCase()}`;
    
    if (processedResources.has(key)) {
      console.log(`Skipping duplicate: ${raw.name}`);
      continue;
    }
    
    const { phone, email } = parseContact(raw.contactInfo);
    const category = raw.category || categorizeResource(raw.tags, raw.description);
    const { zip, city: parsedCity, county: parsedCounty, state: parsedState } = parseServiceArea(raw.serviceArea);
    
    const resource = {
      category: category as any,
      name: raw.name.trim(),
      description: raw.description.trim(),
      eligibility: raw.eligibilityRequirements.trim(),
      geo: {
        zip: zip || '',
        city: parsedCity || '',
        county: parsedCounty || '',
        state: parsedState || 'CA'
      },
      url: raw.website || '',
      contact: {
        phone,
        email
      },
      address: '', // Would need to parse from other data if available
      phone: phone,
      website: raw.website || '',
      hours: {},
      languages: raw.languagesSupported.split(';').map(l => l.trim().toLowerCase()).filter(Boolean),
      status: 'active' as const,
      tags: raw.tags.split(';').map(t => t.trim()).filter(Boolean)
    };
    
    processedResources.set(key, resource);
  }
  
  // Insert all unique resources
  const resourceArray = Array.from(processedResources.values());
  
  console.log(`Inserting ${resourceArray.length} unique resources...`);
  
  for (const resource of resourceArray) {
    try {
      await db.insert(resources).values(resource);
      console.log(`✓ Added: ${resource.name}`);
    } catch (error) {
      console.error(`✗ Failed to add ${resource.name}:`, error);
    }
  }
  
  console.log('Resource seeding completed!');
}

// Run the seeding if this file is executed directly
if (require.main === module) {
  seedResources().then(() => {
    console.log('Seeding finished');
    process.exit(0);
  }).catch(error => {
    console.error('Seeding failed:', error);
    process.exit(1);
  });
}
