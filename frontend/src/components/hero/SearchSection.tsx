import { useState } from 'react';
import { Search, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';

const SearchSection = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [ageRange, setAgeRange] = useState<string>('');
  const [showAgeDropdown, setShowAgeDropdown] = useState(false);
  
  const ageRanges = [
    '3-5 years',
    '6-9 years',
    '10-13 years',
    '14-18 years',
  ];

  const categories = [
    'Music', 'Math', 'Coding', 'Art', 'Science', 'Languages', 'Sports'
  ];

  return (
    <section className="py-6 md:py-12 bg-white border-b border-gray-100">
      <div className="container mx-auto px-4 md:px-6">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-6">Find the Perfect Classes for Your Child</h2>
          
          {/* Outschool-style search with age filter */}
          <div className="bg-white p-5 rounded-lg shadow-md mb-6">
            <div className="flex flex-col md:flex-row gap-3">
              <div className="relative flex-grow">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="What does your child want to learn?"
                  className="w-full pl-10 pr-4 py-3 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-talent-primary focus:border-transparent"
                />
              </div>
              
              {/* Age range dropdown */}
              <div className="relative min-w-[150px]">
                <button 
                  onClick={() => setShowAgeDropdown(!showAgeDropdown)}
                  className="w-full flex items-center justify-between px-4 py-3 border border-gray-300 rounded-md bg-white text-talent-muted"
                >
                  {ageRange || "Learner's age"}
                  <ChevronDown className="h-4 w-4 ml-2" />
                </button>
                
                {showAgeDropdown && (
                  <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg">
                    {ageRanges.map((age) => (
                      <button
                        key={age}
                        className="block w-full text-left px-4 py-2 hover:bg-gray-100"
                        onClick={() => {
                          setAgeRange(age);
                          setShowAgeDropdown(false);
                        }}
                      >
                        {age}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              
              <Button className="bg-talent-primary hover:bg-talent-secondary text-white font-medium h-12 px-6">
                Search
              </Button>
            </div>
          </div>
          
          <div className="mb-8">
            <p className="font-medium text-talent-dark mb-3 text-center">Popular subjects:</p>
            <div className="flex flex-wrap gap-2 justify-center">
              {categories.map((category, index) => (
                <a 
                  key={index}
                  href="#" 
                  className="px-3 py-1 bg-white border border-gray-200 rounded-full text-sm hover:bg-gray-50 transition-colors"
                >
                  {category}
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SearchSection;
