
import { Link } from 'react-router-dom';
import { useIsMobile } from '@/hooks/use-mobile';

const PopularCategories = () => {
  const isMobile = useIsMobile();
  
  const categories = [
    {
      title: "Full courses",
      image: "https://images.unsplash.com/photo-1610484826967-09c5720778c7?q=80&w=500&auto=format&fit=crop",
      link: "/classes/full-courses"
    },
    {
      title: "Personalized tutoring & lessons",
      image: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?q=80&w=500&auto=format&fit=crop",
      link: "/classes/tutoring"
    },
    {
      title: "Afterschool activities",
      image: "https://images.unsplash.com/photo-1596464716127-f2a82984de30?q=80&w=500&auto=format&fit=crop",
      link: "/classes/afterschool"
    },
    {
      title: "Neurodiversity nurtured",
      image: "https://images.unsplash.com/photo-1607453998774-d533f65dac99?q=80&w=500&auto=format&fit=crop",
      link: "/classes/neurodiversity"
    }
  ];

  return (
    <section className={`py-6 md:py-12 bg-white`}>
      <div className="container mx-auto px-4">
        <h2 className="text-2xl md:text-3xl font-bold text-center mb-4 md:mb-8">
          Popular group and 1-on-1 class categories
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
          {categories.map((category, index) => (
            <Link 
              key={index}
              to={category.link}
              className={`group relative block overflow-hidden rounded-lg ${
                isMobile 
                  ? 'bg-white shadow' 
                  : 'shadow-sm hover:shadow-md transition-shadow'
              }`}
            >
              <div className={`${isMobile ? 'aspect-square' : 'aspect-[4/3]'} overflow-hidden`}>
                <img 
                  src={category.image}
                  alt={category.title}
                  className={`w-full h-full object-cover ${
                    isMobile 
                      ? '' 
                      : 'group-hover:scale-105 transition-transform duration-300'
                  }`}
                />
              </div>
              <div className={
                isMobile 
                  ? 'p-3 text-center' 
                  : 'absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4'
              }>
                <h3 className={`font-bold ${isMobile ? 'text-black text-sm' : 'text-white'}`}>
                  {category.title}
                </h3>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PopularCategories;
