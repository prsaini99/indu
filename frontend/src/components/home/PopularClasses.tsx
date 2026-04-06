
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import ClassCard from "@/components/ClassCard";
import { LectureType } from "@/types/lecture-types";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

interface ClassItem {
  classId: string;
  title: string;
  image: string;
  tutor: string;
  rating: number;
  reviewCount: number;
  price: number;
  duration: number;
  nextDate: string;
  tags: string[];
  lectureType: LectureType;
  location?: string;
  isFeatured: boolean;
  ageRange: string;
}

interface PopularClassesProps {
  featuredClasses: ClassItem[];
}

const PopularClasses = ({ featuredClasses }: PopularClassesProps) => {
  const isMobile = useIsMobile();

  return (
    <section className={`py-6 md:py-20 bg-gray-50`}>
      <div className="container mx-auto px-4 md:px-6">
        <div className={`flex flex-col md:flex-row md:items-end justify-between ${isMobile ? 'mb-6' : 'mb-12'}`}>
          <div className={`max-w-2xl ${isMobile ? 'mb-4' : 'mb-6 md:mb-0'}`}>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Explore Popular Classes</h2>
            <p className="text-talent-muted text-lg">
              From online to in-person, we offer diverse learning experiences to fit your needs.
            </p>
          </div>
          <Button variant="outline" className="border-talent-primary/30 hover:border-talent-primary text-talent-dark font-medium">
            View All Classes
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
        
        {isMobile ? (
          <div className="relative">
            <Carousel
              opts={{
                align: "start",
                loop: true,
              }}
            >
              <CarouselContent className="-ml-2">
                {featuredClasses.map((classItem, index) => (
                  <CarouselItem key={index} className="pl-2 basis-[85%] sm:basis-[90%]">
                    <div className="scale-90">
                      <ClassCard 
                        className=""
                        classId={classItem.classId}
                        image={classItem.image}
                        title={classItem.title}
                        tutor={classItem.tutor}
                        rating={classItem.rating}
                        reviewCount={classItem.reviewCount}
                        price={classItem.price}
                        duration={classItem.duration}
                        nextDate={classItem.nextDate}
                        tags={classItem.tags}
                        lectureType={classItem.lectureType}
                        location={classItem.location}
                        isFeatured={classItem.isFeatured}
                        ageRange={classItem.ageRange}
                      />
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious className="left-0" />
              <CarouselNext className="right-0" />
            </Carousel>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredClasses.map((classItem, index) => (
              <ClassCard 
                key={index}
                className=""
                classId={classItem.classId}
                image={classItem.image}
                title={classItem.title}
                tutor={classItem.tutor}
                rating={classItem.rating}
                reviewCount={classItem.reviewCount}
                price={classItem.price}
                duration={classItem.duration}
                nextDate={classItem.nextDate}
                tags={classItem.tags}
                lectureType={classItem.lectureType}
                location={classItem.location}
                isFeatured={classItem.isFeatured}
                ageRange={classItem.ageRange}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default PopularClasses;
