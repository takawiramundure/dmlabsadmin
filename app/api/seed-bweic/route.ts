import { NextResponse } from 'next/server';
import { FirestoreService } from "@/services/firestore";
import { SEED_DATA } from "@/config/seedData";
import { SETTINGS_SEED_DATA } from "@/config/settingsSeedData";
import { SITES } from "@/config/sites";

export async function GET() {
  try {
    const bweicSite = SITES.find(s => s.id === 'bweic');
    if (!bweicSite) throw new Error("BWEIC site not found");

    const siteData = SEED_DATA['bweic'];
    if (siteData) {
      for (const [pageId, content] of Object.entries(siteData)) {
        await FirestoreService.savePageContent(pageId, content as any, 'bweic');
      }
    }

    const siteSettings = SETTINGS_SEED_DATA['bweic'];
    if (siteSettings) {
      await FirestoreService.saveSiteSettings('bweic', siteSettings);
    }

    return NextResponse.json({ success: true, message: "Seeded BWEIC successfully" });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
