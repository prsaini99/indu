
import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useAuth } from "@/contexts/AuthContext";

const NotFound = () => {
  const location = useLocation();
  const { isAuthenticated, user } = useAuth();

  // Determine the correct dashboard URL based on user role
  const dashboardUrl =
    user?.role === "tutor" ? "/tutor-dashboard" :
    user?.role === "consultant" ? "/consultant-dashboard" :
    user?.role === "parent" ? "/parent-dashboard" :
    "/student-dashboard";
  
  // Custom colors for the feature boxes
  const featureColors = [
    { bg: "#E5DEFF" }, // Soft Purple
    { bg: "#D3E4FD" }, // Soft Blue
    { bg: "#F2FCE2" }, // Soft Green
    { bg: "#FEF7CD" }, // Soft Yellow
    { bg: "#FDE1D3" }, // Soft Peach
    { bg: "#FFDEE2" }  // Soft Pink
  ];

  useEffect(() => {
    if (import.meta.env.DEV) {
      console.log("Page under development accessed:", location.pathname);
    }
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex flex-col overflow-x-hidden">
      <Navbar />
      
      <main className="flex-grow flex items-center justify-center py-20 px-4">
        <div className="text-center max-w-md">
          <div className="mb-8 relative w-32 h-32 mx-auto">
            <div className="absolute inset-0 bg-purple-200 rounded-full animate-pulse"></div>
            <div className="absolute inset-2 bg-white rounded-full flex items-center justify-center">
              <div className="text-purple-600 text-5xl font-bold">WIP</div>
            </div>
          </div>
          
          <h1 className="text-3xl font-bold mb-4">Under Development</h1>
          
          <div className="mb-6">
            <Progress value={65} className="h-2" indicatorClassName="bg-purple-600" />
            <p className="text-right text-xs text-gray-500 mt-1">65% complete</p>
          </div>
          
          <p className="text-gray-600 mb-8">
            We're working hard to build this page. It will be available soon with exciting new features and content.
          </p>
          
          {isAuthenticated ? (
            <Link to={dashboardUrl}>
              <Button className="bg-purple-600 hover:bg-purple-700 text-white">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Dashboard
              </Button>
            </Link>
          ) : (
            <Link to="/">
              <Button className="bg-purple-600 hover:bg-purple-700 text-white">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Home
              </Button>
            </Link>
          )}
          
          <div className="mt-10 grid grid-cols-3 gap-4">
            {featureColors.map((color, index) => (
              <div 
                key={index}
                className="h-20 rounded-lg shadow-sm flex items-center justify-center"
                style={{ backgroundColor: color.bg }}
              >
                <span className="text-xs font-medium text-gray-600 opacity-60">
                  Coming soon
                </span>
              </div>
            ))}
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default NotFound;
