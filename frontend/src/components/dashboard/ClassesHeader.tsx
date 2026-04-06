
import { Search, Filter, ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { useState } from "react";

interface ClassesHeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  title?: string;
  subtitle?: string;
  onFilterChange?: (filters: ClassFilters) => void;
}

export interface ClassFilters {
  classTypes: {
    onlineLive: boolean;
    onlineRecorded: boolean;
    offlineInbound: boolean;
    offlineOutbound: boolean;
  };
  classSizes: {
    group: boolean;
    individual: boolean;
  };
  durations: {
    recurring: boolean;
    fixed: boolean;
  };
}

const ClassesHeader: React.FC<ClassesHeaderProps> = ({ 
  searchQuery, 
  onSearchChange,
  title = "My Classes",
  subtitle = "Manage and track your classes",
  onFilterChange
}) => {
  const [filters, setFilters] = useState<ClassFilters>({
    classTypes: {
      onlineLive: true,
      onlineRecorded: true,
      offlineInbound: true,
      offlineOutbound: true
    },
    classSizes: {
      group: true,
      individual: true
    },
    durations: {
      recurring: true,
      fixed: true
    }
  });

  const handleFilterChange = (
    category: 'classTypes' | 'classSizes' | 'durations',
    key: string, 
    value: boolean
  ) => {
    const newFilters = { 
      ...filters,
      [category]: {
        ...filters[category],
        [key]: value
      }
    };
    
    setFilters(newFilters);
    if (onFilterChange) {
      onFilterChange(newFilters);
    }
  };
  
  return (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      <div>
        <h1 className="text-3xl font-bold">{title}</h1>
        <p className="text-muted-foreground">
          {subtitle}
        </p>
      </div>
      <div className="flex gap-2">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search classes..." 
            className="pl-10" 
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon">
              <Filter className="h-4 w-4" />
              <span className="sr-only">Filter</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Class Type</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuCheckboxItem
              checked={filters.classTypes.onlineLive}
              onCheckedChange={(value) => 
                handleFilterChange('classTypes', 'onlineLive', !!value)
              }
            >
              Online Live
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={filters.classTypes.onlineRecorded}
              onCheckedChange={(value) => 
                handleFilterChange('classTypes', 'onlineRecorded', !!value)
              }
            >
              Online Recorded
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={filters.classTypes.offlineInbound}
              onCheckedChange={(value) => 
                handleFilterChange('classTypes', 'offlineInbound', !!value)
              }
            >
              Offline Inbound
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={filters.classTypes.offlineOutbound}
              onCheckedChange={(value) => 
                handleFilterChange('classTypes', 'offlineOutbound', !!value)
              }
            >
              Offline Outbound
            </DropdownMenuCheckboxItem>
            
            <DropdownMenuLabel className="mt-2">Class Size</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuCheckboxItem
              checked={filters.classSizes.group}
              onCheckedChange={(value) => 
                handleFilterChange('classSizes', 'group', !!value)
              }
            >
              Group
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={filters.classSizes.individual}
              onCheckedChange={(value) => 
                handleFilterChange('classSizes', 'individual', !!value)
              }
            >
              Individual (1-on-1)
            </DropdownMenuCheckboxItem>
            
            <DropdownMenuLabel className="mt-2">Duration</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuCheckboxItem
              checked={filters.durations.recurring}
              onCheckedChange={(value) => 
                handleFilterChange('durations', 'recurring', !!value)
              }
            >
              Recurring
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={filters.durations.fixed}
              onCheckedChange={(value) => 
                handleFilterChange('durations', 'fixed', !!value)
              }
            >
              Fixed Duration
            </DropdownMenuCheckboxItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <Button variant="outline" size="icon">
          <ArrowUpDown className="h-4 w-4" />
          <span className="sr-only">Sort</span>
        </Button>
      </div>
    </div>
  );
};

export default ClassesHeader;
