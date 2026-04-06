
import { LectureType, lectureTypes } from "@/types/lecture-types";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { BookAudio, MapPin, Users, Video } from "lucide-react";
import { useState } from "react";

interface LectureTypeFilterProps {
  onFilterChange: (types: LectureType[]) => void;
  defaultSelected?: LectureType[];
}

const LectureTypeFilter = ({ 
  onFilterChange, 
  defaultSelected = [] 
}: LectureTypeFilterProps) => {
  const [selectedTypes, setSelectedTypes] = useState<LectureType[]>(defaultSelected);

  const handleValueChange = (value: string[]) => {
    const types = value as LectureType[];
    setSelectedTypes(types);
    onFilterChange(types);
  };

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case "video":
        return <Video className="h-4 w-4" />;
      case "users":
        return <Users className="h-4 w-4" />;
      case "book-audio":
        return <BookAudio className="h-4 w-4" />;
      case "map-pin":
        return <MapPin className="h-4 w-4" />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium">Class Format</h3>
      <ToggleGroup 
        type="multiple" 
        value={selectedTypes}
        onValueChange={handleValueChange}
        className="justify-start flex-wrap"
      >
        {Object.values(lectureTypes).map((type) => (
          <ToggleGroupItem 
            key={type.id} 
            value={type.id}
            className="flex items-center gap-1 text-xs px-3 py-1.5 data-[state=on]:bg-opacity-20"
            variant="outline"
          >
            {getIcon(type.icon)}
            <span>{type.name}</span>
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </div>
  );
};

export default LectureTypeFilter;
