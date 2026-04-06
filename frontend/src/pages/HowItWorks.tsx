import { useEffect } from "react";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import {
  CalendarCheck,
  UserCheck,
  CreditCard,
  BookOpen,
  Video,
  BarChart3,
  TrendingUp,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";

const steps = [
  {
    number: 1,
    icon: CalendarCheck,
    title: "Book a Free Demo Class",
    subtitle: "Start with a No-Risk Trial",
    description:
      "Experience our teaching approach firsthand with a complimentary demo session. See how our tutors engage with your child, understand the methodology, and make an informed decision — all before any commitment.",
    bullets: [
      "No payment or credit card required",
      "30-minute personalised session",
      "Instant feedback from the tutor",
      "No obligation to continue",
    ],
  },
  {
    number: 2,
    icon: UserCheck,
    title: "Personalized Tutor Matching",
    subtitle: "Get the Right Tutor for Your Child",
    description:
      "Our consultants carefully match your child with a tutor based on multiple factors to ensure the best learning experience.",
    bullets: [
      "Curriculum alignment (CBSE, ICSE, IB, etc.)",
      "Subject and grade-level expertise",
      "Learning style compatibility",
      "Academic goals and areas of improvement",
    ],
  },
  {
    number: 3,
    icon: CreditCard,
    title: "Purchase Credits",
    subtitle: "Flexible Learning with No Lock-ins",
    description:
      "Our credit-based system gives you full control over your spending. Buy only what you need, use them at your own pace, and never worry about rigid subscriptions.",
    bullets: [
      "Choose a credit package that fits your budget",
      "Credits are added to your account instantly",
      "Credits are deducted per class attended",
      "No expiry pressure — learn at your pace",
    ],
  },
  {
    number: 4,
    icon: BookOpen,
    title: "Start Classes (1:1 or Small Group)",
    subtitle: "Begin Structured Learning",
    description:
      "Once matched and credits are loaded, your child can begin attending regular classes. Choose between private 1:1 sessions for focused attention or small group classes for collaborative learning.",
    bullets: [
      "Flexible scheduling that works for your family",
      "Interactive online sessions with screen sharing",
      "Structured lesson plans aligned to curriculum",
      "Homework and practice assignments after each class",
    ],
  },
  {
    number: 5,
    icon: Video,
    title: "Access Recorded Sessions",
    subtitle: "Never Miss or Forget a Lesson",
    description:
      "Every session is recorded and available in your dashboard. Your child can revisit concepts, catch up on missed classes, and reinforce learning at any time.",
    bullets: [
      "Full session recordings stored securely",
      "Revisit difficult topics anytime",
      "Catch up on missed classes easily",
      "Great for exam revision and review",
    ],
  },
  {
    number: 6,
    icon: BarChart3,
    title: "Track Progress via Parent Dashboard",
    subtitle: "Stay Informed at Every Step",
    description:
      "Your dedicated parent dashboard gives you real-time visibility into your child's learning journey. Monitor attendance, view tutor feedback, and track academic progress — all in one place.",
    bullets: [
      "Attendance and session history",
      "Tutor feedback after every class",
      "Performance reports and assessments",
      "Credit balance and usage overview",
    ],
  },
  {
    number: 7,
    icon: TrendingUp,
    title: "Continuous Improvement",
    subtitle: "Learn, Improve, and Excel",
    description:
      "Education is an ongoing journey. Our platform supports continuous improvement through regular assessments, tutor feedback loops, and adaptive learning strategies that evolve with your child's needs.",
    bullets: [
      "Regular progress check-ins with the tutor",
      "Adaptive lesson plans based on performance",
      "Goal setting and milestone tracking",
      "Option to switch tutors if needed",
    ],
  },
];

const journeySummary = [
  "Book a free demo class",
  "Get matched with the ideal tutor",
  "Purchase a flexible credit package",
  "Start 1:1 or small group classes",
  "Access recorded sessions anytime",
  "Track progress on your dashboard",
  "Achieve continuous academic improvement",
];

const whyItWorks = [
  "Zero risk — try before you commit with a free demo class",
  "Personalised matching ensures your child gets the right tutor from day one",
  "Credit-based pricing means you only pay for what you use — no subscriptions, no lock-ins",
  "Full transparency with recorded sessions, progress reports, and tutor feedback",
  "A dedicated consultant guides you through the entire journey",
];

const HowItWorks = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen flex flex-col overflow-x-hidden">
      <Navbar />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-teal-50 via-white to-teal-50 pt-28 pb-12 md:pt-32 md:pb-24">
          <div className="container mx-auto px-4 text-center max-w-3xl">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Simple, Transparent, and Designed for Results
            </h1>
            <p className="text-lg md:text-xl text-gray-600 leading-relaxed">
              From your first demo class to ongoing progress tracking, every step is
              clear, flexible, and fully transparent.
            </p>
          </div>
        </section>

        {/* Steps Timeline */}
        <section className="py-16 md:py-20 bg-white">
          <div className="container mx-auto px-4 max-w-4xl">
            <div className="relative">
              {/* Vertical line */}
              <div className="absolute left-6 md:left-8 top-0 bottom-0 w-0.5 bg-teal-200 hidden md:block" />

              <div className="space-y-12 md:space-y-16">
                {steps.map((step) => {
                  const Icon = step.icon;
                  return (
                    <div key={step.number} className="relative flex gap-6 md:gap-8">
                      {/* Step number circle */}
                      <div className="flex-shrink-0 relative z-10">
                        <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-teal-600 text-white flex items-center justify-center text-lg md:text-xl font-bold shadow-lg shadow-teal-200">
                          {step.number}
                        </div>
                      </div>

                      {/* Card content */}
                      <div className="flex-1 bg-white border border-gray-200 rounded-xl p-6 md:p-8 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-start gap-4 mb-4">
                          <div className="p-2.5 bg-teal-50 rounded-lg text-teal-600 flex-shrink-0">
                            <Icon className="w-6 h-6" />
                          </div>
                          <div>
                            <h3 className="text-xl md:text-2xl font-bold text-gray-900">
                              {step.title}
                            </h3>
                            <p className="text-teal-600 font-medium mt-0.5">
                              {step.subtitle}
                            </p>
                          </div>
                        </div>
                        <p className="text-gray-600 leading-relaxed mb-4">
                          {step.description}
                        </p>
                        <ul className="space-y-2">
                          {step.bullets.map((bullet, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-gray-700">
                              <CheckCircle2 className="w-4 h-4 text-teal-500 mt-1 flex-shrink-0" />
                              <span>{bullet}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* Full Journey Summary */}
        <section className="py-16 md:py-20 bg-gray-50">
          <div className="container mx-auto px-4 max-w-3xl text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Your Full Journey at a Glance
            </h2>
            <p className="text-gray-600 mb-10">
              Here is the complete path from discovery to academic excellence.
            </p>
            <div className="inline-block text-left">
              <ol className="space-y-4">
                {journeySummary.map((item, idx) => (
                  <li key={idx} className="flex items-center gap-4">
                    <span className="w-8 h-8 rounded-full bg-teal-600 text-white flex items-center justify-center text-sm font-bold flex-shrink-0">
                      {idx + 1}
                    </span>
                    <span className="text-gray-800 text-lg">{item}</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </section>

        {/* Why This Process Works */}
        <section className="py-16 md:py-20 bg-white">
          <div className="container mx-auto px-4 max-w-3xl">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-10 text-center">
              Why This Process Works
            </h2>
            <div className="space-y-5">
              {whyItWorks.map((point, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-4 bg-teal-50 border border-teal-100 rounded-lg p-5"
                >
                  <CheckCircle2 className="w-6 h-6 text-teal-600 mt-0.5 flex-shrink-0" />
                  <p className="text-gray-800 text-lg leading-relaxed">{point}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 md:py-24 bg-gradient-to-br from-teal-600 to-teal-700 text-white">
          <div className="container mx-auto px-4 max-w-2xl text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Getting Started Takes Just One Step
            </h2>
            <p className="text-teal-100 text-lg mb-8">
              Join hundreds of parents who have already transformed their children's
              academic journey. Your free demo class is waiting.
            </p>
            <Button
              asChild
              size="lg"
              className="bg-white text-teal-700 hover:bg-teal-50 text-lg px-8 py-6 font-semibold"
            >
              <Link to="/book-demo">
                Book Your Free Demo Class Today
                <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
            </Button>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default HowItWorks;
