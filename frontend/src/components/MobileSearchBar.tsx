
import { Search } from 'lucide-react';

const MobileSearchBar = () => {
  return (
    <div className="sticky top-[60px] z-40 bg-white p-4 shadow-sm md:hidden">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
        <input
          type="text"
          placeholder="Search all classes"
          className="w-full pl-10 pr-4 py-2.5 rounded-full border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-talent-primary focus:border-transparent"
        />
      </div>
    </div>
  );
};

export default MobileSearchBar;
