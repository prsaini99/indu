import { useEffect } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import {
  GraduationCap,
  Users,
  Eye,
  CreditCard,
  Globe,
  Target,
  Lightbulb,
  TrendingUp,
  ShieldCheck,
  BookOpen,
  Video,
  BarChart3,
  ClipboardCheck,
  MessageSquare,
  Star,
  CheckCircle,
  ArrowRight,
} from "lucide-react";

const About = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen flex flex-col overflow-x-hidden">
      <Navbar />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative pt-28 pb-16 md:pt-32 md:pb-20 bg-gradient-to-br from-teal-600 via-teal-700 to-teal-900 text-white overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-10 left-10 w-72 h-72 bg-white rounded-full blur-3xl" />
            <div className="absolute bottom-10 right-10 w-96 h-96 bg-teal-300 rounded-full blur-3xl" />
          </div>
          <div className="container mx-auto px-4 md:px-6 relative z-10 text-center max-w-4xl">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              Redefining Learning for UAE Students
            </h1>
            <p className="text-lg md:text-xl text-teal-100 max-w-3xl mx-auto">
              A next-generation online tutoring platform connecting highly
              qualified Indian educators with students across the UAE.
            </p>
          </div>
        </section>

        {/* Who We Are */}
        <section className="py-16 md:py-20 bg-white">
          <div className="container mx-auto px-4 md:px-6 max-w-4xl">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-6 text-gray-900">
              Who We Are
            </h2>
            <p className="text-lg text-gray-600 text-center leading-relaxed">
              Indu AE is a next-generation online tutoring platform connecting
              highly qualified Indian educators with students across the UAE. We
              believe every child deserves access to world-class teaching --
              personalized, affordable, and transparent. Our platform bridges the
              gap between India's vast pool of talented educators and UAE
              families looking for academic excellence.
            </p>
          </div>
        </section>

        {/* The Problem We're Solving */}
        <section className="py-16 md:py-20 bg-gray-50">
          <div className="container mx-auto px-4 md:px-6 max-w-5xl">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-4 text-gray-900">
              The Problem We're Solving
            </h2>
            <p className="text-gray-600 text-center mb-12 max-w-2xl mx-auto">
              Parents in the UAE face real challenges when it comes to finding
              the right academic support for their children.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                {
                  icon: <CreditCard className="h-6 w-6" />,
                  title: "High Cost of Tutoring",
                  desc: "Private tutoring in the UAE is expensive, putting quality education out of reach for many families.",
                },
                {
                  icon: <Users className="h-6 w-6" />,
                  title: "Lack of Personalized Attention",
                  desc: "Large class sizes and one-size-fits-all approaches leave students struggling without individual support.",
                },
                {
                  icon: <Eye className="h-6 w-6" />,
                  title: "No Visibility for Parents",
                  desc: "Parents have little insight into what's being taught, how their child is performing, or whether sessions are effective.",
                },
                {
                  icon: <ClipboardCheck className="h-6 w-6" />,
                  title: "Rigid Structures",
                  desc: "Fixed schedules and inflexible plans don't accommodate the diverse needs of modern UAE families.",
                },
                {
                  icon: <Video className="h-6 w-6" />,
                  title: "Missed Classes",
                  desc: "When a student misses a session, there's often no way to catch up, leading to gaps in learning.",
                },
              ].map((item, i) => (
                <div
                  key={i}
                  className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
                >
                  <div className="w-12 h-12 rounded-lg bg-red-50 text-red-500 flex items-center justify-center mb-4">
                    {item.icon}
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">
                    {item.title}
                  </h3>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* What Makes Us Different */}
        <section className="py-16 md:py-20 bg-white">
          <div className="container mx-auto px-4 md:px-6 max-w-5xl">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-4 text-gray-900">
              What Makes Us Different
            </h2>
            <p className="text-gray-600 text-center mb-12 max-w-2xl mx-auto">
              We've built our platform from the ground up to address the unique
              challenges faced by UAE families.
            </p>
            <div className="space-y-8">
              {[
                {
                  icon: <GraduationCap className="h-7 w-7" />,
                  title: "1. Personalized Learning at Scale",
                  desc: "Every student gets a tailored learning plan based on their curriculum, grade level, and learning style. Our tutors adapt their teaching methods to match each student's pace and needs -- ensuring no child is left behind.",
                },
                {
                  icon: <Star className="h-7 w-7" />,
                  title: "2. India's Top Educators",
                  desc: "We recruit only the best. Our tutors are experienced professionals from India's leading educational institutions, rigorously vetted for subject expertise, teaching ability, and communication skills.",
                },
                {
                  icon: <Eye className="h-7 w-7" />,
                  title: "3. Full Parent Transparency",
                  desc: "Parents get complete visibility through a dedicated Parent Dashboard showing real-time progress, session feedback, and performance reports. Every class is recorded so parents can review sessions anytime.",
                },
                {
                  icon: <CreditCard className="h-7 w-7" />,
                  title: "4. Flexible Credit-Based Learning",
                  desc: "No rigid monthly plans. Buy credits and use them when you need them. Switch subjects, reschedule sessions, or try different tutors -- all with the same credit balance.",
                },
                {
                  icon: <Globe className="h-7 w-7" />,
                  title: "5. Built for UAE Students",
                  desc: "We support CBSE, ICSE, British, American, and IB curricula. Our tutors understand the UAE academic calendar, exam patterns, and the specific needs of students studying in the region.",
                },
              ].map((item, i) => (
                <div
                  key={i}
                  className="flex gap-5 items-start bg-gray-50 rounded-xl p-6 hover:bg-teal-50/50 transition-colors"
                >
                  <div className="w-14 h-14 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center flex-shrink-0">
                    {item.icon}
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg text-gray-900 mb-2">
                      {item.title}
                    </h3>
                    <p className="text-gray-600 leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Mission & Vision */}
        <section className="py-16 md:py-20 bg-gray-50">
          <div className="container mx-auto px-4 md:px-6 max-w-5xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
                <div className="w-14 h-14 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center mb-5">
                  <Target className="h-7 w-7" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  Our Mission
                </h2>
                <p className="text-gray-600 leading-relaxed">
                  To empower students with personalized learning that improves
                  grades, builds confidence, and creates strong academic
                  foundations -- all at an affordable price point for UAE
                  families.
                </p>
              </div>
              <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
                <div className="w-14 h-14 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center mb-5">
                  <Lightbulb className="h-7 w-7" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  Our Vision
                </h2>
                <p className="text-gray-600 leading-relaxed">
                  To become the most trusted online tutoring platform for UAE
                  students -- known for quality teaching, transparency, and
                  measurable academic outcomes.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Our Approach */}
        <section className="py-16 md:py-20 bg-white">
          <div className="container mx-auto px-4 md:px-6 max-w-5xl">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-4 text-gray-900">
              Our Approach
            </h2>
            <p className="text-gray-600 text-center mb-12 max-w-2xl mx-auto">
              A proven 6-step methodology designed to deliver real academic
              results.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                {
                  step: 1,
                  icon: <MessageSquare className="h-6 w-6" />,
                  title: "Free Consultation",
                  desc: "We start with a free demo class to understand the student's needs, strengths, and areas for improvement.",
                },
                {
                  step: 2,
                  icon: <Users className="h-6 w-6" />,
                  title: "Tutor Matching",
                  desc: "Based on the student's curriculum, grade, and learning style, we match them with the ideal tutor.",
                },
                {
                  step: 3,
                  icon: <BookOpen className="h-6 w-6" />,
                  title: "Custom Learning Plan",
                  desc: "The tutor creates a personalized plan aligned with the student's syllabus and academic goals.",
                },
                {
                  step: 4,
                  icon: <Video className="h-6 w-6" />,
                  title: "Live 1-on-1 Sessions",
                  desc: "Interactive, engaging sessions conducted over video with real-time doubt solving and practice.",
                },
                {
                  step: 5,
                  icon: <BarChart3 className="h-6 w-6" />,
                  title: "Progress Tracking",
                  desc: "Regular assessments, session reports, and performance dashboards keep everyone aligned.",
                },
                {
                  step: 6,
                  icon: <TrendingUp className="h-6 w-6" />,
                  title: "Continuous Improvement",
                  desc: "We refine the learning plan based on progress, ensuring the student is always moving forward.",
                },
              ].map((item) => (
                <div
                  key={item.step}
                  className="relative bg-gray-50 rounded-xl p-6 hover:shadow-md transition-shadow"
                >
                  <div className="absolute -top-3 -left-3 w-8 h-8 rounded-full bg-teal-600 text-white text-sm font-bold flex items-center justify-center">
                    {item.step}
                  </div>
                  <div className="w-12 h-12 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center mb-4">
                    {item.icon}
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">
                    {item.title}
                  </h3>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Our Impact */}
        <section className="py-16 md:py-20 bg-gray-50">
          <div className="container mx-auto px-4 md:px-6 max-w-5xl">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-gray-900">
              Our Impact
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                {
                  icon: <TrendingUp className="h-7 w-7" />,
                  stat: "90%+",
                  label: "Students show measurable grade improvement within 3 months",
                },
                {
                  icon: <Star className="h-7 w-7" />,
                  stat: "4.8/5",
                  label: "Average parent satisfaction rating across all sessions",
                },
                {
                  icon: <Users className="h-7 w-7" />,
                  stat: "500+",
                  label: "Qualified Indian educators vetted and ready to teach",
                },
                {
                  icon: <Globe className="h-7 w-7" />,
                  stat: "5+",
                  label: "Curricula supported including CBSE, ICSE, British, American & IB",
                },
              ].map((item, i) => (
                <div
                  key={i}
                  className="bg-white rounded-xl p-6 text-center shadow-sm border border-gray-100"
                >
                  <div className="w-14 h-14 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center mx-auto mb-4">
                    {item.icon}
                  </div>
                  <div className="text-3xl font-bold text-teal-700 mb-2">
                    {item.stat}
                  </div>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    {item.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Why Parents Trust Us */}
        <section className="py-16 md:py-20 bg-white">
          <div className="container mx-auto px-4 md:px-6 max-w-4xl">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-gray-900">
              Why Parents Trust Us
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                {
                  icon: <ShieldCheck className="h-6 w-6" />,
                  title: "Verified & Vetted Tutors",
                  desc: "Every tutor undergoes a rigorous screening process including background checks, subject tests, and demo evaluations.",
                },
                {
                  icon: <Eye className="h-6 w-6" />,
                  title: "Complete Transparency",
                  desc: "Recorded sessions, real-time progress tracking, and detailed feedback after every class give parents full visibility.",
                },
                {
                  icon: <CreditCard className="h-6 w-6" />,
                  title: "Affordable & Flexible",
                  desc: "Credit-based pricing means you only pay for what you use. No hidden fees, no long-term contracts.",
                },
                {
                  icon: <CheckCircle className="h-6 w-6" />,
                  title: "Proven Results",
                  desc: "Our structured approach delivers measurable improvements in grades, confidence, and study habits.",
                },
              ].map((item, i) => (
                <div
                  key={i}
                  className="flex gap-4 items-start p-5 rounded-xl border border-gray-100 hover:border-teal-200 transition-colors"
                >
                  <div className="w-12 h-12 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center flex-shrink-0">
                    {item.icon}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">
                      {item.title}
                    </h3>
                    <p className="text-gray-600 text-sm leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 md:py-20 bg-gradient-to-br from-teal-600 to-teal-800 text-white">
          <div className="container mx-auto px-4 md:px-6 text-center max-w-3xl">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Ready to Transform Your Child's Learning?
            </h2>
            <p className="text-teal-100 text-lg mb-8">
              Experience the difference with a free demo class. See our teaching
              quality firsthand -- no commitment required.
            </p>
            <Link to="/book-demo">
              <Button
                size="lg"
                className="bg-white text-teal-700 hover:bg-teal-50 font-semibold px-8 py-6 text-lg rounded-xl"
              >
                Book a Free Demo Class Today
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default About;
