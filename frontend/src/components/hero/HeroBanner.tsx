import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import AnimatedJobTitle from '../AnimatedJobTitle';

const HeroBanner = () => {
  // Career/talent titles for the animation
  const careerTitles = [
    'astronaut',
    'graduate',
    'scientist',
    'chef',
    'architect',
    'musician',
    'engineer',
    'artist'
  ];

  return (
    <section className="pt-12 pb-4 md:pt-28 md:pb-8 overflow-hidden bg-[#F8F9FA]">
      <div className="container mx-auto px-4 md:px-6">
        <div className="grid lg:grid-cols-2 gap-8 items-center">
          <div className="max-w-2xl">
            <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-talent-dark mb-6">
              Expert educators and tutors for your future <AnimatedJobTitle titles={careerTitles} />
            </h1>
            <p className="text-lg text-talent-muted mb-6">
              Ignite your child's curiosity with passionate tutors and interactive classes designed for eager young minds.
            </p>
            
            <div className="flex items-center gap-4 mb-6">
              <div className="flex -space-x-3">
                {[1, 2, 3, 4].map((i) => (
                  <div 
                    key={i} 
                    className="h-10 w-10 rounded-full border-2 border-white overflow-hidden bg-talent-gray-200"
                  >
                    <img 
                      src={`https://randomuser.me/api/portraits/${i % 2 === 0 ? 'men' : 'women'}/${i + 20}.jpg`} 
                      alt="User avatar" 
                      className="h-full w-full object-cover"
                    />
                  </div>
                ))}
              </div>
              <div className="text-sm text-talent-muted">
                <span className="font-semibold text-talent-dark">4.9/5</span> from over 2,500+ student reviews
              </div>
            </div>

            <div className="flex items-center gap-4">
              <Button asChild variant="outline" className="border-talent-primary text-talent-primary hover:bg-talent-primary hover:text-white font-medium px-6 py-6 h-auto text-lg">
                <a href="https://induae-student.vercel.app/" target="_blank" rel="noopener noreferrer">
                  Student Dashboard
                </a>
              </Button>
              <Button className="bg-talent-primary hover:bg-talent-secondary text-white font-medium px-6 py-6 h-auto text-lg">
                Explore Classes
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </div>
          
          <div className="relative hidden lg:block">
            <div className="relative w-full rounded-2xl overflow-hidden shadow-xl">
              <div className="aspect-[4/3] bg-gradient-to-r from-talent-primary/10 to-talent-secondary/10 rounded-2xl">
                <img 
                  src="https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&q=80&w=1000" 
                  alt="Child learning with a tutor" 
                  className="w-full h-full object-cover rounded-2xl"
                />
              </div>
            </div>
            
            {/* Featured class card */}
            <div className="absolute -bottom-5 -left-5 max-w-[260px] bg-white p-4 rounded-lg shadow-lg">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-full overflow-hidden">
                  <img 
                    src="https://randomuser.me/api/portraits/women/33.jpg" 
                    alt="Tutor" 
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <h3 className="font-medium text-sm">Violin Fundamentals</h3>
                  <p className="text-xs text-talent-muted">Ms. Priya Sharma</p>
                </div>
              </div>
              <div className="text-xs text-talent-muted mb-2">
                <div className="flex items-center">
                  <span className="font-medium text-talent-dark">4.9</span>
                  <div className="flex text-talent-primary ml-1">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <svg key={i} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3">
                        <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clipRule="evenodd" />
                      </svg>
                    ))}
                  </div>
                  <span className="ml-1 text-talent-muted">(124)</span>
                </div>
              </div>
              <Button asChild className="w-full text-xs h-8 bg-talent-primary hover:bg-talent-secondary">
                <Link to="/classes/violin-fundamentals">View Class</Link>
              </Button>
            </div>
            
            {/* Floating badge */}
            <div className="absolute top-5 right-5 bg-talent-accent text-white px-3 py-1 rounded-full text-xs font-medium shadow-md">
              Flexible Learning Options
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroBanner;
