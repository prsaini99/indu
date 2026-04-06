
import { Link } from 'react-router-dom';
import {
  NavigationMenuItem,
  NavigationMenuTrigger,
  NavigationMenuContent,
  NavigationMenuLink,
} from "@/components/ui/navigation-menu";
import { LucideIcon } from 'lucide-react';

interface NavigationItem {
  title: string;
  description: string;
  href: string;
  icon: LucideIcon;
}

interface DesktopNavigationItemProps {
  label: string;
  items: NavigationItem[];
}

const DesktopNavigationItem = ({ label, items }: DesktopNavigationItemProps) => {
  return (
    <NavigationMenuItem>
      <NavigationMenuTrigger className="px-3 py-2 text-[15px] font-medium text-talent-dark hover:text-talent-primary">
        {label}
      </NavigationMenuTrigger>
      <NavigationMenuContent>
        <ul className={`grid gap-3 p-4 ${items.length >= 4 ? 'w-[400px] md:w-[500px] md:grid-cols-2 lg:w-[600px]' : 'w-[400px]'}`}>
          {items.map((item) => (
            <li key={item.title}>
              <NavigationMenuLink asChild>
                <Link
                  to={item.href}
                  className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                >
                  <div className="flex items-center gap-2">
                    <item.icon className="h-4 w-4 text-talent-primary" />
                    <div className="text-sm font-medium leading-none">{item.title}</div>
                  </div>
                  <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                    {item.description}
                  </p>
                </Link>
              </NavigationMenuLink>
            </li>
          ))}
        </ul>
      </NavigationMenuContent>
    </NavigationMenuItem>
  );
};

export default DesktopNavigationItem;
