import { CheckCircle, Users, Calendar, Video, BookOpen, Medal } from 'lucide-react';

const Features = () => {
  const features = [
    {
      icon: <BookOpen className="w-6 h-6 text-talent-primary" />,
      title: "Diverse Subjects",
      description: "Explore thousands of classes across subjects - from academics to arts, sports to coding."
    },
    {
      icon: <Users className="w-6 h-6 text-talent-primary" />,
      title: "Expert Tutors",
      description: "Learn from passionate, highly-qualified tutors who are experts in their fields."
    },
    {
      icon: <Video className="w-6 h-6 text-talent-primary" />,
      title: "Live Interactive Classes",
      description: "Engage in real-time with interactive video classes that make learning fun."
    },
    {
      icon: <Calendar className="w-6 h-6 text-talent-primary" />,
      title: "Flexible Scheduling",
      description: "Find classes that fit your schedule, with options for one-time or ongoing sessions."
    },
    {
      icon: <CheckCircle className="w-6 h-6 text-talent-primary" />,
      title: "Vetted Quality",
      description: "All tutors undergo thorough background checks and quality assessments."
    },
    {
      icon: <Medal className="w-6 h-6 text-talent-primary" />,
      title: "Growth Tracking",
      description: "Monitor progress with regular assessments and personalized feedback."
    }
  ];

  return (
    <section className="py-8 md:py-20 bg-white">
      <div className="container mx-auto px-4 md:px-6">
        <div className="text-center max-w-3xl mx-auto mb-8 md:mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Why Families Choose Indu AE</h2>
          <p className="text-talent-muted text-lg">
            We're transforming online education with personalized learning experiences tailored to each child's needs.
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div 
              key={index} 
              className="p-6 rounded-xl border border-talent-gray-200 bg-talent-light hover:shadow-md transition-all duration-300 animate-fade-up"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="mb-4 p-3 rounded-full bg-talent-primary/10 w-fit">
                {feature.icon}
              </div>
              <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
              <p className="text-talent-muted">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
