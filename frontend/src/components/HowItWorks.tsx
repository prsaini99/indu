
import { Search, Calendar, Video, Star } from 'lucide-react';

const HowItWorks = () => {
  const steps = [
    {
      icon: <Search className="h-8 w-8 text-white" />,
      title: "Find Your Perfect Class",
      description: "Browse thousands of classes by subject, age, schedule, or tutor ratings to find your perfect match.",
      color: "bg-talent-primary",
      number: "1"
    },
    {
      icon: <Calendar className="h-8 w-8 text-white" />,
      title: "Book with Ease",
      description: "Select your preferred class time, make a secure payment, and receive instant confirmation.",
      color: "bg-talent-accent",
      number: "2"
    },
    {
      icon: <Video className="h-8 w-8 text-white" />,
      title: "Enjoy Interactive Learning",
      description: "Join your class with our simple, reliable video platform designed for engaging learning experiences.",
      color: "bg-talent-success",
      number: "3"
    },
    {
      icon: <Star className="h-8 w-8 text-white" />,
      title: "Track Progress & Grow",
      description: "Receive personalized feedback, track improvements, and continue your learning journey.",
      color: "bg-talent-warning",
      number: "4"
    }
  ];

  return (
    <section className="py-20 bg-white overflow-hidden relative">
      <div className="absolute top-0 right-0 w-96 h-96 bg-talent-primary/5 rounded-full filter blur-3xl -z-10 transform translate-x-1/2 -translate-y-1/2"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-talent-accent/5 rounded-full filter blur-3xl -z-10 transform -translate-x-1/2 translate-y-1/2"></div>
      
      <div className="container mx-auto px-4 md:px-6">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">How Indu AE Works</h2>
          <p className="text-talent-muted text-lg">
            Getting started is simple. Follow these steps to begin your learning journey with Indu AE.
          </p>
        </div>
        
        <div className="relative">
          <div className="hidden md:block absolute left-[calc(50%-1px)] top-24 bottom-24 w-0.5 bg-gray-200 -z-10"></div>
          
          <div className="grid md:grid-cols-2 gap-12 md:gap-y-32">
            {steps.map((step, index) => (
              <div 
                key={index} 
                className={`relative animate-fade-up ${index % 2 === 1 ? 'md:col-start-2' : ''}`}
                style={{ animationDelay: `${index * 200}ms` }}
              >
                <div className="rounded-xl p-6 border border-talent-gray-200 bg-white shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-start gap-5">
                    <div className={`${step.color} h-14 w-14 rounded-full flex items-center justify-center shrink-0`}>
                      {step.icon}
                    </div>
                    <div>
                      <div className="inline-block px-2.5 py-0.5 mb-3 rounded-full bg-talent-gray-200 text-xs font-semibold">
                        Step {step.number}
                      </div>
                      <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
                      <p className="text-talent-muted">{step.description}</p>
                    </div>
                  </div>
                </div>
                
                <div className="hidden md:block absolute top-1/2 w-6 h-6 rounded-full bg-white border-4 border-talent-primary transform -translate-y-1/2 left-0 md:left-[calc(index % 2 === 0 ? '100%' : '-3rem')]"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
