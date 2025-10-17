// Fingerprint Management Page
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { 
  Fingerprint, 
  Search, 
  Filter, 
  Download, 
  Eye, 
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  BarChart3
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageLoading } from "@/components/ui/loading";

// Zod validation schema for fingerprint filters
const fingerprintFilterSchema = z.object({
  search: z.string().optional(),
  quality: z.enum(["all", "excellent", "good", "acceptable", "low"]).optional(),
  status: z.enum(["all", "enrolled", "failed", "pending"]).optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
});

type FingerprintFilterForm = z.infer<typeof fingerprintFilterSchema>;

interface FingerprintRecord {
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

const FingerprintsPage = () => {
  const [fingerprints, setFingerprints] = useState<FingerprintRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFingerprints, setSelectedFingerprints] = useState<number[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [stats, setStats] = useState({
    totalEnrolled: 0,
    totalFailed: 0,
    totalPending: 0,
    averageQuality: 0,
    successRate: 0
  });

  const { register, handleSubmit, watch, reset } = useForm<FingerprintFilterForm>({
    resolver: zodResolver(fingerprintFilterSchema),
    defaultValues: {
      search: "",
      quality: "all",
      status: "all",
      dateFrom: "",
      dateTo: "",
    }
  });

  const watchedValues = watch();

  useEffect(() => {
    fetchFingerprints();
    fetchStats();
  }, [currentPage, watchedValues]);

  const fetchFingerprints = async () => {
    try {
      setLoading(true);
      // TODO: Replace with actual API call
      
      // Mock data
      const mockFingerprints: FingerprintRecord[] = [
        {
          id: 1,
          applicationId: 1,
          fullName: "John Doe",
          identityNumber: "1234567890123",
          qualityScore: 85,
          qualityLevel: "EXCELLENT",
          status: "enrolled",
          templateSize: 2048,
          enrolledAt: "2024-01-15T10:30:00Z",
          attempts: 1,
          lastAttemptAt: "2024-01-15T10:30:00Z"
        },
        {
          id: 2,
          applicationId: 2,
          fullName: "Jane Smith",
          identityNumber: "9876543210987",
          qualityScore: 0,
          qualityLevel: "LOW",
          status: "failed",
          templateSize: 0,
          enrolledAt: "",
          attempts: 3,
          lastAttemptAt: "2024-01-16T14:20:00Z",
          errorMessage: "Image quality too low"
        },
        {
          id: 3,
          applicationId: 3,
          fullName: "Bob Johnson",
          identityNumber: "4567891230456",
          qualityScore: 0,
          qualityLevel: "LOW",
          status: "pending",
          templateSize: 0,
          enrolledAt: "",
          attempts: 0,
          lastAttemptAt: ""
        }
      ];

      setFingerprints(mockFingerprints);
      setTotalPages(3);
      setLoading(false);
    } catch (error) {
      console.error("Failed to fetch fingerprints:", error);
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      // TODO: Replace with actual API call
      setStats({
        totalEnrolled: 892,
        totalFailed: 57,
        totalPending: 298,
        averageQuality: 72,
        successRate: 94.2
      });
    } catch (error) {
      console.error("Failed to fetch stats:", error);
    }
  };

  const handleFilterSubmit = (data: FingerprintFilterForm) => {
    console.log("Filter data:", data);
    setCurrentPage(1);
    fetchFingerprints();
  };

  const handleSelectAll = () => {
    if (selectedFingerprints.length === fingerprints.length) {
      setSelectedFingerprints([]);
    } else {
      setSelectedFingerprints(fingerprints.map(fp => fp.id));
    }
  };

  const handleSelectFingerprint = (id: number) => {
    setSelectedFingerprints(prev => 
      prev.includes(id) 
        ? prev.filter(fpId => fpId !== id)
        : [...prev, id]
    );
  };

  const getQualityColor = (level: string) => {
    switch (level) {
      case "EXCELLENT":
        return "bg-green-100 text-green-800";
      case "GOOD":
        return "bg-blue-100 text-blue-800";
      case "ACCEPTABLE":
        return "bg-yellow-100 text-yellow-800";
      case "LOW":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "enrolled":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "failed":
        return <XCircle className="h-4 w-4 text-red-600" />;
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-600" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "enrolled":
        return "bg-green-100 text-green-800";
      case "failed":
        return "bg-red-100 text-red-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const handleRetryEnrollment = (id: number) => {
    console.log("Retry enrollment for:", id);
    // TODO: Implement retry logic
  };

  if (loading) {
    return <PageLoading text="Loading fingerprint data..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Fingerprint Management</h1>
          <p className="text-gray-600">Monitor fingerprint enrollment and quality</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="outline">
            <BarChart3 className="mr-2 h-4 w-4" />
            Quality Report
          </Button>
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-50 rounded-lg">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Enrolled</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalEnrolled}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-red-50 rounded-lg">
              <XCircle className="h-6 w-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Failed</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalFailed}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-50 rounded-lg">
              <Clock className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalPending}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Fingerprint className="h-6 w-6 text-primary" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Avg Quality</p>
              <p className="text-2xl font-bold text-gray-900">{stats.averageQuality}/100</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-primary/20 rounded-lg">
              <BarChart3 className="h-6 w-6 text-primary" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Success Rate</p>
              <p className="text-2xl font-bold text-gray-900">{stats.successRate}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="mr-2 h-4 w-4" />
            {showFilters ? "Hide" : "Show"} Filters
          </Button>
        </div>

        {showFilters && (
          <form onSubmit={handleSubmit(handleFilterSubmit)} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Search
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  {...register("search")}
                  type="text"
                  placeholder="Search by name or CNIC..."
                  className="pl-10 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Quality Level
              </label>
              <select
                {...register("quality")}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="all">All Quality</option>
                <option value="excellent">Excellent (70+)</option>
                <option value="good">Good (50-69)</option>
                <option value="acceptable">Acceptable (40-49)</option>
                <option value="low">Low (&lt;40)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                {...register("status")}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="all">All Status</option>
                <option value="enrolled">Enrolled</option>
                <option value="failed">Failed</option>
                <option value="pending">Pending</option>
              </select>
            </div>

            <div className="flex items-end space-x-2">
              <Button type="submit" className="flex-1">
                Apply Filters
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => reset()}
              >
                Clear
              </Button>
            </div>
          </form>
        )}
      </div>

      {/* Fingerprints Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <input
                type="checkbox"
                checked={selectedFingerprints.length === fingerprints.length && fingerprints.length > 0}
                onChange={handleSelectAll}
                className="rounded border-gray-300 text-primary focus:ring-primary"
              />
              <span className="text-sm text-gray-600">
                {selectedFingerprints.length} of {fingerprints.length} selected
              </span>
            </div>
            {selectedFingerprints.length > 0 && (
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm">
                  Bulk Retry
                </Button>
                <Button variant="outline" size="sm">
                  Export Selected
                </Button>
              </div>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Student
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Quality Score
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Template Size
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Attempts
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Enrolled At
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {fingerprints.map((fingerprint) => (
                <tr key={fingerprint.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={selectedFingerprints.includes(fingerprint.id)}
                        onChange={() => handleSelectFingerprint(fingerprint.id)}
                        className="rounded border-gray-300 text-primary focus:ring-primary mr-3"
                      />
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {fingerprint.fullName}
                        </div>
                        <div className="text-sm text-gray-500">
                          {fingerprint.identityNumber}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="text-sm font-medium text-gray-900">
                        {fingerprint.qualityScore}/100
                      </div>
                      <span className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getQualityColor(fingerprint.qualityLevel)}`}>
                        {fingerprint.qualityLevel}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {getStatusIcon(fingerprint.status)}
                      <span className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(fingerprint.status)}`}>
                        {fingerprint.status}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {fingerprint.templateSize > 0 ? `${fingerprint.templateSize} bytes` : "N/A"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {fingerprint.attempts}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(fingerprint.enrolledAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                      {fingerprint.status === "failed" && (
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleRetryEnrollment(fingerprint.id)}
                        >
                          <RefreshCw className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-6 py-4 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Showing page {currentPage} of {totalPages}
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(currentPage - 1)}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(currentPage + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FingerprintsPage;
