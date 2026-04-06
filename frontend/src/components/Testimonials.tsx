import { useState } from 'react';
import { ChevronLeft, ChevronRight, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';

const Testimonials = () => {
  const testimonials = [
    {
      id: 1,
      name: "Aarav Patel",
      role: "Parent of 2",
      image: "https://randomuser.me/api/portraits/men/32.jpg",
      text: "Indu AE has been a game-changer for my children. The violin lessons they're taking have helped build confidence and a genuine love for music. Their tutor is not just skilled but incredibly patient and encouraging.",
      rating: 5,
      tutorName: "Ms. Priya",
      className: "Beginner Violin"
    },
    {
      id: 2,
      name: "Meera Sharma",
      role: "Parent of a 9-year-old",
      image: "https://randomuser.me/api/portraits/women/44.jpg",
      text: "My son struggled with math for years until we found Mr. Rajan's class on Indu AE. The way he explains concepts has made all the difference. Now my son looks forward to math homework, something I never thought possible!",
      rating: 5,
      tutorName: "Mr. Rajan",
      className: "Math Mastery"
    },
    {
      id: 3,
      name: "Vikram Singh",
      role: "Parent of 3",
      image: "https://randomuser.me/api/portraits/men/62.jpg",
      text: "The coding classes on Indu AE have opened up a whole new world for my daughter. She's created her own games and animations after just 2 months of lessons. The flexible scheduling also works perfectly with our busy family life.",
      rating: 4,
      tutorName: "Ms. Anjali",
      className: "Coding for Kids"
    },
    {
      id: 4,
      name: "Priya Deshmukh",
      role: "Parent of an 11-year-old",
      image: "https://randomuser.me/api/portraits/women/29.jpg",
      text: "I was skeptical about online cricket coaching, but Coach Rahul's classes have improved my son's technique tremendously. The video platform is excellent, and the coach is able to provide detailed feedback just as effectively as in-person training.",
      rating: 5,
      tutorName: "Coach Rahul",
      className: "Cricket Fundamentals"
    },
  ];

  const [activeIndex, setActiveIndex] = useState(0);

  const handlePrev = () => {
    setActiveIndex((prevIndex) => (prevIndex === 0 ? testimonials.length - 1 : prevIndex - 1));
  };

  const handleNext = () => {
    setActiveIndex((prevIndex) => (prevIndex === testimonials.length - 1 ? 0 : prevIndex + 1));
  };

  return (
    <section className="py-8 md:py-20 bg-talent-gray-100">
      <div className="container mx-auto px-4 md:px-6">
        <div className="text-center max-w-3xl mx-auto mb-8 md:mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">What Parents Say</h2>
          <p className="text-talent-muted text-lg">
            Hear from parents whose children have discovered their talents and passions with our platform.
          </p>
        </div>
        
        <div className="relative max-w-4xl mx-auto">
          <div className="overflow-hidden">
            <div
              className="flex transition-transform duration-500 ease-in-out"
              style={{ transform: `translateX(-${activeIndex * 100}%)` }}
            >
              {testimonials.map((testimonial) => (
                <div key={testimonial.id} className="w-full flex-shrink-0">
                  <div className="p-8 rounded-2xl border border-talent-gray-200 bg-white">
                    <div className="flex flex-col md:flex-row gap-6">
                      <div className="md:w-1/3">
                        <div className="aspect-square w-24 h-24 mx-auto md:mx-0 rounded-full overflow-hidden mb-4">
                          <img 
                            src={testimonial.image} 
                            alt={testimonial.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="text-center md:text-left">
                          <div className="font-semibold text-lg">{testimonial.name}</div>
                          <div className="text-talent-muted text-sm mb-3">{testimonial.role}</div>
                          <div className="flex items-center justify-center md:justify-start mb-4">
                            {[...Array(5)].map((_, i) => (
                              <Star 
                                key={i} 
                                className={`w-4 h-4 ${i < testimonial.rating ? 'text-talent-warning fill-talent-warning' : 'text-talent-gray-300'}`} 
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                      
                      <div className="md:w-2/3">
                        <p className="text-talent-muted mb-6 text-lg italic">"{testimonial.text}"</p>
                        <div className="p-3 bg-talent-gray-100 rounded-lg inline-block">
                          <div className="text-sm">
                            <span className="font-medium text-talent-dark">{testimonial.className}</span>
                            <span className="text-talent-muted"> with </span>
                            <span className="font-medium text-talent-dark">{testimonial.tutorName}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="flex justify-center mt-8 gap-3">
            <Button 
              variant="outline" 
              size="icon" 
              className="rounded-full w-10 h-10" 
              onClick={handlePrev}
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <Button 
              variant="outline" 
              size="icon" 
              className="rounded-full w-10 h-10" 
              onClick={handleNext}
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
          
          <div className="flex justify-center mt-4">
            {testimonials.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setActiveIndex(idx)}
                className={`w-2.5 h-2.5 rounded-full mx-1 ${
                  idx === activeIndex ? 'bg-talent-primary' : 'bg-talent-gray-300'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
