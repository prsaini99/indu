
import { Heart, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LectureType } from "@/types/lecture-types";
import LectureTypeBadge from "./LectureTypeBadge";
import { Link } from "react-router-dom";
import { useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";

interface ClassCardProps {
  className: string;
  image: string;
  title: string;
  tutor: string;
  rating: number;
  reviewCount: number;
  price: number;
  duration: number;
  nextDate: string;
  tags: string[];
  lectureType: LectureType;
  location?: string;
  isFeatured?: boolean;
  classId: string;
  ageRange?: string;
}

const ClassCard = ({
  className,
  image,
  title,
  tutor,
  rating,
  reviewCount,
  price,
  duration,
  nextDate,
  tags,
  lectureType,
  location,
  isFeatured = false,
  classId,
  ageRange,
}: ClassCardProps) => {
  const [saved, setSaved] = useState(false);
  const isMobile = useIsMobile();
  
  const getAgeRange = () => {
    if (ageRange) return ageRange;
    const ageTag = tags.find(tag => tag.includes("Ages") || tag.includes("age"));
    return ageTag ? ageTag.replace("Ages ", "") : "8-12";
  };
  
  if (isMobile) {
    return (
      <div className={`bg-white border-b border-gray-200 p-3 ${
        isFeatured ? "ring-2 ring-talent-primary" : ""
      }`}>
        <div className="flex gap-3">
          <div className="w-24 h-24 flex-shrink-0">
            <img 
              src={image} 
              alt={title} 
              className="w-full h-full object-cover rounded-lg"
            />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-start">
              <h3 className="text-sm font-semibold text-gray-800 mb-1 line-clamp-2">{title}</h3>
              <button
                onClick={() => setSaved(!saved)}
                className="text-talent-primary ml-2 flex-shrink-0"
              >
                <Heart className={`h-5 w-5 ${saved ? "fill-talent-primary" : "stroke-talent-primary"}`} />
              </button>
            </div>
            
            <p className="text-xs text-gray-600 mb-1">{tutor}</p>
            
            <div className="flex items-center gap-1 mb-1">
              <Star className="h-3.5 w-3.5 text-yellow-400 fill-yellow-400" />
              <span className="text-xs font-medium">{rating.toFixed(1)}</span>
              <span className="text-xs text-gray-500">({reviewCount})</span>
            </div>
            
            <div className="flex items-center gap-2 text-xs">
              <span className="font-semibold">₹{price}</span>
              <span className="text-gray-500">•</span>
              <span className="text-gray-500">{duration} mins</span>
              <span className="text-gray-500">•</span>
              <span className="text-gray-500">Ages {getAgeRange()}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className={`rounded-lg overflow-hidden border border-gray-200 bg-white shadow-sm hover:shadow-md transition-all ${
      isFeatured ? "ring-2 ring-talent-primary" : ""
    }`}>
      <div className="relative">
        <img 
          src={image} 
          alt={title} 
          className="w-full h-48 object-cover"
        />
        
        {lectureType !== "online-live-group" && lectureType !== "live-group" && (
          <div className="absolute bottom-3 left-3">
            <LectureTypeBadge type={lectureType} />
          </div>
        )}
      </div>
      
      <div className="p-4">
        <div className="flex justify-end mb-2">
          <button
            onClick={() => setSaved(!saved)}
            className="text-talent-primary"
            aria-label={saved ? "Remove from favorites" : "Add to favorites"}
          >
            <Heart className={`h-7 w-7 ${saved ? "fill-talent-primary" : "stroke-talent-primary"}`} />
          </button>
        </div>
        
        <h3 className="text-xl font-bold text-gray-800 mb-1">{title}</h3>
        
        <div className="flex items-center gap-2 mb-3">
          {tutor && (
            <>
              <div className="w-8 h-8 rounded-full overflow-hidden bg-talent-primary/20 flex items-center justify-center">
                {tutor.charAt(0)}
              </div>
              <span className="text-gray-700">{tutor}</span>
            </>
          )}
        </div>
        
        <div className="flex items-center mb-4">
          <Star className="h-5 w-5 text-yellow-400 fill-yellow-400" />
          <span className="ml-1 font-semibold">{rating.toFixed(1)}</span>
          <span className="text-gray-500 ml-1">({reviewCount})</span>
        </div>
        
        <div className="grid grid-cols-3 gap-2 mb-3">
          <div className="bg-gray-50 p-3 rounded-lg text-center">
            <div className="text-xl font-bold">{getAgeRange()}</div>
            <div className="text-xs text-gray-500">Ages</div>
          </div>
          
          <div className="bg-gray-50 p-3 rounded-lg text-center">
            <div className="text-xl font-bold">{duration}</div>
            <div className="text-xs text-gray-500">Mins</div>
          </div>
          
          <div className="bg-gray-50 p-3 rounded-lg text-center">
            <div className="text-xl font-bold">₹{price}</div>
            <div className="text-xs text-gray-500">Per class</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClassCard;
