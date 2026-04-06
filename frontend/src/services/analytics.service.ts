import api from './api';

export interface DashboardStats {
  users: { total: number; parents: number; tutors: number; consultants: number; admins: number };
  enrollments: { total: number; active: number; paused: number; cancelled: number };
  batches: { total: number; open: number; active: number; full: number; completed: number; cancelled: number };
  sessions: { totalCompleted: number; thisMonth: number; noShows: number };
  revenue: { totalInFils: number; thisMonthInFils: number; totalPayments: number };
  earnings: { totalInPaise: number; unpaidInPaise: number; paidInPaise: number };
  reviews: { total: number; averageRating: number };
  credits: { totalPurchased: number; totalUsed: number };
  monthlyRevenue: { month: string; amount: number }[];
  topTutors: { name: string; sessions: number; earned: number; rating: number }[];
  topSubjects: { name: string; enrollments: number }[];
  recentActivity: { type: string; message: string; time: string }[];
}

export const analyticsService = {
  async getDashboardStats(): Promise<DashboardStats> {
    const { data } = await api.get('/admin/analytics/dashboard');
    return data.data;
  },
};
