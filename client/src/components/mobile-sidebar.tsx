import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { 
  LayoutDashboard,
  Users,
  FileText,
  Calendar,
  Archive,
  Building,
  Settings,
  BarChart3,
  MessageSquare,
  LogOut,
  UserPlus,
  Menu,
  X
} from "lucide-react";

const navigation = [
  { name: "Dashboard", href: "/app", icon: LayoutDashboard },
  { name: "Intake & Referrals", href: "/app/intake", icon: UserPlus, badge: "5" },
  { name: "My Residents", href: "/app/residents", icon: Users, badge: "12" },
  { name: "Case Notes", href: "/app/case-notes", icon: FileText },
  { name: "Attendance", href: "/app/attendance", icon: Calendar },
  { name: "Resources", href: "/app/resources", icon: Archive },
  { name: "Properties", href: "/app/properties", icon: Building },
  { name: "Maintenance", href: "/app/maintenance", icon: Settings, badge: "3" },
  { name: "Reports", href: "/app/reports", icon: BarChart3 },
];

const newPortalNavigation = [
  { name: "Resident Portal", href: "/app/resident-portal", icon: Users, badge: "New" },
  { name: "Staff Dashboard", href: "/app/staff-dashboard", icon: BarChart3, badge: "New" },
  { name: "Admin Panel", href: "/app/admin-panel", icon: Settings, badge: "New" },
];

interface MobileSidebarProps {
  children: React.ReactNode;
}

export function MobileSidebar({ children }: MobileSidebarProps) {
  const [location] = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

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

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

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
          <div 
            className="flex items-center space-x-3 cursor-pointer hover:bg-gray-50 rounded-lg p-2 -m-2 transition-colors"
            onClick={() => window.location.href = '/'}
          >
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#2E6F40' }}>
              <Building className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">Life House Portal</h1>
              <p className="text-sm text-gray-500">← Back to Home</p>
            </div>
          </div>
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

      {/* User Profile */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full overflow-hidden">
            <img 
              src="https://images.pexels.com/photos/6150527/pexels-photo-6150527.jpeg?auto=compress&cs=tinysrgb&w=100"
              alt="Case manager profile"
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">Sarah Williams</p>
            <p className="text-xs text-gray-500">Senior Case Manager</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-4">
        <ul className="space-y-2">
          {navigation.map((item) => {
            const isActive = location === item.href;
            return (
              <li key={item.name}>
                <Link href={item.href}>
                  <span 
                    className={cn(
                      "flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors cursor-pointer",
                      isActive 
                        ? "text-primary bg-primary/10" 
                        : "text-gray-700 hover:text-primary hover:bg-primary/5"
                    )}
                    onClick={isMobile ? closeSidebar : undefined}
                  >
                    <item.icon className="w-5 h-5 mr-3" />
                    {item.name}
                    {item.badge && (
                      <span className="ml-auto bg-primary/10 text-primary text-xs font-medium px-2 py-0.5 rounded-full">
                        {item.badge}
                      </span>
                    )}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>

        {/* New Portal Features */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <div className="px-3 py-2">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Portal Features</p>
          </div>
          <ul className="mt-2 space-y-2">
            {newPortalNavigation.map((item) => {
              const isActive = location === item.href;
              return (
                <li key={item.name}>
                  <Link href={item.href}>
                    <span 
                      className={cn(
                        "flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors cursor-pointer",
                        isActive 
                          ? "text-primary bg-primary/10" 
                          : "text-gray-700 hover:text-primary hover:bg-primary/5"
                      )}
                      onClick={isMobile ? closeSidebar : undefined}
                    >
                      <item.icon className="w-5 h-5 mr-3" />
                      {item.name}
                      {item.badge && (
                        <span className="ml-auto bg-green-100 text-green-700 text-xs font-medium px-2 py-0.5 rounded-full">
                          {item.badge}
                        </span>
                      )}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>

        {/* AI Assistant Section */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="px-3 py-2">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">AI Assistant</p>
          </div>
          <ul className="mt-2 space-y-1">
            <li>
              <Link href="/ai-assistant">
                <span 
                  className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 hover:text-primary hover:bg-primary/5 rounded-lg transition-colors cursor-pointer"
                  onClick={isMobile ? closeSidebar : undefined}
                >
                  <MessageSquare className="w-5 h-5 mr-3" />
                  AI Notes Helper
                </span>
              </Link>
            </li>
          </ul>
        </div>
      </nav>

      {/* User Profile Bottom */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
            <span className="text-sm font-medium text-gray-700">SM</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">Sarah Martinez</p>
            <p className="text-xs text-gray-500 truncate">Case Manager</p>
          </div>
          <button className="text-gray-400 hover:text-gray-600">
            <LogOut className="w-5 h-5" />
          </button>
        </div>
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
              <div className="w-6 h-6 rounded bg-green-700 flex items-center justify-center">
                <Building className="w-4 h-4 text-white" />
              </div>
              <span className="text-lg font-semibold text-gray-900">Life House Portal</span>
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