import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { creditPackageService, type CreditPackage } from "@/services/wallet.service";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import {
  Check,
  CreditCard,
  Users,
  User,
  Pause,
  RefreshCw,
  ArrowRightLeft,
  CalendarClock,
  Monitor,
  Video,
  BarChart3,
  UserCheck,
  Sparkles,
  ShieldCheck,
} from "lucide-react";

/* Plan type for rendering */
type Plan = { name: string; credits: number; priceInFils: number };

/* ─── Styling by card index (cycles for any number of plans) ─── */
const cardStyles = [
  { borderClass: "border-emerald-400", bgClass: "bg-emerald-50", badgeBg: "bg-emerald-100 text-emerald-700", buttonClass: "bg-emerald-600 hover:bg-emerald-700 text-white", color: "emerald" },
  { borderClass: "border-blue-400", bgClass: "bg-blue-50", badgeBg: "bg-blue-100 text-blue-700", buttonClass: "bg-blue-600 hover:bg-blue-700 text-white", color: "blue" },
  { borderClass: "border-purple-400", bgClass: "bg-purple-50", badgeBg: "bg-purple-100 text-purple-700", buttonClass: "bg-purple-600 hover:bg-purple-700 text-white", color: "purple" },
  { borderClass: "border-amber-400", bgClass: "bg-amber-50", badgeBg: "bg-amber-100 text-amber-700", buttonClass: "bg-amber-600 hover:bg-amber-700 text-white", color: "amber" },
];

const creditFactors = [
  "Grade level of the student",
  "Class type — One-to-One or Group",
  "Session duration",
];

const flexibilityBenefits = [
  { icon: Pause, text: "Pause anytime — life happens, your credits stay safe" },
  { icon: ArrowRightLeft, text: "Change subjects mid-plan without penalty" },
  { icon: RefreshCw, text: "Switch tutors if the match isn't right" },
  { icon: CalendarClock, text: "Adjust frequency — weekly, bi-weekly, or intensive" },
];

const includedFeatures = [
  { icon: Monitor, text: "Parent & Student Dashboard with full visibility" },
  { icon: Video, text: "Recorded sessions for revision & catch-up" },
  { icon: BarChart3, text: "Progress tracking & learning analytics" },
  { icon: UserCheck, text: "Dedicated tutor matching by our consultants" },
];

const comparisonRows = [
  { feature: "Pricing model", traditional: "Fixed monthly fees", ours: "Pay-per-session credits" },
  { feature: "Flexibility", traditional: "Locked contracts", ours: "Pause, switch, adjust anytime" },
  { feature: "Tutor matching", traditional: "Self-search or random", ours: "Consultant-matched for best fit" },
  { feature: "Unused sessions", traditional: "Lost / non-refundable", ours: "Credits carry forward" },
  { feature: "Subject changes", traditional: "New enrolment needed", ours: "Use same credits, switch freely" },
  { feature: "Transparency", traditional: "Hidden add-on fees", ours: "No hidden costs — ever" },
];

const Pricing = () => {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
    creditPackageService
      .listActive()
      .then((pkgs) =>
        setPlans(pkgs.map((pkg) => ({ name: pkg.name, credits: pkg.credits, priceInFils: pkg.priceInFils })))
      )
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen flex flex-col overflow-x-hidden">
      <Navbar />

      <main className="flex-1 pt-24">
        {/* ─── Hero / Header ─── */}
        <section className="py-16 md:py-20 bg-gradient-to-b from-teal-50 to-white">
          <div className="container mx-auto px-4 md:px-6 text-center max-w-3xl">
            <h1 className="text-3xl md:text-5xl font-bold text-gray-900 mb-6">
              Simple, Flexible Pricing —{" "}
              <span className="text-teal-600">Designed Around Your Needs</span>
            </h1>
            <p className="text-lg md:text-xl text-gray-600 leading-relaxed">
              Our credit-based system puts you in complete control. No fixed contracts,
              no hidden fees — just quality education on your terms.
            </p>
          </div>
        </section>

        {/* ─── How Pricing Works ─── */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4 md:px-6 max-w-4xl text-center">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
              How Pricing Works
            </h2>
            <div className="grid sm:grid-cols-3 gap-6 md:gap-8 mt-10">
              {[
                { step: "1", title: "Purchase Credits", desc: "Choose a credit package that suits your learning goals and budget." },
                { step: "2", title: "Book Sessions", desc: "Use your credits to book one-to-one or group sessions with matched tutors." },
                { step: "3", title: "Learn & Track", desc: "Credits are deducted per session. Track usage and progress from your dashboard." },
              ].map((item) => (
                <div key={item.step} className="flex flex-col items-center">
                  <div className="w-14 h-14 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center text-xl font-bold mb-4">
                    {item.step}
                  </div>
                  <h3 className="font-semibold text-gray-900 text-lg mb-2">{item.title}</h3>
                  <p className="text-gray-600 text-sm">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── Credit Plans ─── */}
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4 md:px-6">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 text-center mb-4">
              Choose Your Credit Plan
            </h2>
            <p className="text-gray-600 text-center max-w-2xl mx-auto mb-12">
              Pick the plan that matches your child's learning journey. All plans include
              full platform access and consultant support.
            </p>

            {loading ? (
              <div className="text-center text-gray-500 py-12">Loading credit plans...</div>
            ) : error || plans.length === 0 ? (
              <div className="text-center text-gray-500 py-12">Unable to load credit plans. Please try again later.</div>
            ) : (
              <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6 md:gap-8 max-w-5xl mx-auto">
                {plans.map((plan, idx) => {
                  const style = cardStyles[idx % cardStyles.length];
                  const isMiddle = plans.length >= 3 && idx === 1;
                  const priceAED = plan.priceInFils > 0 ? (plan.priceInFils / 1000).toFixed(0) : null;
                  return (
                    <div
                      key={plan.name}
                      className={`relative rounded-2xl border-2 ${style.borderClass} bg-white shadow-lg hover:shadow-xl transition-shadow p-8 flex flex-col items-center text-center ${
                        isMiddle ? "md:-translate-y-3 scale-[1.02]" : ""
                      }`}
                    >
                      {isMiddle && (
                        <span className="absolute -top-4 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-xs font-semibold px-4 py-1.5 rounded-full shadow">
                          Most Popular
                        </span>
                      )}

                      <div className={`w-16 h-16 rounded-full ${style.bgClass} flex items-center justify-center mb-4`}>
                        <CreditCard className={`w-7 h-7 text-${style.color}-600`} />
                      </div>

                      <h3 className="text-xl font-bold text-gray-900 mb-1">{plan.name}</h3>

                      <div className="my-4">
                        <span className="text-4xl font-extrabold text-gray-900">{plan.credits}</span>
                        <span className="text-gray-500 ml-1 text-lg">Credits</span>
                      </div>

                      {priceAED && (
                        <span className={`text-xs font-medium px-3 py-1 rounded-full ${style.badgeBg} mb-3`}>
                          AED {priceAED}
                        </span>
                      )}

                      <Link to="/book-demo" className="w-full mt-auto">
                        <Button className={`w-full ${style.buttonClass}`}>
                          Get Started
                        </Button>
                      </Link>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* ─── How Credits Are Used ─── */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4 md:px-6 max-w-4xl">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 text-center mb-4">
              How Credits Are Used
            </h2>
            <p className="text-gray-600 text-center max-w-2xl mx-auto mb-10">
              The number of credits deducted per session depends on several factors,
              ensuring you only pay for what you need.
            </p>
            <div className="grid sm:grid-cols-2 gap-4 max-w-xl mx-auto">
              {creditFactors.map((factor) => (
                <div
                  key={factor}
                  className="flex items-start gap-3 bg-teal-50 rounded-xl p-4"
                >
                  <Check className="w-5 h-5 text-teal-600 mt-0.5 shrink-0" />
                  <span className="text-gray-700 text-sm">{factor}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── One-to-One vs Group ─── */}
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4 md:px-6 max-w-5xl">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 text-center mb-12">
              One-to-One vs Group Classes
            </h2>
            <div className="grid md:grid-cols-2 gap-8">
              {/* 1:1 */}
              <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm hover:shadow-md transition-shadow">
                <div className="w-14 h-14 rounded-full bg-teal-100 flex items-center justify-center mb-4">
                  <User className="w-6 h-6 text-teal-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">One-to-One Sessions</h3>
                <ul className="space-y-2">
                  {[
                    "Fully personalised attention",
                    "Pace set by the student",
                    "Flexible scheduling",
                    "Higher credit cost per session",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2 text-gray-600 text-sm">
                      <Check className="w-4 h-4 text-teal-500 mt-0.5 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Group */}
              <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm hover:shadow-md transition-shadow">
                <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center mb-4">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Group Classes</h3>
                <ul className="space-y-2">
                  {[
                    "Learn alongside peers for motivation",
                    "Collaborative problem-solving",
                    "Lower credit cost per session",
                    "Small groups (max 5–6 students)",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2 text-gray-600 text-sm">
                      <Check className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* ─── Flexibility Benefits ─── */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4 md:px-6 max-w-4xl">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 text-center mb-4">
              Total Flexibility, Zero Lock-In
            </h2>
            <p className="text-gray-600 text-center max-w-2xl mx-auto mb-10">
              Life changes — your tutoring plan adapts with you.
            </p>
            <div className="grid sm:grid-cols-2 gap-6">
              {flexibilityBenefits.map((item) => (
                <div
                  key={item.text}
                  className="flex items-start gap-4 bg-gray-50 rounded-xl p-5 border border-gray-100"
                >
                  <div className="w-10 h-10 rounded-lg bg-teal-100 flex items-center justify-center shrink-0">
                    <item.icon className="w-5 h-5 text-teal-600" />
                  </div>
                  <p className="text-gray-700 text-sm leading-relaxed">{item.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── Included in Every Plan ─── */}
        <section className="py-16 bg-teal-50">
          <div className="container mx-auto px-4 md:px-6 max-w-4xl">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 text-center mb-4">
              Included in Every Plan
            </h2>
            <p className="text-gray-600 text-center max-w-2xl mx-auto mb-10">
              No matter which plan you choose, you get the full platform experience.
            </p>
            <div className="grid sm:grid-cols-2 gap-6">
              {includedFeatures.map((item) => (
                <div
                  key={item.text}
                  className="flex items-start gap-4 bg-white rounded-xl p-5 shadow-sm border border-teal-100"
                >
                  <div className="w-10 h-10 rounded-lg bg-teal-100 flex items-center justify-center shrink-0">
                    <item.icon className="w-5 h-5 text-teal-600" />
                  </div>
                  <p className="text-gray-700 text-sm leading-relaxed">{item.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── Why Better — Comparison Table ─── */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4 md:px-6 max-w-4xl">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 text-center mb-4">
              Why Our Model Is Better
            </h2>
            <p className="text-gray-600 text-center max-w-2xl mx-auto mb-10">
              See how our credit-based approach compares to traditional tutoring services.
            </p>

            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto rounded-2xl border border-gray-200 shadow-sm">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-6 py-4 font-semibold text-gray-900">Feature</th>
                    <th className="px-6 py-4 font-semibold text-gray-400">Traditional Tutoring</th>
                    <th className="px-6 py-4 font-semibold text-teal-700">Our Model</th>
                  </tr>
                </thead>
                <tbody>
                  {comparisonRows.map((row, i) => (
                    <tr
                      key={row.feature}
                      className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}
                    >
                      <td className="px-6 py-4 font-medium text-gray-900">{row.feature}</td>
                      <td className="px-6 py-4 text-gray-500">{row.traditional}</td>
                      <td className="px-6 py-4 text-teal-700 font-medium">{row.ours}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden space-y-4">
              {comparisonRows.map((row) => (
                <div key={row.feature} className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                  <h4 className="font-semibold text-gray-900 mb-3">{row.feature}</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Traditional</span>
                      <span className="text-gray-500">{row.traditional}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-teal-600 font-medium">Indu AE</span>
                      <span className="text-teal-700 font-medium">{row.ours}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── No Hidden Costs ─── */}
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4 md:px-6 max-w-3xl text-center">
            <div className="w-16 h-16 rounded-full bg-teal-100 flex items-center justify-center mx-auto mb-6">
              <ShieldCheck className="w-8 h-8 text-teal-600" />
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
              No Hidden Costs
            </h2>
            <div className="grid sm:grid-cols-3 gap-6 mt-8">
              {[
                "No registration fees",
                "No cancellation penalties",
                "No forced subscriptions",
              ].map((item) => (
                <div
                  key={item}
                  className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm"
                >
                  <Check className="w-6 h-6 text-teal-600 mx-auto mb-3" />
                  <p className="text-gray-800 font-medium text-sm">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── Free Demo CTA ─── */}
        <section className="py-20 bg-gradient-to-br from-teal-600 to-teal-700 text-white">
          <div className="container mx-auto px-4 md:px-6 max-w-3xl text-center">
            <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-6">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl md:text-4xl font-bold mb-4">
              Try Before You Commit
            </h2>
            <p className="text-teal-100 text-lg mb-8 leading-relaxed max-w-xl mx-auto">
              Book a <strong className="text-white">free demo class</strong> to experience
              our teaching quality, platform, and personalised matching — no credits
              required, no strings attached.
            </p>
            <Link to="/book-demo">
              <Button
                size="lg"
                className="bg-white text-teal-700 hover:bg-teal-50 font-semibold px-8 py-6 text-base rounded-xl shadow-lg"
              >
                Book Your Free Demo Class Today
              </Button>
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Pricing;
