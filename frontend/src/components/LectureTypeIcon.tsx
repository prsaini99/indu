
import { Book, BookOpen, MapPin, Users, Video } from "lucide-react";
import { LectureType, getLectureTypeInfo } from "@/types/lecture-types";

interface LectureTypeIconProps {
  type: LectureType;
  size?: number;
  className?: string;
}

const LectureTypeIcon = ({ type, size = 16, className }: LectureTypeIconProps) => {
  const typeInfo = getLectureTypeInfo(type);
  
  switch (typeInfo.icon) {
    case "video":
      return <Video size={size} className={className} />;
    case "users":
      return <Users size={size} className={className} />;
    case "book-audio":
      return <BookOpen size={size} className={className} />; // Using BookOpen for book-audio
    case "map-pin":
      return <MapPin size={size} className={className} />;
    default:
      return <Book size={size} className={className} />;
  }
};

export default LectureTypeIcon;
