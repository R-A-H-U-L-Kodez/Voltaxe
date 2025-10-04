import { useState, useEffect } from 'react';
import { Sidebar } from '../components/Sidebar';
import { 
  Settings, 
  User, 
  Bell, 
  Shield, 
  Database, 
  Monitor, 
  Palette, 
  Save,
  RefreshCw,
  Eye,
  EyeOff,
  Check,
  Copy,
  Key,
  Download,
  Upload,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

interface SettingsData {
  // User Preferences
  username: string;
  email: string;
  
  // Notifications
  emailNotifications: boolean;
  desktopNotifications: boolean;
  criticalAlerts: boolean;
  suspiciousActivity: boolean;
  systemUpdates: boolean;
  
  // Security
  sessionTimeout: number;
  twoFactorAuth: boolean;
  passwordExpiry: number;
  
  // Monitoring
  refreshInterval: number;
  maxEvents: number;
  dataRetention: number;
  autoRefresh: boolean;
  
  // Display
  theme: 'dark' | 'light';
  compactMode: boolean;
  showTimestamps: boolean;
  dateFormat: '12h' | '24h';
  
  // API Configuration
  apiEndpoint: string;
  timeout: number;
  retryAttempts: number;
}

const defaultSettings: SettingsData = {
  username: 'admin',
  email: 'admin@voltaxe.com',
  emailNotifications: true,
  desktopNotifications: true,
  criticalAlerts: true,
  suspiciousActivity: true,
  systemUpdates: false,
  sessionTimeout: 60,
  twoFactorAuth: false,
  passwordExpiry: 90,
  refreshInterval: 5,
  maxEvents: 100,
  dataRetention: 30,
  autoRefresh: true,
  theme: 'dark',
  compactMode: false,
  showTimestamps: true,
  dateFormat: '24h',
  apiEndpoint: 'http://localhost:8000',
  timeout: 30,
  retryAttempts: 3,
};

export const SettingsPage = () => {
  const [settings, setSettings] = useState<SettingsData>(defaultSettings);
  const [showApiKey, setShowApiKey] = useState(false);
  const [unsavedChanges, setUnsavedChanges] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [apiKey, setApiKey] = useState('vltx_1234567890abcdef_prod_key_secure');
  const [copiedApiKey, setCopiedApiKey] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'success' | 'error'>('idle');

  // Load settings from localStorage on mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('voltaxe_settings');
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        setSettings({ ...defaultSettings, ...parsed });
      } catch (error) {
        console.error('Failed to load settings:', error);
      }
    }
    
    // Load API key
    const savedApiKey = localStorage.getItem('voltaxe_api_key');
    if (savedApiKey) {
      setApiKey(savedApiKey);
    } else {
      // Generate initial API key if none exists
      const initialKey = `vltx_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}_${Date.now()}`;
      setApiKey(initialKey);
      localStorage.setItem('voltaxe_api_key', initialKey);
    }
  }, []);

  // Apply theme when settings change
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', settings.theme);
  }, [settings.theme]);

  // Track unsaved changes
  useEffect(() => {
    const savedSettings = localStorage.getItem('voltaxe_settings');
    const currentSettingsString = JSON.stringify(settings);
    const savedSettingsString = savedSettings || JSON.stringify(defaultSettings);
    setUnsavedChanges(currentSettingsString !== savedSettingsString);
  }, [settings]);

  const handleSave = async () => {
    setSaving(true);
    try {
      localStorage.setItem('voltaxe_settings', JSON.stringify(settings));
      setUnsavedChanges(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (error) {
      console.error('Failed to save settings:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setSettings(defaultSettings);
    localStorage.removeItem('voltaxe_settings');
    setUnsavedChanges(false);
  };

  const generateNewApiKey = () => {
    const newKey = `vltx_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}_${Date.now()}`;
    setApiKey(newKey);
    localStorage.setItem('voltaxe_api_key', newKey);
  };

  const copyApiKey = () => {
    navigator.clipboard.writeText(apiKey);
    setCopiedApiKey(true);
    setTimeout(() => setCopiedApiKey(false), 2000);
  };

  const testConnection = async () => {
    setTestingConnection(true);
    setConnectionStatus('idle');
    
    try {
      const response = await fetch(`${settings.apiEndpoint}/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(settings.timeout * 1000)
      });
      
      if (response.ok) {
        setConnectionStatus('success');
      } else {
        setConnectionStatus('error');
      }
    } catch (error) {
      console.error('Connection test failed:', error);
      setConnectionStatus('error');
    } finally {
      setTestingConnection(false);
      setTimeout(() => setConnectionStatus('idle'), 3000);
    }
  };

  const downloadSettings = () => {
    const dataStr = JSON.stringify(settings, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `voltaxe-settings-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const importSettings = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.onchange = (e: any) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          try {
            const importedSettings = JSON.parse(event.target?.result as string);
            setSettings({ ...defaultSettings, ...importedSettings });
          } catch (error) {
            console.error('Failed to import settings:', error);
            alert('Invalid settings file. Please check the file format.');
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  const updateSetting = (key: keyof SettingsData, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const SettingsSection = ({ 
    title, 
    icon: Icon, 
    children 
  }: { 
    title: string; 
    icon: any; 
    children: React.ReactNode 
  }) => (
    <div className="card p-6 mb-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'hsl(var(--primary-gold) / 0.2)' }}>
          <Icon size={20} style={{ color: 'hsl(var(--primary-gold))' }} />
        </div>
        <h2 className="text-2xl font-bold text-foreground">{title}</h2>
      </div>
      <div className="space-y-4">
        {children}
      </div>
    </div>
  );

  const ToggleSwitch = ({ 
    checked, 
    onChange, 
    label, 
    description 
  }: { 
    checked: boolean; 
    onChange: (checked: boolean) => void; 
    label: string; 
    description?: string 
  }) => (
    <div className="flex items-center justify-between">
      <div>
        <label className="text-foreground font-semibold">{label}</label>
        {description && <p className="text-muted-foreground text-sm mt-1">{description}</p>}
      </div>
      <button
        onClick={() => onChange(!checked)}
        className="relative inline-flex h-6 w-11 items-center rounded-full transition-smooth"
        style={{
          backgroundColor: checked ? 'hsl(var(--primary-gold))' : 'hsl(var(--border))'
        }}
      >
        <span
          className="inline-block h-4 w-4 transform rounded-full transition-transform"
          style={{
            backgroundColor: 'white',
            transform: checked ? 'translateX(1.5rem)' : 'translateX(0.25rem)'
          }}
        />
      </button>
    </div>
  );

  const InputField = ({ 
    label, 
    value, 
    onChange, 
    type = 'text', 
    description 
  }: { 
    label: string; 
    value: string | number; 
    onChange: (value: string | number) => void; 
    type?: string; 
    description?: string 
  }) => (
    <div>
      <label className="block text-foreground font-medium mb-2">{label}</label>
      {description && <p className="text-foreground/60 text-sm mb-2">{description}</p>}
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(type === 'number' ? Number(e.target.value) : e.target.value)}
        className="w-full px-4 py-2 bg-input border border-border rounded-lg text-foreground placeholder-foreground/40 focus:outline-none focus:border-primary-gold"
      />
    </div>
  );

  const SelectField = ({ 
    label, 
    value, 
    onChange, 
    options, 
    description 
  }: { 
    label: string; 
    value: string | number; 
    onChange: (value: string | number) => void; 
    options: { value: string | number; label: string }[]; 
    description?: string 
  }) => (
    <div>
      <label className="block text-foreground font-medium mb-2">{label}</label>
      {description && <p className="text-foreground/60 text-sm mb-2">{description}</p>}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-4 py-2 bg-input border border-border rounded-lg text-foreground focus:outline-none focus:border-primary-gold"
      >
        {options.map(option => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'hsl(var(--background))' }}>
      <Sidebar />

      <main className="ml-64 p-8">
        {/* Page Header */}
        <div className="mb-8 animate-fadeIn">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 gradient-gold rounded-2xl flex items-center justify-center shadow-xl">
                <Settings size={32} style={{ color: 'hsl(var(--background))' }} />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-gradient-gold mb-2">
                  Settings
                </h1>
                <p className="text-muted-foreground flex items-center">
                  <Settings className="h-4 w-4 mr-2" style={{ color: 'hsl(var(--primary-gold))' }} />
                  Configure your Voltaxe Clarity Hub experience
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {unsavedChanges && (
                <span className="text-sm font-semibold" style={{ color: 'hsl(var(--warning))' }}>Unsaved changes</span>
              )}
              <button
                onClick={importSettings}
                className="px-4 py-2 border rounded-lg text-foreground hover:bg-white/5 flex items-center gap-2 transition-smooth"
                style={{ borderColor: 'hsl(var(--border))' }}
                title="Import settings from JSON file"
              >
                <Upload size={16} />
                Import
              </button>
              <button
                onClick={downloadSettings}
                className="px-4 py-2 border rounded-lg text-foreground hover:bg-white/5 flex items-center gap-2 transition-smooth"
                style={{ borderColor: 'hsl(var(--border))' }}
                title="Export settings to JSON file"
              >
                <Download size={16} />
                Export
              </button>
              <button
                onClick={handleReset}
                className="px-4 py-2 border rounded-lg text-foreground hover:bg-white/5 flex items-center gap-2 transition-smooth"
                style={{ borderColor: 'hsl(var(--border))' }}
              >
                <RefreshCw size={16} />
                Reset
              </button>
              <button
                onClick={handleSave}
                disabled={!unsavedChanges || saving}
                className="px-4 py-2 rounded-lg flex items-center gap-2 font-semibold transition-smooth disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  backgroundColor: saved
                    ? 'hsl(var(--success))'
                    : unsavedChanges
                    ? 'hsl(var(--primary-gold))'
                    : 'hsl(var(--border))',
                  color: saved || unsavedChanges
                    ? 'hsl(var(--background))'
                    : 'hsl(var(--muted-foreground))'
                }}
              >
                {saving ? (
                  <RefreshCw className="animate-spin" size={16} />
                ) : saved ? (
                  <Check size={16} />
                ) : (
                  <Save size={16} />
                )}
                {saved ? 'Saved!' : saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>

        <div className="max-w-4xl">
          {/* User Profile */}
          <SettingsSection title="User Profile" icon={User}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InputField
                label="Username"
                value={settings.username}
                onChange={(value) => updateSetting('username', value)}
                description="Your display name in the system"
              />
              <InputField
                label="Email Address"
                value={settings.email}
                onChange={(value) => updateSetting('email', value)}
                type="email"
                description="Used for notifications and account recovery"
              />
            </div>
          </SettingsSection>

          {/* Notifications */}
          <SettingsSection title="Notifications" icon={Bell}>
            <ToggleSwitch
              label="Email Notifications"
              description="Receive security alerts via email"
              checked={settings.emailNotifications}
              onChange={(checked) => updateSetting('emailNotifications', checked)}
            />
            <ToggleSwitch
              label="Desktop Notifications"
              description="Show browser notifications for real-time alerts"
              checked={settings.desktopNotifications}
              onChange={(checked) => updateSetting('desktopNotifications', checked)}
            />
            <ToggleSwitch
              label="Critical Alerts"
              description="Always notify for critical security events"
              checked={settings.criticalAlerts}
              onChange={(checked) => updateSetting('criticalAlerts', checked)}
            />
            <ToggleSwitch
              label="Suspicious Activity"
              description="Notify when suspicious behavior is detected"
              checked={settings.suspiciousActivity}
              onChange={(checked) => updateSetting('suspiciousActivity', checked)}
            />
            <ToggleSwitch
              label="System Updates"
              description="Receive notifications about system updates"
              checked={settings.systemUpdates}
              onChange={(checked) => updateSetting('systemUpdates', checked)}
            />
          </SettingsSection>

          {/* Security */}
          <SettingsSection title="Security" icon={Shield}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <SelectField
                label="Session Timeout"
                value={settings.sessionTimeout}
                onChange={(value) => updateSetting('sessionTimeout', Number(value))}
                options={[
                  { value: 15, label: '15 minutes' },
                  { value: 30, label: '30 minutes' },
                  { value: 60, label: '1 hour' },
                  { value: 120, label: '2 hours' },
                  { value: 240, label: '4 hours' }
                ]}
                description="Automatically log out after inactivity"
              />
              <SelectField
                label="Password Expiry"
                value={settings.passwordExpiry}
                onChange={(value) => updateSetting('passwordExpiry', Number(value))}
                options={[
                  { value: 30, label: '30 days' },
                  { value: 60, label: '60 days' },
                  { value: 90, label: '90 days' },
                  { value: 180, label: '6 months' },
                  { value: 365, label: '1 year' }
                ]}
                description="Force password changes periodically"
              />
            </div>
            <ToggleSwitch
              label="Two-Factor Authentication"
              description="Add an extra layer of security to your account"
              checked={settings.twoFactorAuth}
              onChange={(checked) => updateSetting('twoFactorAuth', checked)}
            />
          </SettingsSection>

          {/* Monitoring */}
          <SettingsSection title="Monitoring" icon={Monitor}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <SelectField
                label="Refresh Interval"
                value={settings.refreshInterval}
                onChange={(value) => updateSetting('refreshInterval', Number(value))}
                options={[
                  { value: 1, label: '1 second' },
                  { value: 2, label: '2 seconds' },
                  { value: 5, label: '5 seconds' },
                  { value: 10, label: '10 seconds' },
                  { value: 30, label: '30 seconds' },
                  { value: 60, label: '1 minute' }
                ]}
                description="How often to check for new events"
              />
              <InputField
                label="Max Events to Display"
                value={settings.maxEvents}
                onChange={(value) => updateSetting('maxEvents', value)}
                type="number"
                description="Maximum events shown in feeds"
              />
              <SelectField
                label="Data Retention"
                value={settings.dataRetention}
                onChange={(value) => updateSetting('dataRetention', Number(value))}
                options={[
                  { value: 7, label: '1 week' },
                  { value: 30, label: '1 month' },
                  { value: 90, label: '3 months' },
                  { value: 180, label: '6 months' },
                  { value: 365, label: '1 year' }
                ]}
                description="How long to keep event data"
              />
            </div>
            <ToggleSwitch
              label="Auto Refresh"
              description="Automatically refresh data without user intervention"
              checked={settings.autoRefresh}
              onChange={(checked) => updateSetting('autoRefresh', checked)}
            />
          </SettingsSection>

          {/* Display */}
          <SettingsSection title="Display" icon={Palette}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <SelectField
                label="Theme"
                value={settings.theme}
                onChange={(value) => updateSetting('theme', value)}
                options={[
                  { value: 'dark', label: 'Dark Theme' },
                  { value: 'light', label: 'Light Theme' }
                ]}
                description="Choose your preferred color scheme"
              />
              <SelectField
                label="Time Format"
                value={settings.dateFormat}
                onChange={(value) => updateSetting('dateFormat', value)}
                options={[
                  { value: '12h', label: '12-hour (AM/PM)' },
                  { value: '24h', label: '24-hour' }
                ]}
                description="Display format for timestamps"
              />
            </div>
            <ToggleSwitch
              label="Compact Mode"
              description="Show more information in less space"
              checked={settings.compactMode}
              onChange={(checked) => updateSetting('compactMode', checked)}
            />
            <ToggleSwitch
              label="Show Timestamps"
              description="Display timestamps for all events and activities"
              checked={settings.showTimestamps}
              onChange={(checked) => updateSetting('showTimestamps', checked)}
            />
          </SettingsSection>

          {/* API Configuration */}
          <SettingsSection title="API Configuration" icon={Database}>
            <InputField
              label="API Endpoint"
              value={settings.apiEndpoint}
              onChange={(value) => updateSetting('apiEndpoint', value)}
              description="Base URL for the Clarity Hub API"
            />
            
            {/* Test Connection Button */}
            <div className="flex items-center gap-3">
              <button
                onClick={testConnection}
                disabled={testingConnection}
                className="px-4 py-2 border rounded-lg text-foreground hover:bg-white/5 flex items-center gap-2 transition-smooth disabled:opacity-50"
                style={{ borderColor: 'hsl(var(--border))' }}
              >
                {testingConnection ? (
                  <>
                    <RefreshCw className="animate-spin" size={16} />
                    Testing...
                  </>
                ) : connectionStatus === 'success' ? (
                  <>
                    <CheckCircle size={16} className="text-green-500" />
                    Connected
                  </>
                ) : connectionStatus === 'error' ? (
                  <>
                    <AlertCircle size={16} className="text-red-500" />
                    Failed
                  </>
                ) : (
                  <>
                    <Database size={16} />
                    Test Connection
                  </>
                )}
              </button>
              {connectionStatus === 'success' && (
                <span className="text-sm text-green-500">API endpoint is reachable</span>
              )}
              {connectionStatus === 'error' && (
                <span className="text-sm text-red-500">Cannot reach API endpoint</span>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InputField
                label="Request Timeout"
                value={settings.timeout}
                onChange={(value) => updateSetting('timeout', value)}
                type="number"
                description="Timeout for API requests (seconds)"
              />
              <InputField
                label="Retry Attempts"
                value={settings.retryAttempts}
                onChange={(value) => updateSetting('retryAttempts', value)}
                type="number"
                description="Number of retry attempts for failed requests"
              />
            </div>
            
            {/* API Key Display */}
            <div>
              <label className="block text-foreground font-medium mb-2">API Key</label>
              <p className="text-foreground/60 text-sm mb-2">Your personal API key for external integrations</p>
              <div className="flex items-center gap-2">
                <input
                  type={showApiKey ? 'text' : 'password'}
                  value={apiKey}
                  readOnly
                  className="flex-1 px-4 py-2 bg-input border border-border rounded-lg text-foreground font-mono"
                />
                <button
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="p-2 border border-border rounded-lg text-foreground hover:bg-white/5"
                  title={showApiKey ? 'Hide API key' : 'Show API key'}
                >
                  {showApiKey ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
                <button
                  onClick={copyApiKey}
                  className="p-2 border border-border rounded-lg text-foreground hover:bg-white/5"
                  title="Copy API key"
                >
                  {copiedApiKey ? <Check size={20} className="text-green-500" /> : <Copy size={20} />}
                </button>
                <button
                  onClick={generateNewApiKey}
                  className="px-4 py-2 border border-border rounded-lg text-foreground hover:bg-white/5 flex items-center gap-2"
                  title="Generate new API key"
                >
                  <Key size={16} />
                  Generate New
                </button>
              </div>
              <p className="text-foreground/40 text-xs mt-2">
                ⚠️ Generating a new key will invalidate the current one
              </p>
            </div>
          </SettingsSection>
        </div>
      </main>
    </div>
  );
};