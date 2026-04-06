
import { LectureType } from "@/types/lecture-types";

// Sample tutors data with lecture types
export const tutors = [
  {
    id: 1,
    name: "Priya Sharma",
    title: "Music Teacher | 8+ Years Experience",
    image: "https://randomuser.me/api/portraits/women/33.jpg",
    rating: 4.9,
    reviews: 124,
    students: 856,
    classes: 42,
    offeredLectureTypes: ["live-one-on-one", "live-group", "offline-student-travels"] as LectureType[],
    featuredClass: {
      id: "violin-101",
      title: "Beginner Violin Course",
      price: 499,
      duration: 45,
      nextAvailable: "Tomorrow at 4:00 PM",
      lectureType: "live-one-on-one" as LectureType
    }
  },
  {
    id: 2,
    name: "Raj Kumar",
    title: "Mathematics Expert | IIT Graduate",
    image: "https://randomuser.me/api/portraits/men/54.jpg",
    rating: 4.8,
    reviews: 89,
    students: 712,
    classes: 35,
    offeredLectureTypes: ["live-one-on-one", "live-group", "recorded-on-demand"] as LectureType[],
    featuredClass: {
      id: "math-olympiad",
      title: "Math Olympiad Preparation",
      price: 599,
      duration: 60,
      nextAvailable: "Today at 6:30 PM",
      lectureType: "live-group" as LectureType
    }
  },
  {
    id: 3,
    name: "Anjali Mehta",
    title: "Coding Instructor | Software Engineer",
    image: "https://randomuser.me/api/portraits/women/68.jpg",
    rating: 4.9,
    reviews: 76,
    students: 531,
    classes: 28,
    offeredLectureTypes: ["live-group", "recorded-on-demand"] as LectureType[],
    featuredClass: {
      id: "python-kids",
      title: "Python for Beginners (Ages 10-14)",
      price: 649,
      duration: 60,
      nextAvailable: "Tomorrow at 5:00 PM",
      lectureType: "recorded-on-demand" as LectureType
    }
  },
  {
    id: 4,
    name: "Rahul Singh",
    title: "Cricket Coach | Former Ranji Player",
    image: "https://randomuser.me/api/portraits/men/22.jpg",
    rating: 4.7,
    reviews: 53,
    students: 426,
    classes: 25,
    offeredLectureTypes: ["offline-tutor-travels", "offline-student-travels"] as LectureType[],
    featuredClass: {
      id: "cricket-batting",
      title: "Cricket Batting Techniques",
      price: 549,
      duration: 90,
      nextAvailable: "Saturday at 9:00 AM",
      lectureType: "offline-student-travels" as LectureType
    }
  }
];

// Sample featured classes with different lecture types
export const featuredClasses = [
  {
    classId: "python-101",
    title: "Introduction to Python Programming",
    image: "https://images.unsplash.com/photo-1515879218367-8466d910aaa4?auto=format&w=800&h=500&fit=crop",
    tutor: "Michael Chen",
    rating: 4.9,
    reviewCount: 126,
    price: 649,
    duration: 60,
    nextDate: "Tomorrow at 5:00 PM",
    tags: ["Programming", "Ages 10-14"],
    lectureType: "live-group" as LectureType,
    isFeatured: true,
    ageRange: "10-14"
  },
  {
    classId: "violin-beginner",
    title: "Beginner Violin Lessons - Classical Foundations",
    image: "https://images.unsplash.com/photo-1465821185615-20b3c2fbf41b?auto=format&w=800&h=500&fit=crop",
    tutor: "Priya Sharma",
    rating: 4.8,
    reviewCount: 89,
    price: 499,
    duration: 45,
    nextDate: "Tomorrow at 4:00 PM",
    tags: ["Music", "All Ages"],
    lectureType: "live-one-on-one" as LectureType,
    isFeatured: false,
    ageRange: "7-16"
  },
  {
    classId: "art-fundamentals",
    title: "Art Fundamentals: Drawing & Sketching",
    image: "https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&w=800&h=500&fit=crop",
    tutor: "Neha Kapoor",
    rating: 4.7,
    reviewCount: 75,
    price: 399,
    duration: 60,
    nextDate: "Available anytime",
    tags: ["Art", "Ages 8+"],
    lectureType: "recorded-on-demand" as LectureType,
    isFeatured: false,
    ageRange: "8-16"
  },
  {
    classId: "cricket-coaching",
    title: "Cricket Batting Mastery Program",
    image: "https://images.unsplash.com/photo-1531415074968-036ba1b575da?auto=format&w=800&h=500&fit=crop",
    tutor: "Rahul Singh",
    rating: 4.9,
    reviewCount: 48,
    price: 799,
    duration: 90,
    nextDate: "Saturday at 9:00 AM",
    tags: ["Sports", "Ages 10-16"],
    lectureType: "offline-student-travels" as LectureType,
    location: "Shivaji Park, Mumbai",
    isFeatured: false,
    ageRange: "10-16"
  }
];
