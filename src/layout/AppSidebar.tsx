"use client";

import { useCallback, useEffect, useRef, useState, useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { MessageSquare, Building2, Lightbulb } from "lucide-react";

// Assume these icons are imported from an icon library
import {
  BoxCubeIcon,
  ChevronDownIcon,
  GridIcon,
  HorizontaLDots,
  PageIcon,
  PieChartIcon,
  PlugInIcon,
  UserCircleIcon,
} from "@/icons";
import { useSidebar } from "@/context/SidebarContext";
import { useSite } from "@/context/SiteContext";
import { useAuth } from "@/context/AuthContext";

type NavItem = {
  name: string;
  icon: React.ReactNode;
  path?: string;
  subItems?: { name: string; path: string; pro?: boolean; new?: boolean }[];
  pro?: boolean;
  new?: boolean;
};

const AppSidebar: React.FC = () => {
  const { isExpanded, isMobileOpen, isHovered, setIsHovered } = useSidebar();
  const { currentSite } = useSite();
  const { profile, hasPermission } = useAuth();
  const location = usePathname();

  const navItems = useMemo(() => {
    const hasHeroSlider = ['bweic', 'kmfw', 'elwg', 'noel', 'phcg', 'nspc'].includes(currentSite.id);
    const globalComponentsSubItems = [
      { name: "Footer Details", path: "/cms/footer" },
      { name: "Reusable Components", path: "/cms/reusable-components" }
    ];
    if (hasHeroSlider) {
      globalComponentsSubItems.unshift({ name: "Hero Slider", path: "/cms/hero" });
    }

    const items: NavItem[] = [
      {
        icon: <GridIcon />,
        name: "Dashboard",
        path: "/",
      },
      {
        icon: <PageIcon />,
        name: "Home Page Editor",
        path: "/cms/home-settings",
      },
      {
        icon: <PageIcon />,
        name: "Pages Manager",
        path: "/cms/pages",
        new: true,
      }
    ];

    // Dynamic Modules group / items
    const hasBlog = ['bweic', 'kmfw', 'elwg', 'dmlabs', 'noel', 'aitasol', 'phcg', 'nspc'].includes(currentSite.id);
    const hasEvents = ['bweic', 'kmfw', 'elwg', 'aitasol', 'nspc'].includes(currentSite.id);
    const hasPortfolio = ['dmlabs', 'noel'].includes(currentSite.id);
    const hasShop = currentSite.id === 'bweic';
    const hasApplications = currentSite.id === 'aitasol';

    // Leads & Forms (if they use forms)
    items.push({
      icon: <MessageSquare size={20} />,
      name: "Leads & Forms",
      path: "/cms/leads",
    });

    items.push({
      icon: <PageIcon />,
      name: "Forms Manager",
      path: "/cms/forms",
      new: true,
    });

    if (hasBlog) {
      items.push({
        icon: <GridIcon />,
        name: "Blog Manager",
        path: "/cms/blog",
      });
    }

    if (hasEvents) {
      items.push({
        icon: <PageIcon />,
        name: "Events Manager",
        path: "/cms/upcoming-events",
      });
    }

    if (hasPortfolio) {
      items.push({
        icon: <PageIcon />,
        name: "Portfolio & Projects",
        path: "/cms/portfolio",
      });
    }

    if (hasShop) {
      items.push({
        icon: <BoxCubeIcon />,
        name: "Shop / Store",
        path: "/cms/shop",
      });
    }

    if (hasApplications) {
      items.push({
        icon: <PageIcon />,
        name: "Student Applications",
        path: "/cms/aitasol-applications",
      });
    }

    // Global Components
    items.push({
      name: "Global Components",
      icon: <PlugInIcon />,
      subItems: globalComponentsSubItems,
      new: true,
    });

    // Media Library
    items.push({
      icon: <BoxCubeIcon />,
      name: "Media Library",
      path: "/cms/media",
    });

    // Feature Requests
    items.push({
      icon: <Lightbulb size={20} className="text-amber-500" />,
      name: "Feature Requests",
      path: "/feature-requests",
      new: true,
    });

    return items;
  }, [currentSite.id]);



  const othersItems = useMemo(() => {
    const isSuperAdmin = profile?.role === 'super_admin';
    const hasAllowedSites = (profile?.allowedSites?.length || 0) > 0;
    const canManageUsers = hasPermission('manage_users');
    const canSystemSettings = hasPermission('system_settings');
    const canSiteSettings = hasPermission('site_settings');
    const canPageSeo = hasPermission('page_seo');
    
    const items: NavItem[] = [
      {
        icon: <UserCircleIcon />,
        name: "User Profile",
        path: "/profile",
      }
    ];

    // Show Analytics to Super Admins OR anyone with at least one site
    if (isSuperAdmin || hasAllowedSites) {
      items.unshift({
        icon: <PieChartIcon />,
        name: "Internal Analytics",
        path: "/analytics",
      });
      if (canSiteSettings) {
        items.push({
          icon: <PlugInIcon />,
          name: "Global Site Settings",
          path: "/settings/site",
        });
      }
      if (canPageSeo) {
        items.push({
          icon: <GridIcon />,
          name: "Page SEO Manager",
          path: "/settings/seo",
        });
      }
    }

    if (canManageUsers) {
      items.unshift({
        icon: <UserCircleIcon />,
        name: "Users",
        path: "/users",
      });
    }

    if (canSystemSettings) {
      items.push(
        {
          icon: <PlugInIcon />,
          name: "System Settings",
          path: "/settings",
        },
        {
          icon: <HorizontaLDots />,
          name: "Rollback Manager",
          path: "/settings/rollback",
        }
      );
    }
    if (isSuperAdmin) {
      items.push({
        icon: <BoxCubeIcon />,
        name: "Tenant Spawner",
        path: "/settings/spawner",
      }, {
        icon: <PlugInIcon />,
        name: "Authorized Domains",
        path: "/settings/authorized-domains",
      }, {
        icon: <Building2 size={18} />,
        name: "Tenant Sites",
        path: "/settings/tenants",
      }, {
        icon: <HorizontaLDots />,
        name: "Audit Logs",
        path: "/settings/audit-logs",
      });
    }
    return items;
  }, [profile, hasPermission]);

  const [openSubmenu, setOpenSubmenu] = useState<{
    type: "main" | "others";
    index: number;
  } | null>(null);
  const [subMenuHeight, setSubMenuHeight] = useState<Record<string, number>>(
    {}
  );
  const subMenuRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // const isActive = (path: string) => location === path;
  const isActive = useCallback(
    (path: string) => location === path,
    [location]
  );

  useEffect(() => {
    let submenuMatched = false;
    ["main", "others"].forEach((menuType) => {
      const items = menuType === "main" ? navItems : othersItems;
      items.forEach((nav, index) => {
        if (nav.subItems) {
          nav.subItems.forEach((subItem) => {
            if (isActive(subItem.path)) {
              setOpenSubmenu({
                type: menuType as "main" | "others",
                index,
              });
              submenuMatched = true;
            }
          });
        }
      });
    });

    // Only auto-close if we navigated to a route that isn't in a submenu?? 
    // Actually, simply removing the else block might be safer for UX: if I'm on a page that isn't in a submenu, keep the last one open? 
    // Or, if I navigate away, I probably expect it to update.
    // But if 'submenuMatched' is false, it means I'm on a top level page or somewhere else.
    // The issue was definitely the constant re-running. Now that navItems is memoized, this effect runs only when location or currentSite changes.
    // This is correct behavior now.
    if (!submenuMatched) {
      setOpenSubmenu(null);
    }
  }, [location, navItems, isActive]);

  useEffect(() => {
    if (openSubmenu !== null) {
      const key = `${openSubmenu.type}-${openSubmenu.index}`;
      if (subMenuRefs.current[key]) {
        setSubMenuHeight((prevHeights) => ({
          ...prevHeights,
          [key]: subMenuRefs.current[key]?.scrollHeight || 0,
        }));
      }
    }
  }, [openSubmenu]);

  const handleSubmenuToggle = (index: number, menuType: "main" | "others") => {
    setOpenSubmenu((prevOpenSubmenu) => {
      if (
        prevOpenSubmenu &&
        prevOpenSubmenu.type === menuType &&
        prevOpenSubmenu.index === index
      ) {
        return null;
      }
      return { type: menuType, index };
    });
  };

  const renderMenuItems = (items: NavItem[], menuType: "main" | "others") => (
    <ul className="flex flex-col gap-4">
      {items.map((nav, index) => (
        <li key={nav.name}>
          {nav.subItems ? (
            <button
              onClick={() => handleSubmenuToggle(index, menuType)}
              className={`menu-item group ${openSubmenu?.type === menuType && openSubmenu?.index === index
                ? "menu-item-active"
                : "menu-item-inactive"
                } cursor-pointer ${!isExpanded && !isHovered
                  ? "lg:justify-center"
                  : "lg:justify-start"
                }`}
            >
              <span
                className={`menu-item-icon-size  ${openSubmenu?.type === menuType && openSubmenu?.index === index
                  ? "menu-item-icon-active"
                  : "menu-item-icon-inactive"
                  }`}
              >
                {nav.icon}
              </span>
              {(isExpanded || isHovered || isMobileOpen) && (
                <span className="menu-item-text">{nav.name}</span>
              )}
              {(isExpanded || isHovered || isMobileOpen) && (
                <ChevronDownIcon
                  className={`ml-auto w-5 h-5 transition-transform duration-200 ${openSubmenu?.type === menuType &&
                    openSubmenu?.index === index
                    ? "rotate-180 text-brand-500"
                    : ""
                    }`}
                />
              )}
            </button>
          ) : (
            nav.path && (
              <Link
                href={nav.path}
                className={`menu-item group ${isActive(nav.path) ? "menu-item-active" : "menu-item-inactive"
                  }`}
              >
                <span
                  className={`menu-item-icon-size ${isActive(nav.path)
                    ? "menu-item-icon-active"
                    : "menu-item-icon-inactive"
                    }`}
                >
                  {nav.icon}
                </span>
                {(isExpanded || isHovered || isMobileOpen) && (
                  <span className="menu-item-text">{nav.name}</span>
                )}
              </Link>
            )
          )}
          {nav.subItems && (isExpanded || isHovered || isMobileOpen) && (
            <div
              ref={(el) => {
                subMenuRefs.current[`${menuType}-${index}`] = el;
              }}
              className="overflow-hidden transition-all duration-300"
              style={{
                height:
                  openSubmenu?.type === menuType && openSubmenu?.index === index
                    ? `${subMenuHeight[`${menuType}-${index}`] || 0}px`
                    : "0px",
              }}
            >
              <ul className="mt-2 space-y-1 ml-9">
                {nav.subItems.map((subItem) => (
                  <li key={subItem.name}>
                    <Link
                      href={subItem.path}
                      className={`menu-dropdown-item ${isActive(subItem.path)
                        ? "menu-dropdown-item-active"
                        : "menu-dropdown-item-inactive"
                        }`}
                    >
                      {subItem.name}
                      <span className="flex items-center gap-1 ml-auto">
                        {subItem.new && (
                          <span
                            className={`ml-auto ${isActive(subItem.path)
                              ? "menu-dropdown-badge-active"
                              : "menu-dropdown-badge-inactive"
                              } menu-dropdown-badge`}
                          >
                            new
                          </span>
                        )}
                        {subItem.pro && (
                          <span
                            className={`ml-auto ${isActive(subItem.path)
                              ? "menu-dropdown-badge-active"
                              : "menu-dropdown-badge-inactive"
                              } menu-dropdown-badge`}
                          >
                            pro
                          </span>
                        )}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </li>
      ))}
    </ul>
  );

  return (
    <aside
      className={`fixed mt-16 flex flex-col lg:mt-0 top-0 px-5 left-0 bg-white dark:bg-gray-900 dark:border-gray-800 text-gray-900 h-screen transition-all duration-300 ease-in-out z-50 border-r border-gray-200 
        ${isExpanded || isMobileOpen
          ? "w-[290px]"
          : isHovered
            ? "w-[290px]"
            : "w-[90px]"
        }
        ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0`}
      onMouseEnter={() => !isExpanded && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className={`py-8 flex ${!isExpanded && !isHovered ? "lg:justify-center" : "justify-start"
          }`}
      >
        <Link href="/">
          {isExpanded || isHovered || isMobileOpen ? (
            <>
              <img
                className="dark:hidden"
                src="/images/logo/digital-maples-logo.png"
                alt="Digital Maples Logo"
                width={150}
                height={40}
              />
              <img
                className="hidden dark:block"
                src="/images/logo/digital-maples-logo-white.png"
                alt="Digital Maples Logo"
                width={150}
                height={40}
              />
            </>
          ) : (
            <img
              src="/images/logo/logo-icon.svg"
              alt="Logo"
              width={32}
              height={32}
            />
          )}
        </Link>
      </div>
      <div className="flex flex-col overflow-y-auto duration-300 ease-linear no-scrollbar">
        <nav className="mb-6">
          <div className="flex flex-col gap-4">
            <div>
              <h2
                className={`mb-4 text-xs uppercase flex leading-[20px] text-gray-400 ${!isExpanded && !isHovered
                  ? "lg:justify-center"
                  : "justify-start"
                  }`}
              >
                {isExpanded || isHovered || isMobileOpen ? (
                  "Menu"
                ) : (
                  <HorizontaLDots className="size-6" />
                )}
              </h2>
              {renderMenuItems(navItems, "main")}
            </div>
            <div className="">
              <h2
                className={`mb-4 text-xs uppercase flex leading-[20px] text-gray-400 ${!isExpanded && !isHovered
                  ? "lg:justify-center"
                  : "justify-start"
                  }`}
              >
                {isExpanded || isHovered || isMobileOpen ? (
                  "Others"
                ) : (
                  <HorizontaLDots />
                )}
              </h2>
              {renderMenuItems(othersItems, "others")}
            </div>
          </div>
        </nav>
        {isExpanded || isHovered || isMobileOpen ? null : null}
      </div>
    </aside>
  );
};

export default AppSidebar;
