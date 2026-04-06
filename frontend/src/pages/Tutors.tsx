import { useEffect } from "react";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import {
  GraduationCap,
  Award,
  BookOpen,
  Users,
  ShieldCheck,
  BarChart3,
  Monitor,
  FileText,
  Clock,
  Search,
  MessageSquare,
  Star,
  CheckCircle2,
  ArrowRight,
  Lightbulb,
  Target,
  Brain,
  HeartHandshake,
  Globe,
  IndianRupee,
  UserCheck,
  Video,
  ClipboardCheck,
  Sparkles,
} from "lucide-react";

const selectionSteps = [
  {
    step: 1,
    title: "Screening & Credential Verification",
    description:
      "We verify every tutor's academic degrees, teaching certifications, and professional experience. Only candidates with proven backgrounds proceed.",
    icon: Search,
  },
  {
    step: 2,
    title: "Demo Class Assessment",
    description:
      "Each tutor delivers a live demo class evaluated by our academic team for subject mastery, clarity of explanation, and student engagement techniques.",
    icon: Video,
  },
  {
    step: 3,
    title: "Communication & Compatibility Check",
    description:
      "We assess English fluency, teaching temperament, patience with diverse learning styles, and ability to connect with students across cultures.",
    icon: MessageSquare,
  },
  {
    step: 4,
    title: "Training & Onboarding",
    description:
      "Selected tutors complete our onboarding program covering our platform tools, reporting standards, curriculum alignment, and parent communication protocols.",
    icon: ClipboardCheck,
  },
];

const methodologyPoints = [
  {
    title: "Concept-First Teaching",
    description:
      "Tutors focus on building deep conceptual understanding rather than rote memorization or rushing through the syllabus.",
    icon: Brain,
  },
  {
    title: "Personalized Lesson Plans",
    description:
      "Every student receives a customized learning plan based on their current level, learning pace, and academic goals.",
    icon: FileText,
  },
  {
    title: "Interactive & Engaging Sessions",
    description:
      "Live classes use whiteboards, screen sharing, quizzes, and real-time problem solving to keep students actively engaged.",
    icon: Lightbulb,
  },
  {
    title: "Regular Assessments & Feedback",
    description:
      "Periodic tests, homework reviews, and detailed progress reports keep parents informed and students on track.",
    icon: Target,
  },
  {
    title: "Exam-Oriented Preparation",
    description:
      "Tutors provide targeted exam prep with past papers, timed practice, and strategy sessions for board and competitive exams.",
    icon: Award,
  },
];

const accountabilityPoints = [
  {
    title: "Session Quality Reviews",
    description: "Random audits and recorded session reviews ensure consistent teaching standards.",
    icon: ShieldCheck,
  },
  {
    title: "Student Progress Tracking",
    description: "Measurable improvement in grades, test scores, and conceptual understanding over time.",
    icon: BarChart3,
  },
  {
    title: "Parent Feedback Integration",
    description: "Regular parent feedback is collected and directly influences tutor evaluations.",
    icon: HeartHandshake,
  },
  {
    title: "Performance-Based Continuation",
    description: "Tutors who consistently underperform are retrained or replaced to protect your child's learning.",
    icon: Star,
  },
];

const transparencyPoints = [
  {
    title: "Recorded Sessions",
    description: "Every class is recorded so parents can review what was taught at any time.",
    icon: Video,
  },
  {
    title: "Real-Time Progress Dashboard",
    description: "Track attendance, homework completion, test scores, and tutor notes from your parent portal.",
    icon: Monitor,
  },
  {
    title: "Detailed Session Reports",
    description: "After each class, tutors submit reports covering topics taught, student participation, and next steps.",
    icon: FileText,
  },
  {
    title: "Flexible Scheduling",
    description: "Reschedule or adjust class timings with full visibility into your tutor's availability.",
    icon: Clock,
  },
];

const matchingFactors = [
  {
    title: "Subject & Board Expertise",
    description: "We match tutors who specialize in your child's specific curriculum — CBSE, ICSE, IB, IGCSE, or British.",
    icon: BookOpen,
  },
  {
    title: "Learning Style Compatibility",
    description: "Visual, auditory, or kinesthetic — we consider how your child learns best when selecting a tutor.",
    icon: Users,
  },
  {
    title: "Personality & Temperament",
    description: "A patient, encouraging tutor for a shy student; a firm, structured one for those who need discipline.",
    icon: HeartHandshake,
  },
  {
    title: "Schedule & Timezone Alignment",
    description: "Tutors are matched based on availability that fits your family's routine seamlessly.",
    icon: Clock,
  },
];

const whyIndianTutors = [
  {
    title: "World-Class Academic Tradition",
    description:
      "India produces millions of STEM graduates and has a deep-rooted culture of academic excellence and competitive exam preparation.",
    icon: GraduationCap,
  },
  {
    title: "Rigorous Training & Expertise",
    description:
      "Indian tutors are trained in some of the most demanding educational systems, making them exceptionally thorough and methodical.",
    icon: Award,
  },
  {
    title: "English Fluency",
    description:
      "With English as a primary medium of instruction, Indian tutors communicate clearly and effectively with students worldwide.",
    icon: Globe,
  },
  {
    title: "Exceptional Value",
    description:
      "Access world-class teaching talent at a fraction of the cost compared to local tutors in the UAE, without compromising on quality.",
    icon: IndianRupee,
  },
];

const parentExpectations = [
  {
    title: "Qualified & Vetted Tutors",
    description: "Every tutor has been rigorously screened, tested, and trained before they teach your child.",
    icon: UserCheck,
  },
  {
    title: "Consistent Quality",
    description: "Ongoing monitoring ensures every session meets our high standards — no off days, no shortcuts.",
    icon: ShieldCheck,
  },
  {
    title: "Full Transparency",
    description: "See exactly what your child is learning, how they're progressing, and what comes next.",
    icon: Monitor,
  },
  {
    title: "Dedicated Support",
    description: "Our consultant team is always available to address concerns, adjust plans, or switch tutors if needed.",
    icon: HeartHandshake,
  },
];

const Tutors = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen flex flex-col overflow-x-hidden">
      <Navbar />

      <main>
        {/* Hero Section */}
        <section className="pt-28 pb-16 bg-gradient-to-br from-teal-50 via-white to-teal-50">
          <div className="container mx-auto px-4 md:px-6 text-center max-w-4xl">
            <span className="inline-block px-4 py-1.5 bg-teal-100 text-teal-700 rounded-full text-sm font-medium mb-6">
              Our Tutors
            </span>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 leading-tight">
              Learn from India's Most{" "}
              <span className="text-teal-600">Trusted Educators</span>
            </h1>
            <p className="text-lg md:text-xl text-gray-600 leading-relaxed max-w-3xl mx-auto">
              Our carefully curated network of highly qualified Indian tutors is
              selected for their ability to teach, engage, and deliver results.
              Every educator on our platform has been vetted, trained, and
              continuously monitored for excellence.
            </p>
          </div>
        </section>

        {/* Who Our Tutors Are */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4 md:px-6">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Who Our Tutors Are
              </h2>
              <p className="text-gray-600 text-lg max-w-2xl mx-auto">
                Key qualifications that every tutor on our platform meets
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {[
                {
                  icon: Clock,
                  text: "5–10+ years of teaching experience",
                },
                {
                  icon: BookOpen,
                  text: "Expert in CBSE, ICSE, IB, IGCSE & British curricula",
                },
                {
                  icon: GraduationCap,
                  text: "Qualified with B.Ed, M.Sc, or equivalent degrees",
                },
                {
                  icon: Globe,
                  text: "Fluent in English with clear communication skills",
                },
                {
                  icon: Award,
                  text: "International teaching experience preferred",
                },
                {
                  icon: Sparkles,
                  text: "Passionate about student success and engagement",
                },
              ].map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-4 p-5 rounded-xl border border-gray-100 bg-gray-50 hover:shadow-md transition-shadow"
                >
                  <div className="flex-shrink-0 h-10 w-10 rounded-lg bg-teal-100 text-teal-600 flex items-center justify-center">
                    <item.icon className="h-5 w-5" />
                  </div>
                  <p className="text-gray-700 font-medium">{item.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Tutor Selection Process — Timeline */}
        <section className="py-16 bg-gradient-to-b from-gray-50 to-white">
          <div className="container mx-auto px-4 md:px-6">
            <div className="text-center mb-14">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Our Tutor Selection Process
              </h2>
              <p className="text-gray-600 text-lg max-w-2xl mx-auto">
                Only the top make it through. Here's our rigorous 4-step
                vetting process.
              </p>
            </div>

            <div className="max-w-3xl mx-auto relative">
              {/* Vertical line */}
              <div className="absolute left-6 md:left-8 top-0 bottom-0 w-0.5 bg-teal-200" />

              <div className="space-y-10">
                {selectionSteps.map((item) => (
                  <div key={item.step} className="relative flex items-start gap-6">
                    {/* Step number circle */}
                    <div className="relative z-10 flex-shrink-0 h-12 w-12 md:h-16 md:w-16 rounded-full bg-teal-600 text-white flex items-center justify-center shadow-lg shadow-teal-200">
                      <span className="text-lg md:text-xl font-bold">{item.step}</span>
                    </div>

                    {/* Content card */}
                    <div className="flex-1 bg-white rounded-xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex items-center gap-3 mb-2">
                        <item.icon className="h-5 w-5 text-teal-600" />
                        <h3 className="text-lg font-semibold text-gray-900">
                          {item.title}
                        </h3>
                      </div>
                      <p className="text-gray-600 leading-relaxed">
                        {item.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Teaching Methodology */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4 md:px-6">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Teaching Methodology
              </h2>
              <p className="text-gray-600 text-lg max-w-2xl mx-auto">
                Focused on concepts, not just completion
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {methodologyPoints.map((item, idx) => (
                <div
                  key={idx}
                  className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm hover:shadow-lg transition-shadow"
                >
                  <div className="h-12 w-12 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center mb-4">
                    <item.icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {item.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Accountability & Performance Tracking */}
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4 md:px-6">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Accountability & Performance Tracking
              </h2>
              <p className="text-gray-600 text-lg max-w-2xl mx-auto">
                Every tutor is measured by results
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              {accountabilityPoints.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-4 bg-white rounded-xl p-6 border border-gray-100 shadow-sm"
                >
                  <div className="flex-shrink-0 h-12 w-12 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
                    <item.icon className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      {item.title}
                    </h3>
                    <p className="text-gray-600 leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Transparency Through Technology */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4 md:px-6">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Transparency Through Technology
              </h2>
              <p className="text-gray-600 text-lg max-w-2xl mx-auto">
                Nothing hidden. Everything trackable.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              {transparencyPoints.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-4 bg-gradient-to-br from-teal-50 to-white rounded-xl p-6 border border-teal-100"
                >
                  <div className="flex-shrink-0 h-12 w-12 rounded-xl bg-teal-100 text-teal-600 flex items-center justify-center">
                    <item.icon className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      {item.title}
                    </h3>
                    <p className="text-gray-600 leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Tutor-Student Matching */}
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4 md:px-6">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Tutor-Student Matching
              </h2>
              <p className="text-gray-600 text-lg max-w-2xl mx-auto">
                The right tutor makes all the difference
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              {matchingFactors.map((item, idx) => (
                <div
                  key={idx}
                  className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="h-10 w-10 rounded-lg bg-teal-100 text-teal-600 flex items-center justify-center">
                      <item.icon className="h-5 w-5" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {item.title}
                    </h3>
                  </div>
                  <p className="text-gray-600 leading-relaxed">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Why Indian Tutors */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4 md:px-6">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Why Indian Tutors?
              </h2>
              <p className="text-gray-600 text-lg max-w-2xl mx-auto">
                Proven excellence in education
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              {whyIndianTutors.map((item, idx) => (
                <div
                  key={idx}
                  className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="h-10 w-10 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center">
                      <item.icon className="h-5 w-5" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {item.title}
                    </h3>
                  </div>
                  <p className="text-gray-600 leading-relaxed">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* What Parents Can Expect */}
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4 md:px-6">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                What Parents Can Expect
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              {parentExpectations.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-4 bg-white rounded-xl p-6 border border-gray-100 shadow-sm"
                >
                  <div className="flex-shrink-0 h-12 w-12 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
                    <item.icon className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      {item.title}
                    </h3>
                    <p className="text-gray-600 leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Closing CTA */}
        <section className="py-20 bg-gradient-to-br from-teal-600 to-teal-700 text-white">
          <div className="container mx-auto px-4 md:px-6 text-center max-w-3xl">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              The Right Teacher Can Change Everything
            </h2>
            <p className="text-teal-100 text-lg mb-8 leading-relaxed">
              Give your child the advantage of learning from India's finest
              educators — experienced, qualified, and dedicated to their
              success. Experience the difference with a free demo class.
            </p>
            <Link to="/book-demo">
              <Button
                size="lg"
                className="bg-white text-teal-700 hover:bg-teal-50 text-lg px-8 py-6 rounded-xl shadow-lg"
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

export default Tutors;
