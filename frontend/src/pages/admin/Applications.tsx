import {useState, useEffect} from "react";
import {Button} from "@/components/ui/button";
import {PageLoading} from "@/components/ui/loading";
import axiosClient from "@/utils/axiosClient";
import {Search, Filter, Download} from "lucide-react";

interface Application {
    id: number;
    full_name: string;
    father_name: string;
    identity_number: string;
    subject: string;
    status?: string | null;
    created_at: string;
}

const ApplicationsPage = () => {
    const [applications, setApplications] = useState<Application[]>([]);
    const [loading, setLoading] = useState(true);
    const [selected, setSelected] = useState<number[]>([]);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [showFilters, setShowFilters] = useState(false);

    // ✅ Fetch data with pagination
    const fetchApplications = async () => {
        try {
            setLoading(true);
            const {data} = await axiosClient.get(
                `/applications-info/applications-list?page=${page}&per_page=10`
            );
            setApplications(data.applications || []);
            setTotalPages(data.total_pages || 1);
        } catch (err) {
            console.error("Error fetching applications:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchApplications();
    }, [page]);

    // ✅ Handle table selection
    const handleSelectAll = () => {
        setSelected(
            selected.length === applications.length ? [] : applications.map((a) => a.id)
        );
    };

    const handleSelect = (id: number) => {
        setSelected((prev) =>
            prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
        );
    };

    const formatDate = (date: string) =>
        new Date(date).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
        });

    if (loading) return <PageLoading text="Loading applications..."/>;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Applications</h1>
                    <p className="text-gray-600">
                        Manage student applications and enrollment status
                    </p>
                </div>
                <div className="flex items-center space-x-3">
                    <Button variant="outline">
                        <Download className="mr-2 h-4 w-4"/>
                        Export
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
                        <Filter className="mr-2 h-4 w-4"/>
                        {showFilters ? "Hide" : "Show"} Filters
                    </Button>
                </div>

                {showFilters && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {[
                            {label: "Search", icon: <Search className="h-4 w-4 text-gray-400"/>},
                            {label: "From Date", type: "date"},
                            {label: "To Date", type: "date"},
                        ].map(({label, icon, type = "text"}) => (
                            <div key={label}>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    {label}
                                </label>
                                <div className="relative">
                                    {icon && (
                                        <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                                            {icon}
                                        </div>
                                    )}
                                    <input
                                        type={type}
                                        placeholder={label}
                                        className={`${
                                            icon ? "pl-10" : "pl-3"
                                        } w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary`}
                                    />
                                </div>
                            </div>
                        ))}
                        <div className="flex items-end space-x-2">
                            <Button className="flex-1">Apply</Button>
                            <Button variant="outline">Clear</Button>
                        </div>
                    </div>
                )}
            </div>

            {/* Table */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <input
                            type="checkbox"
                            checked={
                                selected.length === applications.length && applications.length > 0
                            }
                            onChange={handleSelectAll}
                            className="rounded border-gray-300 text-primary focus:ring-primary"
                        />
                        <span className="text-sm text-gray-600">
              {selected.length} of {applications.length} selected
            </span>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                        <tr>
                            {["Student", "CNIC", "Subject", "Status", "Created"].map((header) => (
                                <th
                                    key={header}
                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                >
                                    {header}
                                </th>
                            ))}
                        </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                        {applications.map((app) => (
                            <tr key={app.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center">
                                        <input
                                            type="checkbox"
                                            checked={selected.includes(app.id)}
                                            onChange={() => handleSelect(app.id)}
                                            className="rounded border-gray-300 text-primary focus:ring-primary mr-3"
                                        />
                                        <div>
                                            <div className="text-sm font-medium text-gray-900">
                                                {app.full_name}
                                            </div>
                                            <div className="text-sm text-gray-500">
                                                {app.father_name}
                                            </div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-900">
                                    {app.identity_number}
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-900">
                                    {app.subject}
                                </td>
                                <td
                                    className={`px-6 py-4 text-sm font-semibold ${
                                        app.status === "Pending"
                                            ? "text-yellow-500"
                                            : app.status === "Enrolled"
                                                ? "text-green-500"
                                                : "text-red-500"
                                    }`}
                                >
                                    {app.status}
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-500">
                                    {formatDate(app.created_at)}
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                      <span className="text-sm text-gray-700">
                        Page {page} of {totalPages}
                      </span>
                    <div className="flex items-center space-x-2">
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={page === 1}
                            onClick={() => setPage(page - 1)}
                        >
                            Previous
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPage(page + 1)}
                        >
                            Next
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ApplicationsPage;
