import api from './api';

export interface ParentDashboardData {
  childrenCount: number;
  creditBalance: number;
  activeEnrollments: number;
  activeBatches: number;
  upcomingDemos: number;
  assessmentCount: number;
  upcomingSessions: { subject: string; tutor: string; date: string; time: string; type: string }[];
  recentAssessments: { title: string; subject: string; score: number; maxScore: number; percentage: number; date: string }[];
  notifications: { unreadCount: number };
}

export interface TutorDashboardData {
  stats: { totalStudents: number; upcomingSessions: number; completedSessions: number; totalEarnings: number; coursesCount: number; averageRating: number };
  earningsSummary: { unpaidInPaise: number; thisMonthInPaise: number };
  upcomingSessions: { subject: string; student: string; date: string; time: string; type: string; zoomLink: string | null }[];
  recentActivity: { type: string; message: string; time: string }[];
  notifications: { unreadCount: number };
}

export interface ConsultantDashboardData {
  pendingDemoRequests: number;
  totalDemoRequests: number;
  activeDemoBookings: number;
  completedDemos: number;
  recentDemoRequests: { id: string; parentName: string; childName: string; subjects: string; status: string; date: string; createdAt: string }[];
  upcomingDemos: { id: string; subject: string; tutor: string; student: string; date: string; time: string; meetingLink: string | null }[];
  notifications: { unreadCount: number };
}

export const dashboardService = {
  async getParentDashboard(): Promise<ParentDashboardData> {
    const { data } = await api.get('/dashboard/parent');
    return data.data;
  },

  async getTutorDashboard(): Promise<TutorDashboardData> {
    const { data } = await api.get('/dashboard/tutor');
    return data.data;
  },

  async getConsultantDashboard(): Promise<ConsultantDashboardData> {
    const { data } = await api.get('/dashboard/consultant');
    return data.data;
  },
};
