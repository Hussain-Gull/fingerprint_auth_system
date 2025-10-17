// Admin API Service
import axiosClient from "@/utils/axiosClient";

export interface Application {
  id: number;
  fullName: string;
  fatherName: string;
  identityNumber: string;
  dateOfBirth: string;
  gender: string;
  country: string;
  address: string;
  subject: string;
  status: "pending" | "enrolled" | "failed";
  fingerprintEnrolled: boolean;
  createdAt: string;
  cnicFrontPath?: string;
  cnicBackPath?: string;
  studentImagePath?: string;
}

export interface FingerprintRecord {
  id: number;
  applicationId: number;
  fullName: string;
  identityNumber: string;
  qualityScore: number;
  qualityLevel: "EXCELLENT" | "GOOD" | "ACCEPTABLE" | "LOW";
  status: "enrolled" | "failed" | "pending";
  templateSize: number;
  enrolledAt: string;
  attempts: number;
  lastAttemptAt: string;
  errorMessage?: string;
}

export interface AdminUser {
  id: number;
  username: string;
  email: string;
  fullName: string;
  role: "admin" | "super_admin" | "viewer";
  status: "active" | "inactive" | "suspended";
  lastLogin: string;
  createdAt: string;
  permissions: string[];
}

export interface DashboardStats {
  totalApplications: number;
  enrolledApplications: number;
  pendingApplications: number;
  failedEnrollments: number;
  todayApplications: number;
  weeklyApplications: number;
  monthlyApplications: number;
  systemHealth: "healthy" | "warning" | "error";
}

export interface AnalyticsData {
  applicationsOverTime: Array<{ date: string; count: number }>;
  enrollmentSuccessRate: number;
  qualityDistribution: Array<{ level: string; count: number }>;
  subjectDistribution: Array<{ subject: string; count: number }>;
  dailyStats: {
    today: number;
    yesterday: number;
    thisWeek: number;
    lastWeek: number;
    thisMonth: number;
    lastMonth: number;
  };
  topSubjects: Array<{ subject: string; count: number; percentage: number }>;
  qualityTrends: Array<{ date: string; averageQuality: number }>;
}

class AdminApiService {
  // Authentication
  async login(username: string, password: string) {
    const response = await axiosClient.post("/admin/auth/login", {
      username,
      password,
    });
    return response.data;
  }

  async logout() {
    const response = await axiosClient.post("/admin/auth/logout");
    return response.data;
  }

  // Dashboard
  async getDashboardStats(): Promise<DashboardStats> {
    const response = await axiosClient.get("/admin/dashboard/stats");
    return response.data;
  }

  // Applications
  async getApplications(params?: {
    page?: number;
    search?: string;
    status?: string;
    dateFrom?: string;
    dateTo?: string;
    subject?: string;
  }): Promise<{ data: Application[]; totalPages: number; currentPage: number }> {
    const response = await axiosClient.get("/admin/applications", { params });
    return response.data;
  }

  async getApplication(id: number): Promise<Application> {
    const response = await axiosClient.get(`/admin/applications/${id}`);
    return response.data;
  }

  async updateApplicationStatus(id: number, status: string) {
    const response = await axiosClient.put(`/admin/applications/${id}/status`, {
      status,
    });
    return response.data;
  }

  async deleteApplication(id: number) {
    const response = await axiosClient.delete(`/admin/applications/${id}`);
    return response.data;
  }

  async exportApplications(format: "csv" | "pdf" = "csv") {
    const response = await axiosClient.get(`/admin/applications/export?format=${format}`, {
      responseType: "blob",
    });
    return response.data;
  }

  // Fingerprints
  async getFingerprints(params?: {
    page?: number;
    search?: string;
    quality?: string;
    status?: string;
    dateFrom?: string;
    dateTo?: string;
  }): Promise<{ data: FingerprintRecord[]; totalPages: number; currentPage: number }> {
    const response = await axiosClient.get("/admin/fingerprints", { params });
    return response.data;
  }

  async getFingerprintStats() {
    const response = await axiosClient.get("/admin/fingerprints/stats");
    return response.data;
  }

  async retryFingerprintEnrollment(id: number) {
    const response = await axiosClient.post(`/admin/fingerprints/${id}/retry`);
    return response.data;
  }

  async exportFingerprints(format: "csv" | "pdf" = "csv") {
    const response = await axiosClient.get(`/admin/fingerprints/export?format=${format}`, {
      responseType: "blob",
    });
    return response.data;
  }

  // Users
  async getUsers(params?: {
    page?: number;
    search?: string;
    role?: string;
    status?: string;
  }): Promise<{ data: AdminUser[]; totalPages: number; currentPage: number }> {
    const response = await axiosClient.get("/admin/users", { params });
    return response.data;
  }

  async createUser(userData: Partial<AdminUser>) {
    const response = await axiosClient.post("/admin/users", userData);
    return response.data;
  }

  async updateUser(id: number, userData: Partial<AdminUser>) {
    const response = await axiosClient.put(`/admin/users/${id}`, userData);
    return response.data;
  }

  async deleteUser(id: number) {
    const response = await axiosClient.delete(`/admin/users/${id}`);
    return response.data;
  }

  // Analytics
  async getAnalytics(dateRange: string = "30d"): Promise<AnalyticsData> {
    const response = await axiosClient.get(`/admin/analytics?range=${dateRange}`);
    return response.data;
  }

  async exportAnalytics(format: "csv" | "pdf" = "csv") {
    const response = await axiosClient.get(`/admin/analytics/export?format=${format}`, {
      responseType: "blob",
    });
    return response.data;
  }

  // Settings
  async getSystemSettings() {
    const response = await axiosClient.get("/admin/settings/system");
    return response.data;
  }

  async updateSystemSettings(settings: any) {
    const response = await axiosClient.put("/admin/settings/system", settings);
    return response.data;
  }

  async getSecuritySettings() {
    const response = await axiosClient.get("/admin/settings/security");
    return response.data;
  }

  async updateSecuritySettings(settings: any) {
    const response = await axiosClient.put("/admin/settings/security", settings);
    return response.data;
  }

  async getNotificationSettings() {
    const response = await axiosClient.get("/admin/settings/notifications");
    return response.data;
  }

  async updateNotificationSettings(settings: any) {
    const response = await axiosClient.put("/admin/settings/notifications", settings);
    return response.data;
  }

  // System
  async testConnection() {
    const response = await axiosClient.get("/admin/system/test-connection");
    return response.data;
  }

  async getSystemStatus() {
    const response = await axiosClient.get("/admin/system/status");
    return response.data;
  }

  async backupDatabase() {
    const response = await axiosClient.post("/admin/system/backup");
    return response.data;
  }

  async optimizeDatabase() {
    const response = await axiosClient.post("/admin/system/optimize");
    return response.data;
  }

  // Bulk Operations
  async bulkUpdateApplications(ids: number[], updates: any) {
    const response = await axiosClient.put("/admin/applications/bulk", {
      ids,
      updates,
    });
    return response.data;
  }

  async bulkRetryFingerprints(ids: number[]) {
    const response = await axiosClient.post("/admin/fingerprints/bulk-retry", {
      ids,
    });
    return response.data;
  }

  async bulkDeleteUsers(ids: number[]) {
    const response = await axiosClient.delete("/admin/users/bulk", {
      data: { ids },
    });
    return response.data;
  }
}

export const adminApiService = new AdminApiService();
export default adminApiService;
