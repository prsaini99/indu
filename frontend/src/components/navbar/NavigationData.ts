
import { User, Briefcase, Headphones } from 'lucide-react';

// ==========================================
// PRIMARY NAV — shown as top-level links
// ==========================================

export const primaryNavItems = [
  { title: "Home", href: "/" },
  { title: "About", href: "/about" },
  { title: "Features", href: "/features" },
  { title: "Tutors", href: "/tutors" },
  { title: "Pricing", href: "/pricing" },
  { title: "How It Works", href: "/how-it-works" },
  { title: "Contact", href: "/contact" },
];

// ==========================================
// DROPDOWN DATA (for sub-nav menus)
// ==========================================

export const forTutorsItems = [
  {
    title: "Become a Tutor",
    description: "Start teaching on our platform and reach students across UAE",
    href: "/for-tutors/become-tutor",
    icon: User,
  },
];

export const forConsultantsItems = [
  {
    title: "Become a Consultant",
    description: "Join our platform as an education consultant",
    href: "/for-consultants/become-consultant",
    icon: Briefcase,
  },
];

export const resourcesItems = [
  {
    title: "Help Center",
    description: "FAQs and support resources for using our platform",
    href: "/resources/help-center",
    icon: Headphones,
  },
];
