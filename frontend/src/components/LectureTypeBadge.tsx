
import { Book, BookAudio, MapPin, Users, Video } from "lucide-react";
import { LectureType, getLectureTypeInfo } from "@/types/lecture-types";
import { cn } from "@/lib/utils";

interface LectureTypeBadgeProps {
  type: LectureType;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  className?: string;
}

const LectureTypeBadge = ({ 
  type, 
  size = "md", 
  showLabel = true,
  className 
}: LectureTypeBadgeProps) => {
  const typeInfo = getLectureTypeInfo(type);
  
  const getIcon = () => {
    const iconSize = size === "sm" ? 14 : size === "md" ? 16 : 18;
    
    switch (typeInfo.icon) {
      case "video":
        return <Video size={iconSize} />;
      case "users":
        return <Users size={iconSize} />;
      case "book-audio":
        return <BookAudio size={iconSize} />;
      case "map-pin":
        return <MapPin size={iconSize} />;
      default:
        return <Book size={iconSize} />;
    }
  };
  
  const getSizeClasses = () => {
    switch (size) {
      case "sm":
        return "text-xs px-2 py-0.5 gap-1";
      case "lg":
        return "text-sm px-3 py-1.5 gap-2";
      case "md":
      default:
        return "text-xs px-2.5 py-1 gap-1.5";
    }
  };
  
  return (
    <div 
      className={cn(
        "inline-flex items-center rounded-full font-medium",
        typeInfo.color.replace("bg-", "bg-opacity-10 text-"),
        getSizeClasses(),
        className
      )}
    >
      {getIcon()}
      {showLabel && <span>{typeInfo.name}</span>}
    </div>
  );
};

export default LectureTypeBadge;
