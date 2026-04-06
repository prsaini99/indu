import { useEffect } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import {
  BarChart3,
  Video,
  CreditCard,
  Target,
  GraduationCap,
  Clock,
  TrendingUp,
} from "lucide-react";

const features = [
  {
    icon: BarChart3,
    title: "Parent Dashboard",
    headline: "Complete Visibility into Your Child's Learning",
    description:
      "Stay informed every step of the way. Our Parent Dashboard gives you real-time access to your child's learning journey — from attendance and class recordings to tutor feedback and progress reports.",
    benefits: [
      "Live class schedules and attendance tracking",
      "Access to recorded sessions anytime",
      "Tutor feedback and performance summaries",
      "Credit balance and usage history",
    ],
    whyItMatters:
      "Parents no longer have to wonder what's happening in class. Full transparency means you're always in control of your child's education.",
  },
  {
    icon: Video,
    title: "Recorded Classes",
    headline: "Every Class, Always Accessible",
    description:
      "Every live session is automatically recorded and stored in your dashboard. Students can revisit lessons, catch up on missed classes, or review tricky concepts — anytime, anywhere.",
    benefits: [
      "Automatic recording of all live sessions",
      "On-demand playback from any device",
      "Great for revision before exams",
      "Parents can review teaching quality",
    ],
    whyItMatters:
      "Learning doesn't stop when the class ends. Recorded sessions ensure no lesson is ever lost and every student can learn at their own pace.",
  },
  {
    icon: CreditCard,
    title: "Credit-Based Learning System",
    headline: "Pay Only for What You Use",
    description:
      "Our flexible credit system lets you purchase learning credits and use them to book classes as needed. No long-term commitments, no wasted payments — just smart, flexible learning.",
    benefits: [
      "Buy credits in packages that suit your budget",
      "Use credits across any subject or tutor",
      "Transparent pricing with no hidden fees",
      "Unused credits carry forward",
    ],
    whyItMatters:
      "Families shouldn't be locked into rigid payment plans. Credits give you the freedom to learn on your terms — and only pay for the classes you actually take.",
  },
  {
    icon: Target,
    title: "Personalized Learning Paths",
    headline: "Tailored to Every Student's Needs",
    description:
      "No two students learn the same way. Our platform matches students with the right tutor and curriculum based on their grade level, learning style, and academic goals.",
    benefits: [
      "Customized lesson plans for every student",
      "Adaptive pacing based on student progress",
      "Goal-oriented teaching aligned with school curricula",
      "Support for CBSE, ICSE, IB, and UAE MOE frameworks",
    ],
    whyItMatters:
      "Cookie-cutter tutoring doesn't work. Personalized paths ensure every student gets exactly the support they need to succeed.",
  },
  {
    icon: GraduationCap,
    title: "Expert Indian Tutors",
    headline: "High-Quality Teaching at Global Standards",
    description:
      "Our tutors are experienced, qualified educators from India — carefully vetted for subject expertise, teaching ability, and communication skills. They bring world-class instruction at competitive rates.",
    benefits: [
      "Rigorously screened and interviewed tutors",
      "Specialists across Maths, Science, English, and more",
      "Experience with international curricula",
      "Fluent in English with clear communication",
    ],
    whyItMatters:
      "The quality of a tutor makes or breaks the learning experience. Our vetting process ensures only the best educators join the platform.",
  },
  {
    icon: Clock,
    title: "Flexible Scheduling (UAE Friendly)",
    headline: "Learn at Your Convenience",
    description:
      "Book classes at times that work for your family. Our scheduling system is optimized for UAE time zones, with availability across mornings, afternoons, and evenings — including weekends.",
    benefits: [
      "Classes available 7 days a week",
      "Morning, afternoon, and evening slots",
      "Easy rescheduling with credit protection",
      "Timezone-optimized for UAE families",
    ],
    whyItMatters:
      "Busy families need flexibility. Our scheduling ensures learning fits into your life — not the other way around.",
  },
  {
    icon: TrendingUp,
    title: "Continuous Assessment & Feedback",
    headline: "Track Progress. Improve Faster.",
    description:
      "Regular assessments and detailed tutor feedback keep students on track. Parents and students receive progress reports that highlight strengths, areas for improvement, and recommended next steps.",
    benefits: [
      "Periodic assessments after every learning milestone",
      "Detailed tutor feedback after each session",
      "Visual progress reports in the dashboard",
      "Actionable recommendations for improvement",
    ],
    whyItMatters:
      "Without regular feedback, learning gaps go unnoticed. Continuous assessment ensures students stay on the path to success.",
  },
];

const Features = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen flex flex-col overflow-x-hidden">
      <Navbar />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-teal-50 to-white pt-28 pb-16 md:pt-32 md:pb-20">
          <div className="container mx-auto px-4 md:px-6 text-center max-w-3xl">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              A Smarter Learning System — Built for Students &amp; Parents
            </h1>
            <p className="text-lg md:text-xl text-gray-600 leading-relaxed">
              A complete learning ecosystem that ensures transparency, flexibility, and measurable
              results — so every student gets the support they need to thrive.
            </p>
          </div>
        </section>

        {/* Features Grid */}
        <section className="py-16 md:py-20">
          <div className="container mx-auto px-4 md:px-6">
            <div className="grid gap-12 md:gap-16">
              {features.map((feature, index) => {
                const Icon = feature.icon;
                const isEven = index % 2 === 0;

                return (
                  <div
                    key={feature.title}
                    className={`flex flex-col lg:flex-row items-start gap-8 lg:gap-12 ${
                      isEven ? "" : "lg:flex-row-reverse"
                    }`}
                  >
                    {/* Icon & Title Card */}
                    <div className="lg:w-1/3 w-full">
                      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-8 h-full">
                        <div className="w-14 h-14 rounded-xl bg-teal-100 flex items-center justify-center mb-5">
                          <Icon className="w-7 h-7 text-teal-600" />
                        </div>
                        <h3 className="text-sm font-semibold text-teal-600 uppercase tracking-wide mb-2">
                          {feature.title}
                        </h3>
                        <h2 className="text-2xl font-bold text-gray-900">
                          {feature.headline}
                        </h2>
                      </div>
                    </div>

                    {/* Details */}
                    <div className="lg:w-2/3 w-full">
                      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-8 h-full">
                        <p className="text-gray-600 leading-relaxed mb-6">
                          {feature.description}
                        </p>

                        <div className="mb-6">
                          <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-3">
                            Key Benefits
                          </h4>
                          <ul className="grid sm:grid-cols-2 gap-2">
                            {feature.benefits.map((benefit) => (
                              <li
                                key={benefit}
                                className="flex items-start gap-2 text-gray-600"
                              >
                                <span className="mt-1.5 w-2 h-2 rounded-full bg-teal-500 shrink-0" />
                                {benefit}
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div className="bg-teal-50 rounded-xl p-4">
                          <p className="text-sm text-teal-800">
                            <span className="font-semibold">Why It Matters: </span>
                            {feature.whyItMatters}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Closing CTA */}
        <section className="bg-teal-600 py-16 md:py-20">
          <div className="container mx-auto px-4 md:px-6 text-center max-w-2xl">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              More Than Just Classes — A Complete Learning System
            </h2>
            <p className="text-teal-100 text-lg mb-8">
              Experience transparent, flexible, and results-driven tutoring designed for UAE
              families. Start with a free demo class and see the difference.
            </p>
            <Button
              asChild
              size="lg"
              className="bg-white text-teal-600 hover:bg-teal-50 text-base px-8 py-3 h-auto"
            >
              <Link to="/book-demo">Book a Free Demo Class Today</Link>
            </Button>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Features;
