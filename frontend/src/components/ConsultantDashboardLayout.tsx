
import { ReactNode, useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  ClipboardList,
  UserCheck,
  MessageSquare,
  Star,
  BarChart,
  Menu,
  HelpCircle,
  Bell,
  Calendar,
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
  SheetTrigger
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";

import { useAuth } from "@/contexts/AuthContext";
import NotificationBell from "@/components/NotificationBell";
import { useMediaQuery } from "@/hooks/use-media-query";
import { useToast } from "@/hooks/use-toast";
import { consultantDemoService } from "@/services/demoRequest.service";

interface ConsultantDashboardLayoutProps {
  children: ReactNode;
}

const navItems = [
  { href: "/consultant-dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/consultant-dashboard/demo-requests", label: "Demo Requests", icon: ClipboardList },
  { href: "/consultant-dashboard/demo-bookings", label: "Demo Bookings", icon: Calendar },
  { href: "/consultant-dashboard/allocations", label: "Allocations", icon: UserCheck },
  { href: "/consultant-dashboard/earnings", label: "Earnings", icon: BarChart },
  { href: "/consultant-dashboard/feedback", label: "Feedback", icon: Star },
];

const ConsultantDashboardLayout = ({ children }: ConsultantDashboardLayoutProps) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const isMobile = useMediaQuery("(max-width: 768px)");
  const [isSidebarOpen, setIsSidebarOpen] = useState(!isMobile);
  const [pendingDemoCount, setPendingDemoCount] = useState(0);

  useEffect(() => {
    consultantDemoService.list({ status: "PENDING", limit: 1 })
      .then((res) => setPendingDemoCount(res.meta.total))
      .catch(() => {});
  }, [location.pathname]);

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
    if (path === "/consultant-dashboard") {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  if (!user || user.role !== "consultant") {
    navigate("/auth/login");
    return null;
  }

  const skipToContent = () => {
    const content = document.getElementById("main-content");
    if (content) {
      content.focus();
      content.scrollIntoView();
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <a
        href="#main-content"
        onClick={skipToContent}
        className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:bg-primary focus:text-white focus:p-4 focus:m-2 focus:rounded-md"
      >
        Skip to content
      </a>

      <header className="fixed top-0 left-0 right-0 z-40 h-16 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-16 items-center px-4 md:px-6">
          <div className="flex items-center">
            <Link to="/" className="flex items-center mr-4">
              <div className="relative h-10 w-40">
                <img
                  src="/indu.png"
                  alt="Indu AE Logo"
                  className="h-full object-contain"
                />
              </div>
            </Link>
          </div>

          <div className="ml-auto flex items-center gap-4">
            <NotificationBell />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8 border border-teal-200">
                    <AvatarImage src={user?.avatar} alt={user?.fullName} />
                    <AvatarFallback className="bg-teal-600 text-white">{user?.fullName.charAt(0)}</AvatarFallback>
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
                  <Link to="/consultant-dashboard/settings">Settings</Link>
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
        <aside className={`hidden md:block ${isSidebarOpen ? 'col-span-2 lg:col-span-2 xl:col-span-2' : 'col-span-1'} transition-all duration-300 border-r bg-background`}>
          <div className="flex flex-col h-full p-2 gap-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all ${
                  item.href === "/consultant-dashboard"
                    ? location.pathname === item.href
                      ? "bg-teal-600 text-white font-medium"
                      : "text-muted-foreground hover:bg-teal-100 hover:text-teal-600"
                    : isActiveRoute(item.href)
                    ? "bg-teal-100 text-teal-600 font-medium"
                    : "text-muted-foreground hover:bg-teal-100 hover:text-teal-600"
                }`}
                aria-current={isActiveRoute(item.href) ? "page" : undefined}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                {isSidebarOpen && (
                  <>
                    <span className="truncate">{item.label}</span>
                    {item.href === "/consultant-dashboard/demo-requests" && pendingDemoCount > 0 && (
                      <Badge className="ml-auto text-xs bg-teal-200 text-teal-700" variant="secondary">
                        {pendingDemoCount}
                      </Badge>
                    )}
                  </>
                )}
              </Link>
            ))}

            <div className="mt-auto pt-4" />
          </div>
        </aside>

        {isMobile && (
          <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="md:hidden fixed bottom-4 right-4 z-50 rounded-full shadow-lg">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[240px]">
              <SheetHeader>
                <SheetTitle className="text-teal-600">Dashboard Menu</SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col gap-2 mt-6">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    to={item.href}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all ${
                      isActiveRoute(item.href)
                        ? "bg-teal-100 text-teal-600 font-medium"
                        : "text-muted-foreground hover:bg-teal-100 hover:text-teal-600"
                    }`}
                    onClick={() => setIsSidebarOpen(false)}
                  >
                    <item.icon className="h-4 w-4" />
                    <span>{item.label}</span>
                    {item.href === "/consultant-dashboard/demo-requests" && pendingDemoCount > 0 && (
                      <Badge className="ml-auto text-xs bg-teal-200 text-teal-700" variant="secondary">
                        {pendingDemoCount}
                      </Badge>
                    )}
                  </Link>
                ))}
              </nav>
            </SheetContent>
          </Sheet>
        )}

        <main id="main-content" tabIndex={-1} className={`${isSidebarOpen ? 'col-span-12 md:col-span-10 lg:col-span-10 xl:col-span-10' : 'col-span-12 md:col-span-11'} transition-all duration-300 overflow-auto p-4 md:p-6 bg-[#f8fafc]`}>
          {children}
        </main>
      </div>
    </div>
  );
};

export default ConsultantDashboardLayout;
