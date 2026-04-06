
import { ReactNode } from "react";
import Navbar from "./Navbar";
import Footer from "./Footer";

interface PageLayoutProps {
  children: ReactNode;
  title: string;
  description?: string;
}

const PageLayout = ({ children, title, description }: PageLayoutProps) => {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow pt-28">
        <div className="container mx-auto px-4 md:px-6 py-12">
          <div className="max-w-4xl mx-auto mb-10 text-center">
            <h1 className="text-3xl md:text-5xl font-bold mb-4 text-talent-dark">{title}</h1>
            {description && <p className="text-talent-muted text-lg">{description}</p>}
          </div>
          {children}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default PageLayout;
