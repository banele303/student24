"use client";

import { usePathname } from "next/navigation";
import React, { useEffect } from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "./ui/sidebar";
import {
  Building2,
  LayoutDashboard,
  FileText,
  Heart,
  Home,
  Users,
  Settings,
  BellRing,
  CreditCard,
  LogOut,
  ChevronRight,
} from "lucide-react";
import { NAVBAR_HEIGHT } from "@/lib/constants";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useTheme } from "next-themes";

type AppSidebarProps = {
  userType: "manager" | "tenant";
};

const AppSidebar = ({ userType }: AppSidebarProps) => {
  const pathname = usePathname();
  const { toggleSidebar, open, setOpen } = useSidebar();
  const { theme } = useTheme();
  const isDark = theme === "dark";

  // Close sidebar on mobile when clicking outside
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768 && open) {
        setOpen(false);
      }
    };
    
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [open, setOpen]);

  // Define navigation links based on user type
  const managerLinks = [
    { icon: LayoutDashboard, label: "Dashboard", href: "/managers/dashboard" },
    { icon: Building2, label: "Properties", href: "/managers/properties" },
    { icon: FileText, label: "Applications", href: "/managers/applications" },
    { icon: Users, label: "Tenants", href: "/managers/tenants" },
    { icon: CreditCard, label: "Payments", href: "/managers/payments" },
  ];

  const tenantLinks = [
    { icon: LayoutDashboard, label: "Dashboard", href: "/tenants/dashboard" },
    { icon: Heart, label: "Favorites", href: "/tenants/favorites" },
    { icon: Home, label: "Residences", href: "/tenants/residences" },
    { icon: FileText, label: "Applications", href: "/tenants/applications" },
    { icon: CreditCard, label: "Payments", href: "/tenants/payments" },
  ];
  
  const bottomLinks = [
    { icon: Settings, label: "Settings", href: `/${userType}s/settings` },
    { icon: BellRing, label: "Notifications", href: `/${userType}s/notifications` },
  ];

  const navLinks = userType === "manager" ? managerLinks : tenantLinks;

  // Check if we're on mobile
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  
  return (
    <Sidebar
      collapsible="icon"
      className={cn(
        "fixed left-0 backdrop-blur-sm z-50 border-r transition-all duration-300 ease-in-out transform-gpu",
        isDark ? 
          "bg-slate-900/95 border-slate-800/40 shadow-xl" : 
          "bg-white/95 border-slate-200 shadow-md"
      )}
      style={{
        top: `${NAVBAR_HEIGHT}px`,
        height: `calc(100vh - ${NAVBAR_HEIGHT}px)`,
        width: open ? 'var(--sidebar-width)' : 'var(--sidebar-width-icon)',
        // On mobile, slide in from the left when open, otherwise hide off-screen
        transform: isMobile ? (open ? 'translateX(0)' : 'translateX(-100%)') : 'none',
      }}
    >
      <SidebarHeader className="relative z-10 pt-3 pb-1">
        <SidebarMenu>
          <SidebarMenuItem>
            <div
              className={cn(
                "flex w-full items-center",
                open ? "justify-between px-4" : "justify-center"
              )}
            >
              {open && (
                <span className={cn(
                  "font-medium text-base capitalize",
                  isDark ? "text-white/90" : "text-slate-800"
                )}>
                  {userType} Portal
                </span>
              )}
              <button
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full transition-colors",
                  isDark ? 
                    "hover:bg-slate-800 text-slate-400 hover:text-white" : 
                    "hover:bg-slate-100 text-slate-600 hover:text-slate-900"
                )}
                onClick={toggleSidebar}
                aria-label={open ? "Collapse sidebar" : "Expand sidebar"}
              >
                <ChevronRight size={18} className={open ? "rotate-180" : "rotate-0"} />
              </button>
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent className="relative z-10 px-3 pt-2 pb-4">
        <SidebarMenu>
          {/* Main navigation links */}
          <div className="mb-1 pb-1">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              const IconComponent = link.icon;
              return (
                <SidebarMenuItem key={link.href}>
                  <Link href={link.href} passHref scroll={false}>
                    <SidebarMenuButton
                      isActive={isActive}
                      variant={isActive ? "default" : "ghost"}
                      size="default"
                      className={cn(
                        "mb-1 transition-colors group relative",
                        isDark ? 
                          "text-slate-400 hover:text-white" : 
                          "text-slate-600 hover:text-slate-900",
                        isActive && isDark && "bg-gradient-to-r from-blue-600/20 to-indigo-600/20 text-white hover:text-white",
                        isActive && !isDark && "bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 hover:text-blue-800"
                      )}
                    >
                      <IconComponent size={18} />
                      <span className="text-[14px] font-medium">{link.label}</span>
                      {isActive && (
                        <span className={cn(
                          "absolute inset-y-0 left-0 w-[3px] rounded-r-full",
                          isDark ? "bg-blue-500" : "bg-blue-600"
                        )}></span>
                      )}
                    </SidebarMenuButton>
                  </Link>
                </SidebarMenuItem>
              );
            })}
          </div>
          
          {/* Divider */}
          <div className={cn(
            "w-full h-px my-3", 
            isDark ? "bg-slate-800" : "bg-slate-200"
          )} />
          
          {/* Bottom links */}
          <div>
            {bottomLinks.map((link) => {
              const isActive = pathname === link.href;
              const IconComponent = link.icon;
              return (
                <SidebarMenuItem key={link.href}>
                  <Link href={link.href} passHref scroll={false}>
                    <SidebarMenuButton
                      isActive={isActive}
                      variant="ghost"
                      size="default"
                      className={cn(
                        "transition-colors",
                        isDark ? 
                          "text-slate-400 hover:text-white hover:bg-slate-800/50" : 
                          "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                      )}
                    >
                      <IconComponent size={18} />
                      <span className="text-[14px] font-medium">{link.label}</span>
                    </SidebarMenuButton>
                  </Link>
                </SidebarMenuItem>
              );
            })}
            
            {/* Logout button at the bottom */}
            <SidebarMenuItem className="mt-4">
              <SidebarMenuButton
                variant="ghost"
                size="default"
                className={cn(
                  "transition-colors",
                  isDark ? 
                    "text-rose-400 hover:text-rose-300 hover:bg-rose-900/20" : 
                    "text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                )}
                onClick={() => {
                  // You can implement logout functionality here if needed
                  console.log('Logout clicked');
                }}
              >
                <LogOut size={18} />
                <span className="text-[14px] font-medium">Sign Out</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </div>
        </SidebarMenu>
      </SidebarContent>
      
      {/* User section at bottom - properly positioned */}
      {open && (
        <div className="absolute bottom-0 left-0 w-full px-4 pb-4">
          <div className={cn(
            "border-t pt-4 relative",
            isDark ? "border-slate-800" : "border-slate-200"
          )}>
            <div className={cn(
              "flex items-center gap-3 p-2 rounded-lg", 
              isDark ? "bg-slate-800/50" : "bg-slate-100"
            )}>
              <div className="relative flex-shrink-0">
                <div className={cn(
                  "h-9 w-9 rounded-full flex items-center justify-center",
                  isDark ? 
                    "bg-gradient-to-tr from-blue-600 to-indigo-600 text-white" : 
                    "bg-gradient-to-tr from-blue-500 to-indigo-500 text-white"
                )}>
                  <span className="font-medium text-sm">
                    {userType === "manager" ? "M" : "T"}
                  </span>
                </div>
                <span className={cn(
                  "absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border",
                  isDark ? "bg-green-500 border-slate-900" : "bg-green-500 border-white"
                )}></span>
              </div>
              
              <div className="flex flex-col">
                <span className={cn(
                  "text-sm font-medium",
                  isDark ? "text-white" : "text-slate-900"
                )}>
                  {userType === "manager" ? "Property Manager" : "Tenant"}
                </span>
                <span className={cn(
                  "text-xs",
                  isDark ? "text-slate-400" : "text-slate-600"
                )}>
                  Active Now
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </Sidebar>
  );
};

export default AppSidebar;
