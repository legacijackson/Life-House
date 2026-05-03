import { google } from "googleapis";

let driveClient: ReturnType<typeof google.drive> | null = null;

function getDriveClient() {
  if (driveClient) return driveClient;

  const keyJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (!keyJson) {
    throw new Error("GOOGLE_SERVICE_ACCOUNT_JSON not configured");
  }

  const key = JSON.parse(Buffer.from(keyJson, "base64").toString("utf-8"));
  const auth = new google.auth.GoogleAuth({
    credentials: key,
    scopes: [
      "https://www.googleapis.com/auth/drive",
      "https://www.googleapis.com/auth/documents",
      "https://www.googleapis.com/auth/spreadsheets",
    ],
  });

  driveClient = google.drive({ version: "v3", auth });
  return driveClient;
}

export async function createFolder(name: string, parentId: string): Promise<{ id: string; url: string }> {
  const drive = getDriveClient();

  // Check if folder already exists
  const existing = await drive.files.list({
    q: `name = '${name.replace(/'/g, "\\'")}' and parents in '${parentId}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
    fields: "files(id, webViewLink)",
  });

  if (existing.data.files && existing.data.files.length > 0) {
    const f = existing.data.files[0];
    return { id: f.id!, url: f.webViewLink! };
  }

  const res = await drive.files.create({
    requestBody: {
      name,
      mimeType: "application/vnd.google-apps.folder",
      parents: [parentId],
    },
    fields: "id, webViewLink",
  });

  return { id: res.data.id!, url: res.data.webViewLink! };
}

export async function createClientFolder(clientName: string): Promise<{
  folderId: string;
  folderUrl: string;
  subfolders: Record<string, { id: string; url: string }>;
}> {
  const parentId = process.env.GOOGLE_CLIENTS_FOLDER_ID;
  if (!parentId) throw new Error("GOOGLE_CLIENTS_FOLDER_ID not configured");

  const { id: folderId, url: folderUrl } = await createFolder(clientName, parentId);

  const subfolderNames = ["Attachments", "Case Notes", "Signed Documents", "Snapshots", "Authorizations"];
  const subfolders: Record<string, { id: string; url: string }> = {};

  for (const name of subfolderNames) {
    subfolders[name] = await createFolder(name, folderId);
  }

  return { folderId, folderUrl, subfolders };
}

export async function uploadFile(params: {
  name: string;
  mimeType: string;
  content: Buffer | string;
  parentFolderId: string;
}): Promise<{ id: string; url: string }> {
  const drive = getDriveClient();
  const { Readable } = await import("stream");

  const body = typeof params.content === "string"
    ? Readable.from([params.content])
    : Readable.from([params.content]);

  const res = await drive.files.create({
    requestBody: {
      name: params.name,
      parents: [params.parentFolderId],
    },
    media: {
      mimeType: params.mimeType,
      body,
    },
    fields: "id, webViewLink",
  });

  return { id: res.data.id!, url: res.data.webViewLink! };
}

export async function ensureSubfolder(name: string, parentFolderId: string): Promise<{ id: string; url: string }> {
  return createFolder(name, parentFolderId);
}

export async function copyTemplate(templateFileId: string, destName: string, destFolderId: string): Promise<{ id: string; url: string }> {
  const drive = getDriveClient();

  const res = await drive.files.copy({
    fileId: templateFileId,
    requestBody: {
      name: destName,
      parents: [destFolderId],
    },
    fields: "id, webViewLink",
  });

  return { id: res.data.id!, url: res.data.webViewLink! };
}
