
import { ReactNode, useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Search,
  Calendar,
  CalendarCheck,
  CreditCard,
  BookOpen,
  ClipboardList,
  MessageSquare,
  Menu,
  Video,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";

import { useAuth } from "@/contexts/AuthContext";
import NotificationBell from "@/components/NotificationBell";
import { useMediaQuery } from "@/hooks/use-media-query";
import { useToast } from "@/hooks/use-toast";

interface ParentDashboardLayoutProps {
  children: ReactNode;
}

const navItems = [
  { href: "/parent-dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/parent-dashboard/children", label: "My Children", icon: Users },
  { href: "/parent-dashboard/find-tutors", label: "Find Tutors", icon: Search },
  { href: "/parent-dashboard/demo-requests", label: "Demo Requests", icon: Calendar },
  { href: "/parent-dashboard/bookings", label: "My Bookings", icon: CalendarCheck },
  { href: "/parent-dashboard/credits", label: "Credits", icon: CreditCard },
  { href: "/parent-dashboard/enrolled-classes", label: "Enrolled Classes", icon: BookOpen },
  { href: "/parent-dashboard/batches", label: "Browse Classes", icon: Search },
  { href: "/parent-dashboard/my-batches", label: "My Group Classes", icon: Users },
  { href: "/parent-dashboard/recordings", label: "Recordings", icon: Video },
  { href: "/parent-dashboard/assessments", label: "Assessments", icon: ClipboardList },
];

const ParentDashboardLayout = ({ children }: ParentDashboardLayoutProps) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const isMobile = useMediaQuery("(max-width: 768px)");
  const [isSidebarOpen, setIsSidebarOpen] = useState(!isMobile);

  useEffect(() => {
    if (isMobile) {
      setIsSidebarOpen(false);
    } else {
      setIsSidebarOpen(true);
    }
  }, [location, isMobile]);

  const handleLogout = () => {
    toast({
      title: "Logging out",
      description: "You have been logged out successfully.",
    });
    logout();
    navigate("/");
  };

  const isActiveRoute = (path: string) => {
    if (path === "/parent-dashboard") {
      return location.pathname === path;
    }
    // Exact match for Browse Classes to avoid highlighting on /batches/:id
    if (path === "/parent-dashboard/batches") {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  if (!user || user.role !== "parent") {
    navigate("/auth/login");
    return null;
  }

  const skipToContent = () => {
    const content = document.getElementById("main-content");
    if (content) { content.focus(); content.scrollIntoView(); }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Accessibility skip link */}
      <a
        href="#main-content"
        onClick={skipToContent}
        className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:bg-primary focus:text-white focus:p-4 focus:m-2 focus:rounded-md"
      >
        Skip to content
      </a>

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-40 h-16 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-16 items-center px-4 md:px-6">
          <Link to="/" className="flex items-center mr-4">
            <div className="relative h-10 w-40">
              <img src="/indu.png" alt="Indu AE Logo" className="h-full object-contain" />
            </div>
          </Link>

          <div className="ml-auto flex items-center gap-4">
            <NotificationBell />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8 border border-indigo-200">
                    <AvatarImage src={user?.avatar} alt={user?.fullName} />
                    <AvatarFallback className="bg-indigo-600 text-white">{user?.fullName.charAt(0)}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user?.fullName}</p>
                    <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild className="cursor-pointer">
                  <Link to="/parent-dashboard/settings">Settings</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-12 min-h-[calc(100vh-4rem)] pt-16">
        {/* Desktop Sidebar */}
        <aside className={`hidden md:block ${isSidebarOpen ? "col-span-2" : "col-span-1"} transition-all duration-300 border-r bg-background`}>
          <div className="flex flex-col h-full p-2 gap-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all ${
                  isActiveRoute(item.href)
                    ? item.href === "/parent-dashboard" && location.pathname === "/parent-dashboard"
                      ? "bg-indigo-600 text-white font-medium"
                      : item.href !== "/parent-dashboard" && isActiveRoute(item.href)
                      ? "bg-indigo-100 text-indigo-600 font-medium"
                      : "text-muted-foreground hover:bg-indigo-100 hover:text-indigo-600"
                    : "text-muted-foreground hover:bg-indigo-100 hover:text-indigo-600"
                }`}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                {isSidebarOpen && (
                  <span className="truncate">{item.label}</span>
                )}
              </Link>
            ))}

            <div className="mt-auto pt-4" />
          </div>
        </aside>

        {/* Mobile Sidebar */}
        {isMobile && (
          <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="md:hidden fixed bottom-4 right-4 z-50 rounded-full shadow-lg">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[240px]">
              <SheetHeader>
                <SheetTitle className="text-indigo-600">Parent Dashboard</SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col gap-2 mt-6">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    to={item.href}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all ${
                      isActiveRoute(item.href)
                        ? "bg-indigo-100 text-indigo-600 font-medium"
                        : "text-muted-foreground hover:bg-indigo-100 hover:text-indigo-600"
                    }`}
                    onClick={() => setIsSidebarOpen(false)}
                  >
                    <item.icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </Link>
                ))}
              </nav>
            </SheetContent>
          </Sheet>
        )}

        {/* Main Content */}
        <main
          className={`${isSidebarOpen ? "col-span-12 md:col-span-10" : "col-span-12 md:col-span-11"} transition-all duration-300 overflow-auto p-4 md:p-6 bg-[#f8fafc]`}
        >
          {children}
        </main>
      </div>
    </div>
  );
};

export default ParentDashboardLayout;
