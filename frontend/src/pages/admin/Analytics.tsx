// Analytics Page
import { useState, useEffect } from "react";
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown,
  Fingerprint,
  Calendar,
  Download,
  RefreshCw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageLoading } from "@/components/ui/loading";

interface AnalyticsData {
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

const AnalyticsPage = () => {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState("30d");

  useEffect(() => {
    fetchAnalytics();
  }, [dateRange]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      // TODO: Replace with actual API call
      
      // Mock data
      const mockData: AnalyticsData = {
        applicationsOverTime: [
          { date: "2024-01-01", count: 45 },
          { date: "2024-01-02", count: 52 },
          { date: "2024-01-03", count: 38 },
          { date: "2024-01-04", count: 61 },
          { date: "2024-01-05", count: 47 },
          { date: "2024-01-06", count: 55 },
          { date: "2024-01-07", count: 43 },
        ],
        enrollmentSuccessRate: 94.2,
        qualityDistribution: [
          { level: "Excellent", count: 456 },
          { level: "Good", count: 234 },
          { level: "Acceptable", count: 123 },
          { level: "Low", count: 45 },
        ],
        subjectDistribution: [
          { subject: "Mathematics", count: 234 },
          { subject: "Physics", count: 189 },
          { subject: "Chemistry", count: 156 },
          { subject: "English", count: 134 },
          { subject: "History", count: 98 },
        ],
        dailyStats: {
          today: 23,
          yesterday: 18,
          thisWeek: 156,
          lastWeek: 142,
          thisMonth: 487,
          lastMonth: 423,
        },
        topSubjects: [
          { subject: "Mathematics", count: 234, percentage: 28.5 },
          { subject: "Physics", count: 189, percentage: 23.0 },
          { subject: "Chemistry", count: 156, percentage: 19.0 },
          { subject: "English", count: 134, percentage: 16.3 },
          { subject: "History", count: 98, percentage: 11.9 },
        ],
        qualityTrends: [
          { date: "2024-01-01", averageQuality: 72 },
          { date: "2024-01-02", averageQuality: 75 },
          { date: "2024-01-03", averageQuality: 68 },
          { date: "2024-01-04", averageQuality: 78 },
          { date: "2024-01-05", averageQuality: 74 },
          { date: "2024-01-06", averageQuality: 76 },
          { date: "2024-01-07", averageQuality: 73 },
        ],
      };

      setData(mockData);
      setLoading(false);
    } catch (error) {
      console.error("Failed to fetch analytics:", error);
      setLoading(false);
    }
  };

  const calculateChange = (current: number, previous: number) => {
    if (previous === 0) return 0;
    return ((current - previous) / previous) * 100;
  };

  const getChangeIcon = (change: number) => {
    if (change > 0) return <TrendingUp className="h-4 w-4 text-green-600" />;
    if (change < 0) return <TrendingDown className="h-4 w-4 text-red-600" />;
    return null;
  };

  const getChangeColor = (change: number) => {
    if (change > 0) return "text-green-600";
    if (change < 0) return "text-red-600";
    return "text-gray-600";
  };

  if (loading) {
    return <PageLoading text="Loading analytics data..." />;
  }

  if (!data) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No analytics data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
          <p className="text-gray-600">Insights and trends for your biometric system</p>
        </div>
        <div className="flex items-center space-x-3">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="1y">Last year</option>
          </select>
          <Button variant="outline" onClick={fetchAnalytics}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Today</p>
              <p className="text-2xl font-bold text-gray-900">{data.dailyStats.today}</p>
              <div className="flex items-center mt-1">
                {getChangeIcon(calculateChange(data.dailyStats.today, data.dailyStats.yesterday))}
                <span className={`text-sm font-medium ml-1 ${getChangeColor(calculateChange(data.dailyStats.today, data.dailyStats.yesterday))}`}>
                  {Math.abs(calculateChange(data.dailyStats.today, data.dailyStats.yesterday)).toFixed(1)}%
                </span>
                <span className="text-sm text-gray-500 ml-1">vs yesterday</span>
              </div>
            </div>
            <div className="p-2 bg-primary/10 rounded-lg">
              <Calendar className="h-6 w-6 text-primary" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">This Week</p>
              <p className="text-2xl font-bold text-gray-900">{data.dailyStats.thisWeek}</p>
              <div className="flex items-center mt-1">
                {getChangeIcon(calculateChange(data.dailyStats.thisWeek, data.dailyStats.lastWeek))}
                <span className={`text-sm font-medium ml-1 ${getChangeColor(calculateChange(data.dailyStats.thisWeek, data.dailyStats.lastWeek))}`}>
                  {Math.abs(calculateChange(data.dailyStats.thisWeek, data.dailyStats.lastWeek)).toFixed(1)}%
                </span>
                <span className="text-sm text-gray-500 ml-1">vs last week</span>
              </div>
            </div>
            <div className="p-2 bg-green-50 rounded-lg">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">This Month</p>
              <p className="text-2xl font-bold text-gray-900">{data.dailyStats.thisMonth}</p>
              <div className="flex items-center mt-1">
                {getChangeIcon(calculateChange(data.dailyStats.thisMonth, data.dailyStats.lastMonth))}
                <span className={`text-sm font-medium ml-1 ${getChangeColor(calculateChange(data.dailyStats.thisMonth, data.dailyStats.lastMonth))}`}>
                  {Math.abs(calculateChange(data.dailyStats.thisMonth, data.dailyStats.lastMonth)).toFixed(1)}%
                </span>
                <span className="text-sm text-gray-500 ml-1">vs last month</span>
              </div>
            </div>
            <div className="p-2 bg-primary/20 rounded-lg">
              <BarChart3 className="h-6 w-6 text-primary" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Success Rate</p>
              <p className="text-2xl font-bold text-gray-900">{data.enrollmentSuccessRate}%</p>
              <div className="flex items-center mt-1">
                <TrendingUp className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium text-green-600 ml-1">+2.1%</span>
                <span className="text-sm text-gray-500 ml-1">vs last month</span>
              </div>
            </div>
            <div className="p-2 bg-yellow-50 rounded-lg">
              <Fingerprint className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Applications Over Time */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Applications Over Time</h3>
            <Button variant="outline" size="sm">
              View Details
            </Button>
          </div>
          <div className="h-64 flex items-center justify-center">
            <div className="text-center">
              <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500">Chart visualization would go here</p>
              <p className="text-sm text-gray-400">Integration with charting library needed</p>
            </div>
          </div>
        </div>

        {/* Quality Distribution */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Quality Distribution</h3>
            <Button variant="outline" size="sm">
              View Details
            </Button>
          </div>
          <div className="space-y-4">
            {data.qualityDistribution.map((item) => (
              <div key={item.level} className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className={`w-3 h-3 rounded-full mr-3 ${
                    item.level === "Excellent" ? "bg-green-500" :
                    item.level === "Good" ? "bg-blue-500" :
                    item.level === "Acceptable" ? "bg-yellow-500" : "bg-red-500"
                  }`}></div>
                  <span className="text-sm text-gray-600">{item.level}</span>
                </div>
                <div className="flex items-center">
                  <span className="text-sm font-medium text-gray-900 mr-2">{item.count}</span>
                  <div className="w-20 bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${
                        item.level === "Excellent" ? "bg-green-500" :
                        item.level === "Good" ? "bg-blue-500" :
                        item.level === "Acceptable" ? "bg-yellow-500" : "bg-red-500"
                      }`}
                      style={{ 
                        width: `${(item.count / Math.max(...data.qualityDistribution.map(q => q.count))) * 100}%` 
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Subject Distribution */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Subject Distribution</h3>
          <Button variant="outline" size="sm">
            View Details
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.topSubjects.map((subject) => (
            <div key={subject.subject} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-gray-900">{subject.subject}</h4>
                <span className="text-sm text-gray-500">{subject.percentage}%</span>
              </div>
              <div className="text-2xl font-bold text-gray-900 mb-2">{subject.count}</div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-primary h-2 rounded-full"
                  style={{ width: `${subject.percentage}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quality Trends */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Quality Trends</h3>
          <Button variant="outline" size="sm">
            View Details
          </Button>
        </div>
        <div className="h-64 flex items-center justify-center">
          <div className="text-center">
            <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-500">Quality trend chart would go here</p>
            <p className="text-sm text-gray-400">Integration with charting library needed</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPage;
