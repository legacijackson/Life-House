import puppeteer from "puppeteer-core";
import { execSync } from "child_process";

function getChromiumPath(): string {
  // Try common paths in order
  const candidates = [
    "/usr/bin/chromium-browser",
    "/usr/bin/chromium",
    "/usr/bin/google-chrome",
    "/usr/bin/google-chrome-stable",
    "/snap/bin/chromium",
  ];
  for (const c of candidates) {
    try { execSync(`test -x ${c}`); return c; } catch {}
  }
  // Fallback: let puppeteer-core throw a useful error
  return "/usr/bin/chromium-browser";
}

async function htmlToPdf(html: string): Promise<Buffer> {
  const browser = await puppeteer.launch({
    executablePath: getChromiumPath(),
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
    headless: true,
  });
  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });
    const pdf = await page.pdf({ format: "Letter", printBackground: true, margin: { top: "1in", right: "1in", bottom: "1in", left: "1in" } });
    return Buffer.from(pdf);
  } finally {
    await browser.close();
  }
}

function baseStyles(): string {
  return `
    <style>
      * { box-sizing: border-box; margin: 0; padding: 0; }
      body { font-family: Arial, Helvetica, sans-serif; font-size: 12px; color: #222; line-height: 1.5; }
      h1 { font-size: 20px; color: #166534; margin-bottom: 4px; }
      h2 { font-size: 15px; color: #1d4ed8; margin: 18px 0 6px; border-bottom: 1px solid #ddd; padding-bottom: 4px; }
      h3 { font-size: 13px; margin: 12px 0 4px; }
      .header { background: linear-gradient(135deg, #166534 0%, #1d4ed8 100%); color: white; padding: 24px 32px; margin: -1in -1in 24px; }
      .header h1 { color: white; font-size: 24px; }
      .header p { color: rgba(255,255,255,0.85); font-size: 12px; }
      table { width: 100%; border-collapse: collapse; margin: 8px 0; }
      th { background: #f1f5f9; text-align: left; padding: 6px 10px; font-weight: 600; font-size: 11px; }
      td { padding: 6px 10px; border-bottom: 1px solid #f0f0f0; vertical-align: top; }
      .badge { display: inline-block; padding: 2px 8px; border-radius: 12px; font-size: 10px; font-weight: 600; }
      .badge-green { background: #dcfce7; color: #166534; }
      .badge-blue { background: #dbeafe; color: #1e40af; }
      .badge-yellow { background: #fef9c3; color: #854d0e; }
      .badge-gray { background: #f1f5f9; color: #475569; }
      .field { margin-bottom: 10px; }
      .field label { font-size: 10px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; display: block; }
      .field value { font-size: 12px; }
      .section { margin-bottom: 20px; }
      .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
      .sig-block { margin-top: 40px; border-top: 1px solid #ccc; padding-top: 8px; }
      .sig-line { border-bottom: 1px solid #999; width: 60%; display: inline-block; margin-right: 16px; }
      footer { position: fixed; bottom: 0; left: 1in; right: 1in; font-size: 9px; color: #94a3b8; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 4px; }
    </style>
  `;
}

function pageFooter(docType: string): string {
  return `<footer>Life House Reentry Program &bull; 8399 Folsom Blvd STE 1 #4014, Sacramento CA 95826 &bull; (855) 454-3387 &bull; ${docType} &bull; Generated ${new Date().toLocaleDateString()}</footer>`;
}

export interface ClientData {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  programStatus?: string;
  housingStatus?: string;
  moveInDate?: string;
  propertyAssignment?: string;
  roomAssignment?: string;
  caseManager?: string;
}

export async function generateConsentForm(client: ClientData): Promise<Buffer> {
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8">${baseStyles()}</head><body>
    <div class="header">
      <h1>Life House Reentry Program</h1>
      <p>Informed Consent &amp; Program Agreement</p>
    </div>
    ${pageFooter("Informed Consent Form")}
    <div class="section">
      <h2>Client Information</h2>
      <div class="two-col">
        <div class="field"><label>Full Name</label><value>${client.name}</value></div>
        <div class="field"><label>Client ID</label><value>${client.id}</value></div>
        <div class="field"><label>Email</label><value>${client.email || "—"}</value></div>
        <div class="field"><label>Phone</label><value>${client.phone || "—"}</value></div>
        <div class="field"><label>Program Status</label><value>${client.programStatus || "—"}</value></div>
        <div class="field"><label>Case Manager</label><value>${client.caseManager || "—"}</value></div>
      </div>
    </div>
    <div class="section">
      <h2>Program Agreement</h2>
      <p>I, <strong>${client.name}</strong>, voluntarily consent to participate in the Life House Reentry Program. I understand that the program provides transitional housing, case management, life skills training, and reentry support services.</p>
      <h3>I agree to:</h3>
      <ul style="margin: 8px 0 8px 20px;">
        <li>Comply with all house rules and program expectations</li>
        <li>Attend scheduled meetings with my case manager</li>
        <li>Participate in assigned programs and activities</li>
        <li>Maintain sobriety (if applicable) and report any violations</li>
        <li>Contribute 30% of income toward program fees (25% reimbursable as savings)</li>
        <li>Actively pursue employment, education, or vocational training goals</li>
        <li>Respect fellow residents and staff at all times</li>
        <li>Provide accurate and complete information to staff</li>
      </ul>
    </div>
    <div class="section">
      <h2>Privacy &amp; HIPAA Notice</h2>
      <p>Life House maintains HIPAA-grade privacy standards. Your personal information will only be shared with partnering agencies as necessary for service delivery, per California law. You may request a copy of your records at any time.</p>
    </div>
    <div class="section">
      <h2>Acknowledgment</h2>
      <p>By signing below, I confirm that I have read, understood, and agree to the terms of this program agreement.</p>
      <div style="margin-top: 32px; display: flex; gap: 40px;">
        <div>
          <div class="sig-line">&nbsp;</div>
          <div style="font-size:10px;color:#64748b;margin-top:4px;">Client Signature</div>
          <div style="margin-top:16px; border-bottom: 1px solid #999; width:120px;">&nbsp;</div>
          <div style="font-size:10px;color:#64748b;margin-top:4px;">Date</div>
        </div>
        <div>
          <div class="sig-line">&nbsp;</div>
          <div style="font-size:10px;color:#64748b;margin-top:4px;">Staff Witness</div>
          <div style="margin-top:16px; border-bottom: 1px solid #999; width:120px;">&nbsp;</div>
          <div style="font-size:10px;color:#64748b;margin-top:4px;">Date</div>
        </div>
      </div>
    </div>
  </body></html>`;
  return htmlToPdf(html);
}

export interface CaseNoteData {
  clientName: string;
  clientId: string;
  author: string;
  date: string;
  noteType: string;
  content: string;
  goals?: string[];
  nextSteps?: string;
}

export async function generateCaseNote(note: CaseNoteData): Promise<Buffer> {
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8">${baseStyles()}</head><body>
    <div class="header">
      <h1>Life House Reentry Program</h1>
      <p>Case Note Documentation</p>
    </div>
    ${pageFooter("Case Note")}
    <div class="section">
      <div class="two-col">
        <div class="field"><label>Client Name</label><value>${note.clientName}</value></div>
        <div class="field"><label>Client ID</label><value>${note.clientId}</value></div>
        <div class="field"><label>Date of Note</label><value>${note.date}</value></div>
        <div class="field"><label>Note Type</label><value><span class="badge badge-blue">${note.noteType}</span></value></div>
        <div class="field"><label>Staff Author</label><value>${note.author}</value></div>
      </div>
    </div>
    <div class="section">
      <h2>Note Content</h2>
      <div style="background:#f8fafc;border-left:3px solid #1d4ed8;padding:12px 16px;border-radius:0 4px 4px 0;white-space:pre-wrap;">${note.content}</div>
    </div>
    ${note.goals && note.goals.length > 0 ? `
    <div class="section">
      <h2>Goals Addressed</h2>
      <ul style="margin-left:20px;">${note.goals.map(g => `<li>${g}</li>`).join("")}</ul>
    </div>` : ""}
    ${note.nextSteps ? `
    <div class="section">
      <h2>Next Steps / Follow-Up</h2>
      <p>${note.nextSteps}</p>
    </div>` : ""}
    <div class="sig-block">
      <div style="display:flex;gap:40px;margin-top:16px;">
        <div>
          <div class="sig-line">&nbsp;</div>
          <div style="font-size:10px;color:#64748b;margin-top:4px;">Staff Signature</div>
        </div>
        <div>
          <div style="border-bottom:1px solid #999;width:120px;">&nbsp;</div>
          <div style="font-size:10px;color:#64748b;margin-top:4px;">Date</div>
        </div>
      </div>
    </div>
  </body></html>`;
  return htmlToPdf(html);
}

export interface MonthlyReportData {
  month: string;
  year: number;
  generatedBy: string;
  stats: {
    totalClients: number;
    activeResidents: number;
    newIntakes: number;
    discharges: number;
    employmentPlacements: number;
    housingPlacements: number;
    averageGoalCompletion: number;
  };
  clients?: { name: string; status: string; programStage: string; goalCompletion: number }[];
}

export async function generateMonthlyReport(data: MonthlyReportData): Promise<Buffer> {
  const clientRows = (data.clients || []).map(c => `
    <tr>
      <td>${c.name}</td>
      <td><span class="badge badge-blue">${c.status}</span></td>
      <td>${c.programStage}</td>
      <td>${c.goalCompletion}%</td>
    </tr>`).join("");

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8">${baseStyles()}</head><body>
    <div class="header">
      <h1>Life House Reentry Program</h1>
      <p>Monthly Program Report &mdash; ${data.month} ${data.year}</p>
    </div>
    ${pageFooter(`Monthly Report — ${data.month} ${data.year}`)}
    <div class="section">
      <div class="two-col">
        <div class="field"><label>Reporting Period</label><value>${data.month} ${data.year}</value></div>
        <div class="field"><label>Generated By</label><value>${data.generatedBy}</value></div>
        <div class="field"><label>Generated Date</label><value>${new Date().toLocaleDateString()}</value></div>
      </div>
    </div>
    <div class="section">
      <h2>Program Statistics</h2>
      <table>
        <tr><th>Metric</th><th>Value</th></tr>
        <tr><td>Total Active Clients</td><td><strong>${data.stats.totalClients}</strong></td></tr>
        <tr><td>Active Residents (Housed)</td><td>${data.stats.activeResidents}</td></tr>
        <tr><td>New Intakes This Month</td><td>${data.stats.newIntakes}</td></tr>
        <tr><td>Successful Discharges</td><td>${data.stats.discharges}</td></tr>
        <tr><td>Employment Placements</td><td>${data.stats.employmentPlacements}</td></tr>
        <tr><td>Housing Placements</td><td>${data.stats.housingPlacements}</td></tr>
        <tr><td>Average Goal Completion</td><td>${data.stats.averageGoalCompletion}%</td></tr>
      </table>
    </div>
    ${clientRows ? `
    <div class="section">
      <h2>Client Summary</h2>
      <table>
        <thead><tr><th>Name</th><th>Status</th><th>Program Stage</th><th>Goal Completion</th></tr></thead>
        <tbody>${clientRows}</tbody>
      </table>
    </div>` : ""}
    <div class="sig-block">
      <p style="font-size:11px;color:#64748b;">This report was generated automatically by the Life House case management system. For questions, contact your program administrator.</p>
    </div>
  </body></html>`;
  return htmlToPdf(html);
}
