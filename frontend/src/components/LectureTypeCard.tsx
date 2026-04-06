
import { LectureType, getLectureTypeInfo } from "@/types/lecture-types";
import LectureTypeIcon from "./LectureTypeIcon";

interface LectureTypeCardProps {
  type: LectureType;
  onClick?: () => void;
}

const LectureTypeCard = ({ type, onClick }: LectureTypeCardProps) => {
  const typeInfo = getLectureTypeInfo(type);
  
  const bgColorClass = typeInfo.color;
  const textColorClass = typeInfo.color.replace("bg-", "text-");
  
  return (
    <div 
      onClick={onClick} 
      className={`${bgColorClass} bg-opacity-10 rounded-lg p-4 transition-all hover:scale-105 hover:shadow-md cursor-pointer`}
    >
      <div className={`${textColorClass} p-2 rounded-full w-10 h-10 flex items-center justify-center mb-3`}>
        <LectureTypeIcon type={type} size={24} className={textColorClass} />
      </div>
      <h3 className="font-semibold mb-1">{typeInfo.name}</h3>
      <p className="text-sm text-talent-muted">{typeInfo.description}</p>
    </div>
  );
};

export default LectureTypeCard;
