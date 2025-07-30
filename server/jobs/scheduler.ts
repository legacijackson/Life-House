import { storage } from "../storage";

// Simple in-memory job scheduler for background tasks
class JobScheduler {
  private jobs: Map<string, NodeJS.Timeout> = new Map();
  private enabled: boolean = true;

  start() {
    console.log('Starting background job scheduler...');
    
    // Schedule jobs
    this.scheduleResourceCrawler();
    this.scheduleResourceDiff();
    this.scheduleStopArmsReminder();
    this.scheduleOverdueNotesWatchdog();
  }

  stop() {
    console.log('Stopping background job scheduler...');
    this.enabled = false;
    this.jobs.forEach((timeout) => clearInterval(timeout));
    this.jobs.clear();
  }

  // 5-1: Resource Crawler - Runs every 6 hours
  private scheduleResourceCrawler() {
    const runResourceCrawler = async () => {
      if (!this.enabled) return;
      
      try {
        console.log('[ResourceCrawler] Starting resource crawl...');
        
        // In production, this would crawl external resource websites
        // For now, we'll simulate updating resource metadata
        const resources = await storage.getResources();
        
        for (const resource of resources) {
          // Simulate checking if resource is still available
          const isAvailable = Math.random() > 0.1; // 90% availability
          if (!isAvailable) {
            console.log(`[ResourceCrawler] Resource ${resource.name} may be unavailable`);
          }
        }
        
        console.log(`[ResourceCrawler] Crawled ${resources.length} resources`);
      } catch (error) {
        console.error('[ResourceCrawler] Error:', error);
      }
    };

    // Run immediately, then every 6 hours
    runResourceCrawler();
    const interval = setInterval(runResourceCrawler, 6 * 60 * 60 * 1000);
    this.jobs.set('resourceCrawler', interval);
  }

  // 5-2: Nightly Resource Diff - Runs at 2 AM daily
  private scheduleResourceDiff() {
    const runResourceDiff = async () => {
      if (!this.enabled) return;
      
      const now = new Date();
      const hours = now.getHours();
      
      // Only run at 2 AM
      if (hours !== 2) return;
      
      try {
        console.log('[ResourceDiff] Starting nightly resource diff...');
        
        // In production, compare with yesterday's snapshot
        const resources = await storage.getResources();
        const newResources = resources.filter((r: any) => {
          // Check if created in last 24 hours
          const createdAt = new Date(r.createdAt || Date.now());
          const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
          return createdAt > dayAgo;
        });
        
        if (newResources.length > 0) {
          console.log(`[ResourceDiff] Found ${newResources.length} new resources`);
          // TODO: Send notification to case managers
        }
        
        console.log('[ResourceDiff] Nightly diff complete');
      } catch (error) {
        console.error('[ResourceDiff] Error:', error);
      }
    };

    // Check every hour
    const interval = setInterval(runResourceDiff, 60 * 60 * 1000);
    this.jobs.set('resourceDiff', interval);
  }

  // 5-3: STOP ARMS Reminder - Runs every 4 hours during business hours
  private scheduleStopArmsReminder() {
    const runStopArmsReminder = async () => {
      if (!this.enabled) return;
      
      const now = new Date();
      const hours = now.getHours();
      
      // Only run during business hours (8 AM - 6 PM)
      if (hours < 8 || hours > 18) return;
      
      try {
        console.log('[StopArmsReminder] Checking for upcoming STOP touchpoints...');
        
        // Get all users and filter residents  
        const users = await storage.getUsers({ role: 'Resident' });
        const upcomingTouchpoints = users.filter((user: any) => {
          // Check if touchpoint is due within 48 hours
          // In production, this would check resident profile data
          const nextTouchpoint = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
          const dueDate = new Date(nextTouchpoint);
          const twoDaysFromNow = new Date(Date.now() + 48 * 60 * 60 * 1000);
          return dueDate <= twoDaysFromNow;
        });
        
        if (upcomingTouchpoints.length > 0) {
          console.log(`[StopArmsReminder] ${upcomingTouchpoints.length} residents have upcoming touchpoints`);
          // TODO: Send reminders to case managers
        }
        
      } catch (error) {
        console.error('[StopArmsReminder] Error:', error);
      }
    };

    // Run immediately, then every 4 hours
    runStopArmsReminder();
    const interval = setInterval(runStopArmsReminder, 4 * 60 * 60 * 1000);
    this.jobs.set('stopArmsReminder', interval);
  }

  // 5-4: Overdue Notes Watchdog - Runs every 2 hours
  private scheduleOverdueNotesWatchdog() {
    const runOverdueNotesWatchdog = async () => {
      if (!this.enabled) return;
      
      try {
        console.log('[OverdueNotesWatchdog] Checking for overdue case notes...');
        
        // Get all resident users
        const residents = await storage.getUsers({ role: 'Resident' });
        
        // Check for residents without recent notes
        const overdueResidents = [];
        for (const resident of residents) {
          const residentNotes = await storage.getCaseNotes(resident.id);
          
          if (residentNotes.length === 0) {
            overdueResidents.push(resident);
            continue;
          }
          
          // Find most recent note
          const mostRecentNote = residentNotes.reduce((latest: any, note: any) => {
            const noteDate = new Date(note.createdAt || 0);
            const latestDate = new Date(latest.createdAt || 0);
            return noteDate > latestDate ? note : latest;
          });
          
          // Check if older than 7 days
          const noteDate = new Date(mostRecentNote.createdAt || 0);
          const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
          if (noteDate < weekAgo) {
            overdueResidents.push(resident);
          }
        }
        
        if (overdueResidents.length > 0) {
          console.log(`[OverdueNotesWatchdog] ${overdueResidents.length} residents have overdue case notes`);
          // TODO: Send alerts to case managers
        }
        
      } catch (error) {
        console.error('[OverdueNotesWatchdog] Error:', error);
      }
    };

    // Run immediately, then every 2 hours
    runOverdueNotesWatchdog();
    const interval = setInterval(runOverdueNotesWatchdog, 2 * 60 * 60 * 1000);
    this.jobs.set('overdueNotesWatchdog', interval);
  }
}

export const jobScheduler = new JobScheduler();