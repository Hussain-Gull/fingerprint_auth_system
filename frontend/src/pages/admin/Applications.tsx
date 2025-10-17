// Applications Management Page
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { 
  Search, 
  Filter, 
  Download, 
  Eye, 
  Edit, 
  Trash2,
  CheckCircle,
  Clock,
  XCircle,
  MoreHorizontal
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageLoading, SkeletonTable } from "@/components/ui/loading";

// Zod validation schema for application filters
const applicationFilterSchema = z.object({
  search: z.string().optional(),
  status: z.enum(["all", "pending", "enrolled", "failed"]).optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  subject: z.string().optional(),
});

type ApplicationFilterForm = z.infer<typeof applicationFilterSchema>;

interface Application {
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

const ApplicationsPage = () => {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedApplications, setSelectedApplications] = useState<number[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  const { register, handleSubmit, watch, reset } = useForm<ApplicationFilterForm>({
    resolver: zodResolver(applicationFilterSchema),
    defaultValues: {
      search: "",
      status: "all",
      dateFrom: "",
      dateTo: "",
      subject: "",
    }
  });

  const watchedValues = watch();

  useEffect(() => {
    fetchApplications();
  }, [currentPage, watchedValues]);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      // TODO: Replace with actual API call
      // const response = await axiosClient.get("/admin/applications", {
      //   params: { page: currentPage, ...watchedValues }
      // });
      
      // Mock data
      const mockApplications: Application[] = [
        {
          id: 1,
          fullName: "John Doe",
          fatherName: "Robert Doe",
          identityNumber: "1234567890123",
          dateOfBirth: "1990-01-15",
          gender: "Male",
          country: "Pakistan",
          address: "123 Main Street, Karachi",
          subject: "Mathematics",
          status: "enrolled",
          fingerprintEnrolled: true,
          createdAt: "2024-01-15T10:30:00Z",
          cnicFrontPath: "/uploads/cnic_front_1.jpg",
          cnicBackPath: "/uploads/cnic_back_1.jpg",
          studentImagePath: "/uploads/student_1.jpg"
        },
        {
          id: 2,
          fullName: "Jane Smith",
          fatherName: "Michael Smith",
          identityNumber: "9876543210987",
          dateOfBirth: "1992-05-20",
          gender: "Female",
          country: "Pakistan",
          address: "456 Oak Avenue, Lahore",
          subject: "Physics",
          status: "pending",
          fingerprintEnrolled: false,
          createdAt: "2024-01-16T14:20:00Z",
          cnicFrontPath: "/uploads/cnic_front_2.jpg",
          cnicBackPath: "/uploads/cnic_back_2.jpg",
          studentImagePath: "/uploads/student_2.jpg"
        },
        {
          id: 3,
          fullName: "Bob Johnson",
          fatherName: "David Johnson",
          identityNumber: "4567891230456",
          dateOfBirth: "1988-12-10",
          gender: "Male",
          country: "Pakistan",
          address: "789 Pine Road, Islamabad",
          subject: "Chemistry",
          status: "failed",
          fingerprintEnrolled: false,
          createdAt: "2024-01-17T09:15:00Z",
          cnicFrontPath: "/uploads/cnic_front_3.jpg",
          cnicBackPath: "/uploads/cnic_back_3.jpg",
          studentImagePath: "/uploads/student_3.jpg"
        }
      ];

      setApplications(mockApplications);
      setTotalPages(5);
      setLoading(false);
    } catch (error) {
      console.error("Failed to fetch applications:", error);
      setLoading(false);
    }
  };

  const handleFilterSubmit = (data: ApplicationFilterForm) => {
    console.log("Filter data:", data);
    setCurrentPage(1);
    fetchApplications();
  };

  const handleSelectAll = () => {
    if (selectedApplications.length === applications.length) {
      setSelectedApplications([]);
    } else {
      setSelectedApplications(applications.map(app => app.id));
    }
  };

  const handleSelectApplication = (id: number) => {
    setSelectedApplications(prev => 
      prev.includes(id) 
        ? prev.filter(appId => appId !== id)
        : [...prev, id]
    );
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "enrolled":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case "failed":
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "enrolled":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "failed":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  if (loading) {
    return <PageLoading text="Loading applications..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Applications</h1>
          <p className="text-gray-600">Manage student applications and enrollment status</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button>
            Add Application
          </Button>
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
                Status
              </label>
              <select
                {...register("status")}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="enrolled">Enrolled</option>
                <option value="failed">Failed</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                From Date
              </label>
              <input
                {...register("dateFrom")}
                type="date"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                To Date
              </label>
              <input
                {...register("dateTo")}
                type="date"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
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

      {/* Applications Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <input
                type="checkbox"
                checked={selectedApplications.length === applications.length && applications.length > 0}
                onChange={handleSelectAll}
                className="rounded border-gray-300 text-primary focus:ring-primary"
              />
              <span className="text-sm text-gray-600">
                {selectedApplications.length} of {applications.length} selected
              </span>
            </div>
            {selectedApplications.length > 0 && (
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm">
                  Bulk Actions
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
                  CNIC
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Subject
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fingerprint
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {applications.map((application) => (
                <tr key={application.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={selectedApplications.includes(application.id)}
                        onChange={() => handleSelectApplication(application.id)}
                        className="rounded border-gray-300 text-primary focus:ring-primary mr-3"
                      />
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {application.fullName}
                        </div>
                        <div className="text-sm text-gray-500">
                          {application.fatherName}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {application.identityNumber}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {application.subject}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {getStatusIcon(application.status)}
                      <span className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(application.status)}`}>
                        {application.status}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {application.fingerprintEnrolled ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <XCircle className="h-4 w-4 text-gray-400" />
                      )}
                      <span className="ml-2 text-sm text-gray-900">
                        {application.fingerprintEnrolled ? "Enrolled" : "Not Enrolled"}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(application.createdAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
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

export default ApplicationsPage;
