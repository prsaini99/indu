
import { useState } from "react";
import PageLayout from "@/components/PageLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Users, Calendar, Video, DollarSign, Globe, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { applicationService } from "@/services/application.service";

const BecomeConsultant = () => {
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    experience: "",
    qualifications: "",
    bio: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.firstName || !form.lastName || !form.email || !form.phone) {
      toast({ title: "Missing fields", description: "Please fill in all required fields.", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      await applicationService.submit({
        role: "CONSULTANT",
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        phone: form.phone,
        experience: form.experience ? parseInt(form.experience) : undefined,
        qualifications: form.qualifications || undefined,
        bio: form.bio || undefined,
      });
      setSubmitted(true);
      toast({ title: "Application submitted!", description: "We'll review your application and get back to you soon." });
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: { message?: string } } } };
      toast({
        title: "Submission failed",
        description: error?.response?.data?.error?.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const benefits = [
    { title: "Mediate Education Across UAE", description: "Help connect parents with the right tutors and manage the entire learning journey.", icon: <Globe className="h-10 w-10 text-talent-primary" /> },
    { title: "Flexible Scheduling", description: "Manage your consulting schedule on your terms — part-time, full-time, or anything in between.", icon: <Calendar className="h-10 w-10 text-talent-primary" /> },
    { title: "Competitive Earnings", description: "Earn competitive income by facilitating educational connections and managing bookings.", icon: <DollarSign className="h-10 w-10 text-talent-primary" /> },
    { title: "Professional Network", description: "Join our community of education consultants who collaborate and support each other.", icon: <Users className="h-10 w-10 text-talent-primary" /> },
    { title: "Easy-to-Use Platform", description: "Our intuitive tools make it simple to manage demo requests, bookings, and tutor assignments.", icon: <Video className="h-10 w-10 text-talent-primary" /> },
    { title: "Growth Opportunities", description: "Expand your consulting practice as our platform and parent base continues to grow.", icon: <CheckCircle className="h-10 w-10 text-talent-primary" /> },
  ];

  const steps = [
    { title: "Submit Your Application", description: "Fill out the form below with your qualifications, experience, and education consulting background." },
    { title: "Application Review", description: "Our team will review your application and assess your suitability as an education consultant." },
    { title: "Interview", description: "A brief conversation with our team to understand your approach to parent-tutor mediation." },
    { title: "Admin Creates Your Account", description: "Once approved, our admin team creates your consultant account and sends you login credentials." },
    { title: "Platform Training", description: "Complete our orientation to learn demo request handling, booking management, and tutor assignment workflows." },
    { title: "Start Consulting", description: "Begin managing demo requests, scheduling bookings, and connecting parents with tutors!" },
  ];

  const faqs = [
    { question: "What does a consultant do on Indu AE?", answer: "Consultants act as mediators between parents and tutors. You handle incoming demo requests, match parents with suitable tutors, schedule demo and regular class bookings, and ensure a smooth learning experience for families." },
    { question: "What qualifications do I need?", answer: "We look for individuals with strong communication skills, education industry experience, and organizational abilities. A background in education management, counseling, or parent engagement is a plus." },
    { question: "How much can I earn?", answer: "Earnings depend on the number of bookings you manage and your level of activity on the platform. Active consultants with good parent satisfaction ratings earn competitive income." },
    { question: "How long does the application process take?", answer: "The typical application review takes 3-5 business days. Once approved, your account is created by our admin team and you can start immediately." },
    { question: "Can I work part-time?", answer: "Yes! Many consultants work part-time alongside other commitments. You can manage your availability and workload based on your schedule." },
  ];

  return (
    <PageLayout
      title="Become a Consultant"
      description="Join our team of education consultants and help connect parents with the right tutors across the UAE."
    >
      <div className="space-y-16">
        {/* Hero section */}
        <div className="grid md:grid-cols-2 gap-8 items-center">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold mb-4">Bridge the Gap Between Parents & Tutors</h2>
            <p className="text-gray-600 mb-6">
              As an Indu AE consultant, you'll be the key mediator — handling demo requests, matching families with tutors, and managing the entire booking process. Apply below to join our team.
            </p>
            <Button size="lg" className="bg-talent-primary hover:bg-talent-secondary text-white" onClick={() => document.getElementById("application-form")?.scrollIntoView({ behavior: "smooth" })}>
              Apply to Consult
            </Button>
          </div>
          <div className="rounded-xl overflow-hidden shadow-lg">
            <img
              src="https://images.unsplash.com/photo-1553877522-43269d4ea984?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80"
              alt="Education consultant"
              className="w-full h-auto"
            />
          </div>
        </div>

        {/* Benefits section */}
        <div>
          <h2 className="text-2xl md:text-3xl font-bold mb-8 text-center">Why Consult on Indu AE</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {benefits.map((benefit, index) => (
              <div key={index} className="p-6 border border-gray-200 rounded-xl hover:shadow-md transition-shadow">
                <div className="mb-4">{benefit.icon}</div>
                <h3 className="text-xl font-semibold mb-2">{benefit.title}</h3>
                <p className="text-gray-600">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* How it works section */}
        <div>
          <h2 className="text-2xl md:text-3xl font-bold mb-8 text-center">How It Works</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-10">
            {steps.map((step, index) => (
              <div key={index} className="relative">
                <div className="bg-talent-primary text-white text-2xl font-bold rounded-full w-12 h-12 flex items-center justify-center mb-4">
                  {index + 1}
                </div>
                <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
                <p className="text-gray-600">{step.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Application Form */}
        <div id="application-form">
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="text-2xl text-center">Consultant Application Form</CardTitle>
              <p className="text-sm text-gray-500 text-center mt-1">
                Fill in your details below. Our team will review and contact you within 3-5 business days.
              </p>
            </CardHeader>
            <CardContent>
              {submitted ? (
                <div className="text-center py-8">
                  <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">Application Submitted!</h3>
                  <p className="text-gray-600">
                    Thank you for applying. Our team will review your application and get back to you at <strong>{form.email}</strong> within 3-5 business days.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="firstName">First Name *</Label>
                      <Input id="firstName" name="firstName" value={form.firstName} onChange={handleChange} placeholder="John" required />
                    </div>
                    <div>
                      <Label htmlFor="lastName">Last Name *</Label>
                      <Input id="lastName" name="lastName" value={form.lastName} onChange={handleChange} placeholder="Doe" required />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="email">Email Address *</Label>
                    <Input id="email" name="email" type="email" value={form.email} onChange={handleChange} placeholder="john@example.com" required />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone Number *</Label>
                    <Input id="phone" name="phone" value={form.phone} onChange={handleChange} placeholder="+91 98765 43210" required />
                  </div>
                  <div>
                    <Label htmlFor="experience">Years of Relevant Experience</Label>
                    <Input id="experience" name="experience" type="number" min="0" value={form.experience} onChange={handleChange} placeholder="3" />
                  </div>
                  <div>
                    <Label htmlFor="qualifications">Qualifications / Background</Label>
                    <Input id="qualifications" name="qualifications" value={form.qualifications} onChange={handleChange} placeholder="e.g., Education Management, School Counselor, MBA" />
                  </div>
                  <div>
                    <Label htmlFor="bio">About Yourself</Label>
                    <Textarea id="bio" name="bio" value={form.bio} onChange={handleChange} placeholder="Tell us about your experience in education consulting, parent engagement, or tutor coordination..." rows={4} />
                  </div>
                  <Button type="submit" className="w-full bg-talent-primary hover:bg-talent-secondary text-white" size="lg" disabled={submitting}>
                    {submitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting...</> : "Submit Application"}
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
        </div>

        {/* FAQs section */}
        <div>
          <h2 className="text-2xl md:text-3xl font-bold mb-8 text-center">Frequently Asked Questions</h2>
          <div className="space-y-6">
            {faqs.map((faq, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-6">
                <h3 className="text-xl font-semibold mb-2">{faq.question}</h3>
                <p className="text-gray-600">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </PageLayout>
  );
};

export default BecomeConsultant;
