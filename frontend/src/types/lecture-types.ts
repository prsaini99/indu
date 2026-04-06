
export type LectureType = 
  | "online-live-one-on-one" 
  | "online-live-group" 
  | "online-recorded-one-on-one"
  | "online-recorded-group"
  | "offline-inbound-one-on-one"
  | "offline-outbound-one-on-one"
  | "offline-outbound-group"
  // Legacy types for backward compatibility
  | "live-one-on-one"
  | "live-group"
  | "recorded-on-demand"
  | "offline-student-travels"
  | "offline-tutor-travels";

export interface LectureTypeInfo {
  id: LectureType;
  name: string;
  description: string;
  icon: string;
  color: string;
  deliveryMode: "online" | "offline";
  format?: "live" | "recorded" | "inbound" | "outbound";
  size: "one-on-one" | "group";
  durationType: "recurring"; // All are recurring/subscription based for now
  travelType?: "in-call" | "out-call"; // For offline classes
}

export const lectureTypes: Record<LectureType, LectureTypeInfo> = {
  "online-live-one-on-one": {
    id: "online-live-one-on-one",
    name: "Live 1-on-1",
    description: "Personalized real-time online classes with a single student",
    icon: "video",
    color: "bg-blue-500",
    deliveryMode: "online",
    format: "live",
    size: "one-on-one",
    durationType: "recurring"
  },
  "online-live-group": {
    id: "online-live-group",
    name: "Live Group",
    description: "Interactive online sessions with multiple students simultaneously",
    icon: "users",
    color: "bg-green-500",
    deliveryMode: "online",
    format: "live",
    size: "group",
    durationType: "recurring"
  },
  "online-recorded-one-on-one": {
    id: "online-recorded-one-on-one",
    name: "Recorded 1-on-1",
    description: "Pre-recorded sessions tailored for a specific student",
    icon: "book-audio",
    color: "bg-indigo-500",
    deliveryMode: "online",
    format: "recorded",
    size: "one-on-one",
    durationType: "recurring"
  },
  "online-recorded-group": {
    id: "online-recorded-group",
    name: "Recorded Group",
    description: "Pre-recorded sessions accessible to multiple students",
    icon: "book-audio",
    color: "bg-purple-500",
    deliveryMode: "online",
    format: "recorded",
    size: "group",
    durationType: "recurring"
  },
  "offline-inbound-one-on-one": {
    id: "offline-inbound-one-on-one",
    name: "Inbound 1-on-1",
    description: "Tutor travels to student's location for in-person sessions",
    icon: "map-pin",
    color: "bg-amber-500",
    deliveryMode: "offline",
    format: "inbound",
    size: "one-on-one",
    durationType: "recurring",
    travelType: "in-call"
  },
  "offline-outbound-one-on-one": {
    id: "offline-outbound-one-on-one",
    name: "Outbound 1-on-1",
    description: "Single student visits tutor's location for in-person sessions",
    icon: "map-pin",
    color: "bg-rose-500",
    deliveryMode: "offline",
    format: "outbound",
    size: "one-on-one",
    durationType: "recurring",
    travelType: "out-call"
  },
  "offline-outbound-group": {
    id: "offline-outbound-group",
    name: "Outbound Group",
    description: "Multiple students visit tutor's location for in-person sessions",
    icon: "users",
    color: "bg-orange-500",
    deliveryMode: "offline",
    format: "outbound",
    size: "group",
    durationType: "recurring",
    travelType: "out-call"
  },
  
  // Legacy mappings for backward compatibility
  "live-one-on-one": {
    id: "live-one-on-one",
    name: "Live 1-on-1",
    description: "Personalized real-time online classes with a single student",
    icon: "video",
    color: "bg-blue-500",
    deliveryMode: "online",
    format: "live",
    size: "one-on-one",
    durationType: "recurring"
  },
  "live-group": {
    id: "live-group",
    name: "Live Group",
    description: "Interactive online sessions with multiple students simultaneously",
    icon: "users",
    color: "bg-green-500",
    deliveryMode: "online",
    format: "live",
    size: "group",
    durationType: "recurring"
  },
  "recorded-on-demand": {
    id: "recorded-on-demand",
    name: "Recorded On-Demand",
    description: "Pre-recorded sessions accessible anytime",
    icon: "book-audio",
    color: "bg-purple-500",
    deliveryMode: "online",
    format: "recorded",
    size: "group", // Default to group
    durationType: "recurring"
  },
  "offline-student-travels": {
    id: "offline-student-travels",
    name: "Student Travels",
    description: "Students visit tutor's location for in-person sessions",
    icon: "map-pin",
    color: "bg-orange-500",
    deliveryMode: "offline",
    format: "outbound",
    size: "group", // Default to group
    durationType: "recurring",
    travelType: "out-call"
  },
  "offline-tutor-travels": {
    id: "offline-tutor-travels",
    name: "Tutor Travels",
    description: "Tutor travels to student's location for in-person sessions",
    icon: "map-pin",
    color: "bg-amber-500", 
    deliveryMode: "offline",
    format: "inbound",
    size: "one-on-one",
    durationType: "recurring",
    travelType: "in-call"
  }
};

export const getLectureTypeInfo = (type: LectureType): LectureTypeInfo => {
  return lectureTypes[type];
};

// Helper function to map old lecture type names to new ones
export const mapLegacyLectureType = (legacyType: LectureType): LectureType => {
  switch(legacyType) {
    case "live-one-on-one":
      return "online-live-one-on-one";
    case "live-group":
      return "online-live-group";
    case "recorded-on-demand":
      return "online-recorded-group";
    case "offline-student-travels":
      return "offline-outbound-group";
    case "offline-tutor-travels":
      return "offline-inbound-one-on-one";
    default:
      return legacyType;
  }
};
