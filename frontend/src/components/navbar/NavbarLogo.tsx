
import { Link } from 'react-router-dom';

const NavbarLogo = () => {
  return (
    <Link to="/" className="flex items-center">
      <div className="relative h-12 w-56">
        <img 
          src="/indu.png"
          alt="Indu AE Logo" 
          className="h-full object-contain"
        />
      </div>
    </Link>
  );
};

export default NavbarLogo;
