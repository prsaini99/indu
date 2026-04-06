
import { useState, useEffect } from 'react';
import NavbarLogo from './navbar/NavbarLogo';
import DesktopNavigation from './navbar/DesktopNavigation';
import MobileNavigation from './navbar/MobileNavigation';
import MenuToggle from './navbar/MenuToggle';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      isScrolled ? 'py-2 bg-white/80 backdrop-blur-lg shadow-sm' : 'py-4 bg-white/60 backdrop-blur-sm shadow-[0_1px_3px_rgba(0,0,0,0.05)]'
    }`}>
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex items-center justify-between">
          <NavbarLogo />
          <DesktopNavigation />
          <MenuToggle isMenuOpen={isMenuOpen} toggleMenu={toggleMenu} />
        </div>
        <MobileNavigation isMenuOpen={isMenuOpen} />
      </div>
    </nav>
  );
};

export default Navbar;
