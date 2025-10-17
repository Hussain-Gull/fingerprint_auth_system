// Settings Page
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { 
  Save, 
  RefreshCw,
  Shield,
  Database,
  Fingerprint,
  Bell,
  Monitor,
  Key
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ButtonLoading } from "@/components/ui/loading";

// Zod validation schemas
const systemSettingsSchema = z.object({
  scanTimeout: z.number().min(5).max(300),
  maxAttempts: z.number().min(1).max(10),
  qualityThreshold: z.number().min(10).max(100),
  autoRetry: z.boolean(),
  ledBlinking: z.boolean(),
});

const securitySettingsSchema = z.object({
  sessionTimeout: z.number().min(5).max(1440),
  encryptionKey: z.string().min(32),
  requireAuth: z.boolean(),
  logLevel: z.enum(["DEBUG", "INFO", "WARNING", "ERROR"]),
});

const notificationSettingsSchema = z.object({
  emailNotifications: z.boolean(),
  smsNotifications: z.boolean(),
  webhookUrl: z.string().url().optional().or(z.literal("")),
  alertThreshold: z.number().min(1).max(100),
});

type SystemSettingsForm = z.infer<typeof systemSettingsSchema>;
type SecuritySettingsForm = z.infer<typeof securitySettingsSchema>;
type NotificationSettingsForm = z.infer<typeof notificationSettingsSchema>;

const SettingsPage = () => {
  const [activeTab, setActiveTab] = useState("system");
  const [loading, setLoading] = useState(false);
  const [systemSettings, setSystemSettings] = useState({
    scanTimeout: 30,
    maxAttempts: 3,
    qualityThreshold: 40,
    autoRetry: true,
    ledBlinking: true,
  });

  const [securitySettings, setSecuritySettings] = useState({
    sessionTimeout: 60,
    encryptionKey: "your-32-character-encryption-key-here",
    requireAuth: true,
    logLevel: "INFO" as "DEBUG" | "INFO" | "WARNING" | "ERROR",
  });

  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    smsNotifications: false,
    webhookUrl: "" as string,
    alertThreshold: 80,
  });

  const systemForm = useForm<SystemSettingsForm>({
    resolver: zodResolver(systemSettingsSchema),
    defaultValues: systemSettings,
  });

  const securityForm = useForm<SecuritySettingsForm>({
    resolver: zodResolver(securitySettingsSchema),
    defaultValues: securitySettings,
  });

  const notificationForm = useForm<NotificationSettingsForm>({
    resolver: zodResolver(notificationSettingsSchema),
    defaultValues: notificationSettings,
  });

  const tabs = [
    { id: "system", name: "System", icon: Monitor },
    { id: "security", name: "Security", icon: Shield },
    { id: "notifications", name: "Notifications", icon: Bell },
    { id: "database", name: "Database", icon: Database },
  ];

  const handleSystemSubmit = async (data: SystemSettingsForm) => {
    try {
      setLoading(true);
      // TODO: Replace with actual API call
      console.log("System settings:", data);
      setSystemSettings(data);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error("Failed to save system settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSecuritySubmit = async (data: SecuritySettingsForm) => {
    try {
      setLoading(true);
      // TODO: Replace with actual API call
      console.log("Security settings:", data);
      setSecuritySettings(data);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (err) {
      console.error("Failed to save security settings:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationSubmit = async (data: NotificationSettingsForm) => {
    try {
      setLoading(true);
      // TODO: Replace with actual API call
      console.log("Notification settings:", data);
      setNotificationSettings({
        ...data,
        webhookUrl: data.webhookUrl || "",
      });
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (err) {
      console.error("Failed to save notification settings:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleTestConnection = async () => {
    try {
      setLoading(true);
      // TODO: Implement connection test
      await new Promise(resolve => setTimeout(resolve, 1000));
      alert("Connection test successful!");
    } catch (_err) {
      alert("Connection test failed!");
    } finally {
      setLoading(false);
    }
  };

  const handleBackupDatabase = async () => {
    try {
      setLoading(true);
      // TODO: Implement database backup
      await new Promise(resolve => setTimeout(resolve, 2000));
      alert("Database backup completed successfully!");
    } catch (_err) {
      alert("Database backup failed!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600">Configure system settings and preferences</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="outline" onClick={handleTestConnection} disabled={loading}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Test Connection
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? "border-primary text-primary"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <Icon className="mr-2 h-4 w-4" />
                {tab.name}
              </button>
            );
          })}
        </nav>
      </div>

      {/* System Settings */}
      {activeTab === "system" && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">System Settings</h3>
            <div className="flex items-center space-x-2">
              <Monitor className="h-5 w-5 text-gray-400" />
              <Fingerprint className="h-5 w-5 text-gray-400" />
            </div>
          </div>

          <form onSubmit={systemForm.handleSubmit(handleSystemSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Scan Timeout (seconds)
                </label>
                <input
                  {...systemForm.register("scanTimeout", { valueAsNumber: true })}
                  type="number"
                  min="5"
                  max="300"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
                {systemForm.formState.errors.scanTimeout && (
                  <p className="mt-1 text-sm text-red-600">
                    {systemForm.formState.errors.scanTimeout.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Maximum Attempts
                </label>
                <input
                  {...systemForm.register("maxAttempts", { valueAsNumber: true })}
                  type="number"
                  min="1"
                  max="10"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
                {systemForm.formState.errors.maxAttempts && (
                  <p className="mt-1 text-sm text-red-600">
                    {systemForm.formState.errors.maxAttempts.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Quality Threshold
                </label>
                <input
                  {...systemForm.register("qualityThreshold", { valueAsNumber: true })}
                  type="number"
                  min="10"
                  max="100"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
                {systemForm.formState.errors.qualityThreshold && (
                  <p className="mt-1 text-sm text-red-600">
                    {systemForm.formState.errors.qualityThreshold.message}
                  </p>
                )}
              </div>

              <div className="space-y-4">
                <div className="flex items-center">
                  <input
                    {...systemForm.register("autoRetry")}
                    type="checkbox"
                    className="rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <label className="ml-2 text-sm text-gray-700">
                    Enable Auto Retry
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    {...systemForm.register("ledBlinking")}
                    type="checkbox"
                    className="rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <label className="ml-2 text-sm text-gray-700">
                    Enable LED Blinking
                  </label>
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <ButtonLoading text="Saving..." />
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Settings
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Security Settings */}
      {activeTab === "security" && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Security Settings</h3>
            <Shield className="h-5 w-5 text-gray-400" />
          </div>

          <form onSubmit={securityForm.handleSubmit(handleSecuritySubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Session Timeout (minutes)
                </label>
                <input
                  {...securityForm.register("sessionTimeout", { valueAsNumber: true })}
                  type="number"
                  min="5"
                  max="1440"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
                {securityForm.formState.errors.sessionTimeout && (
                  <p className="mt-1 text-sm text-red-600">
                    {securityForm.formState.errors.sessionTimeout.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Log Level
                </label>
                <select
                  {...securityForm.register("logLevel")}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="DEBUG">DEBUG</option>
                  <option value="INFO">INFO</option>
                  <option value="WARNING">WARNING</option>
                  <option value="ERROR">ERROR</option>
                </select>
                {securityForm.formState.errors.logLevel && (
                  <p className="mt-1 text-sm text-red-600">
                    {securityForm.formState.errors.logLevel.message}
                  </p>
                )}
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Encryption Key
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    {...securityForm.register("encryptionKey")}
                    type="password"
                    className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                  <Button variant="outline" size="sm">
                    <Key className="h-4 w-4" />
                  </Button>
                </div>
                {securityForm.formState.errors.encryptionKey && (
                  <p className="mt-1 text-sm text-red-600">
                    {securityForm.formState.errors.encryptionKey.message}
                  </p>
                )}
              </div>

              <div className="flex items-center">
                <input
                  {...securityForm.register("requireAuth")}
                  type="checkbox"
                  className="rounded border-gray-300 text-primary focus:ring-primary"
                />
                <label className="ml-2 text-sm text-gray-700">
                  Require Authentication for Admin Access
                </label>
              </div>
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <ButtonLoading text="Saving..." />
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Settings
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Notification Settings */}
      {activeTab === "notifications" && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Notification Settings</h3>
            <Bell className="h-5 w-5 text-gray-400" />
          </div>

          <form onSubmit={notificationForm.handleSubmit(handleNotificationSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Alert Threshold (%)
                </label>
                <input
                  {...notificationForm.register("alertThreshold", { valueAsNumber: true })}
                  type="number"
                  min="1"
                  max="100"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
                {notificationForm.formState.errors.alertThreshold && (
                  <p className="mt-1 text-sm text-red-600">
                    {notificationForm.formState.errors.alertThreshold.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Webhook URL
                </label>
                <input
                  {...notificationForm.register("webhookUrl")}
                  type="url"
                  placeholder="https://example.com/webhook"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
                {notificationForm.formState.errors.webhookUrl && (
                  <p className="mt-1 text-sm text-red-600">
                    {notificationForm.formState.errors.webhookUrl.message}
                  </p>
                )}
              </div>

              <div className="space-y-4">
                <div className="flex items-center">
                  <input
                    {...notificationForm.register("emailNotifications")}
                    type="checkbox"
                    className="rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <label className="ml-2 text-sm text-gray-700">
                    Email Notifications
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    {...notificationForm.register("smsNotifications")}
                    type="checkbox"
                    className="rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <label className="ml-2 text-sm text-gray-700">
                    SMS Notifications
                  </label>
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <ButtonLoading text="Saving..." />
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Settings
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Database Settings */}
      {activeTab === "database" && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Database Management</h3>
            <Database className="h-5 w-5 text-gray-400" />
          </div>

          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">Database Status</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Status:</span>
                    <span className="text-sm font-medium text-green-600">Connected</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Type:</span>
                    <span className="text-sm font-medium text-gray-900">SQLite</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Size:</span>
                    <span className="text-sm font-medium text-gray-900">20.5 MB</span>
                  </div>
                </div>
              </div>

              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">Quick Actions</h4>
                <div className="space-y-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full justify-start"
                    onClick={handleBackupDatabase}
                    disabled={loading}
                  >
                    <Database className="mr-2 h-4 w-4" />
                    Backup Database
                  </Button>
                  <Button variant="outline" size="sm" className="w-full justify-start">
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Optimize Database
                  </Button>
                </div>
              </div>
            </div>

            <div className="border border-gray-200 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-2">Database Statistics</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">1,247</div>
                  <div className="text-sm text-gray-600">Applications</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">892</div>
                  <div className="text-sm text-gray-600">Fingerprints</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">3</div>
                  <div className="text-sm text-gray-600">Admin Users</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">156</div>
                  <div className="text-sm text-gray-600">Sessions</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsPage;
