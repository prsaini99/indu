import { useEffect } from "react";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import {
  MessageCircle,
  Phone,
  Mail,
  MapPin,
  Headphones,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";

const contactMethods = [
  {
    icon: MessageCircle,
    title: "WhatsApp (Primary)",
    description: "Fastest way to connect",
    details: [
      "Quick responses to your queries",
      "Ask questions about courses & tutors",
      "Book a free demo class instantly",
    ],
    cta: "Chat on WhatsApp",
    href: "https://wa.me/918800463263",
    accent: "bg-green-50 border-green-200 hover:border-green-400",
    iconBg: "bg-green-100 text-green-600",
  },
  {
    icon: Phone,
    title: "Call Us",
    description: "Speak with an academic advisor",
    details: [
      "Personalized consultation",
      "Immediate assistance",
      "UAE-friendly hours: 9 AM – 9 PM",
    ],
    cta: "Call Now",
    href: "tel:+918800463263",
    accent: "bg-teal-50 border-teal-200 hover:border-teal-400",
    iconBg: "bg-teal-100 text-teal-600",
  },
  {
    icon: Mail,
    title: "Email Us",
    description: "For detailed inquiries",
    details: [
      "Course information & curriculum",
      "Pricing details & packages",
      "Partnership & collaboration inquiries",
    ],
    cta: "Send Email",
    href: "mailto:support@induae.com",
    accent: "bg-sky-50 border-sky-200 hover:border-sky-400",
    iconBg: "bg-sky-100 text-sky-600",
  },
];

const coverageAreas = [
  "Dubai",
  "Abu Dhabi",
  "Sharjah",
  "Ajman",
  "Ras Al Khaimah",
  "Fujairah",
];

const supportTopics = [
  "Choosing the right tutor for your child",
  "Understanding pricing & credit packages",
  "Scheduling & rescheduling sessions",
  "Tracking your child's academic progress",
];

const Contact = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen flex flex-col overflow-x-hidden">
      <Navbar />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-teal-600 to-teal-800 text-white pt-28 pb-16 md:pt-32 md:pb-20">
          <div className="container mx-auto px-4 md:px-6 text-center max-w-3xl">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              We're Here to Help You Get Started
            </h1>
            <p className="text-lg md:text-xl text-teal-100">
              Our academic advisors are here to guide you in finding the perfect
              tutor and learning plan for your child.
            </p>
          </div>
        </section>

        {/* Get in Touch */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4 max-w-6xl">
            <h2 className="text-3xl font-bold text-center text-gray-900 mb-2">
              Get in Touch
            </h2>
            <p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto">
              Choose the way that works best for you. We typically respond
              within minutes on WhatsApp.
            </p>

            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6">
              {contactMethods.map((method) => (
                <a
                  key={method.title}
                  href={method.href}
                  target={method.href.startsWith("http") ? "_blank" : undefined}
                  rel={
                    method.href.startsWith("http")
                      ? "noopener noreferrer"
                      : undefined
                  }
                  className={`block rounded-xl border-2 p-6 transition-all duration-200 ${method.accent}`}
                >
                  <div
                    className={`w-14 h-14 rounded-lg flex items-center justify-center mb-4 ${method.iconBg}`}
                  >
                    <method.icon className="w-7 h-7" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-1">
                    {method.title}
                  </h3>
                  <p className="text-sm text-gray-500 mb-4">
                    {method.description}
                  </p>
                  <ul className="space-y-2 mb-6">
                    {method.details.map((detail) => (
                      <li
                        key={detail}
                        className="flex items-start gap-2 text-sm text-gray-700"
                      >
                        <CheckCircle2 className="w-4 h-4 text-teal-500 mt-0.5 shrink-0" />
                        <span>{detail}</span>
                      </li>
                    ))}
                  </ul>
                  <span className="inline-flex items-center gap-1 text-sm font-medium text-teal-700">
                    {method.cta}
                    <ArrowRight className="w-4 h-4" />
                  </span>
                </a>
              ))}
            </div>
          </div>
        </section>

        {/* Book a Free Demo CTA */}
        <section className="py-16 bg-teal-50">
          <div className="container mx-auto px-4 max-w-4xl text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Book a Free Demo Class
            </h2>
            <p className="text-gray-600 text-lg mb-8 max-w-2xl mx-auto">
              Experience our teaching approach firsthand. A free demo session
              lets your child meet a qualified tutor, explore the subject, and
              see how personalized online learning works — with zero commitment.
            </p>
            <Link to="/book-demo">
              <Button
                size="lg"
                className="bg-teal-600 hover:bg-teal-700 text-white text-lg px-8 py-6"
              >
                Book Your Free Demo
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
          </div>
        </section>

        {/* Service Coverage */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4 max-w-5xl">
            <div className="flex items-center gap-3 justify-center mb-2">
              <MapPin className="w-6 h-6 text-teal-600" />
              <h2 className="text-3xl font-bold text-gray-900">
                Service Coverage
              </h2>
            </div>
            <p className="text-center text-gray-600 mb-10">
              Fully online — learn from anywhere in the UAE and beyond.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              {coverageAreas.map((area) => (
                <span
                  key={area}
                  className="px-5 py-2.5 bg-teal-50 text-teal-800 rounded-full text-sm font-medium border border-teal-200"
                >
                  {area}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* Support & Assistance */}
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4 max-w-4xl">
            <div className="flex items-center gap-3 justify-center mb-2">
              <Headphones className="w-6 h-6 text-teal-600" />
              <h2 className="text-3xl font-bold text-gray-900">
                Support & Assistance
              </h2>
            </div>
            <p className="text-center text-gray-600 mb-10">
              Our team can help you with:
            </p>
            <div className="grid sm:grid-cols-2 gap-4 max-w-2xl mx-auto">
              {supportTopics.map((topic) => (
                <div
                  key={topic}
                  className="flex items-start gap-3 bg-white rounded-lg p-4 border border-gray-200"
                >
                  <CheckCircle2 className="w-5 h-5 text-teal-500 mt-0.5 shrink-0" />
                  <span className="text-gray-700">{topic}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Closing CTA */}
        <section className="py-20 bg-gradient-to-br from-teal-700 to-teal-900 text-white">
          <div className="container mx-auto px-4 text-center max-w-3xl">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              One Conversation Can Change Your Child's Learning Journey
            </h2>
            <p className="text-teal-100 text-lg mb-8">
              Get in touch today and let us match your child with the perfect
              tutor.
            </p>
            <Link to="/book-demo">
              <Button
                size="lg"
                className="bg-white text-teal-700 hover:bg-teal-50 text-lg px-8 py-6 font-semibold"
              >
                Book Your Free Demo Class Now
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Contact;
