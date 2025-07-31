import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { jobScheduler } from "./jobs/scheduler";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // Process CSV files from attached_assets directory at startup
  await processUploadedCSVFiles();

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

async function processUploadedCSVFiles() {
  const fs = await import('fs/promises');
  const path = await import('path');
  const { csvProcessor } = await import('./csv-processor');
  
  try {
    const attachedAssetsDir = path.resolve(import.meta.dirname, '..', 'attached_assets');
    const files = await fs.readdir(attachedAssetsDir);
    const csvFiles = files.filter(file => file.endsWith('.csv') && file.includes('Reentry_Resources'));
    
    console.log(`[Startup] Found ${csvFiles.length} CSV files to process...`);
    
    // Process just the first 10 files to build up a good resource database
    const filesToProcess = csvFiles.slice(0, 10);
    console.log(`[Startup] Processing ${filesToProcess.length} files to build resource database...`);
    
    for (const fileName of filesToProcess) {
      try {
        const filePath = path.join(attachedAssetsDir, fileName);
        const csvContent = await fs.readFile(filePath, 'utf-8');
        
        console.log(`[Startup] Processing ${fileName}...`);
        const processedCount = await csvProcessor.processAndSaveCSV(csvContent, fileName);
        console.log(`[Startup] Processed ${fileName}: ${processedCount} resources added`);
        
        // Continue processing all files to build comprehensive database
        if (processedCount > 0) {
          console.log(`[Startup] Successfully added ${processedCount} resources from ${fileName}`);
        }
      } catch (error) {
        console.error(`[Startup] Error processing ${fileName}:`, error);
      }
    }
    
    console.log(`[Startup] CSV processing completed`);
  } catch (error) {
    console.error('[Startup] Error accessing CSV files:', error);
  }
}

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || '5000', 10);
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
    
    // Start background job scheduler
    jobScheduler.start();
  });
})();
