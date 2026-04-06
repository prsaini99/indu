
import { X, Menu } from 'lucide-react';

interface MenuToggleProps {
  isMenuOpen: boolean;
  toggleMenu: () => void;
}

const MenuToggle = ({ isMenuOpen, toggleMenu }: MenuToggleProps) => {
  return (
    <button
      onClick={toggleMenu}
      className="text-talent-dark focus:outline-none md:hidden"
    >
      {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
    </button>
  );
};

export default MenuToggle;
