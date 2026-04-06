
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { referenceService, type Subject } from "@/services/user.service";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  BookOpen,
  Video,
  CreditCard,
  Users,
  GraduationCap,
  Shield,
  Star,
  ChevronRight,
  CheckCircle,
  Globe,
  Clock,
  Target,
  Sparkles,
} from "lucide-react";

// Rotating card colors so subjects look visually distinct
const cardColors = [
  "bg-blue-50 border-blue-200 text-blue-700",
  "bg-green-50 border-green-200 text-green-700",
  "bg-purple-50 border-purple-200 text-purple-700",
  "bg-pink-50 border-pink-200 text-pink-700",
  "bg-amber-50 border-amber-200 text-amber-700",
  "bg-cyan-50 border-cyan-200 text-cyan-700",
  "bg-emerald-50 border-emerald-200 text-emerald-700",
  "bg-indigo-50 border-indigo-200 text-indigo-700",
  "bg-rose-50 border-rose-200 text-rose-700",
  "bg-teal-50 border-teal-200 text-teal-700",
];

const Index = () => {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [subjectsLoading, setSubjectsLoading] = useState(true);
  const [subjectsError, setSubjectsError] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
    referenceService
      .getSubjects()
      .then(setSubjects)
      .catch(() => setSubjectsError(true))
      .finally(() => setSubjectsLoading(false));
  }, []);

  return (
    <div className="min-h-screen flex flex-col overflow-x-hidden">
      <Navbar />

      <main>
        {/* ===== HERO ===== */}
        <section className="pt-20 pb-16 md:pt-32 md:pb-24 bg-gradient-to-br from-teal-50 via-white to-teal-50/30 overflow-hidden relative">
          <div className="absolute top-20 right-0 w-[500px] h-[500px] bg-teal-100/40 rounded-full blur-3xl -z-10" />
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-teal-50/60 rounded-full blur-3xl -z-10" />

          <div className="container mx-auto px-4 md:px-6">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div className="max-w-xl">
                <div className="inline-flex items-center gap-2 bg-teal-100 text-teal-700 px-4 py-1.5 rounded-full text-sm font-medium mb-6">
                  <Sparkles className="h-4 w-4" />
                  India's Best Tutors for UAE Students
                </div>

                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-gray-900 mb-6 leading-tight">
                  Expert Online Tutoring for Your Child's{" "}
                  <span className="text-teal-600">Academic Success</span>
                </h1>

                <p className="text-lg md:text-xl text-gray-600 mb-8 leading-relaxed">
                  Live 1-on-1 classes with verified Indian educators. Personalized learning for Grade 1–12 students in the UAE — Maths, Science, English, and more.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 mb-8">
                  <Button
                    asChild
                    className="bg-teal-600 hover:bg-teal-700 text-white font-semibold text-lg px-8 py-6 h-auto"
                  >
                    <Link to="/book-demo">
                      Book a Free Demo Class
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Link>
                  </Button>
                  <Button
                    asChild
                    variant="outline"
                    className="border-teal-600 text-teal-600 hover:bg-teal-50 hover:text-teal-700 font-semibold text-lg px-8 py-6 h-auto"
                  >
                    <Link to="/how-it-works">See How It Works</Link>
                  </Button>
                </div>

                <div className="flex flex-wrap gap-6 text-sm text-gray-500">
                  <span className="flex items-center gap-1.5">
                    <CheckCircle className="h-4 w-4 text-teal-500" /> Free demo class
                  </span>
                  <span className="flex items-center gap-1.5">
                    <CheckCircle className="h-4 w-4 text-teal-500" /> No registration fees
                  </span>
                  <span className="flex items-center gap-1.5">
                    <CheckCircle className="h-4 w-4 text-teal-500" /> Cancel anytime
                  </span>
                </div>
              </div>

              <div className="relative hidden lg:block">
                <div className="relative w-full rounded-2xl overflow-hidden shadow-2xl">
                  <div className="aspect-[4/3] bg-gradient-to-br from-teal-100 to-teal-50 rounded-2xl">
                    <img
                      src="https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&q=80&w=1000"
                      alt="Child learning online with tutor"
                      className="w-full h-full object-cover rounded-2xl"
                    />
                  </div>
                </div>

                {/* Floating stat card */}
                <div className="absolute -bottom-4 -left-4 bg-white p-4 rounded-xl shadow-lg border">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-full bg-teal-100 flex items-center justify-center">
                      <GraduationCap className="h-6 w-6 text-teal-600" />
                    </div>
                    <div>
                      <div className="font-bold text-gray-900">500+</div>
                      <div className="text-xs text-gray-500">Verified Tutors</div>
                    </div>
                  </div>
                </div>

                {/* Floating rating card */}
                <div className="absolute top-4 -right-4 bg-white p-3 rounded-xl shadow-lg border">
                  <div className="flex items-center gap-2">
                    <div className="flex text-yellow-400">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <Star key={i} className="h-4 w-4 fill-current" />
                      ))}
                    </div>
                    <span className="text-sm font-semibold text-gray-900">4.9/5</span>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">Parent satisfaction</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ===== TRUST BAR ===== */}
        <section className="py-6 bg-white border-y border-gray-100">
          <div className="container mx-auto px-4 md:px-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
              {[
                { value: "500+", label: "Verified Tutors" },
                { value: "10,000+", label: "Classes Delivered" },
                { value: "4.9/5", label: "Parent Rating" },
                { value: "7", label: "Emirates Covered" },
              ].map((stat) => (
                <div key={stat.label}>
                  <div className="text-2xl md:text-3xl font-bold text-teal-600">{stat.value}</div>
                  <div className="text-sm text-gray-500">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ===== WHY INDU AE ===== */}
        <section className="py-16 md:py-24 bg-white">
          <div className="container mx-auto px-4 md:px-6">
            <div className="text-center max-w-3xl mx-auto mb-14">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Why Parents Choose Indu AE
              </h2>
              <p className="text-gray-600 text-lg">
                We combine India's best teaching talent with technology to deliver a personalized, safe, and effective learning experience.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                {
                  icon: GraduationCap,
                  title: "Handpicked Tutors",
                  desc: "Every tutor is verified, experienced, and trained to teach online. Only top educators make it through our 5-step selection process.",
                },
                {
                  icon: Video,
                  title: "Live 1-on-1 Classes",
                  desc: "Real-time interactive sessions via Zoom — not pre-recorded videos. Your child gets undivided attention from their dedicated tutor.",
                },
                {
                  icon: CreditCard,
                  title: "Flexible Credit System",
                  desc: "Buy credits, book classes. No subscriptions, no lock-ins. Pause, switch subjects, or change tutors anytime.",
                },
                {
                  icon: Target,
                  title: "Personalized Learning",
                  desc: "Customized lesson plans based on your child's grade, curriculum (CBSE, ICSE, IB), and learning pace.",
                },
                {
                  icon: Shield,
                  title: "Safe & Transparent",
                  desc: "All sessions are recorded. Parents get full dashboard access to track attendance, progress, and tutor feedback.",
                },
                {
                  icon: Globe,
                  title: "UAE-Focused Service",
                  desc: "Designed for UAE-based families. Tutors are matched to your child's timezone and curriculum requirements.",
                },
              ].map((feature) => (
                <div
                  key={feature.title}
                  className="p-6 rounded-xl border border-gray-100 hover:border-teal-200 hover:shadow-md transition-all group"
                >
                  <div className="h-12 w-12 rounded-lg bg-teal-50 flex items-center justify-center mb-4 group-hover:bg-teal-100 transition-colors">
                    <feature.icon className="h-6 w-6 text-teal-600" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ===== SUBJECTS ===== */}
        <section className="py-16 md:py-24 bg-gray-50">
          <div className="container mx-auto px-4 md:px-6">
            <div className="text-center max-w-3xl mx-auto mb-14">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Subjects We Offer
              </h2>
              <p className="text-gray-600 text-lg">
                Comprehensive coverage from Grade 1 to Grade 12 across all major curricula.
              </p>
            </div>

            {subjectsLoading ? (
              <div className="text-center text-gray-500 py-12">Loading subjects...</div>
            ) : subjectsError || subjects.length === 0 ? (
              <div className="text-center text-gray-500 py-12">Unable to load subjects. Please try again later.</div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {subjects.map((s, idx) => {
                  const color = cardColors[idx % cardColors.length];
                  return (
                    <div
                      key={s.id}
                      className={`px-5 py-6 rounded-xl border ${color} text-center hover:shadow-md transition-shadow cursor-pointer`}
                    >
                      <div className="font-semibold">{s.name}</div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="text-center mt-10">
              <Button asChild variant="outline" className="border-teal-600 text-teal-600 hover:bg-teal-50 hover:text-teal-700">
                <Link to="/features">
                  View All Subjects & Features
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* ===== HOW IT WORKS (SUMMARY) ===== */}
        <section className="py-16 md:py-24 bg-white">
          <div className="container mx-auto px-4 md:px-6">
            <div className="text-center max-w-3xl mx-auto mb-14">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Getting Started Is Simple
              </h2>
              <p className="text-gray-600 text-lg">
                From your first inquiry to regular classes — we handle everything.
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
              {[
                {
                  step: "1",
                  title: "Book a Free Demo",
                  desc: "Fill a quick form. No account needed. Our consultant contacts you within 24 hours.",
                  icon: BookOpen,
                },
                {
                  step: "2",
                  title: "Meet Your Tutor",
                  desc: "We match your child with the right tutor based on subject, grade, and learning style.",
                  icon: Users,
                },
                {
                  step: "3",
                  title: "Try a Free Class",
                  desc: "Your child attends a live demo session. No commitment, no payment required.",
                  icon: Video,
                },
                {
                  step: "4",
                  title: "Start Learning",
                  desc: "Purchase credits and schedule regular classes at times that suit your family.",
                  icon: Clock,
                },
              ].map((item) => (
                <div key={item.step} className="text-center">
                  <div className="h-16 w-16 rounded-full bg-teal-600 text-white flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                    {item.step}
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
                  <p className="text-gray-600 text-sm">{item.desc}</p>
                </div>
              ))}
            </div>

            <div className="text-center mt-10">
              <Button asChild variant="outline" className="border-teal-600 text-teal-600 hover:bg-teal-50 hover:text-teal-700">
                <Link to="/how-it-works">
                  Learn More About Our Process
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* ===== TESTIMONIALS ===== */}
        <section className="py-16 md:py-24 bg-gray-50">
          <div className="container mx-auto px-4 md:px-6">
            <div className="text-center max-w-3xl mx-auto mb-14">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                What Parents Say
              </h2>
              <p className="text-gray-600 text-lg">
                Hear from families across the UAE who trust Indu AE for their children's education.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  name: "Fatima Al Maktoum",
                  location: "Dubai",
                  text: "My daughter's Maths grades improved from a C to an A in just 3 months. The tutor understood exactly where she was struggling and created a custom plan.",
                  rating: 5,
                },
                {
                  name: "Rajesh Nair",
                  location: "Abu Dhabi",
                  text: "We tried 3 other platforms before Indu AE. The difference is the consultant who actually understands our needs and matches the right tutor. My son loves his Science classes.",
                  rating: 5,
                },
                {
                  name: "Sarah Khan",
                  location: "Sharjah",
                  text: "The flexibility is unbeatable. We can reschedule, switch subjects, and even change tutors without any hassle. The credit system is transparent — no hidden costs.",
                  rating: 5,
                },
              ].map((t) => (
                <div key={t.name} className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                  <div className="flex items-center gap-1 mb-4">
                    {[...Array(t.rating)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 text-yellow-400 fill-current" />
                    ))}
                  </div>
                  <p className="text-gray-600 mb-6 italic">"{t.text}"</p>
                  <div>
                    <div className="font-semibold text-gray-900">{t.name}</div>
                    <div className="text-sm text-gray-500">{t.location}, UAE</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ===== CTA ===== */}
        <section className="py-16 md:py-20 bg-teal-600 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-teal-500/30 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-teal-700/30 rounded-full blur-3xl" />

          <div className="container mx-auto px-4 md:px-6 relative z-10">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
                Give Your Child the Learning Advantage They Deserve
              </h2>
              <p className="text-teal-100 text-lg mb-8">
                Book a free demo class today. No payment required. No account needed. Just fill the form and we'll take care of the rest.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  asChild
                  className="bg-white text-teal-700 hover:bg-gray-100 font-semibold text-lg px-8 py-6 h-auto"
                >
                  <Link to="/book-demo">
                    Book a Free Demo Class
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  className="border-white text-white bg-transparent hover:bg-white/10 hover:text-white font-semibold text-lg px-8 py-6 h-auto"
                >
                  <Link to="/pricing">View Pricing</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Index;
