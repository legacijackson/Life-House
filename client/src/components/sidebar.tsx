import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { useCurrentUser, filterSidebarItems } from "@/lib/rbac";
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
  UserPlus
} from "lucide-react";
import { Logo } from "@/components/logo";

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

export function Sidebar() {
  const [location] = useLocation();
  const { data: user, isLoading } = useCurrentUser();
  
  // Filter navigation items based on user role
  const filteredNavigation = user ? filterSidebarItems(navigation, user.role) : [];
  const filteredPortalNavigation = user ? filterSidebarItems(newPortalNavigation, user.role) : [];

  return (
    <aside className="w-64 bg-white shadow-lg border-r border-gray-200 flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <Logo className="w-10 h-10" />
          <div>
            <h1 className="text-lg font-semibold text-gray-900">Life House Reentry</h1>
            <p className="text-sm text-gray-500">← Back to Home</p>
          </div>
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
            <p className="text-sm font-medium text-gray-900">{user?.name || 'Loading...'}</p>
            <p className="text-xs text-gray-500">{user?.role || 'Loading...'}</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-4">
        <ul className="space-y-2">
          {filteredNavigation.map((item) => {
            const isActive = location === item.href;
            return (
              <li key={item.name}>
                <Link href={item.href}>
                  <span className={cn(
                    "flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors cursor-pointer",
                    isActive 
                      ? "text-primary bg-primary/10" 
                      : "text-gray-700 hover:text-primary hover:bg-primary/5"
                  )}>
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
        {filteredPortalNavigation.length > 0 && (
          <div className="mt-8 pt-6 border-t border-gray-200">
            <div className="px-3 py-2">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Portal Features</p>
            </div>
            <ul className="mt-2 space-y-2">
            {filteredPortalNavigation.map((item) => {
              const isActive = location === item.href;
              return (
                <li key={item.name}>
                  <Link href={item.href}>
                    <span className={cn(
                      "flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors cursor-pointer",
                      isActive 
                        ? "text-primary bg-primary/10" 
                        : "text-gray-700 hover:text-primary hover:bg-primary/5"
                    )}>
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
        )}

        {/* AI Assistant Section */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="px-3 py-2">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">AI Assistant</p>
          </div>
          <ul className="mt-2 space-y-1">
            <li>
              <Link href="/ai-assistant">
                <span className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 hover:text-primary hover:bg-primary/5 rounded-lg transition-colors cursor-pointer">
                  <MessageSquare className="w-5 h-5 mr-3" />
                  AI Notes Helper
                </span>
              </Link>
            </li>
          </ul>
        </div>
      </nav>

      {/* User Profile */}
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
}
