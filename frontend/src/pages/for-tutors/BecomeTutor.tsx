
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

const BecomeTutor = () => {
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    experience: "",
    subjects: "",
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
        role: "TUTOR",
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        phone: form.phone,
        experience: form.experience ? parseInt(form.experience) : undefined,
        subjects: form.subjects || undefined,
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
    { title: "Reach Students Across UAE", description: "Connect with eager learners across all 7 emirates and share your expertise.", icon: <Globe className="h-10 w-10 text-talent-primary" /> },
    { title: "Flexible Scheduling", description: "Create a teaching schedule that works for you — teach part-time, full-time, or anything in between.", icon: <Calendar className="h-10 w-10 text-talent-primary" /> },
    { title: "Competitive Earnings", description: "Earn competitive income teaching subjects you're passionate about.", icon: <DollarSign className="h-10 w-10 text-talent-primary" /> },
    { title: "Supportive Community", description: "Join our community of educators who share resources, strategies, and support each other.", icon: <Users className="h-10 w-10 text-talent-primary" /> },
    { title: "Easy-to-Use Platform", description: "Our intuitive teaching tools make it simple to deliver engaging online classes.", icon: <Video className="h-10 w-10 text-talent-primary" /> },
    { title: "Growth Opportunities", description: "Expand your teaching profile and build your reputation with our growing student base.", icon: <CheckCircle className="h-10 w-10 text-talent-primary" /> },
  ];

  const steps = [
    { title: "Submit Your Application", description: "Fill out the form below with your qualifications, experience, and the subjects you wish to teach." },
    { title: "Application Review", description: "Our team will review your application, verify your credentials, and assess your fit." },
    { title: "Teaching Demonstration", description: "Show us your teaching style through a brief demo session with our education team." },
    { title: "Admin Creates Your Account", description: "Once approved, our admin team creates your tutor account and sends you login credentials." },
    { title: "Platform Training", description: "Complete our orientation program to learn how to use our teaching tools effectively." },
    { title: "Start Teaching", description: "Launch your first classes and begin connecting with students across the UAE!" },
  ];

  const faqs = [
    { question: "What qualifications do I need to become a tutor?", answer: "We look for tutors with expertise in their subject area, which could include formal qualifications (degrees, certifications) or demonstrated mastery through professional experience. Most importantly, you must have a passion for teaching and excellent communication skills." },
    { question: "How much can I earn on Indu AE?", answer: "Earnings vary based on your subject, experience, class format, and pricing strategy. Many of our successful tutors earn a substantial part-time or full-time income." },
    { question: "What technology do I need to teach on Indu AE?", answer: "You'll need a reliable internet connection, a computer with webcam and microphone, and a quiet, well-lit teaching space. Our platform works in modern browsers without requiring additional software installation." },
    { question: "How long does the application process take?", answer: "The typical application review takes 3-5 business days. Once approved, your account is created by our admin team and you can start immediately." },
    { question: "Can I teach multiple subjects?", answer: "Absolutely! Many tutors teach across several related subjects where they have expertise. You can be assigned to different courses for various topics and grade levels." },
  ];

  return (
    <PageLayout
      title="Become a Tutor"
      description="Join our growing community of passionate educators and share your expertise with students across the UAE."
    >
      <div className="space-y-16">
        {/* Hero section */}
        <div className="grid md:grid-cols-2 gap-8 items-center">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold mb-4">Transform Lives Through Teaching</h2>
            <p className="text-gray-600 mb-6">
              Share your passion and expertise with eager young minds on Indu AE — the UAE's growing platform for personalized education. Apply below and our team will review your application.
            </p>
            <Button size="lg" className="bg-talent-primary hover:bg-talent-secondary text-white" onClick={() => document.getElementById("application-form")?.scrollIntoView({ behavior: "smooth" })}>
              Apply to Teach
            </Button>
          </div>
          <div className="rounded-xl overflow-hidden shadow-lg">
            <img
              src="https://images.unsplash.com/photo-1543269865-cbf427effbad?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80"
              alt="Teacher with students"
              className="w-full h-auto"
            />
          </div>
        </div>

        {/* Benefits section */}
        <div>
          <h2 className="text-2xl md:text-3xl font-bold mb-8 text-center">Why Teach on Indu AE</h2>
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

        {/* How to become a tutor section */}
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
              <CardTitle className="text-2xl text-center">Tutor Application Form</CardTitle>
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
                    <Label htmlFor="experience">Years of Teaching Experience</Label>
                    <Input id="experience" name="experience" type="number" min="0" value={form.experience} onChange={handleChange} placeholder="5" />
                  </div>
                  <div>
                    <Label htmlFor="subjects">Subjects You Want to Teach</Label>
                    <Input id="subjects" name="subjects" value={form.subjects} onChange={handleChange} placeholder="e.g., Mathematics, Physics, Chemistry" />
                  </div>
                  <div>
                    <Label htmlFor="qualifications">Qualifications / Certifications</Label>
                    <Input id="qualifications" name="qualifications" value={form.qualifications} onChange={handleChange} placeholder="e.g., B.Ed, M.Sc Mathematics, CELTA" />
                  </div>
                  <div>
                    <Label htmlFor="bio">About Yourself</Label>
                    <Textarea id="bio" name="bio" value={form.bio} onChange={handleChange} placeholder="Tell us about your teaching philosophy, experience, and why you'd like to join Indu AE..." rows={4} />
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

export default BecomeTutor;
