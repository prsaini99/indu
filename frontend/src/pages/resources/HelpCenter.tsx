
import PageLayout from "@/components/PageLayout";
import { Button } from "@/components/ui/button";
import { Search, Headphones, Mail, MessageSquare, FileQuestion, Users, BookOpen, Shield, CreditCard } from "lucide-react";
import { useState } from "react";

const HelpCenter = () => {
  const [searchQuery, setSearchQuery] = useState("");
  
  const popularTopics = [
    {
      title: "Getting Started",
      icon: <BookOpen className="h-8 w-8 text-talent-primary" />,
      questions: [
        "How do I create an account?",
        "How do I enroll my child in a class?",
        "What technology do we need for classes?",
        "How do I find the right class for my child?",
      ]
    },
    {
      title: "Account & Profile",
      icon: <Users className="h-8 w-8 text-talent-primary" />,
      questions: [
        "How do I update my profile information?",
        "Can I have multiple children on one account?",
        "How do I reset my password?",
        "Can I change the email address on my account?",
      ]
    },
    {
      title: "Classes & Learning",
      icon: <MessageSquare className="h-8 w-8 text-talent-primary" />,
      questions: [
        "How do we join a scheduled class?",
        "What happens if we miss a class?",
        "How do I contact my child's tutor?",
        "Can I request a specific time for a class?",
      ]
    },
    {
      title: "Payments & Billing",
      icon: <CreditCard className="h-8 w-8 text-talent-primary" />,
      questions: [
        "What payment methods do you accept?",
        "How do refunds work?",
        "Can I get an invoice for tax purposes?",
        "How do I update my payment information?",
      ]
    },
    {
      title: "Privacy & Security",
      icon: <Shield className="h-8 w-8 text-talent-primary" />,
      questions: [
        "How is my child's data protected?",
        "Is the classroom environment secure?",
        "What information do tutors have access to?",
        "How are tutors vetted and verified?",
      ]
    },
    {
      title: "Troubleshooting",
      icon: <FileQuestion className="h-8 w-8 text-talent-primary" />,
      questions: [
        "What if the video or audio isn't working?",
        "How do I improve connection quality?",
        "What browsers work best with Indu AE?",
        "How do I report a technical issue?",
      ]
    },
  ];

  const contactMethods = [
    {
      title: "Live Chat",
      description: "Chat with our support team in real-time for immediate assistance.",
      icon: <MessageSquare className="h-10 w-10 text-talent-primary" />,
      availability: "Available 9 AM - 9 PM IST, 7 days a week",
      action: "Start Chat",
    },
    {
      title: "Email Support",
      description: "Send us an email with your questions or concerns for a detailed response.",
      icon: <Mail className="h-10 w-10 text-talent-primary" />,
      availability: "Responses within 24 hours",
      action: "Send Email",
    },
    {
      title: "Phone Support",
      description: "Speak directly with our support team for complex issues or urgent matters.",
      icon: <Headphones className="h-10 w-10 text-talent-primary" />,
      availability: "Available 10 AM - 7 PM IST, Monday-Friday",
      action: "Call Support",
    },
  ];

  return (
    <PageLayout
      title="Help Center"
      description="Find answers to your questions and get the support you need to make the most of Indu AE."
    >
      <div className="space-y-16">
        {/* Search section */}
        <div className="bg-talent-gray-100 p-8 rounded-xl">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold mb-6 text-center">How can we help you?</h2>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Type your question or search by keyword..."
                className="w-full pl-12 pr-4 py-4 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-talent-primary focus:border-transparent"
              />
              <Button className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-talent-primary hover:bg-talent-secondary text-white font-medium">
                Search
              </Button>
            </div>
          </div>
        </div>
        
        {/* Popular topics */}
        <div>
          <h2 className="text-2xl md:text-3xl font-bold mb-8 text-center">Popular Help Topics</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {popularTopics.map((topic, index) => (
              <div key={index} className="border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3 mb-4">
                  {topic.icon}
                  <h3 className="text-xl font-semibold">{topic.title}</h3>
                </div>
                <ul className="space-y-2">
                  {topic.questions.map((question, i) => (
                    <li key={i}>
                      <a 
                        href="#" 
                        className="block p-2 hover:bg-talent-primary/5 rounded-md text-talent-dark hover:text-talent-primary transition-colors"
                      >
                        {question}
                      </a>
                    </li>
                  ))}
                </ul>
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <Button variant="ghost" className="w-full justify-center text-talent-primary hover:text-talent-secondary hover:bg-talent-primary/5">
                    View All Articles
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Contact support section */}
        <div className="bg-talent-primary/5 p-8 rounded-xl">
          <h2 className="text-2xl md:text-3xl font-bold mb-8 text-center">Need More Help?</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {contactMethods.map((method, index) => (
              <div key={index} className="bg-white p-6 rounded-xl border border-gray-200 text-center">
                <div className="mx-auto w-fit mb-3">{method.icon}</div>
                <h3 className="text-xl font-semibold mb-2">{method.title}</h3>
                <p className="text-talent-muted mb-4">{method.description}</p>
                <div className="text-xs text-talent-muted mb-4">{method.availability}</div>
                <Button className="w-full bg-talent-primary hover:bg-talent-secondary text-white">
                  {method.action}
                </Button>
              </div>
            ))}
          </div>
        </div>
        
        {/* Video tutorials */}
        <div>
          <h2 className="text-2xl md:text-3xl font-bold mb-8 text-center">Video Tutorials</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="border border-gray-200 rounded-xl overflow-hidden hover:shadow-md transition-shadow">
              <div className="aspect-video bg-gray-100 relative">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-16 h-16 bg-talent-primary/90 rounded-full flex items-center justify-center cursor-pointer hover:bg-talent-primary transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white ml-1" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </div>
                </div>
              </div>
              <div className="p-4">
                <h3 className="font-semibold mb-1">Getting Started Guide</h3>
                <p className="text-talent-muted text-sm">A complete walkthrough of the Indu AE platform and features.</p>
              </div>
            </div>
            <div className="border border-gray-200 rounded-xl overflow-hidden hover:shadow-md transition-shadow">
              <div className="aspect-video bg-gray-100 relative">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-16 h-16 bg-talent-primary/90 rounded-full flex items-center justify-center cursor-pointer hover:bg-talent-primary transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white ml-1" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </div>
                </div>
              </div>
              <div className="p-4">
                <h3 className="font-semibold mb-1">Using the Virtual Classroom</h3>
                <p className="text-talent-muted text-sm">Learn how to navigate and use all the features of our online classroom.</p>
              </div>
            </div>
            <div className="border border-gray-200 rounded-xl overflow-hidden hover:shadow-md transition-shadow">
              <div className="aspect-video bg-gray-100 relative">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-16 h-16 bg-talent-primary/90 rounded-full flex items-center justify-center cursor-pointer hover:bg-talent-primary transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white ml-1" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </div>
                </div>
              </div>
              <div className="p-4">
                <h3 className="font-semibold mb-1">Troubleshooting Common Issues</h3>
                <p className="text-talent-muted text-sm">Solutions for the most frequently encountered technical problems.</p>
              </div>
            </div>
          </div>
          <div className="mt-6 text-center">
            <Button variant="outline" className="border-talent-primary text-talent-primary hover:bg-talent-primary/5">
              View All Video Tutorials
            </Button>
          </div>
        </div>
        
        {/* FAQ section */}
        <div className="bg-talent-gray-100 p-8 rounded-xl">
          <h2 className="text-2xl font-bold mb-6">Frequently Asked Questions</h2>
          <div className="space-y-4">
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <h3 className="text-lg font-semibold mb-2">What ages does Indu AE support?</h3>
              <p className="text-talent-muted">
                Indu AE offers classes for children ages 3-18. We have specially designed classes for different age groups with age-appropriate content and teaching methods.
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <h3 className="text-lg font-semibold mb-2">How do I know if a class is right for my child?</h3>
              <p className="text-talent-muted">
                Each class listing includes detailed information about recommended ages, skill levels, and prerequisites. Many tutors also offer free trial classes or consultations to help determine fit.
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <h3 className="text-lg font-semibold mb-2">What's your refund policy?</h3>
              <p className="text-talent-muted">
                If you're not satisfied with your first class, we offer a full refund. For ongoing courses, refunds are available for unused classes when cancellation policies are followed.
              </p>
            </div>
          </div>
          <div className="mt-6 text-center">
            <Button variant="outline" className="border-talent-primary text-talent-primary hover:bg-talent-primary/5">
              View All FAQs
            </Button>
          </div>
        </div>
        
        {/* Community support */}
        <div className="text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">Join Our Community</h2>
          <p className="text-talent-muted mb-6 max-w-2xl mx-auto">
            Connect with other parents and tutors in our community forums to share experiences, ask questions, and get peer support.
          </p>
          <Button size="lg" className="bg-talent-primary hover:bg-talent-secondary text-white">
            Visit Community Forums
          </Button>
        </div>
      </div>
    </PageLayout>
  );
};

export default HelpCenter;
