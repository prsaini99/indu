
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import TutorCard from "@/components/TutorCard";
import { LectureType } from "@/types/lecture-types";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

interface FeaturedTutorsProps {
  tutors: Array<{
    id: number;
    name: string;
    title: string;
    image: string;
    rating: number;
    reviews: number;
    students: number;
    classes: number;
    offeredLectureTypes: LectureType[];
    featuredClass: {
      id: string;
      title: string;
      price: number;
      duration: number;
      nextAvailable: string;
      lectureType: LectureType;
    };
  }>;
}

const FeaturedTutors = ({ tutors }: FeaturedTutorsProps) => {
  const isMobile = useIsMobile();

  return (
    <section className={`py-6 md:py-20 bg-white`}>
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
          <div className="max-w-2xl mb-6 md:mb-0">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Meet Our Featured Tutors</h2>
            <p className="text-talent-muted text-lg">
              Learn from passionate experts who are dedicated to helping students excel.
            </p>
          </div>
          <Button variant="outline" className="border-talent-primary/30 hover:border-talent-primary text-talent-dark font-medium">
            Browse All Tutors
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
                {tutors.map((tutor) => (
                  <CarouselItem key={tutor.id} className="pl-2 basis-[85%] sm:basis-[90%]">
                    <div className="h-full">
                      <TutorCard tutor={tutor} />
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
            {tutors.map((tutor) => (
              <TutorCard key={tutor.id} tutor={tutor} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default FeaturedTutors;
