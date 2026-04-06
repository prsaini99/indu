
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronDown, Search } from "lucide-react";
import AgeFilter from "./AgeFilter";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface SearchFiltersProps {
  onSearch: (filters: any) => void;
  className?: string;
}

const SearchFilters = ({ onSearch, className = "" }: SearchFiltersProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedAges, setSelectedAges] = useState<string[]>([]);
  const [selectedDays, setSelectedDays] = useState<string>("");
  const [selectedPrice, setSelectedPrice] = useState<string>("");
  const [selectedClassSize, setSelectedClassSize] = useState<string>("");
  
  const handleSearch = () => {
    onSearch({
      searchTerm,
      ages: selectedAges,
      days: selectedDays,
      price: selectedPrice,
      classSize: selectedClassSize
    });
  };
  
  const resetFilters = () => {
    setSearchTerm("");
    setSelectedAges([]);
    setSelectedDays("");
    setSelectedPrice("");
    setSelectedClassSize("");
  };
  
  return (
    <div className={`w-full ${className}`}>
      {/* Search input and button */}
      <div className="flex flex-col md:flex-row gap-3 mb-6">
        <div className="relative flex-grow">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search for classes or subjects"
            className="w-full pl-10 pr-4 py-3 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-talent-primary focus:border-transparent"
          />
        </div>
        <Button 
          className="bg-talent-primary hover:bg-talent-secondary text-white font-medium h-12 px-6"
          onClick={handleSearch}
        >
          Search
        </Button>
      </div>
      
      {/* Filter buttons row */}
      <div className="flex flex-wrap gap-3 mb-6">
        {/* Day or time filter */}
        <Popover>
          <PopoverTrigger asChild>
            <button className="filter-button">
              Day or time <ChevronDown className="h-4 w-4" />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-72 p-4">
            <h3 className="font-medium mb-3">Select day or time</h3>
            <div className="grid grid-cols-2 gap-2">
              {["Weekdays", "Weekends", "Morning", "Afternoon", "Evening"].map(time => (
                <Button 
                  key={time}
                  variant="outline"
                  className={`justify-start ${selectedDays === time ? "border-talent-primary bg-talent-primary/10" : ""}`}
                  onClick={() => setSelectedDays(time)}
                >
                  {time}
                </Button>
              ))}
            </div>
          </PopoverContent>
        </Popover>
        
        {/* Date filter */}
        <Popover>
          <PopoverTrigger asChild>
            <button className="filter-button">
              Date <ChevronDown className="h-4 w-4" />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-72 p-4">
            <h3 className="font-medium mb-3">Select date range</h3>
            <div className="grid grid-cols-1 gap-2">
              {["Today", "Tomorrow", "This week", "Next week", "This month"].map(date => (
                <Button 
                  key={date}
                  variant="outline"
                  className={`justify-start ${selectedDays === date ? "border-talent-primary bg-talent-primary/10" : ""}`}
                  onClick={() => setSelectedDays(date)}
                >
                  {date}
                </Button>
              ))}
            </div>
          </PopoverContent>
        </Popover>
        
        {/* Class size */}
        <Popover>
          <PopoverTrigger asChild>
            <button className="filter-button">
              Class size <ChevronDown className="h-4 w-4" />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-72 p-4">
            <h3 className="font-medium mb-3">Select class size</h3>
            <div className="grid grid-cols-1 gap-2">
              {["1-on-1", "Small group (2-5)", "Medium group (6-10)", "Large group (11+)"].map(size => (
                <Button 
                  key={size}
                  variant="outline"
                  className={`justify-start ${selectedClassSize === size ? "border-talent-primary bg-talent-primary/10" : ""}`}
                  onClick={() => setSelectedClassSize(size)}
                >
                  {size}
                </Button>
              ))}
            </div>
          </PopoverContent>
        </Popover>
        
        {/* Price range */}
        <Popover>
          <PopoverTrigger asChild>
            <button className="filter-button">
              Any price <ChevronDown className="h-4 w-4" />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-72 p-4">
            <h3 className="font-medium mb-3">Select price range</h3>
            <div className="grid grid-cols-1 gap-2">
              {["Under ₹200", "₹200 - ₹500", "₹500 - ₹1000", "₹1000 - ₹2000", "Over ₹2000"].map(price => (
                <Button 
                  key={price}
                  variant="outline"
                  className={`justify-start ${selectedPrice === price ? "border-talent-primary bg-talent-primary/10" : ""}`}
                  onClick={() => setSelectedPrice(price)}
                >
                  {price}
                </Button>
              ))}
            </div>
          </PopoverContent>
        </Popover>
        
        {/* Age filter */}
        <Popover>
          <PopoverTrigger asChild>
            <button className="filter-button">
              Ages <ChevronDown className="h-4 w-4" />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-72 p-4">
            <AgeFilter 
              onAgeChange={(ages) => setSelectedAges(ages)} 
            />
          </PopoverContent>
        </Popover>
        
        {/* More filters button */}
        <button className="filter-button">
          More <ChevronDown className="h-4 w-4" />
        </button>
        
        {/* Reset filters */}
        <button 
          className="text-talent-primary text-sm font-medium ml-auto"
          onClick={resetFilters}
        >
          Reset Filters
        </button>
      </div>
    </div>
  );
};

export default SearchFilters;
