import { db } from "./db";
import { resources } from "@shared/schema";
import { eq, and } from "drizzle-orm";

const lifehousePrograms = [
  {
    name: 'Life House Brokerage & Savings Program',
    description: 'Our flagship matched-savings program that turns mandatory 30% program contributions into a substantial nest-egg for permanent housing. Participants can build up to $1,500 in savings while learning investment basics through our 5% brokerage account option.',
    summary: 'Matched-savings + 5% brokerage account that turns mandatory 30% program contributions into a $1,500 nest-egg for permanent housing.',
    category: 'money' as const,
    categories: ['financial', 'lifedesign'],
    url: 'https://lifehousereentry.org/brokerage',
    website: 'https://lifehousereentry.org/brokerage',
    isLifehouse: true,
    status: 'active' as const,
    tags: ['savings', 'financial-literacy', 'housing-fund', 'investment'],
    eligibility: 'Active Life House residents in good standing',
    image: '/assets/flagship/brokerage-savings.svg'
  },
  {
    name: 'Life & Love Design Curriculum',
    description: 'A transformative 12-week healing-centered coaching program that addresses the whole person. Using CBT-informed journaling, peer labs, and expert facilitation, participants rewire their identity, relationships, and money habits for lasting change.',
    summary: '12-week healing-centered coaching that rewires identity, relationships & money habits through CBT-informed journaling and peer labs.',
    category: 'healthcare' as const,
    categories: ['healing', 'jobreadiness'],
    url: 'https://lifehousereentry.org/lifedesign',
    website: 'https://lifehousereentry.org/lifedesign',
    isLifehouse: true,
    status: 'active' as const,
    tags: ['healing', 'coaching', 'mental-health', 'life-skills'],
    eligibility: 'All Life House residents and community members',
    image: '/assets/flagship/life-love-design.svg'
  },
  {
    name: '7-Stage Reentry Housing Program',
    description: 'Our comprehensive structured pathway guides residents from Intake through Legacy stages. Each stage includes specific milestones: sober housing, life-design coaching, job placement support, and permanent housing navigation with wraparound services.',
    summary: 'Structured pathway from Intake → Legacy with sober housing, life-design coaching, job placement, and permanent-housing navigation.',
    category: 'housing' as const,
    categories: ['housing', 'jobreadiness'],
    url: 'https://lifehousereentry.org/7stages',
    website: 'https://lifehousereentry.org/7stages',
    isLifehouse: true,
    status: 'active' as const,
    tags: ['housing', 'reentry', 'support-services', 'case-management'],
    eligibility: 'Formerly incarcerated individuals committed to transformation',
    image: '/assets/flagship/7-stage-housing.svg'
  },
  {
    name: 'Credit-Repair Clinic (Cure My Credit 700)',
    description: 'Professional credit repair service that helps residents achieve FICO scores of 640+ within 6 months. Our partner-led dispute process addresses negative items while teaching credit-building strategies. Free for Life House residents, sliding scale for community.',
    summary: 'Partner-led dispute service that lifts FICO ≥ 640 in ~6 mo; offered free to Life House residents, sliding-scale for community.',
    category: 'money' as const,
    categories: ['financial'],
    url: 'https://www.curemycredit700.com',
    website: 'https://www.curemycredit700.com',
    isLifehouse: true,
    status: 'active' as const,
    tags: ['credit-repair', 'financial-health', 'FICO', 'dispute-services'],
    eligibility: 'Life House residents (free), Community members (sliding scale)',
    image: '/assets/flagship/credit-repair.svg'
  },
  {
    name: 'Global Investment Co. Financial Literacy',
    description: 'Comprehensive financial education program featuring self-paced micro-courses and live workshops. Topics include budgeting, debt snowball method, emergency funds, and beginner investing. Residents earn $25 stipend per completed module.',
    summary: 'Self-paced micro-courses + live workshops covering budgeting, debt snowball, and beginner investing. Residents earn $25 stipend per module.',
    category: 'education' as const,
    categories: ['financial', 'community'],
    url: 'https://globalinvestmentcompanies.com/home',
    website: 'https://globalinvestmentcompanies.com/home',
    isLifehouse: true,
    status: 'active' as const,
    tags: ['financial-literacy', 'education', 'stipend', 'workshops'],
    eligibility: 'Open to all Life House residents and alumni',
    image: '/assets/flagship/financial-literacy.svg'
  },
  {
    name: 'LegacyPlan™ Pathway (Business & Money)',
    description: 'Innovative gamified mobile curriculum that transforms entrepreneurial dreams into reality. Participants progress through modules on side-gig ideation, LLC formation, tax basics, and business operations. Features integrated digital wallet for tracking savings goals.',
    summary: 'Gamified mobile curriculum that walks residents through side-gig ideation, LLC setup, and tax basics. Integrated wallet for savings goals.',
    category: 'employment' as const,
    categories: ['jobreadiness', 'financial'],
    url: 'https://legacyplan.app/b/globalpathway',
    website: 'https://legacyplan.app/b/globalpathway',
    isLifehouse: true,
    status: 'active' as const,
    tags: ['entrepreneurship', 'business', 'mobile-app', 'financial-planning'],
    eligibility: 'Life House residents interested in entrepreneurship',
    image: '/assets/flagship/legacyplan.svg'
  },
  {
    name: 'Building Your Dream Legacy – Business Coaching',
    description: 'Exclusive 12-month business accelerator led by Kai Shariff, turning creative genius into scalable revenue. Using the proven Earn-While-You-Learn™ methodology, participants launch sustainable businesses while maintaining program compliance.',
    summary: '12-month accelerator by Kai Shariff turning creative genius into scalable revenue using the Earn-While-You-Learn™ method.',
    category: 'employment' as const,
    categories: ['business', 'community'],
    url: 'https://lifehousereentry.org/legacy-coaching',
    website: 'https://lifehousereentry.org/legacy-coaching',
    isLifehouse: true,
    status: 'active' as const,
    tags: ['business-coaching', 'mentorship', 'entrepreneurship', 'earn-while-learn'],
    eligibility: 'Selected Life House residents with business ideas',
    image: '/assets/flagship/dream-legacy.svg'
  }
];

async function seedFlagshipResources() {
  try {
    console.log('Starting to seed Life House flagship resources...');
    
    // First, check if flagship resources already exist
    const existingFlagship = await db
      .select()
      .from(resources)
      .where(eq(resources.isLifehouse, true));
    
    if (existingFlagship.length > 0) {
      console.log(`Found ${existingFlagship.length} existing flagship resources. Skipping seed.`);
      return;
    }
    
    // Insert all flagship programs
    const inserted = await db
      .insert(resources)
      .values(lifehousePrograms)
      .returning();
    
    console.log(`Successfully seeded ${inserted.length} Life House flagship programs!`);
    
    // Log the names of inserted programs
    inserted.forEach(program => {
      console.log(`  ✓ ${program.name}`);
    });
    
  } catch (error) {
    console.error('Error seeding flagship resources:', error);
    throw error;
  }
}

// Run the seed
seedFlagshipResources()
  .then(() => {
    console.log('Seed completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exit(1);
  });