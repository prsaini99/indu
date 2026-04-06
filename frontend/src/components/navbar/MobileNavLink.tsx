
import { Link } from 'react-router-dom';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface MobileNavLinkProps {
  href?: string;
  label: string;
  expanded?: boolean;
  onClick?: () => void;
  hasSubmenu?: boolean;
}

const MobileNavLink = ({ href, label, expanded, onClick, hasSubmenu = false }: MobileNavLinkProps) => {
  if (hasSubmenu) {
    return (
      <button 
        onClick={onClick}
        className="w-full flex items-center justify-between py-2 text-base font-medium text-talent-dark hover:text-talent-primary transition-colors"
      >
        <span>{label}</span>
        {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </button>
    );
  }
  
  return (
    <Link 
      to={href || "#"} 
      className="block py-2 text-base font-medium text-talent-dark hover:text-talent-primary transition-colors"
    >
      {label}
    </Link>
  );
};

export default MobileNavLink;
