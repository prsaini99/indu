import { ClassCreationState } from "@/hooks/use-class-creation-store";
import { LectureType } from "@/types/lecture-types";

// Delay function for sequential auto-filling with shorter delays for faster execution
export const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Auto-fill configurations for different class types
const classTypeConfigs: Record<LectureType, Partial<ClassCreationState>> = {
  "online-live-one-on-one": {
    deliveryMode: "online",
    classFormat: "live",
    classSize: "one-on-one",
    durationType: "recurring",
    meetingLink: "https://zoom.us/j/1234567890?pwd=abcdefghijklmnopqrstuvwxyz"
  },
  "online-live-group": {
    deliveryMode: "online",
    classFormat: "live",
    classSize: "group",
    durationType: "recurring",
    meetingLink: "https://zoom.us/j/1234567890?pwd=abcdefghijklmnopqrstuvwxyz"
  },
  "online-recorded-one-on-one": {
    deliveryMode: "online",
    classFormat: "recorded",
    classSize: "one-on-one",
    durationType: "recurring"
  },
  "online-recorded-group": {
    deliveryMode: "online",
    classFormat: "recorded",
    classSize: "group",
    durationType: "recurring"
  },
  "offline-inbound-one-on-one": {
    deliveryMode: "offline",
    classFormat: "inbound",
    classSize: "one-on-one",
    durationType: "recurring",
    address: {
      street: "123 Student St",
      city: "San Francisco",
      state: "CA",
      zipCode: "94105",
      country: "United States"
    }
  },
  "offline-outbound-one-on-one": {
    deliveryMode: "offline",
    classFormat: "outbound",
    classSize: "one-on-one",
    durationType: "recurring",
    address: {
      street: "456 Tutor St",
      city: "San Francisco",
      state: "CA",
      zipCode: "94105",
      country: "United States"
    }
  },
  "offline-outbound-group": {
    deliveryMode: "offline",
    classFormat: "outbound",
    classSize: "group",
    durationType: "recurring",
    address: {
      street: "456 Tutor St",
      city: "San Francisco",
      state: "CA",
      zipCode: "94105",
      country: "United States"
    }
  },
  // Legacy type mappings
  "live-one-on-one": {
    deliveryMode: "online",
    classFormat: "live",
    classSize: "one-on-one",
    durationType: "recurring",
    meetingLink: "https://zoom.us/j/1234567890?pwd=abcdefghijklmnopqrstuvwxyz"
  },
  "live-group": {
    deliveryMode: "online",
    classFormat: "live",
    classSize: "group",
    durationType: "recurring",
    meetingLink: "https://zoom.us/j/1234567890?pwd=abcdefghijklmnopqrstuvwxyz"
  },
  "recorded-on-demand": {
    deliveryMode: "online",
    classFormat: "recorded",
    classSize: "group",
    durationType: "recurring"
  },
  "offline-student-travels": {
    deliveryMode: "offline",
    classFormat: "outbound",
    classSize: "group",
    durationType: "recurring",
    address: {
      street: "456 Tutor St",
      city: "San Francisco",
      state: "CA",
      zipCode: "94105",
      country: "United States"
    }
  },
  "offline-tutor-travels": {
    deliveryMode: "offline",
    classFormat: "inbound",
    classSize: "one-on-one",
    durationType: "recurring",
    address: {
      street: "123 Student St",
      city: "San Francisco",
      state: "CA",
      zipCode: "94105",
      country: "United States"
    }
  }
};

// Auto-fill data for the class creation form with faster typing effects
export const autoFillClassCreation = async (
  classType: LectureType,
  setStep: (step: number) => void, 
  updateFormState: (state: Partial<ClassCreationState>) => void
) => {
  console.log(`Starting auto-fill for ${classType} class creation...`);
  
  // Get class-type specific configuration
  const typeConfig = classTypeConfigs[classType];
  
  // Scroll to top of form to ensure visibility
  window.scrollTo({ top: 0, behavior: 'smooth' });
  
  // Step 1: Delivery & Type - Fill with minimal delays to simulate faster typing
  console.log("Step 1: Filling Delivery & Type");
  await delay(100);
  updateFormState({ deliveryMode: typeConfig.deliveryMode });
  await delay(100);
  updateFormState({ classFormat: typeConfig.classFormat });
  await delay(100);
  updateFormState({ classSize: typeConfig.classSize });
  await delay(100);
  updateFormState({ durationType: typeConfig.durationType });
  await delay(200);
  setStep(1);
  
  // Ensure form is visible after step change
  window.scrollTo({ top: 0, behavior: 'smooth' });
  
  // Step 2: Details - Fill fields with minimal delays
  console.log("Step 2: Filling Details");
  await delay(100);
  updateFormState({ title: `Auto-generated ${classType} Test Class` });
  await delay(100);
  updateFormState({ subject: "Technology & Coding" });
  await delay(100);
  updateFormState({ 
    description: `This is an automatically generated ${classType} class for testing purposes. It includes a detailed description of what students will learn in this course.`
  });
  await delay(100);
  updateFormState({ 
    thumbnailUrl: "https://images.unsplash.com/photo-1547658719-da2b51169166?auto=format&fit=crop&w=800&h=450&q=80"
  });
  await delay(200);
  setStep(2);
  
  // Ensure form is visible after step change
  window.scrollTo({ top: 0, behavior: 'smooth' });
  
  // Step 3: Schedule - Fill with minimal delays
  console.log("Step 3: Filling Schedule");
  await delay(100);
  updateFormState({ frequency: "weekly" });
  await delay(100);
  const startDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]; // One week from now
  updateFormState({ startDate });
  await delay(100);
  const endDate = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]; // 3 months from now
  updateFormState({ endDate });
  await delay(100);
  updateFormState({ totalSessions: 12 });
  await delay(100);
  
  // Add time slots quickly
  const timeSlot1 = {
    day: "monday" as DayOfWeek,
    startTime: "18:00",
    endTime: "19:30"
  };
  updateFormState({ timeSlots: [timeSlot1] });
  await delay(100);
  
  const timeSlot2 = {
    day: "wednesday" as DayOfWeek,
    startTime: "18:00",
    endTime: "19:30"
  };
  updateFormState({ timeSlots: [timeSlot1, timeSlot2] });
  await delay(200);
  setStep(3);
  
  // Ensure form is visible after step change
  window.scrollTo({ top: 0, behavior: 'smooth' });
  
  // Step 4: Pricing & Capacity
  console.log("Step 4: Filling Pricing & Capacity");
  await delay(100);
  updateFormState({ price: 29.99 });
  await delay(100);
  updateFormState({ currency: "USD" });
  await delay(100);
  updateFormState({ maxStudents: typeConfig.classSize === "group" ? 15 : 1 });
  await delay(100);
  updateFormState({ autoRenewal: true });
  await delay(200);
  setStep(4);
  
  // Ensure form is visible after step change
  window.scrollTo({ top: 0, behavior: 'smooth' });
  
  // Step 5: Location/Links
  console.log("Step 5: Filling Location/Links");
  if (typeConfig.deliveryMode === "online") {
    await delay(100);
    updateFormState({
      meetingLink: typeConfig.meetingLink || "https://zoom.us/j/1234567890?pwd=abcdefghijklmnopqrstuvwxyz"
    });
  } else {
    // Fill address fields quickly for offline classes
    const address = typeConfig.address || {
      street: "123 Main St",
      city: "San Francisco",
      state: "CA",
      zipCode: "94105",
      country: "United States"
    };
    
    await delay(100);
    updateFormState({ address: { ...address, street: address.street } });
    await delay(100);
    updateFormState({ address: { ...address, city: address.city } });
    await delay(100);
    updateFormState({ address: { ...address, state: address.state } });
    await delay(100);
    updateFormState({ address: { ...address, zipCode: address.zipCode } });
    await delay(100);
    updateFormState({ address: { ...address, country: address.country } });
  }
  await delay(200);
  setStep(5);
  
  // Ensure form is visible after step change
  window.scrollTo({ top: 0, behavior: 'smooth' });
  
  // Step 6: Curriculum
  console.log("Step 6: Filling Curriculum");
  // Add syllabus items quickly
  const syllabus = [
    {
      title: "Introduction to Programming",
      description: "Basic concepts of programming, variables, and data types"
    },
    {
      title: "Control Structures",
      description: "Loops, conditionals, and flow control"
    },
    {
      title: "Functions and Classes",
      description: "Building blocks of object-oriented programming"
    },
    {
      title: "Final Project",
      description: "Creating a complete application using all learned concepts"
    }
  ];
  
  await delay(100);
  updateFormState({ syllabus: [syllabus[0]] });
  await delay(100);
  updateFormState({ syllabus: syllabus.slice(0, 2) });
  await delay(100);
  updateFormState({ syllabus: syllabus.slice(0, 3) });
  await delay(100);
  updateFormState({ syllabus: syllabus });
  
  // Add materials quickly
  const materials = [
    {
      name: "Course Handbook",
      type: "pdf",
      url: "https://example.com/handbook.pdf"
    },
    {
      name: "Starter Code",
      type: "code",
      url: "https://github.com/example/starter-code"
    }
  ];
  
  await delay(100);
  updateFormState({ materials: [materials[0]] });
  await delay(100);
  updateFormState({ materials: materials });
  await delay(200);
  setStep(6);
  
  console.log("Auto-fill complete!");
};

// Type definition for day of week to avoid TS errors
type DayOfWeek = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

// Login auto-fill functions with faster execution
export const autoFillLogin = async (
  role: "student" | "tutor", 
  setValue: (field: string, value: any) => void,
  submit: () => void
) => {
  console.log(`Starting auto-fill for ${role} login...`);
  
  // Fill email field
  setValue("email", role === "tutor" ? "tutor@example.com" : "student@example.com");
  await delay(100);
  
  // Fill password field
  setValue("password", "password123");
  await delay(100);
  
  // Select role
  setValue("role", role);
  await delay(100);
  
  // Check "Remember me"
  setValue("rememberMe", true);
  await delay(100);
  
  // Submit the form
  submit();
};
