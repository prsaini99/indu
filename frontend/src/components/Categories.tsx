
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import SearchFilters from './SearchFilters';

const Categories = () => {
  const categories = [
    {
      title: "Music & Arts",
      image: "https://images.unsplash.com/photo-1514119412350-e174d90d280e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      color: "from-pink-500/20 to-purple-500/20",
      count: 420,
      icon: "🎵"
    },
    {
      title: "STEM & Coding",
      image: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      color: "from-blue-500/20 to-cyan-500/20",
      count: 385,
      icon: "💻"
    },
    {
      title: "Languages",
      image: "https://images.unsplash.com/photo-1546410531-bb4caa6b424d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      color: "from-yellow-500/20 to-orange-500/20",
      count: 310,
      icon: "🗣️"
    },
    {
      title: "Sports & Fitness",
      image: "https://images.unsplash.com/photo-1579952363873-27f3bade9f55?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      color: "from-green-500/20 to-emerald-500/20",
      count: 275,
      icon: "🏏"
    },
    {
      title: "Academic Subjects",
      image: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      color: "from-red-500/20 to-rose-500/20",
      count: 450,
      icon: "📚"
    },
    {
      title: "Life Skills",
      image: "https://images.unsplash.com/photo-1516321497487-e288fb19713f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      color: "from-indigo-500/20 to-violet-500/20",
      count: 215,
      icon: "🧠"
    }
  ];

  const handleSearch = (filters: any) => {
    // TODO: Implement search functionality
  };

  return (
    <section className="py-20 bg-talent-gray-100">
      <div className="container mx-auto px-4 md:px-6">
        {/* Search filters component */}
        <div className="bg-white rounded-xl p-6 shadow-sm mb-12">
          <SearchFilters onSearch={handleSearch} />
        </div>

        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
          <div className="max-w-2xl mb-6 md:mb-0">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Explore Categories</h2>
            <p className="text-talent-muted text-lg">
              Discover thousands of classes across diverse categories taught by expert tutors.
            </p>
          </div>
          <Button variant="outline" className="border-talent-primary/30 hover:border-talent-primary text-talent-dark font-medium">
            View All Categories
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6">
          {categories.map((category, index) => (
            <div 
              key={index} 
              className="group relative rounded-xl overflow-hidden md:h-72 h-44 animate-fade-up"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="absolute inset-0 bg-black/30 group-hover:bg-black/40 transition-all z-10"></div>
              <div className={`absolute inset-0 bg-gradient-to-br ${category.color} opacity-60 z-[5]`}></div>
              <img 
                src={category.image} 
                alt={category.title} 
                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
              />
              
              <div className="absolute inset-0 z-20 p-3 md:p-6 flex flex-col">
                <div className="text-2xl md:text-4xl mb-1 md:mb-2">{category.icon}</div>
                <div className="mt-auto">
                  <h3 className="text-lg md:text-2xl font-bold text-white mb-0.5 md:mb-2">{category.title}</h3>
                  <p className="text-white/80 text-xs md:text-sm">
                    {category.count}+ classes available
                  </p>
                </div>
              </div>
              
              <div className="absolute bottom-0 left-0 right-0 p-3 md:p-6 bg-gradient-to-t from-black/60 to-transparent z-15 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                <Button className="w-full bg-talent-primary hover:bg-talent-secondary text-sm md:text-base">
                  Explore Classes
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Categories;
