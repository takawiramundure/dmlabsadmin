"use client";


import SignIn from "./pages/AuthPages/SignIn";
import SignUp from "./pages/AuthPages/SignUp";
import Unauthorized from "./pages/OtherPage/Unauthorized";
import NotFound from "./pages/OtherPage/NotFound";
import UserProfiles from "./pages/UserProfiles";
import Videos from "./pages/UiElements/Videos";
import Images from "./pages/UiElements/Images";
import Alerts from "./pages/UiElements/Alerts";
import Badges from "./pages/UiElements/Badges";
import Avatars from "./pages/UiElements/Avatars";
import Buttons from "./pages/UiElements/Buttons";
import LineChart from "./pages/Charts/LineChart";
import BarChart from "./pages/Charts/BarChart";
import Calendar from "./pages/Calendar";
import BasicTables from "./pages/Tables/BasicTables";
import SystemSettings from "./pages/Settings/SystemSettings";
import SiteSettingsManager from "./pages/Settings/SiteSettingsManager";
import SEOManager from "./pages/Settings/SEOManager";
import FormElements from "./pages/Forms/FormElements";
import Blank from "./pages/Blank";
import AppLayout from "@/layout/AppLayout";
import { ScrollToTop } from "@/components/common/ScrollToTop";
import Home from "./pages/Dashboard/Home";
import AnalyticsOverview from "./pages/Dashboard/AnalyticsOverview";
import SharedAnalytics from "./pages/Dashboard/SharedAnalytics";
import ContentManager from "./pages/CMS/ContentManager";
import HomePageManager from "./pages/CMS/HomePageManager";
import AboutPageManager from "./pages/CMS/AboutPageManager";
import OurStoryManager from "./pages/CMS/OurStoryManager";
import HeroManager from "./pages/CMS/HeroManager";
import UnderstandingManager from "./pages/CMS/UnderstandingManager";
import CopingManager from "./pages/CMS/CopingManager";
import CrisisManager from "./pages/CMS/CrisisManager";
import ProgramsManager from "./pages/CMS/ProgramsManager";
import ResourcesManager from "./pages/CMS/ResourcesManager";
import MediaManager from "./pages/CMS/MediaManager";
import EventsManager from "./pages/CMS/EventsManager";
import VideoManager from "./pages/CMS/VideoManager";
import PartnerManager from "./pages/CMS/PartnerManager";
import ProductManager from "./pages/CMS/ProductManager";
import BlogManager from "./pages/CMS/BlogManager";
import FooterManager from "./pages/CMS/FooterManager";
import SuicideFactsManager from "./pages/CMS/SuicideFactsManager";
import NewslettersManager from "./pages/CMS/NewslettersManager";
import GalaManager from "./pages/CMS/GalaManager";
import EventHeroManager from "./pages/CMS/EventHeroManager";
import FoundersMessageManager from "./pages/CMS/FoundersMessageManager";
import GalleryManager from "./pages/CMS/GalleryManager";
import MeetOurTeamManager from "./pages/CMS/MeetOurTeamManager";
import StrategicPlanManager from "./pages/CMS/StrategicPlanManager";
import ContactPageManager from "./pages/CMS/ContactPageManager";
import MessagesManager from "./pages/CMS/MessagesManager";
import PageVisibilityManager from "./pages/CMS/PageVisibilityManager";
import ResearchPageManager from "./pages/CMS/ResearchPageManager";
import ProjectPageManager from "./pages/CMS/ProjectPageManager";
import PortfolioManager from "./pages/CMS/PortfolioManager";
import ServicesManager from "./pages/CMS/ServicesManager";
import ReviewsManager from "./pages/CMS/ReviewsManager";
import UserManagement from "./pages/Users/UserManagement";
import { AuthProvider } from "@/context/AuthContext";
import { AnalyticsProvider } from "@/context/AnalyticsContext";
import { SiteProvider } from "@/context/SiteContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { ANALYTICS_CONFIG } from "@/config/analyticsConfig";

export default function App() {
  return (
    <GoogleOAuthProvider clientId={ANALYTICS_CONFIG.CLIENT_ID}>
      <AuthProvider>
        <SiteProvider>
          <AnalyticsProvider>
            <Router>
              <ScrollToTop />
              <Routes>
                {/* Dashboard Layout - Protected */}
                <Route element={<ProtectedRoute />}>
                  <Route element={<AppLayout />}>
                    <Route index path="/" element={<Home />} />
                    <Route path="/analytics" element={<AnalyticsOverview />} />
                    <Route path="/share/analytics/:snapshotId" element={<SharedAnalytics />} />

                    {/* CMS Routes */}
                    <Route path="/cms/home-settings" element={<HomePageManager />} />
                    <Route path="/cms/about" element={<AboutPageManager />} />
                    <Route path="/cms/our-story" element={<OurStoryManager />} />
                    <Route path="/cms/hero" element={<HeroManager />} />
                    <Route path="/cms/understanding" element={<UnderstandingManager />} />
                    <Route path="/cms/coping" element={<CopingManager />} />
                    <Route path="/cms/programs" element={<ProgramsManager />} />
                    <Route path="/cms/crisis-support" element={<CrisisManager />} />
                    <Route path="/cms/resources" element={<ResourcesManager />} />
                    <Route path="/cms/media" element={<MediaManager />} />
                    <Route path="/cms/videos" element={<VideoManager />} />
                    <Route path="/cms/partners" element={<PartnerManager />} />
                    <Route path="/cms/upcoming-events" element={<EventsManager />} />
                    <Route path="/cms/blog" element={<BlogManager />} />
                    <Route path="/cms/shop" element={<ProductManager />} />
                    <Route path="/cms/footer" element={<FooterManager />} />
                    <Route path="/cms/suicide-facts" element={<SuicideFactsManager />} />
                    <Route path="/cms/newsletters" element={<NewslettersManager />} />
                    <Route path="/cms/black-excellence-gala" element={<GalaManager />} />
                    <Route path="/cms/event-hero" element={<EventHeroManager />} />
                    <Route path="/cms/founders-message" element={<FoundersMessageManager />} />
                    <Route path="/cms/gallery" element={<GalleryManager />} />
                    <Route path="/cms/meet-our-team" element={<MeetOurTeamManager />} />
                    <Route path="/cms/strategic-plan" element={<StrategicPlanManager />} />
                    <Route path="/cms/contact" element={<ContactPageManager />} />
                    <Route path="/cms/messages" element={<MessagesManager />} />
                    <Route path="/cms/appointments" element={<MessagesManager collectionName="appointments" />} />
                    <Route path="/cms/applications" element={<MessagesManager collectionName="applications" />} />
                    <Route path="/cms/page-visibility" element={<PageVisibilityManager />} />
                    <Route path="/cms/research" element={<ResearchPageManager />} />
                    <Route path="/cms/project-:projectId" element={<ProjectPageManager />} />
                    <Route path="/cms/portfolio" element={<PortfolioManager />} />
                    <Route path="/cms/reviews" element={<ReviewsManager />} />
                    <Route path="/cms/noel-services" element={<ServicesManager />} />
                    
                    {/* Catch-all for generic content pages */}
                    <Route path="/cms/careers" element={<ContentManager />} />
                    <Route path="/cms/volunteer" element={<ContentManager />} />
                    <Route path="/cms/funders" element={<ContentManager />} />
                    <Route path="/cms/join-us" element={<ContentManager />} />

                    {/* Protected Management Routes */}
                    <Route element={<ProtectedRoute requiredPermission="manage_users" />}>
                      <Route path="/users" element={<UserManagement />} />
                    </Route>
                    <Route element={<ProtectedRoute requiredPermission="system_settings" />}>
                      <Route path="/settings" element={<SystemSettings />} />
                      <Route path="/cms/page-visibility" element={<PageVisibilityManager />} />
                    </Route>
                    {/* General Protected Routes */}
                    <Route element={<ProtectedRoute allowedRoles={['super_admin', 'tenant_admin', 'editor']} />}>
                      <Route path="/profile" element={<UserProfiles />} />
                    </Route>
                    <Route element={<ProtectedRoute requiredPermission="site_settings" />}>
                      <Route path="/settings/site" element={<SiteSettingsManager />} />
                    </Route>
                    <Route element={<ProtectedRoute requiredPermission="page_seo" />}>
                      <Route path="/settings/seo" element={<SEOManager />} />
                    </Route>
                    <Route path="/calendar" element={<Calendar />} />
                    <Route path="/blank" element={<Blank />} />

                    {/* Forms */}
                    <Route path="/form-elements" element={<FormElements />} />

                    {/* Tables */}
                    <Route path="/basic-tables" element={<BasicTables />} />

                    {/* Ui Elements */}
                    <Route path="/alerts" element={<Alerts />} />
                    <Route path="/avatars" element={<Avatars />} />
                    <Route path="/badge" element={<Badges />} />
                    <Route path="/buttons" element={<Buttons />} />
                    <Route path="/images" element={<Images />} />
                    <Route path="/videos" element={<Videos />} />

                    {/* Charts */}
                    <Route path="/line-chart" element={<LineChart />} />
                    <Route path="/bar-chart" element={<BarChart />} />
                  </Route>
                </Route>

                {/* Auth Layout */}
                <Route path="/signin" element={<SignIn />} />
                <Route path="/signup" element={<SignUp />} />

                {/* Status Pages */}
                <Route path="/unauthorized" element={<Unauthorized />} />
                <Route path="/not-found" element={<NotFound />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Router>
          </AnalyticsProvider>
        </SiteProvider>
      </AuthProvider>
    </GoogleOAuthProvider>
  );
}
