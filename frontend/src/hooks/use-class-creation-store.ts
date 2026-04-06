
import { create } from 'zustand';

// Define the types for our form state
export type DeliveryMode = 'online' | 'offline';
export type ClassFormat = 'live' | 'recorded' | 'inbound' | 'outbound';
export type ClassSize = 'group' | 'one-on-one';
export type DurationType = 'recurring' | 'fixed';
export type Frequency = 'daily' | 'weekly' | 'biweekly' | 'monthly';
export type DayOfWeek = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
export type TimeSlot = {
  day: DayOfWeek;
  startTime: string;
  endTime: string;
};

export type ClassCreationState = {
  // Step 1: Delivery & Type
  deliveryMode: DeliveryMode | null;
  classFormat: ClassFormat | null;
  classSize: ClassSize | null;
  durationType: DurationType | null;
  
  // Step 2: Details
  title: string;
  subject: string;
  description: string;
  thumbnailUrl: string;
  
  // Step 3: Schedule
  frequency: Frequency | null;
  startDate: string | null;
  endDate: string | null;
  totalSessions: number | null;
  timeSlots: TimeSlot[];
  
  // Step 4: Pricing & Capacity
  price: number | null;
  currency: string;
  maxStudents: number | null;
  autoRenewal: boolean;
  
  // Step 5: Location/Links
  meetingLink: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  
  // Step 6: Curriculum
  syllabus: { title: string; description: string }[];
  materials: { name: string; type: string; url: string }[];
};

type ClassCreationStore = {
  formState: ClassCreationState;
  setDeliveryMode: (mode: DeliveryMode) => void;
  setClassFormat: (format: ClassFormat) => void;
  setClassSize: (size: ClassSize) => void;
  setDurationType: (type: DurationType) => void;
  setBasicDetails: (details: Pick<ClassCreationState, 'title' | 'subject' | 'description' | 'thumbnailUrl'>) => void;
  setSchedule: (schedule: Pick<ClassCreationState, 'frequency' | 'startDate' | 'endDate' | 'totalSessions'>) => void;
  addTimeSlot: (timeSlot: TimeSlot) => void;
  removeTimeSlot: (index: number) => void;
  updateTimeSlot: (index: number, timeSlot: TimeSlot) => void;
  setPricing: (pricing: Pick<ClassCreationState, 'price' | 'currency' | 'maxStudents' | 'autoRenewal'>) => void;
  setLocation: (location: Pick<ClassCreationState, 'meetingLink' | 'address'>) => void;
  setSyllabus: (syllabus: { title: string; description: string }[]) => void;
  addSyllabusItem: (item: { title: string; description: string }) => void;
  removeSyllabusItem: (index: number) => void;
  updateSyllabusItem: (index: number, item: { title: string; description: string }) => void;
  addMaterial: (material: { name: string; type: string; url: string }) => void;
  removeMaterial: (index: number) => void;
  reset: () => void;
};

const initialState: ClassCreationState = {
  // Step 1: Delivery & Type
  deliveryMode: null,
  classFormat: null,
  classSize: null,
  durationType: null,
  
  // Step 2: Details
  title: '',
  subject: '',
  description: '',
  thumbnailUrl: '',
  
  // Step 3: Schedule
  frequency: null,
  startDate: null,
  endDate: null,
  totalSessions: null,
  timeSlots: [],
  
  // Step 4: Pricing & Capacity
  price: null,
  currency: 'USD',
  maxStudents: null,
  autoRenewal: false,
  
  // Step 5: Location/Links
  meetingLink: '',
  address: {
    street: '',
    city: '',
    state: '',
    zipCode: '',
    country: '',
  },
  
  // Step 6: Curriculum
  syllabus: [],
  materials: [],
};

export const useClassCreationStore = create<ClassCreationStore>((set) => ({
  formState: initialState,
  
  setDeliveryMode: (mode) => set((state) => ({ 
    formState: { 
      ...state.formState, 
      deliveryMode: mode,
      // Reset dependent fields when changing delivery mode
      classFormat: null,
      classSize: null 
    } 
  })),
  
  setClassFormat: (format) => set((state) => ({ 
    formState: { 
      ...state.formState, 
      classFormat: format,
      // Reset dependent fields
      classSize: format === 'inbound' ? 'one-on-one' : state.formState.classSize
    } 
  })),
  
  setClassSize: (size) => set((state) => ({ 
    formState: { 
      ...state.formState, 
      classSize: size,
      // Update max students if one-on-one
      maxStudents: size === 'one-on-one' ? 1 : state.formState.maxStudents
    } 
  })),
  
  setDurationType: (type) => set((state) => ({ 
    formState: { ...state.formState, durationType: type } 
  })),
  
  setBasicDetails: (details) => set((state) => ({ 
    formState: { ...state.formState, ...details } 
  })),
  
  setSchedule: (schedule) => set((state) => ({ 
    formState: { ...state.formState, ...schedule } 
  })),
  
  addTimeSlot: (timeSlot) => set((state) => ({ 
    formState: { 
      ...state.formState, 
      timeSlots: [...state.formState.timeSlots, timeSlot] 
    } 
  })),
  
  removeTimeSlot: (index) => set((state) => ({ 
    formState: { 
      ...state.formState, 
      timeSlots: state.formState.timeSlots.filter((_, i) => i !== index) 
    } 
  })),
  
  updateTimeSlot: (index, timeSlot) => set((state) => ({ 
    formState: { 
      ...state.formState, 
      timeSlots: state.formState.timeSlots.map((ts, i) => i === index ? timeSlot : ts) 
    } 
  })),
  
  setPricing: (pricing) => set((state) => ({ 
    formState: { ...state.formState, ...pricing } 
  })),
  
  setLocation: (location) => set((state) => ({ 
    formState: { ...state.formState, ...location } 
  })),
  
  setSyllabus: (syllabus) => set((state) => ({ 
    formState: { ...state.formState, syllabus } 
  })),
  
  addSyllabusItem: (item) => set((state) => ({ 
    formState: { 
      ...state.formState, 
      syllabus: [...state.formState.syllabus, item] 
    } 
  })),
  
  removeSyllabusItem: (index) => set((state) => ({ 
    formState: { 
      ...state.formState, 
      syllabus: state.formState.syllabus.filter((_, i) => i !== index) 
    } 
  })),
  
  updateSyllabusItem: (index, item) => set((state) => ({ 
    formState: { 
      ...state.formState, 
      syllabus: state.formState.syllabus.map((si, i) => i === index ? item : si) 
    } 
  })),
  
  addMaterial: (material) => set((state) => ({ 
    formState: { 
      ...state.formState, 
      materials: [...state.formState.materials, material] 
    } 
  })),
  
  removeMaterial: (index) => set((state) => ({ 
    formState: { 
      ...state.formState, 
      materials: state.formState.materials.filter((_, i) => i !== index) 
    } 
  })),
  
  reset: () => set({ formState: initialState }),
}));
