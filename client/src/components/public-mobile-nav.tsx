import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Menu, X, Home, FileText, Phone, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/logo";

interface PublicMobileNavProps {
  children: React.ReactNode;
}

export function PublicMobileNav({ children }: PublicMobileNavProps) {
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
      
      // Only trigger swipe if starting from left edge (within 30px)
      if (startX <= 30) {
        isSwipeGesture = true;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isMobile || !isSwipeGesture) return;
      
      const touch = e.touches[0];
      const deltaX = touch.clientX - startX;
      const deltaY = Math.abs(touch.clientY - startY);
      
      // Check if swipe is horizontal and from left edge
      if (deltaX > 50 && deltaY < 100) {
        setIsSidebarOpen(true);
        isSwipeGesture = false;
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
  }, [isMobile]);

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  const publicNavigation = [
    { name: "Home", href: "/", icon: Home },
    { name: "About", href: "/#about", icon: Users },
    { name: "Programs", href: "/#programs", icon: FileText },
    { name: "Resources", href: "/resources", icon: FileText },
    { name: "Contact", href: "/#contact", icon: Phone },
  ];

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
            onClick={() => {
              window.location.href = '/';
              closeSidebar();
            }}
          >
            <Logo className="h-8" />
            <div>
              <h1 className="text-lg font-semibold text-gray-900">Life House</h1>
              <p className="text-sm text-gray-500">Community Resources</p>
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

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-4">
        <ul className="space-y-2">
          {publicNavigation.map((item) => (
            <li key={item.name}>
              <a
                href={item.href}
                onClick={closeSidebar}
                className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 hover:text-green-700 hover:bg-green-50 rounded-lg transition-colors cursor-pointer"
              >
                <item.icon className="w-5 h-5 mr-3" />
                {item.name}
              </a>
            </li>
          ))}
        </ul>

        {/* Call-to-Action Section */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <div className="space-y-3">
            <Button 
              onClick={() => {
                window.location.href = '/#apply';
                closeSidebar();
              }}
              className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white"
            >
              Apply for Housing
            </Button>
            <Button 
              variant="outline"
              onClick={() => {
                window.location.href = '/app';
                closeSidebar();
              }}
              className="w-full border-green-600 text-green-600 hover:bg-green-50"
            >
              Portal Login
            </Button>
          </div>
        </div>
      </nav>
    </aside>
  );

  // For desktop, just return children without sidebar
  if (!isMobile) {
    return <>{children}</>;
  }

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
              <Logo className="h-6" />
              <span className="text-lg font-semibold text-gray-900">Life House</span>
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