
import fetch from 'node-fetch';

interface KitContact {
  id: string;
  email_address: string;
  first_name?: string;
  last_name?: string;
  state: 'active' | 'inactive';
  created_at: string;
  fields: Record<string, any>;
  tags: Array<{ id: string; name: string; }>;
}

interface KitSubscriber {
  subscriber: KitContact;
}

interface KitTag {
  id: string;
  name: string;
  created_at: string;
}

interface KitForm {
  id: string;
  name: string;
  description?: string;
  sign_up_redirect_url?: string;
  success_message?: string;
  archived: boolean;
  created_at: string;
}

class KitService {
  private apiKey: string;
  private apiSecret: string;
  private baseUrl = 'https://api.kit.com/v3';

  constructor() {
    this.apiKey = process.env.KIT_API_KEY || '';
    this.apiSecret = process.env.KIT_API_SECRET || '';
    
    if (!this.apiKey) {
      console.warn('KIT_API_KEY not configured');
    }
  }

  private async makeRequest(endpoint: string, options: any = {}): Promise<any> {
    if (!this.apiKey) {
      throw new Error('Kit API key not configured');
    }

    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      'Authorization': `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
      ...options.headers
    };

    const response = await fetch(url, {
      ...options,
      headers
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Kit API error: ${response.status} - ${error}`);
    }

    return response.json();
  }

  // Subscribers (Contacts) Management
  async getSubscribers(page = 1, sort_order = 'asc'): Promise<KitContact[]> {
    const data = await this.makeRequest(`/subscribers?page=${page}&sort_order=${sort_order}`);
    return data.subscribers || [];
  }

  async getSubscriber(id: string): Promise<KitContact | null> {
    try {
      const data = await this.makeRequest(`/subscribers/${id}`);
      return data.subscriber || null;
    } catch (error) {
      if (((error as any).message || "").includes('404')) {
        return null;
      }
      throw error;
    }
  }

  async getSubscriberByEmail(email: string): Promise<KitContact | null> {
    try {
      const data = await this.makeRequest(`/subscribers?email_address=${encodeURIComponent(email)}`);
      return data.subscribers?.[0] || null;
    } catch (error) {
      return null;
    }
  }

  async createSubscriber(subscriberData: {
    email_address: string;
    first_name?: string;
    last_name?: string;
    fields?: Record<string, any>;
  }): Promise<KitContact> {
    const data = await this.makeRequest('/subscribers', {
      method: 'POST',
      body: JSON.stringify(subscriberData)
    });
    return data.subscriber;
  }

  async updateSubscriber(id: string, updates: {
    first_name?: string;
    last_name?: string;
    fields?: Record<string, any>;
  }): Promise<KitContact> {
    const data = await this.makeRequest(`/subscribers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    });
    return data.subscriber;
  }

  async unsubscribe(id: string): Promise<void> {
    await this.makeRequest(`/subscribers/${id}/unsubscribe`, {
      method: 'POST'
    });
  }

  // Tags Management
  async getTags(): Promise<KitTag[]> {
    const data = await this.makeRequest('/tags');
    return data.tags || [];
  }

  async createTag(name: string): Promise<KitTag> {
    const data = await this.makeRequest('/tags', {
      method: 'POST',
      body: JSON.stringify({ name })
    });
    return data.tag;
  }

  async tagSubscriber(tagId: string, subscriberId: string): Promise<void> {
    await this.makeRequest(`/tags/${tagId}/subscribers`, {
      method: 'POST',
      body: JSON.stringify({ subscriber: { id: subscriberId } })
    });
  }

  async untagSubscriber(tagId: string, subscriberId: string): Promise<void> {
    await this.makeRequest(`/tags/${tagId}/subscribers/${subscriberId}`, {
      method: 'DELETE'
    });
  }

  // Forms Management
  async getForms(): Promise<KitForm[]> {
    const data = await this.makeRequest('/forms');
    return data.forms || [];
  }

  async getForm(id: string): Promise<KitForm | null> {
    try {
      const data = await this.makeRequest(`/forms/${id}`);
      return data.form || null;
    } catch (error) {
      if (((error as any).message || "").includes('404')) {
        return null;
      }
      throw error;
    }
  }

  async getFormSubscribers(formId: string, page = 1): Promise<KitContact[]> {
    const data = await this.makeRequest(`/forms/${formId}/subscribers?page=${page}`);
    return data.subscribers || [];
  }

  // Sequences Management
  async getSequences() {
    const data = await this.makeRequest('/sequences');
    return data.sequences || [];
  }

  async addSubscriberToSequence(sequenceId: string, subscriberId: string): Promise<void> {
    await this.makeRequest(`/sequences/${sequenceId}/subscribers`, {
      method: 'POST',
      body: JSON.stringify({ subscriber: { id: subscriberId } })
    });
  }

  // Webhooks Management
  async createWebhook(target_url: string, events: string[]): Promise<any> {
    const data = await this.makeRequest('/automations/webhooks', {
      method: 'POST',
      body: JSON.stringify({
        target_url,
        events
      })
    });
    return data.webhook;
  }

  async getWebhooks(): Promise<any[]> {
    const data = await this.makeRequest('/automations/webhooks');
    return data.webhooks || [];
  }

  // CRM Integration Methods
  async syncContactToKit(contact: {
    email: string;
    firstName?: string;
    lastName?: string;
    donorType?: string;
    tags?: string[];
    customFields?: Record<string, any>;
  }): Promise<KitContact> {
    // Check if subscriber exists
    let subscriber = await this.getSubscriberByEmail(contact.email);

    const subscriberData = {
      email_address: contact.email,
      first_name: contact.firstName,
      last_name: contact.lastName,
      fields: {
        donor_type: contact.donorType,
        source: 'Life House CRM',
        ...contact.customFields
      }
    };

    if (subscriber) {
      // Update existing subscriber
      subscriber = await this.updateSubscriber(subscriber.id, {
        first_name: subscriberData.first_name,
        last_name: subscriberData.last_name,
        fields: subscriberData.fields
      });
    } else {
      // Create new subscriber
      subscriber = await this.createSubscriber(subscriberData);
    }

    // Apply tags if provided
    if (contact.tags && contact.tags.length > 0) {
      const existingTags = await this.getTags();
      
      for (const tagName of contact.tags) {
        let tag = existingTags.find(t => t.name === tagName);
        
        if (!tag) {
          tag = await this.createTag(tagName);
        }
        
        try {
          await this.tagSubscriber(tag.id, subscriber.id);
        } catch (error) {
          // Tag might already be applied
          console.log(`Tag ${tagName} might already be applied to subscriber`);
        }
      }
    }

    return subscriber;
  }

  async syncKitContactToCRM(kitContact: KitContact): Promise<any> {
    const { storage } = await import('./storage');
    
    // Check if donor exists in CRM
    const existingDonors = await storage.getDonors({ email: kitContact.email_address });
    let donor = existingDonors[0];

    const donorData = {
      firstName: kitContact.first_name || '',
      lastName: kitContact.last_name || '',
      email: kitContact.email_address,
      donorType: kitContact.fields?.donor_type || 'individual',
      notes: `Synced from Kit on ${new Date().toISOString()}`,
      tags: kitContact.tags?.map(t => t.name) || [],
      totalDonated: '0',
      isAnonymous: false
    };

    if (donor) {
      // Update existing donor
      donor = await storage.updateDonor(donor.id, donorData);
    } else {
      // Create new donor
      donor = await storage.createDonor(donorData);
    }

    return donor;
  }

  // Bulk sync methods
  async bulkSyncCRMToKit(): Promise<{ synced: number; errors: any[] }> {
    const { storage } = await import('./storage');
    const donors = await storage.getDonors({});
    
    let synced = 0;
    const errors = [];

    for (const donor of donors) {
      try {
        await this.syncContactToKit({
          email: donor.email,
          firstName: donor.firstName,
          lastName: donor.lastName,
          donorType: donor.donorType ?? undefined,
          tags: donor.tags || [],
          customFields: {
            total_donated: donor.totalDonated,
            is_anonymous: donor.isAnonymous,
            created_at: donor.createdAt
          }
        });
        synced++;
      } catch (error) {
        errors.push({ donor: donor.email, error: (error as any).message });
      }
    }

    return { synced, errors };
  }

  async bulkSyncKitToCRM(): Promise<{ synced: number; errors: any[] }> {
    let page = 1;
    let synced = 0;
    const errors = [];

    while (true) {
      const subscribers = await this.getSubscribers(page);
      
      if (subscribers.length === 0) {
        break;
      }

      for (const subscriber of subscribers) {
        try {
          await this.syncKitContactToCRM(subscriber);
          synced++;
        } catch (error) {
          errors.push({ subscriber: subscriber.email_address, error: (error as any).message });
        }
      }

      page++;
    }

    return { synced, errors };
  }
}

export const kitService = new KitService();
