
import { useState, useEffect } from "react";
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  BookOpen,
  GraduationCap,
  CreditCard,
  BarChart3,
  MessageSquare,
  Bell,
  LogOut,
  Menu,
  HelpCircle,
  FileText,
  Video,
  ClipboardList,
  CalendarCheck,
  Star,
  DollarSign,
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
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/contexts/AuthContext";
import NotificationBell from "@/components/NotificationBell";
import { useMediaQuery } from "@/hooks/use-media-query";
import { useToast } from "@/hooks/use-toast";
import { adminApplicationService } from "@/services/application.service";

const navItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/applications", label: "Applications", icon: ClipboardList },
  { href: "/admin/users", label: "User Management", icon: Users },
  { href: "/admin/tutors", label: "Tutor Management", icon: GraduationCap },
  { href: "/admin/classes", label: "Course Management", icon: BookOpen },
  { href: "/admin/demo-requests", label: "Demo Requests", icon: FileText },
  { href: "/admin/demo-bookings", label: "Demo Bookings", icon: Video },
  { href: "/admin/enrollments", label: "Enrollments", icon: CalendarCheck },
  { href: "/admin/batches", label: "Batch Classes", icon: ClipboardList },
  { href: "/admin/payments", label: "Credits & Wallets", icon: CreditCard },
  { href: "/admin/assessment-results", label: "Assessments", icon: ClipboardList },
  { href: "/admin/reviews", label: "Reviews", icon: Star },
  { href: "/admin/earnings", label: "Earnings & Payouts", icon: DollarSign },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/admin/notifications", label: "Notifications", icon: Bell },
];

const AdminLayout = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const isMobile = useMediaQuery("(max-width: 768px)");
  const [isSidebarOpen, setIsSidebarOpen] = useState(!isMobile);
  const [pendingAppsCount, setPendingAppsCount] = useState(0);

  useEffect(() => {
    adminApplicationService.list({ status: "PENDING", limit: 1 })
      .then((res) => setPendingAppsCount(res.meta.total))
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
    if (path === "/admin") {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  const skipToContent = () => {
    const content = document.getElementById("main-content");
    if (content) {
      content.focus();
      content.scrollIntoView();
    }
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
            <Badge variant="secondary" className="bg-gray-800 text-white text-[10px] hover:bg-gray-800">
              Admin
            </Badge>
          </div>

          <div className="ml-auto flex items-center gap-4">
            <NotificationBell />

            {/* Avatar Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8 border border-gray-300">
                    <AvatarImage src={user?.avatar} alt={user?.fullName} />
                    <AvatarFallback className="bg-gray-700 text-white">
                      {user?.fullName?.charAt(0) || "A"}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user?.fullName || "Admin"}</p>
                    <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild className="cursor-pointer">
                  <Link to="/admin/settings">Settings</Link>
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
        <aside className={`hidden md:block ${isSidebarOpen ? "col-span-2 lg:col-span-2 xl:col-span-2" : "col-span-1"} transition-all duration-300 border-r bg-background`}>
          <div className="flex flex-col h-full p-2 gap-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all ${
                  item.href === "/admin"
                    ? location.pathname === item.href
                      ? "bg-gray-800 text-white font-medium"
                      : "text-muted-foreground hover:bg-gray-100 hover:text-gray-800"
                    : isActiveRoute(item.href)
                    ? "bg-gray-100 text-gray-800 font-medium"
                    : "text-muted-foreground hover:bg-gray-100 hover:text-gray-800"
                }`}
                aria-current={isActiveRoute(item.href) ? "page" : undefined}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                {isSidebarOpen && (
                  <>
                    <span className="truncate">{item.label}</span>
                    {item.href === "/admin/applications" && pendingAppsCount > 0 && (
                      <Badge className="ml-auto text-xs bg-gray-200 text-gray-700">
                        {pendingAppsCount}
                      </Badge>
                    )}
                  </>
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
                <SheetTitle className="text-gray-800">Admin Menu</SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col gap-2 mt-6">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    to={item.href}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all ${
                      isActiveRoute(item.href)
                        ? "bg-gray-100 text-gray-800 font-medium"
                        : "text-muted-foreground hover:bg-gray-100 hover:text-gray-800"
                    }`}
                    onClick={() => setIsSidebarOpen(false)}
                  >
                    <item.icon className="h-4 w-4" />
                    <span>{item.label}</span>
                    {item.href === "/admin/applications" && pendingAppsCount > 0 && (
                      <Badge className="ml-auto text-xs bg-gray-200 text-gray-700">
                        {pendingAppsCount}
                      </Badge>
                    )}
                  </Link>
                ))}
              </nav>
            </SheetContent>
          </Sheet>
        )}

        {/* Main Content */}
        <main
          id="main-content"
          tabIndex={-1}
          className={`${isSidebarOpen ? "col-span-12 md:col-span-10 lg:col-span-10 xl:col-span-10" : "col-span-12 md:col-span-11"} transition-all duration-300 overflow-auto bg-[#f8fafc]`}
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
