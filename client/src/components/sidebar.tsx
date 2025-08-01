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
  UserPlus,
  Camera,
  Upload,
  ChevronDown
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { toast } from "@/hooks/use-toast";
import { Logo } from "@/components/logo";
import { PortalLoginModal } from "@/components/portal-login-modal";

const navigation = [
  { name: "Resources", href: "/app/resources", icon: Archive },
];

const newPortalNavigation = [
  { name: "Resident Portal", href: "/app/resident-portal", icon: Users, badge: "New" },
  { name: "Staff Dashboard", href: "/app/staff-dashboard", icon: BarChart3, badge: "New" },
  { name: "Admin Panel", href: "/app/admin-panel", icon: Settings, badge: "New" },
];

const avatarOptions = [
  { name: "Green Life House", url: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTAwIiBoZWlnaHQ9IjUwMCIgdmlld0JveD0iMCAwIDUwMCA1MDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI1MDAiIGhlaWdodD0iNTAwIiBmaWxsPSIjNDBCOTgzIi8+CjxwYXRoIGQ9Ik0xMTUgMjkzLjVIMzQzVjQyMkgxMTVWMjkzLjVaIiBmaWxsPSJ3aGl0ZSIvPgo8cGF0aCBkPSJNMTY2IDI5M1YzNDdIMjIyVjI5M0gxNjZaIiBmaWxsPSIjNDBCOTgzIi8+CjxwYXRoIGQ9Ik0xMTUgMjkzLjVMMjI5IDIwMEwzNDMgMjkzLjVIMjkzTDIyOSAyNDJMMTY1IDI5My41SDExNVoiIGZpbGw9IndoaXRlIi8+Cjx0ZXh0IHg9IjI1MCIgeT0iNDcwIiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iNjAiIGZvbnQtd2VpZ2h0PSJib2xkIiBmaWxsPSJ3aGl0ZSIgdGV4dC1hbmNob3I9Im1pZGRsZSI+bGlmZWhvdXNlPC90ZXh0Pgo8L3N2Zz4K" },
  { name: "Purple Life House", url: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTAwIiBoZWlnaHQ9IjUwMCIgdmlld0JveD0iMCAwIDUwMCA1MDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI1MDAiIGhlaWdodD0iNTAwIiBmaWxsPSIjOEM1Q0Y2Ii8+CjxwYXRoIGQ9Ik0xMTUgMjkzLjVIMzQzVjQyMkgxMTVWMjkzLjVaIiBmaWxsPSJ3aGl0ZSIvPgo8cGF0aCBkPSJNMTY2IDI5M1YzNDdIMjIyVjI5M0gxNjZaIiBmaWxsPSIjOEM1Q0Y2Ii8+CjxwYXRoIGQ9Ik0xMTUgMjkzLjVMMjI5IDIwMEwzNDMgMjkzLjVIMjkzTDIyOSAyNDJMMTY1IDI5My41SDExNVoiIGZpbGw9IndoaXRlIi8+Cjx0ZXh0IHg9IjI1MCIgeT0iNDcwIiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iNjAiIGZvbnQtd2VpZ2h0PSJib2xkIiBmaWxsPSJ3aGl0ZSIgdGV4dC1hbmNob3I9Im1pZGRsZSI+bGlmZWhvdXNlPC90ZXh0Pgo8L3N2Zz4K" },
  { name: "Blue Life House", url: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTAwIiBoZWlnaHQ9IjUwMCIgdmlld0JveD0iMCAwIDUwMCA1MDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI1MDAiIGhlaWdodD0iNTAwIiBmaWxsPSIjMzMzOUZGIi8+CjxwYXRoIGQ9Ik0xMTUgMjkzLjVIMzQzVjQyMkgxMTVWMjkzLjVaIiBmaWxsPSJ3aGl0ZSIvPgo8cGF0aCBkPSJNMTY2IDI5M1YzNDdIMjIyVjI5M0gxNjZaIiBmaWxsPSIjMzMzOUZGIi8+CjxwYXRoIGQ9Ik0xMTUgMjkzLjVMMjI5IDIwMEwzNDMgMjkzLjVIMjkzTDIyOSAyNDJMMTY1IDI5My41SDExNVoiIGZpbGw9IndoaXRlIi8+Cjx0ZXh0IHg9IjI1MCIgeT0iNDcwIiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iNjAiIGZvbnQtd2VpZ2h0PSJib2xkIiBmaWxsPSJ3aGl0ZSIgdGV4dC1hbmNob3I9Im1pZGRsZSI+bGlmZWhvdXNlPC90ZXh0Pgo8L3N2Zz4K" },
  { name: "Gradient Life House", url: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTAwIiBoZWlnaHQ9IjUwMCIgdmlld0JveD0iMCAwIDUwMCA1MDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxkZWZzPgo8bGluZWFyR3JhZGllbnQgaWQ9ImdyYWQiIHgxPSIwJSIgeTE9IjAlIiB4Mj0iMTAwJSIgeTI9IjEwMCUiPgo8c3RvcCBvZmZzZXQ9IjAlIiBzdG9wLWNvbG9yPSIjOEM1Q0Y2Ii8+CjxzdG9wIG9mZnNldD0iNTAlIiBzdG9wLWNvbG9yPSIjNDBCOTgzIi8+CjxzdG9wIG9mZnNldD0iMTAwJSIgc3RvcC1jb2xvcj0iIzMzMzlGRiIvPgo8L2xpbmVhckdyYWRpZW50Pgo8L2RlZnM+CjxyZWN0IHdpZHRoPSI1MDAiIGhlaWdodD0iNTAwIiBmaWxsPSJ1cmwoI2dyYWQpIi8+CjxwYXRoIGQ9Ik0xMTUgMjkzLjVIMzQzVjQyMkgxMTVWMjkzLjVaIiBmaWxsPSJ3aGl0ZSIvPgo8cGF0aCBkPSJNMTY2IDI5M1YzNDdIMjIyVjI5M0gxNjZaIiBmaWxsPSJ1cmwoI2dyYWQpIi8+CjxwYXRoIGQ9Ik0xMTUgMjkzLjVMMjI5IDIwMEwzNDMgMjkzLjVIMjkzTDIyOSAyNDJMMTY1IDI5My41SDExNVoiIGZpbGw9IndoaXRlIi8+Cjx0ZXh0IHg9IjI1MCIgeT0iNDcwIiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iNjAiIGZvbnQtd2VpZ2h0PSJib2xkIiBmaWxsPSJ3aGl0ZSIgdGV4dC1hbmNob3I9Im1pZGRsZSI+bGlmZWhvdXNlPC90ZXh0Pgo8L3N2Zz4K" },
  { name: "Purple Icon", url: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTAwIiBoZWlnaHQ9IjUwMCIgdmlld0JveD0iMCAwIDUwMCA1MDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI1MDAiIGhlaWdodD0iNTAwIiBmaWxsPSJ3aGl0ZSIvPgo8cGF0aCBkPSJNMTAwIDM2MEg0MDBWNDcwSDEwMFYzNjBaIiBmaWxsPSIjOEM1Q0Y2Ii8+CjxwYXRoIGQ9Ik0xNzAgMzYwVjQyMEgyNDBWMzYwSDE3MFoiIGZpbGw9IndoaXRlIi8+CjxwYXRoIGQ9Ik0xMDAgMzYwTDI1MCAyMDBMNDAwIDM2MEgzMzBMMjUwIDI4MEwxNzAgMzYwSDEwMFoiIGZpbGw9IiM4QzVDRjYiLz4KPHRleHQgeD0iMjUwIiB5PSI0ODAiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIzMCIgZm9udC13ZWlnaHQ9ImJvbGQiIGZpbGw9IiM0MEI5ODMiIHRleHQtYW5jaG9yPSJtaWRkbGUiPmxpZmU8L3RleHQ+Cjx0ZXh0IHg9IjI1MCIgeT0iNDkwIiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMzAiIGZvbnQtd2VpZ2h0PSJib2xkIiBmaWxsPSIjMzMzOUZGIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5ob3VzZTwvdGV4dD4KPC9zdmc+" }
];

export function Sidebar() {
  const [location] = useLocation();
  const { data: user, isLoading } = useCurrentUser();
  const [isUploading, setIsUploading] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [targetPortal, setTargetPortal] = useState<string | undefined>();
  
  // Helper function to check if user has required role for portal access
  const checkPortalAccess = (portalName: string, requiredRoles: string[]) => {
    if (!user) {
      setTargetPortal(portalName);
      setIsLoginModalOpen(true);
      return false;
    }
    
    const userRole = (user as any)?.role;
    
    // Special case for Resident Portal - only residents and admins can access
    if (portalName === "Resident Portal") {
      if (userRole !== "Resident" && userRole !== "Admin") {
        toast({
          title: "Access Denied",
          description: "You need Resident access to view the Resident Portal.",
          variant: "destructive",
        });
        return false;
      }
    }
    
    // Special case for Staff Dashboard - case managers, intake, and admins only
    if (portalName === "Staff Dashboard") {
      if (!["CaseManager", "Intake", "Admin"].includes(userRole)) {
        toast({
          title: "Access Denied", 
          description: "Only staff members can access the Staff Dashboard. Residents should use the Resident Portal.",
          variant: "destructive",
        });
        return false;
      }
    }
    
    // General role check for other portals
    if (!requiredRoles.includes(userRole)) {
      toast({
        title: "Access Denied",
        description: `You need ${requiredRoles.join(' or ')} access to view the ${portalName}.`,
        variant: "destructive",
      });
      return false;
    }
    
    return true;
  };

  // Portal access handler
  const handlePortalClick = (href: string, portalName: string, requiredRoles: string[]) => {
    const hasAccess = checkPortalAccess(portalName, requiredRoles);
    if (hasAccess) {
      window.location.href = href;
    }
  };
  
  // Don't render sidebar if user is not authenticated
  if (isLoading) {
    return (
      <aside className="w-64 bg-white shadow-lg border-r border-gray-200 flex flex-col">
        <div className="p-6 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </aside>
    );
  }

  if (!user) {
    return null;
  }
  
  // Upload mutations
  const uploadAvatarMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('avatar', file);
      
      const response = await fetch(`/api/users/${(user as any)?.id}/avatar`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken') || 'mock-token-1'}`,
        },
        body: formData,
      });
      if (!response.ok) throw new Error('Failed to upload avatar');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Avatar uploaded",
        description: "Your avatar has been successfully updated.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/users/me'] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to upload avatar. Please try again.",
        variant: "destructive",
      });
    },
    onSettled: () => setIsUploading(false),
  });

  const selectAvatarMutation = useMutation({
    mutationFn: async (avatarUrl: string) => {
      const response = await fetch(`/api/users/${(user as any)?.id}/avatar-preset`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken') || 'mock-token-1'}`,
        },
        body: JSON.stringify({ avatarUrl }),
      });
      if (!response.ok) throw new Error('Failed to set avatar');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Avatar updated",
        description: "Your avatar has been successfully updated.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/users/me'] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update avatar. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setIsUploading(true);
      uploadAvatarMutation.mutate(file);
    }
  };

  const handleAvatarSelect = (avatarUrl: string) => {
    selectAvatarMutation.mutate(avatarUrl);
  };

  // Filter navigation items based on user role
  const filteredNavigation = filterSidebarItems(navigation, (user as any)?.role);

  return (
    <aside className="w-64 bg-white shadow-lg border-r border-gray-200 flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <Logo className="w-10 h-10" />
        </div>
      </div>

      {/* User Profile */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="relative group">
            {(user as any)?.profileImage ? (
              <img 
                src={(user as any).profileImage} 
                alt={(user as any)?.name || 'User'} 
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-sm font-medium text-primary">
                  {(user as any)?.name?.charAt(0) || (user as any)?.email?.charAt(0) || 'U'}
                </span>
              </div>
            )}
            
            {/* Photo Upload Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  size="sm"
                  variant="ghost"
                  className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-primary text-white hover:bg-primary/90 opacity-0 group-hover:opacity-100 transition-opacity"
                  disabled={isUploading}
                >
                  <Camera className="w-3 h-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                {/* Upload Custom Photo */}
                <DropdownMenuItem asChild>
                  <label className="cursor-pointer flex items-center">
                    <Upload className="w-4 h-4 mr-2" />
                    {isUploading ? 'Uploading...' : 'Upload Photo'}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarChange}
                      className="hidden"
                      disabled={isUploading}
                    />
                  </label>
                </DropdownMenuItem>
                
                <DropdownMenuSeparator />
                
                {/* Preset Avatars */}
                {avatarOptions.map((avatar) => (
                  <DropdownMenuItem
                    key={avatar.name}
                    onClick={() => handleAvatarSelect(avatar.url)}
                    className="flex items-center"
                  >
                    <img 
                      src={avatar.url} 
                      alt={avatar.name}
                      className="w-4 h-4 mr-2 rounded-full"
                    />
                    {avatar.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          
          <div>
            <p className="text-sm font-medium text-gray-900">{(user as any)?.name || (user as any)?.email}</p>
            <p className="text-xs text-gray-500">Guest</p>
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
        {newPortalNavigation.length > 0 && (
          <div className="mt-8 pt-6 border-t border-gray-200">
            <div className="px-3 py-2">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Portal Features</p>
            </div>
            <ul className="mt-2 space-y-2">
            {newPortalNavigation.map((item) => {
              const isActive = location === item.href;
              
              // Define required roles for each portal
              const getRequiredRoles = (itemName: string) => {
                switch (itemName) {
                  case "Resident Portal":
                    return ["Resident", "Admin"];
                  case "Staff Dashboard":
                    return ["CaseManager", "Intake", "Admin"];
                  case "Admin Panel":
                    return ["Admin"];
                  default:
                    return [];
                }
              };
              
              const requiredRoles = getRequiredRoles(item.name);
              
              return (
                <li key={item.name}>
                  <button
                    onClick={() => handlePortalClick(item.href, item.name, requiredRoles)}
                    className={cn(
                      "w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors cursor-pointer text-left",
                      isActive 
                        ? "text-primary bg-primary/10" 
                        : "text-gray-700 hover:text-primary hover:bg-primary/5"
                    )}
                  >
                    <item.icon className="w-5 h-5 mr-3" />
                    {item.name}
                    {item.badge && (
                      <span className="ml-auto bg-green-100 text-green-700 text-xs font-medium px-2 py-0.5 rounded-full">
                        {item.badge}
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
        )}


      </nav>

      {/* User Profile */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="relative group">
            {(user as any)?.profileImage ? (
              <img 
                src={(user as any).profileImage} 
                alt={(user as any)?.name || 'User'} 
                className="w-8 h-8 rounded-full object-cover"
              />
            ) : (
              <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-gray-700">
                  {(user as any)?.name?.charAt(0) || (user as any)?.email?.charAt(0) || 'U'}
                </span>
              </div>
            )}
            
            {/* Photo Upload Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  size="sm"
                  variant="ghost"
                  className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-primary text-white hover:bg-primary/90 opacity-0 group-hover:opacity-100 transition-opacity"
                  disabled={isUploading}
                >
                  <Camera className="w-2.5 h-2.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                {/* Upload Custom Photo */}
                <DropdownMenuItem asChild>
                  <label className="cursor-pointer flex items-center">
                    <Upload className="w-4 h-4 mr-2" />
                    {isUploading ? 'Uploading...' : 'Upload Photo'}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarChange}
                      className="hidden"
                      disabled={isUploading}
                    />
                  </label>
                </DropdownMenuItem>
                
                <DropdownMenuSeparator />
                
                {/* Preset Avatars */}
                {avatarOptions.map((avatar) => (
                  <DropdownMenuItem
                    key={avatar.name}
                    onClick={() => handleAvatarSelect(avatar.url)}
                    className="flex items-center"
                  >
                    <img 
                      src={avatar.url} 
                      alt={avatar.name}
                      className="w-4 h-4 mr-2 rounded-full"
                    />
                    {avatar.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">Guest User</p>
            <p className="text-xs text-gray-500 truncate">{(user as any)?.role}</p>
          </div>
          <button 
            onClick={() => {
              localStorage.removeItem("token");
              localStorage.removeItem("userRole");
              queryClient.clear();
              window.location.href = "/";
            }}
            className="text-gray-400 hover:text-gray-600"
            title="Logout"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
      
      {/* Portal Login Modal */}
      <PortalLoginModal 
        isOpen={isLoginModalOpen} 
        onClose={() => {
          setIsLoginModalOpen(false);
          setTargetPortal(undefined);
        }}
        targetPortal={targetPortal}
      />
    </aside>
  );
}
