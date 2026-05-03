import { db } from "../db";
import { users, clientProfiles, clientSnapshots } from "../../shared/schema";
import { eq } from "drizzle-orm";
import { uploadFile } from "../services/google-drive";

export async function takeWeeklyClientSnapshots(): Promise<void> {
  try {
    const clients = await db.select()
      .from(users)
      .where(eq(users.role, "Resident" as any));

    const profiles = await db.select()
      .from(clientProfiles);

    const profileMap = Object.fromEntries(profiles.map((p) => [p.userId, p]));

    const weekOf = new Date();
    weekOf.setDate(weekOf.getDate() - weekOf.getDay()); // Sunday
    const weekStr = weekOf.toISOString().split("T")[0];

    for (const client of clients) {
      try {
        const profile = profileMap[client.id];

        const snapshotData = {
          snapshotDate: new Date().toISOString(),
          weekOf: weekStr,
          user: {
            id: client.id,
            name: client.name,
            email: client.email,
            role: client.role,
            createdAt: client.createdAt,
          },
          profile: profile ?? null,
        };

        const [snapshot] = await db.insert(clientSnapshots).values({
          clientId: client.id,
          snapshotData,
          weekOf: weekStr,
        }).returning();

        // Upload to Google Drive if folder is configured
        if (profile?.googleFolderId) {
          try {
            const { url } = await uploadFile({
              name: `${weekStr}-snapshot.json`,
              mimeType: "application/json",
              content: JSON.stringify(snapshotData, null, 2),
              parentFolderId: profile.googleFolderId + "/Snapshots",
            });

            await db.update(clientSnapshots)
              .set({ googleDriveUrl: url })
              .where(eq(clientSnapshots.id, snapshot.id));
          } catch (driveErr) {
            console.error(`[WeeklySnapshot] Drive upload failed for client ${client.id}:`, driveErr);
          }
        }
      } catch (clientErr) {
        console.error(`[WeeklySnapshot] Error for client ${client.id}:`, clientErr);
      }
    }

    console.log(`[WeeklySnapshot] Snapshots taken for ${clients.length} clients`);
  } catch (err) {
    console.error("[WeeklySnapshot] Error:", err);
  }
}
