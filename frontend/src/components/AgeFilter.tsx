
import { useState } from "react";
import { Button } from "@/components/ui/button";

interface AgeFilterProps {
  onAgeChange: (ages: string[]) => void;
  className?: string;
}

const AgeFilter = ({ onAgeChange, className = "" }: AgeFilterProps) => {
  const [selectedAges, setSelectedAges] = useState<string[]>([]);
  
  const ageGroups = [
    { id: "3-5", label: "3-5 years" },
    { id: "6-9", label: "6-9 years" },
    { id: "10-13", label: "10-13 years" },
    { id: "14-18", label: "14-18 years" }
  ];
  
  const toggleAgeGroup = (ageId: string) => {
    setSelectedAges(prev => {
      const isSelected = prev.includes(ageId);
      const newSelection = isSelected 
        ? prev.filter(a => a !== ageId) 
        : [...prev, ageId];
      
      // Notify parent component
      onAgeChange(newSelection);
      return newSelection;
    });
  };
  
  return (
    <div className={`flex flex-col ${className}`}>
      <h3 className="text-lg font-medium mb-4">Learner's age</h3>
      
      <div className="flex flex-wrap gap-3">
        {ageGroups.map(age => (
          <Button 
            key={age.id}
            type="button"
            variant={selectedAges.includes(age.id) ? "default" : "outline"}
            className={`rounded-full ${
              selectedAges.includes(age.id) 
                ? "bg-talent-primary text-white" 
                : "border-gray-300 text-gray-700"
            }`}
            onClick={() => toggleAgeGroup(age.id)}
          >
            {age.label}
          </Button>
        ))}
      </div>
    </div>
  );
};

export default AgeFilter;
