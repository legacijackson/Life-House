import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useCurrentUser } from "@/lib/rbac";
import { Logo } from "@/components/logo";
import { apiRequest } from "@/lib/queryClient";
import {
  Home,
  Users,
  Archive,
  Heart,
  FileText,
  Building,
  Settings,
  BarChart3,
  Menu,
  X,
  ExternalLink,
  MessageSquare,
  Calendar,
  UserPlus,
  LogOut,
  Bell,
  CheckCheck,
  ClipboardCheck,
  CheckSquare,
} from "lucide-react";

// Define navigation for different contexts
const publicNavigation = [
  { name: "Home", href: "/", icon: Home },
  { name: "Resources", href: "/guest-resources", icon: Archive },
  { name: "Apply", href: "/apply", icon: FileText },
  { name: "Refer", href: "/refer", icon: Users },
  { name: "Donate", href: "/donate", icon: Heart },
];

// Resident navigation
const residentNavigation = [
  { name: "Dashboard", href: "/", icon: Home },
  { name: "Check-in", href: "/app/check-in", icon: CheckSquare },
  { name: "Resources", href: "/app/resources", icon: Archive },
  { name: "Requests", href: "/app/authorization-requests", icon: ClipboardCheck },
  { name: "Maintenance", href: "/app/maintenance", icon: Building },
  { name: "Messages", href: "/app/messages", icon: MessageSquare },
];

// Staff navigation (for case workers)
const staffNavigation = [
  { name: "Staff Dashboard", href: "/app/staff-dashboard", icon: Home },
  { name: "Clients", href: "/app/clients", icon: Users },
  { name: "Intake & Referrals", href: "/app/intake", icon: UserPlus },
  { name: "Case Notes", href: "/app/case-notes", icon: FileText },
  { name: "Events & Attendance", href: "/app/attendance", icon: Calendar },
  { name: "Check-in Roster", href: "/app/check-in", icon: CheckSquare },
  { name: "Onboarding", href: "/app/onboarding", icon: UserPlus },
  { name: "Auth Requests", href: "/app/authorization-requests", icon: ClipboardCheck },
  { name: "Messages", href: "/app/messages", icon: MessageSquare },
  { name: "Properties", href: "/app/properties", icon: Building },
  { name: "Reports", href: "/app/reports", icon: BarChart3 },
  { name: "Resources", href: "/app/resources", icon: Archive },
  { name: "Maintenance", href: "/app/maintenance", icon: Building },
  { name: "Workshop Studio", href: "/app/workshop-studio", icon: Building },
];

// Admin navigation (includes all staff items plus admin panel)
const adminNavigation = [
  { name: "Staff Dashboard", href: "/app/staff-dashboard", icon: Home },
  { name: "Clients", href: "/app/clients", icon: Users },
  { name: "Intake & Referrals", href: "/app/intake", icon: UserPlus },
  { name: "Case Notes", href: "/app/case-notes", icon: FileText },
  { name: "Events & Attendance", href: "/app/attendance", icon: Calendar },
  { name: "Check-in Roster", href: "/app/check-in", icon: CheckSquare },
  { name: "Onboarding", href: "/app/onboarding", icon: UserPlus },
  { name: "Auth Requests", href: "/app/authorization-requests", icon: ClipboardCheck },
  { name: "Messages", href: "/app/messages", icon: MessageSquare },
  { name: "Properties", href: "/app/properties", icon: Building },
  { name: "Reports", href: "/app/reports", icon: BarChart3 },
  { name: "Resources", href: "/app/resources", icon: Archive },
  { name: "Maintenance", href: "/app/maintenance", icon: Building },
  { name: "Workshop Studio", href: "/app/workshop-studio", icon: Building },
  { name: "Finance", href: "/app/finance", icon: BarChart3 },
  { name: "Admin Panel", href: "/app/admin-panel", icon: Settings },
];

// ── Notifications Bell ────────────────────────────────────────────────────────

function NotificationsBell() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const qc = useQueryClient();

  const { data: notifs = [] } = useQuery<any[]>({
    queryKey: ["/api/notifications"],
    queryFn: () => apiRequest("GET", "/api/notifications").then((r) => r.json()),
    refetchInterval: 30_000,
  });

  const unread = (notifs as any[]).filter((n) => n.status === "unread");

  const markRead = useMutation({
    mutationFn: (id: string) => apiRequest("PATCH", `/api/notifications/${id}/read`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/notifications"] }),
  });

  const markAllRead = useMutation({
    mutationFn: () => apiRequest("PATCH", "/api/notifications/mark-all-read"),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/notifications"] }),
  });

  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative p-2 rounded-lg text-gray-500 hover:text-green-700 hover:bg-green-50 transition-colors"
        title="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unread.length > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center leading-none">
            {unread.length > 9 ? "9+" : unread.length}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute bottom-10 left-0 w-80 bg-white rounded-xl shadow-xl border border-gray-100 z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b">
            <span className="text-sm font-semibold text-gray-800">Notifications</span>
            {unread.length > 0 && (
              <button
                onClick={() => markAllRead.mutate()}
                className="text-xs text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
              >
                <CheckCheck className="w-3.5 h-3.5" /> Mark all read
              </button>
            )}
          </div>
          <div className="max-h-80 overflow-y-auto divide-y divide-gray-50">
            {(notifs as any[]).length === 0 ? (
              <div className="px-4 py-6 text-center text-sm text-gray-400">No notifications</div>
            ) : (
              (notifs as any[]).slice(0, 20).map((n: any) => (
                <div
                  key={n.id}
                  onClick={() => { if (n.status === "unread") markRead.mutate(n.id); }}
                  className={cn(
                    "px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors",
                    n.status === "unread" && "bg-blue-50/50"
                  )}
                >
                  <div className="flex items-start gap-2">
                    {n.status === "unread" && (
                      <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 flex-shrink-0" />
                    )}
                    <div className={n.status !== "unread" ? "ml-3.5" : ""}>
                      <p className="text-xs font-medium text-gray-800">{n.title}</p>
                      {n.body && <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.body}</p>}
                      <p className="text-[11px] text-gray-400 mt-1">
                        {new Date(n.createdAt).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

interface UniversalSidebarProps {
  children: React.ReactNode;
}

export function UniversalSidebar({ children }: UniversalSidebarProps) {
  const [location] = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const { data: user, isLoading } = useCurrentUser();

  // Determine if we're on an authenticated page (excluding the login page)
  const isAuthenticatedPage = location.startsWith('/app') && location !== '/app';
  
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 1024);
      if (window.innerWidth >= 1024) {
        setIsSidebarOpen(false);
      }
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // Add swipe gesture support
  useEffect(() => {
    let startX = 0;
    let startY = 0;
    let isSwipeGesture = false;

    const handleTouchStart = (e: TouchEvent) => {
      if (!isMobile) return;
      
      const touch = e.touches[0];
      startX = touch.clientX;
      startY = touch.clientY;
      
      if (startX <= 30 || isSidebarOpen) {
        isSwipeGesture = true;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isMobile || !isSwipeGesture) return;
      
      const touch = e.touches[0];
      const deltaX = touch.clientX - startX;
      const deltaY = Math.abs(touch.clientY - startY);
      
      if (Math.abs(deltaX) > 50 && deltaY < 100) {
        if (deltaX > 0 && startX <= 30 && !isSidebarOpen) {
          setIsSidebarOpen(true);
          isSwipeGesture = false;
        } else if (deltaX < 0 && isSidebarOpen) {
          setIsSidebarOpen(false);
          isSwipeGesture = false;
        }
      }
    };

    const handleTouchEnd = () => {
      isSwipeGesture = false;
    };

    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchmove', handleTouchMove, { passive: true });
    document.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isMobile, isSidebarOpen]);

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  // Choose navigation based on context and user role
  let navigation = publicNavigation;
  
  if (isAuthenticatedPage && user) {
    const userRole = (user as any)?.role;
    const isAdmin = (user as any)?.isAdmin;
    
    // Check role and admin status
    switch (userRole) {
      case 'CaseManager':
      case 'Intake':
        // If case manager has admin privileges, show admin navigation
        navigation = isAdmin ? adminNavigation : staffNavigation;
        break;
      case 'Client':
        navigation = residentNavigation;
        break;
      case 'Resident':
        navigation = residentNavigation;
        break;
      case 'Admin':
        navigation = adminNavigation;
        break;
      default:
        navigation = publicNavigation;
    }
  }

  const SidebarContent = () => (
    <aside className={cn(
      "w-64 bg-white shadow-lg border-r border-gray-200 flex flex-col",
      "fixed inset-y-0 left-0 z-50 lg:relative lg:z-auto",
      isMobile && !isSidebarOpen && "transform -translate-x-full lg:translate-x-0",
      isMobile && isSidebarOpen && "transform translate-x-0"
    )}>
      {/* Logo */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <Link href="/">
            <div className="flex items-center space-x-3 cursor-pointer hover:bg-gray-50 rounded-lg p-2 -m-2 transition-colors">
              <Logo className="w-10 h-10" />
            </div>
          </Link>
          {isMobile && (
            <Button
              variant="ghost"
              size="sm"
              onClick={closeSidebar}
              className="lg:hidden"
            >
              <X className="w-5 h-5" />
            </Button>
          )}
        </div>
      </div>

      {/* User Profile (only for authenticated pages) */}
      {isAuthenticatedPage && user && (
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center">
              {(user as any)?.profileImage ? (
                <img 
                  src={(user as any).profileImage} 
                  alt={(user as any)?.name || 'User'} 
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-sm font-medium text-gray-600">
                  {((user as any)?.name?.charAt(0) || (user as any)?.email?.charAt(0) || 'U')}
                </span>
              )}
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">
                {(user as any)?.name || (user as any)?.email}
              </p>
              <div className="flex items-center gap-2">
                <p className="text-xs text-gray-500">
                  {(user as any)?.isAdmin ? 'Admin' :
                   (user as any)?.role === 'CaseManager' || (user as any)?.role === 'Intake' ? 'Staff' :
                   (user as any)?.role === 'Resident' || (user as any)?.role === 'Client' ? 'Client' : 'Guest'}
                </p>
                {(user as any)?.isAdmin && (
                  <span className="text-xs bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded">Admin Access</span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-4">
        <ul className="space-y-2">
          {navigation.map((item) => {
            const isActive = location === item.href || 
              (item.href === "/guest-resources" && location === "/resources");
            
            const handleClick = () => {
              if (isMobile) closeSidebar();
              
              // Handle anchor links
              if (item.href.startsWith('#')) {
                const element = document.querySelector(item.href);
                if (element) {
                  element.scrollIntoView({ behavior: 'smooth' });
                }
                return;
              }
            };

            if (item.href.startsWith('#')) {
              return (
                <li key={item.name}>
                  <button
                    onClick={handleClick}
                    className={cn(
                      "w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors cursor-pointer text-left",
                      isActive 
                        ? "text-green-700 bg-green-50 border-l-4 border-green-700" 
                        : "text-gray-700 hover:text-green-700 hover:bg-green-50"
                    )}
                  >
                    <item.icon className="w-5 h-5 mr-3" />
                    {item.name}
                  </button>
                </li>
              );
            }

            // Handle external URLs
            if (item.href.startsWith('http')) {
              return (
                <li key={item.name}>
                  <a 
                    href={item.href} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className={cn(
                      "flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors cursor-pointer",
                      "text-gray-700 hover:text-green-700 hover:bg-green-50"
                    )}
                    onClick={handleClick}
                  >
                    <item.icon className="w-5 h-5 mr-3" />
                    {item.name}
                    <ExternalLink className="w-3 h-3 ml-auto" />
                  </a>
                </li>
              );
            }

            return (
              <li key={item.name}>
                <Link href={item.href}>
                  <span 
                    className={cn(
                      "flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors cursor-pointer",
                      isActive 
                        ? "text-green-700 bg-green-50 border-l-4 border-green-700" 
                        : "text-gray-700 hover:text-green-700 hover:bg-green-50"
                    )}
                    onClick={handleClick}
                  >
                    <item.icon className="w-5 h-5 mr-3" />
                    {item.name}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Bottom Actions */}
      <div className="p-4 border-t border-gray-200">
        {isAuthenticatedPage && user ? (
          <div className="flex items-center justify-between">
            <Link href="/app/profile">
              <Button variant="ghost" size="sm" className="text-gray-600 hover:text-green-700">
                Settings
              </Button>
            </Link>
            <div className="flex items-center gap-1">
              <NotificationsBell />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  localStorage.removeItem("token");
                  localStorage.removeItem("userData");
                  window.location.href = "/";
                }}
                className="text-gray-600 hover:text-red-600"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ) : (
          <Button 
            onClick={() => window.location.href = '/apply'}
            className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white"
          >
            Apply Now
          </Button>
        )}
      </div>
    </aside>
  );

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Mobile overlay */}
      {isMobile && isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-gray-600 bg-opacity-75 z-40 lg:hidden"
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar */}
      <SidebarContent />

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile header with hamburger menu */}
        <header className="lg:hidden bg-white shadow-sm border-b border-gray-200 px-4 py-3">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsSidebarOpen(true)}
              className="text-gray-600"
            >
              <Menu className="w-6 h-6" />
            </Button>
            <div className="flex items-center space-x-2">
              <Logo className="w-8 h-8" />
            </div>
            <div className="w-10" /> {/* Spacer for centering */}
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}