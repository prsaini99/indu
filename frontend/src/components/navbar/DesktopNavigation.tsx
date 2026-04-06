
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';
import { primaryNavItems } from './NavigationData';
import { useAuth } from '@/contexts/AuthContext';

const DesktopNavigation = () => {
  const { isAuthenticated, user, logout } = useAuth();

  const dashboardUrl =
    user?.role === "tutor" ? "/tutor-dashboard" :
    user?.role === "consultant" ? "/consultant-dashboard" :
    user?.role === "parent" ? "/parent-dashboard" :
    "/student-dashboard";

  return (
    <>
      <nav className="hidden md:flex items-center space-x-1">
        {primaryNavItems.map((item) => (
          <Link
            key={item.href}
            to={item.href}
            className="px-3 py-2 text-sm font-medium text-talent-dark hover:text-talent-primary transition-colors rounded-md hover:bg-gray-50"
          >
            {item.title}
          </Link>
        ))}
      </nav>

      <div className="hidden md:flex items-center gap-3">
        {isAuthenticated ? (
          <>
            <Button className="bg-talent-primary hover:bg-talent-secondary text-white font-medium transition-all" asChild>
              <Link to={dashboardUrl}>Go to Dashboard</Link>
            </Button>
            <Button
              variant="outline"
              onClick={logout}
              className="font-medium border-talent-primary text-talent-primary hover:bg-talent-primary/10"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Log Out
            </Button>
          </>
        ) : (
          <>
            <Button variant="ghost" className="font-medium" asChild>
              <Link to="/auth/login">Log In</Link>
            </Button>
            <Button className="bg-talent-primary hover:bg-talent-secondary text-white font-medium transition-all" asChild>
              <Link to="/auth/signup">Sign Up Free</Link>
            </Button>
          </>
        )}
      </div>
    </>
  );
};

export default DesktopNavigation;
