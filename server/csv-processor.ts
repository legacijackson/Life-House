import OpenAI from "openai";
import Papa from "papaparse";
import { storage } from "./storage";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

interface CSVRow {
  [key: string]: string;
}

interface ProcessedResource {
  name: string;
  description: string;
  category: 'housing' | 'food' | 'id_docs' | 'healthcare' | 'sud_mh_referral' | 'employment' | 'training' | 'legal' | 'transport' | 'family' | 'money' | 'emergency' | 'education';
  eligibility: string;
  benefitAmount?: number;
  geo: {
    zip: string;
    city: string;
    county: string;
    state: string;
  };
  url?: string;
  contact: {
    phone?: string;
    email?: string;
    address?: string;
  };
  languages: string[];
  tags: string[];
}

export class CSVProcessor {
  
  async processCSVFile(csvContent: string, fileName: string): Promise<ProcessedResource[]> {
    try {
      console.log(`[CSVProcessor] Processing file: ${fileName}`);
      
      // Parse CSV content
      const parseResult = Papa.parse(csvContent, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (header: string) => header.trim()
      });

      if (parseResult.errors.length > 0) {
        console.error('[CSVProcessor] Parse errors:', parseResult.errors);
        throw new Error(`CSV parsing failed: ${parseResult.errors[0].message}`);
      }

      const rows = parseResult.data as CSVRow[];
      console.log(`[CSVProcessor] Parsed ${rows.length} rows from ${fileName}`);

      // Process rows in batches to avoid OpenAI rate limits
      const batchSize = 10;
      const processedResources: ProcessedResource[] = [];

      for (let i = 0; i < rows.length; i += batchSize) {
        const batch = rows.slice(i, i + batchSize);
        const batchResults = await this.processBatch(batch, fileName);
        processedResources.push(...batchResults);
      }

      console.log(`[CSVProcessor] Successfully processed ${processedResources.length} resources from ${fileName}`);
      return processedResources;

    } catch (error) {
      console.error(`[CSVProcessor] Error processing ${fileName}:`, error);
      throw error;
    }
  }

  private async processBatch(rows: CSVRow[], fileName: string): Promise<ProcessedResource[]> {
    try {
      // Check if OpenAI API is available
      if (!process.env.OPENAI_API_KEY) {
        console.log('[CSVProcessor] OpenAI API key not available, using fallback processing');
        return this.fallbackProcessBatch(rows, fileName);
      }

      // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are a data processing expert specializing in community reentry resources for formerly incarcerated individuals. Your task is to clean, standardize, and categorize community resource data from CSV files.

INSTRUCTIONS:
1. Process each row of CSV data into a standardized resource format
2. Clean and normalize all data fields
3. Categorize resources using ONLY these categories: housing, food, id_docs, healthcare, sud_mh_referral, employment, training, legal, transport, family, money, emergency, education
4. Extract geographic information (zip, city, county, state)
5. Parse contact information (phone, email, address)
6. Identify supported languages (convert to lowercase codes: en, es, zh, vi, etc.)
7. Generate relevant tags based on services offered
8. Extract eligibility requirements
9. If benefit amounts are mentioned, extract as numbers (remove $ and commas)
10. Respond with valid JSON array containing processed resources

EXAMPLE OUTPUT FORMAT:
[
  {
    "name": "Clean Organization Name",
    "description": "Clear, professional description of services",
    "category": "housing",
    "eligibility": "Specific eligibility requirements",
    "benefitAmount": 1500,
    "geo": {
      "zip": "94612",
      "city": "Oakland", 
      "county": "Alameda",
      "state": "CA"
    },
    "url": "https://example.org",
    "contact": {
      "phone": "(510) 555-0123",
      "email": "contact@example.org",
      "address": "123 Main St, Oakland CA"
    },
    "languages": ["en", "es"],
    "tags": ["rental assistance", "emergency housing", "case management"]
  }
]

IMPORTANT: 
- Always return valid JSON
- Use "housing" for any residential, transitional, or shelter services
- Use "employment" for job training, placement, or career services
- Use "legal" for expungement, court advocacy, or legal aid
- Use "healthcare" for medical, mental health, or substance abuse services
- Extract actual phone numbers, emails, and addresses when available
- Convert language names to standard codes (English->en, Spanish->es, Chinese->zh, Vietnamese->vi)
- Generate descriptive tags based on actual services mentioned`
          },
          {
            role: "user",
            content: `Process this batch of community reentry resources from file "${fileName}". Clean, standardize and categorize each row:

${JSON.stringify(rows, null, 2)}`
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.1
      });

      const result = JSON.parse(response.choices[0].message.content || '{"resources": []}');
      console.log('[CSVProcessor] OpenAI response structure:', typeof result, Object.keys(result));
      
      let resources = [];
      
      // Handle different response structures
      if (Array.isArray(result)) {
        resources = result;
      } else if (result.resources && Array.isArray(result.resources)) {
        resources = result.resources;
      } else if (typeof result === 'object' && result !== null) {
        // If it's a single resource object, wrap it in an array
        if (result.name && result.description) {
          resources = [result];
        } else {
          // If it's an object but not in expected format, try to extract array values
          const values = Object.values(result);
          const arrayValue = values.find(val => Array.isArray(val));
          resources = arrayValue || [];
        }
      }

      console.log(`[CSVProcessor] Found ${resources.length} resources in OpenAI response`);
      console.log('[CSVProcessor] First resource sample:', JSON.stringify(resources[0], null, 2));

      // Validate and filter results with more detailed logging
      const validResources = resources.filter((resource: any, index: number) => {
        const isValid = resource.name && 
                       resource.description && 
                       resource.category &&
                       resource.geo?.city &&
                       resource.geo?.state;
        
        if (!isValid) {
          console.log(`[CSVProcessor] Resource ${index} failed validation:`, {
            hasName: !!resource.name,
            hasDescription: !!resource.description,
            hasCategory: !!resource.category,
            hasCity: !!resource.geo?.city,
            hasState: !!resource.geo?.state,
            resource: JSON.stringify(resource, null, 2)
          });
        }
        return isValid;
      });
      
      console.log(`[CSVProcessor] ${validResources.length} resources passed validation`);
      return validResources;

    } catch (error) {
      console.error('[CSVProcessor] Error processing batch:', error);
      // If OpenAI fails, use fallback processing
      if ((error as any).status === 429 || (error as any).code === 'insufficient_quota') {
        console.log('[CSVProcessor] OpenAI quota exceeded, using fallback processing');
        return this.fallbackProcessBatch(rows, fileName);
      }
      return []; // Return empty array for other errors
    }
  }

  private fallbackProcessBatch(rows: CSVRow[], fileName: string): ProcessedResource[] {
    console.log(`[CSVProcessor] Processing ${rows.length} rows with fallback method`);
    
    return rows.map((row, index) => {
      // Extract basic information from CSV columns
      const name = row['Organization Name'] || row['Name'] || row['Service Provider'] || `Resource ${index + 1}`;
      const description = row['Description'] || row['Services'] || row['Program Description'] || 'Community resource for reentry support';
      const address = row['Address'] || row['Street Address'] || '';
      const city = row['City'] || 'Oakland';
      const state = row['State'] || 'CA';
      const zip = row['ZIP'] || row['Zip Code'] || '';
      const phone = row['Phone'] || row['Contact Phone'] || '';
      const email = row['Email'] || row['Contact Email'] || '';
      const website = row['Website'] || row['URL'] || '';
      
      // Determine category based on keywords in name/description
      let category: ProcessedResource['category'] = 'emergency';
      const text = (name + ' ' + description).toLowerCase();
      
      if (text.includes('housing') || text.includes('shelter') || text.includes('transitional')) {
        category = 'housing';
      } else if (text.includes('employment') || text.includes('job') || text.includes('work')) {
        category = 'employment';
      } else if (text.includes('food') || text.includes('meal') || text.includes('nutrition')) {
        category = 'food';
      } else if (text.includes('health') || text.includes('medical') || text.includes('clinic')) {
        category = 'healthcare';
      } else if (text.includes('legal') || text.includes('law') || text.includes('court')) {
        category = 'legal';
      } else if (text.includes('education') || text.includes('school') || text.includes('training')) {
        category = 'education';
      } else if (text.includes('transport') || text.includes('bus') || text.includes('travel')) {
        category = 'transport';
      } else if (text.includes('family') || text.includes('child') || text.includes('parent')) {
        category = 'family';
      } else if (text.includes('financial') || text.includes('money') || text.includes('benefit')) {
        category = 'money';
      }

      return {
        name: name.trim(),
        description: description.trim(),
        category,
        eligibility: row['Eligibility'] || 'General eligibility requirements may apply',
        geo: {
          zip: zip.trim(),
          city: city.trim(),
          county: row['County'] || 'Alameda',
          state: state.trim()
        },
        url: website.trim() || undefined,
        contact: {
          phone: phone.trim() || undefined,
          email: email.trim() || undefined,
          address: address.trim() || undefined
        },
        languages: ['en'], // Default to English
        tags: [category, 'reentry', 'community resource']
      };
    }).filter(resource => resource.name && resource.description);
  }

  async saveProcessedResources(processedResources: ProcessedResource[]): Promise<void> {
    try {
      console.log(`[CSVProcessor] Processing ${processedResources.length} resources with automatic deduplication`);
      
      let created = 0;
      let updated = 0;
      
      for (const resource of processedResources) {
        const existing = await storage.findResourceByName(resource.name);
        
        if (existing) {
          updated++;
          console.log(`[CSVProcessor] Resource "${resource.name}" already exists, updating`);
        } else {
          created++;
        }
        
        await storage.createOrUpdateResource({
          category: resource.category,
          name: resource.name,
          description: resource.description,
          eligibility: resource.eligibility,
          benefitAmount: resource.benefitAmount?.toString(),
          geo: resource.geo,
          url: resource.url,
          contact: resource.contact,
          languages: resource.languages,
          tags: resource.tags,
          status: 'active' as const,
          isLifehouse: false
        });
      }

      console.log(`[CSVProcessor] Deduplication complete: ${created} new resources created, ${updated} existing resources updated`);
    } catch (error) {
      console.error('[CSVProcessor] Error saving resources:', error);
      throw error;
    }
  }

  async processAndSaveCSV(csvContent: string, fileName: string): Promise<number> {
    try {
      const processedResources = await this.processCSVFile(csvContent, fileName);
      await this.saveProcessedResources(processedResources);
      return processedResources.length;
    } catch (error) {
      console.error(`[CSVProcessor] Failed to process and save CSV ${fileName}:`, error);
      throw error;
    }
  }
}

export const csvProcessor = new CSVProcessor();