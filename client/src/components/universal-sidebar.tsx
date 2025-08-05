import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useCurrentUser } from "@/lib/rbac";
import { Logo } from "@/components/logo";
import { 
  Home,
  Users,
  Archive,
  Heart,
  FileText,
  DollarSign,
  Building,
  Settings,
  BarChart3,
  Menu,
  X,
  ExternalLink,
  Phone,
  MessageSquare,
  Calendar,
  UserPlus,
  LogOut
} from "lucide-react";

// Define navigation for different contexts
const publicNavigation = [
  { name: "Home", href: "/", icon: Home },
  { name: "Resources", href: "/guest-resources", icon: Archive },
  { name: "Apply", href: "/apply", icon: FileText },
  { name: "Refer", href: "/refer", icon: Users },
  { name: "Donate", href: "/donate", icon: Heart },
  { name: "Contact", href: "#contact", icon: Phone },
];

// Resident navigation
const residentNavigation = [
  { name: "Dashboard", href: "/app/resident-portal", icon: Home },
  { name: "Resources", href: "/app/resources", icon: Archive },
  { name: "Maintenance", href: "/app/maintenance", icon: Building },
  { name: "Check-in", href: "/app/check-in", icon: Calendar },
  { name: "Messages", href: "/app/messages", icon: MessageSquare },
];

// Case Worker (Staff) navigation
const caseWorkerNavigation = [
  { name: "Staff Dashboard", href: "/app/staff-dashboard", icon: Home },
  { name: "Intake & Referrals", href: "/app/intake-referrals", icon: UserPlus },
  { name: "My Residents", href: "/app/residents", icon: Users },
  { name: "Case Notes", href: "/app/case-notes", icon: FileText },
  { name: "Attendance", href: "/app/attendance", icon: Calendar },
  { name: "Resources", href: "/app/resources", icon: Archive },
  { name: "Maintenance", href: "/app/maintenance", icon: Building },
  { name: "Reports", href: "/app/reports", icon: BarChart3 },
];

// Admin navigation
const adminNavigation = [
  { name: "Admin Dashboard", href: "/app/admin-panel", icon: Home },
  { name: "Intake & Referrals", href: "/app/intake-referrals", icon: UserPlus },
  { name: "My Residents", href: "/app/residents", icon: Users },
  { name: "Case Notes", href: "/app/case-notes", icon: FileText },
  { name: "Attendance", href: "/app/attendance", icon: Calendar },
  { name: "Resources", href: "/app/resources", icon: Archive },
  { name: "Properties", href: "/app/properties", icon: Building },
  { name: "Maintenance", href: "/app/maintenance", icon: Building },
  { name: "Reports", href: "/app/reports", icon: BarChart3 },
  { name: "CRM", href: "/app/crm", icon: Users },
  { name: "DONOR", href: "/app/donor", icon: DollarSign },
];

interface UniversalSidebarProps {
  children: React.ReactNode;
}

export function UniversalSidebar({ children }: UniversalSidebarProps) {
  const [location] = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const { data: user, isLoading } = useCurrentUser();

  // Determine if we're on an authenticated page
  const isAuthenticatedPage = location.startsWith('/app');
  
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
    switch (userRole) {
      case 'Admin':
        navigation = adminNavigation;
        break;
      case 'CaseManager':
      case 'Intake':
        navigation = caseWorkerNavigation;
        break;
      case 'Resident':
        navigation = residentNavigation;
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
                  {(user as any)?.name?.charAt(0) || (user as any)?.email?.charAt(0) || 'U'}
                </span>
              )}
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">
                {(user as any)?.name || (user as any)?.email}
              </p>
              <p className="text-xs text-gray-500">{(user as any)?.role || 'User'}</p>
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

        {/* Portal Access for Authenticated Users */}
        {isAuthenticatedPage && user && (
          <div className="mt-8 pt-6 border-t border-gray-200">
            <div className="px-3 py-2">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Portal Features</p>
            </div>
            <ul className="mt-2 space-y-2">
              <li>
                <Link href="/app/resident-portal">
                  <span 
                    className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 hover:text-green-700 hover:bg-green-50 rounded-lg transition-colors cursor-pointer"
                    onClick={isMobile ? closeSidebar : undefined}
                  >
                    <Users className="w-5 h-5 mr-3" />
                    Resident Portal
                  </span>
                </Link>
              </li>
              <li>
                <Link href="/app/staff-dashboard">
                  <span 
                    className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 hover:text-green-700 hover:bg-green-50 rounded-lg transition-colors cursor-pointer"
                    onClick={isMobile ? closeSidebar : undefined}
                  >
                    <BarChart3 className="w-5 h-5 mr-3" />
                    Staff Dashboard
                  </span>
                </Link>
              </li>
            </ul>
          </div>
        )}
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
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => {
                localStorage.removeItem("token");
                localStorage.removeItem("userRole");
                window.location.href = "/";
              }}
              className="text-gray-600 hover:text-red-600"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            <Button 
              onClick={() => window.location.href = '/apply'}
              className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white"
            >
              Apply Now
            </Button>
            <Button 
              variant="outline"
              onClick={() => window.location.href = '/app'}
              className="w-full border-green-600 text-green-600 hover:bg-green-50"
            >
              Staff Login
            </Button>
          </div>
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