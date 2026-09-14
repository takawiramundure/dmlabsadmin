const fs = require('fs');
const path = require('path');

const routeMapping = {
  // Dashboard Layout routes
  "src/pages/Dashboard/Home.tsx": "app/(dashboard)/page.tsx",
  "src/pages/Dashboard/AnalyticsOverview.tsx": "app/(dashboard)/analytics/page.tsx",
  "src/pages/Dashboard/SharedAnalytics.tsx": "app/(dashboard)/share/analytics/[snapshotId]/page.tsx",
  
  // CMS Routes
  "src/pages/CMS/HomePageManager.tsx": "app/(dashboard)/cms/home-settings/page.tsx",
  "src/pages/CMS/AboutPageManager.tsx": "app/(dashboard)/cms/about/page.tsx",
  "src/pages/CMS/OurStoryManager.tsx": "app/(dashboard)/cms/our-story/page.tsx",
  "src/pages/CMS/HeroManager.tsx": "app/(dashboard)/cms/hero/page.tsx",
  "src/pages/CMS/UnderstandingManager.tsx": "app/(dashboard)/cms/understanding/page.tsx",
  "src/pages/CMS/CopingManager.tsx": "app/(dashboard)/cms/coping/page.tsx",
  "src/pages/CMS/ProgramsManager.tsx": "app/(dashboard)/cms/programs/page.tsx",
  "src/pages/CMS/CrisisManager.tsx": "app/(dashboard)/cms/crisis-support/page.tsx",
  "src/pages/CMS/ResourcesManager.tsx": "app/(dashboard)/cms/resources/page.tsx",
  "src/pages/CMS/MediaManager.tsx": "app/(dashboard)/cms/media/page.tsx",
  "src/pages/CMS/VideoManager.tsx": "app/(dashboard)/cms/videos/page.tsx",
  "src/pages/CMS/PartnerManager.tsx": "app/(dashboard)/cms/partners/page.tsx",
  "src/pages/CMS/EventsManager.tsx": "app/(dashboard)/cms/upcoming-events/page.tsx",
  "src/pages/CMS/BlogManager.tsx": "app/(dashboard)/cms/blog/page.tsx",
  "src/pages/CMS/ProductManager.tsx": "app/(dashboard)/cms/shop/page.tsx",
  "src/pages/CMS/FooterManager.tsx": "app/(dashboard)/cms/footer/page.tsx",
  "src/pages/CMS/SuicideFactsManager.tsx": "app/(dashboard)/cms/suicide-facts/page.tsx",
  "src/pages/CMS/NewslettersManager.tsx": "app/(dashboard)/cms/newsletters/page.tsx",
  "src/pages/CMS/GalaManager.tsx": "app/(dashboard)/cms/black-excellence-gala/page.tsx",
  "src/pages/CMS/EventHeroManager.tsx": "app/(dashboard)/cms/event-hero/page.tsx",
  "src/pages/CMS/FoundersMessageManager.tsx": "app/(dashboard)/cms/founders-message/page.tsx",
  "src/pages/CMS/GalleryManager.tsx": "app/(dashboard)/cms/gallery/page.tsx",
  "src/pages/CMS/MeetOurTeamManager.tsx": "app/(dashboard)/cms/meet-our-team/page.tsx",
  "src/pages/CMS/StrategicPlanManager.tsx": "app/(dashboard)/cms/strategic-plan/page.tsx",
  "src/pages/CMS/ContactPageManager.tsx": "app/(dashboard)/cms/contact/page.tsx",
  "src/pages/CMS/MessagesManager.tsx": "app/(dashboard)/cms/messages/page.tsx",
  "src/pages/CMS/PageVisibilityManager.tsx": "app/(dashboard)/cms/page-visibility/page.tsx",
  "src/pages/CMS/ResearchPageManager.tsx": "app/(dashboard)/cms/research/page.tsx",
  "src/pages/CMS/ProjectPageManager.tsx": "app/(dashboard)/cms/project-[projectId]/page.tsx",
  "src/pages/CMS/PortfolioManager.tsx": "app/(dashboard)/cms/portfolio/page.tsx",
  "src/pages/CMS/ServicesManager.tsx": "app/(dashboard)/cms/noel-services/page.tsx",
  "src/pages/CMS/ReviewsManager.tsx": "app/(dashboard)/cms/reviews/page.tsx",
  
  // Generic Content Pages
  "src/pages/CMS/ContentManager.tsx": "app/(dashboard)/cms/content-manager/page.tsx", // Note: The App.tsx used ContentManager for /cms/careers, /cms/volunteer, etc. We will need to parameterize this later or keep it generic.
  
  // Protected Management Routes
  "src/pages/Users/UserManagement.tsx": "app/(dashboard)/users/page.tsx",
  "src/pages/Settings/SystemSettings.tsx": "app/(dashboard)/settings/page.tsx",
  
  // General Protected Routes
  "src/pages/UserProfiles.tsx": "app/(dashboard)/profile/page.tsx",
  "src/pages/Settings/SiteSettingsManager.tsx": "app/(dashboard)/settings/site/page.tsx",
  "src/pages/Settings/SEOManager.tsx": "app/(dashboard)/settings/seo/page.tsx",
  
  // Forms & UI
  "src/pages/Calendar.tsx": "app/(dashboard)/calendar/page.tsx",
  "src/pages/Blank.tsx": "app/(dashboard)/blank/page.tsx",
  "src/pages/Forms/FormElements.tsx": "app/(dashboard)/form-elements/page.tsx",
  "src/pages/Tables/BasicTables.tsx": "app/(dashboard)/basic-tables/page.tsx",
  "src/pages/UiElements/Alerts.tsx": "app/(dashboard)/alerts/page.tsx",
  "src/pages/UiElements/Avatars.tsx": "app/(dashboard)/avatars/page.tsx",
  "src/pages/UiElements/Badges.tsx": "app/(dashboard)/badge/page.tsx",
  "src/pages/UiElements/Buttons.tsx": "app/(dashboard)/buttons/page.tsx",
  "src/pages/UiElements/Images.tsx": "app/(dashboard)/images/page.tsx",
  "src/pages/UiElements/Videos.tsx": "app/(dashboard)/videos/page.tsx",
  "src/pages/Charts/LineChart.tsx": "app/(dashboard)/line-chart/page.tsx",
  "src/pages/Charts/BarChart.tsx": "app/(dashboard)/bar-chart/page.tsx",

  // Status Pages
  "src/pages/OtherPage/Unauthorized.tsx": "app/unauthorized/page.tsx",
  "src/pages/OtherPage/NotFound.tsx": "app/not-found.tsx", // Next.js native 404
};

for (const [src, dest] of Object.entries(routeMapping)) {
  if (fs.existsSync(src)) {
    const destDir = path.dirname(dest);
    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true });
    }
    fs.renameSync(src, dest);
    console.log(`Moved ${src} to ${dest}`);
  } else {
    console.log(`Warning: ${src} not found`);
  }
}
