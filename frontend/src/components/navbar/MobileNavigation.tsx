
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { primaryNavItems } from './NavigationData';
import { useAuth } from '@/contexts/AuthContext';

interface MobileNavigationProps {
  isMenuOpen: boolean;
}

const MobileNavigation = ({ isMenuOpen }: MobileNavigationProps) => {
  const { isAuthenticated, user } = useAuth();

  const dashboardUrl =
    user?.role === "tutor" ? "/tutor-dashboard" :
    user?.role === "consultant" ? "/consultant-dashboard" :
    user?.role === "parent" ? "/parent-dashboard" :
    "/student-dashboard";

  if (!isMenuOpen) return null;

  return (
    <div
      className="md:hidden fixed inset-x-0 top-16 z-50 bg-white shadow-lg animate-fade-in max-h-[calc(100vh-4rem)] overflow-y-auto"
      style={{ backdropFilter: 'blur(10px)' }}
    >
      <div className="flex flex-col space-y-1 p-4">
        {primaryNavItems.map((item) => (
          <Link
            key={item.href}
            to={item.href}
            className="block py-3 px-2 text-base font-medium text-talent-dark hover:text-talent-primary hover:bg-gray-50 rounded-md transition-colors border-b border-gray-100"
          >
            {item.title}
          </Link>
        ))}

        <div className="pt-4 flex flex-col gap-2">
          {isAuthenticated ? (
            <Button className="w-full justify-center bg-talent-primary hover:bg-talent-secondary" asChild>
              <Link to={dashboardUrl}>Go to Dashboard</Link>
            </Button>
          ) : (
            <>
              <Button variant="outline" className="w-full justify-center" asChild>
                <Link to="/auth/login">Log In</Link>
              </Button>
              <Button className="w-full justify-center bg-talent-primary hover:bg-talent-secondary" asChild>
                <Link to="/auth/signup">Sign Up Free</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default MobileNavigation;
