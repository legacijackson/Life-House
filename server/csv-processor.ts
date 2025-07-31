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
      const resources = result.resources || result || [];

      // Validate and filter results
      return resources.filter((resource: any) => 
        resource.name && 
        resource.description && 
        resource.category &&
        resource.geo?.city &&
        resource.geo?.state
      );

    } catch (error) {
      console.error('[CSVProcessor] Error processing batch:', error);
      return []; // Return empty array instead of throwing to continue processing other batches
    }
  }

  async saveProcessedResources(processedResources: ProcessedResource[]): Promise<void> {
    try {
      console.log(`[CSVProcessor] Saving ${processedResources.length} processed resources to database`);
      
      for (const resource of processedResources) {
        await storage.createResource({
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

      console.log(`[CSVProcessor] Successfully saved ${processedResources.length} resources to database`);
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