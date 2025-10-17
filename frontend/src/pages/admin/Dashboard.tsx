// Admin Dashboard Page
import { useState, useEffect } from "react";
import { 
  Users, 
  Fingerprint, 
  FileText, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  Activity
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageLoading } from "@/components/ui/loading";

interface DashboardStats {
  totalApplications: number;
  enrolledApplications: number;
  pendingApplications: number;
  failedEnrollments: number;
  todayApplications: number;
  weeklyApplications: number;
  monthlyApplications: number;
  systemHealth: "healthy" | "warning" | "error";
}

const AdminDashboard = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalApplications: 0,
    enrolledApplications: 0,
    pendingApplications: 0,
    failedEnrollments: 0,
    todayApplications: 0,
    weeklyApplications: 0,
    monthlyApplications: 0,
    systemHealth: "healthy"
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats().then(r => r);
  }, []);

  const fetchDashboardStats = async () => {
    try {
      // TODO: Replace with actual API call
      // const response = await axiosClient.get("/admin/dashboard/stats");
      // setStats(response.data);
      
      // Mock data for now
      setTimeout(() => {
        setStats({
          totalApplications: 1247,
          enrolledApplications: 892,
          pendingApplications: 298,
          failedEnrollments: 57,
          todayApplications: 23,
          weeklyApplications: 156,
          monthlyApplications: 487,
          systemHealth: "healthy"
        });
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error("Failed to fetch dashboard stats:", error);
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: "Total Applications",
      value: stats.totalApplications,
      icon: FileText,
      color: "text-primary",
      bgColor: "bg-primary/10",
      change: "+12%",
      changeType: "positive"
    },
    {
      title: "Enrolled",
      value: stats.enrolledApplications,
      icon: CheckCircle,
      color: "text-green-600",
      bgColor: "bg-green-50",
      change: "+8%",
      changeType: "positive"
    },
    {
      title: "Pending",
      value: stats.pendingApplications,
      icon: Clock,
      color: "text-yellow-600",
      bgColor: "bg-yellow-50",
      change: "-5%",
      changeType: "negative"
    },
    {
      title: "Failed",
      value: stats.failedEnrollments,
      icon: AlertCircle,
      color: "text-red-600",
      bgColor: "bg-red-50",
      change: "+2%",
      changeType: "negative"
    }
  ];

  const recentActivities = [
    {
      id: 1,
      type: "enrollment",
      message: "New fingerprint enrollment completed",
      user: "John Doe",
      time: "2 minutes ago",
      status: "success"
    },
    {
      id: 2,
      type: "application",
      message: "New application submitted",
      user: "Jane Smith",
      time: "5 minutes ago",
      status: "info"
    },
    {
      id: 3,
      type: "error",
      message: "Fingerprint capture failed",
      user: "Bob Johnson",
      time: "10 minutes ago",
      status: "error"
    },
    {
      id: 4,
      type: "enrollment",
      message: "Fingerprint enrollment completed",
      user: "Alice Brown",
      time: "15 minutes ago",
      status: "success"
    }
  ];

  const getHealthStatusColor = (health: string) => {
    switch (health) {
      case "healthy":
        return "text-green-600 bg-green-50";
      case "warning":
        return "text-yellow-600 bg-yellow-50";
      case "error":
        return "text-red-600 bg-red-50";
      default:
        return "text-gray-600 bg-gray-50";
    }
  };

  if (loading) {
    return <PageLoading text="Loading dashboard data..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">Overview of your biometric authentication system</p>
        </div>
        <div className="flex items-center space-x-2">
          <div className={`px-3 py-1 rounded-full text-sm font-medium ${getHealthStatusColor(stats.systemHealth)}`}>
            <Activity className="inline-block w-4 h-4 mr-1" />
            System {stats.systemHealth}
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.title} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{card.title}</p>
                  <p className="text-2xl font-bold text-gray-900">{card.value.toLocaleString()}</p>
                  <div className="flex items-center mt-1">
                    <span className={`text-sm font-medium ${
                      card.changeType === "positive" ? "text-green-600" : "text-red-600"
                    }`}>
                      {card.change}
                    </span>
                    <span className="text-sm text-gray-500 ml-1">vs last month</span>
                  </div>
                </div>
                <div className={`p-3 rounded-lg ${card.bgColor}`}>
                  <Icon className={`h-6 w-6 ${card.color}`} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts and Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Applications Chart */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Applications Trend</h3>
            <Button variant="outline" size="sm">
              View Details
            </Button>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-primary rounded-full"></div>
                <span className="text-sm text-gray-600">Today</span>
              </div>
              <span className="text-sm font-medium text-gray-900">{stats.todayApplications}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-sm text-gray-600">This Week</span>
              </div>
              <span className="text-sm font-medium text-gray-900">{stats.weeklyApplications}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-primary/70 rounded-full"></div>
                <span className="text-sm text-gray-600">This Month</span>
              </div>
              <span className="text-sm font-medium text-gray-900">{stats.monthlyApplications}</span>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
            <Button variant="outline" size="sm">
              View All
            </Button>
          </div>
          <div className="space-y-4">
            {recentActivities.map((activity) => (
              <div key={activity.id} className="flex items-start space-x-3">
                <div className={`w-2 h-2 rounded-full mt-2 ${
                  activity.status === "success" ? "bg-green-500" :
                  activity.status === "error" ? "bg-red-500" : "bg-blue-500"
                }`}></div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900">{activity.message}</p>
                  <p className="text-sm text-gray-500">{activity.user} • {activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Button className="h-12 justify-start" variant="outline">
            <FileText className="mr-2 h-5 w-5" />
            View All Applications
          </Button>
          <Button className="h-12 justify-start" variant="outline">
            <Fingerprint className="mr-2 h-5 w-5" />
            Manage Fingerprints
          </Button>
          <Button className="h-12 justify-start" variant="outline">
            <Users className="mr-2 h-5 w-5" />
            User Management
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
