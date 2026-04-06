
import { Star, Calendar, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LectureType } from '@/types/lecture-types';
import LectureTypeBadge from './LectureTypeBadge';
import { Link } from 'react-router-dom';
import { useIsMobile } from '@/hooks/use-mobile';

interface TutorCardProps {
  tutor: {
    id: number;
    name: string;
    title: string;
    image: string;
    rating: number;
    reviews: number;
    students: number;
    classes: number;
    offeredLectureTypes: LectureType[];
    // Removed featuredClass property
  };
}

const TutorCard = ({ tutor }: TutorCardProps) => {
  const isMobile = useIsMobile();
  
  return (
    <div className={`rounded-xl overflow-hidden border border-talent-gray-200 bg-white hover:shadow-lg transition-all duration-300 animate-fade-up ${
      isMobile ? 'h-full' : ''
    }`}>
      <div className={`relative ${isMobile ? 'h-32' : 'h-48'} overflow-hidden`}>
        <img 
          src={tutor.image} 
          alt={tutor.name}
          className="w-full h-full object-cover transition-transform hover:scale-105 duration-700"
        />
        <div className="absolute top-4 left-4 flex items-center bg-white/90 backdrop-blur-sm rounded-full px-2 py-1">
          <Star className="h-4 w-4 text-talent-warning fill-talent-warning" />
          <span className="ml-1 font-medium text-sm">{tutor.rating}</span>
          <span className="ml-1 text-xs text-talent-muted">({tutor.reviews})</span>
        </div>
      </div>
      
      <div className={`p-4 ${isMobile ? 'space-y-2' : 'p-5'}`}>
        <h3 className={`font-semibold ${isMobile ? 'text-lg' : 'text-xl'} mb-1`}>{tutor.name}</h3>
        <p className="text-talent-muted text-sm mb-2">{tutor.title}</p>
        
        <div className="flex flex-wrap gap-1 mb-3">
          {tutor.offeredLectureTypes.map((type) => (
            <LectureTypeBadge key={type} type={type} size="sm" />
          ))}
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center text-sm text-talent-muted">
            <Users className="h-4 w-4 mr-1" />
            <span>{tutor.students} students</span>
          </div>
          <div className="flex items-center text-sm text-talent-muted">
            <Calendar className="h-4 w-4 mr-1" />
            <span>{tutor.classes} classes</span>
          </div>
        </div>
        
        <Button asChild className="w-full bg-talent-primary hover:bg-talent-secondary mt-4">
          <Link to={`/tutors/${tutor.id}`}>View Profile</Link>
        </Button>
      </div>
    </div>
  );
};

export default TutorCard;
