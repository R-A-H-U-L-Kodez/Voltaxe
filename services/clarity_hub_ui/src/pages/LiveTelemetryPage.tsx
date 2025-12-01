import { useState, useEffect } from 'react';
import { Activity, Database, TrendingUp, Clock, CheckCircle, AlertCircle, RefreshCw, AlertTriangle } from 'lucide-react';
import { axonService } from '../services/api';

interface TelemetryData {
  total_records: number;
  unique_snapshots: number;
  unique_processes: number;
  unique_hosts: number;
  oldest_snapshot: string;
  newest_snapshot: string;
  hours_collected: number;
  training_ready: boolean;
  hours_remaining: number;
  estimated_ready: string;
  collection_rate: number;
  recent_snapshots: Array<{
    hostname: string;
    timestamp: string;
    process_count: number;
  }>;
}

export default function LiveTelemetryPage() {
  const [telemetry, setTelemetry] = useState<TelemetryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [showRetrainDialog, setShowRetrainDialog] = useState(false);
  const [retraining, setRetraining] = useState(false);
  const [retrainSuccess, setRetrainSuccess] = useState<string | null>(null);

  const fetchTelemetry = async () => {
    try {
      const response = await fetch('/api/ml/telemetry');
      if (!response.ok) throw new Error('Failed to fetch telemetry data');
      const data = await response.json();
      setTelemetry(data);
      setLastUpdate(new Date());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const handleRetrain = async () => {
    setRetraining(true);
    setRetrainSuccess(null);
    setError(null);
    
    try {
      const result = await axonService.retrainModel();
      setRetrainSuccess(result.message);
      setShowRetrainDialog(false);
      
      // Show success message for 5 seconds
      setTimeout(() => {
        setRetrainSuccess(null);
      }, 5000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to trigger retraining');
    } finally {
      setRetraining(false);
    }
  };

  useEffect(() => {
    fetchTelemetry();
    const interval = setInterval(fetchTelemetry, 5000); // Refresh every 5 seconds
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
            <span className="text-red-700">Error: {error}</span>
          </div>
        </div>
      </div>
    );
  }

  if (!telemetry) return null;

  const progressPercentage = (telemetry.hours_collected / 48) * 100;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
              <Activity className="h-8 w-8 text-blue-500 mr-3" />
              Live Telemetry
            </h1>
            <p className="text-gray-600 mt-1">
              Real-time ML data collection monitoring
            </p>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-500">Last updated</div>
            <div className="text-lg font-semibold text-gray-700">
              {lastUpdate.toLocaleTimeString()}
            </div>
          </div>
        </div>
      </div>

      {/* Success Message */}
      {retrainSuccess && (
        <div className="mb-6 bg-green-50 border-2 border-green-300 rounded-lg p-4">
          <div className="flex items-center">
            <CheckCircle className="h-6 w-6 text-green-600 mr-3" />
            <div>
              <h3 className="font-semibold text-green-900">Retraining Initiated</h3>
              <p className="text-green-700">{retrainSuccess}</p>
            </div>
          </div>
        </div>
      )}

      {/* Training Status Banner */}
      <div
        className={`mb-6 p-6 rounded-lg border-2 ${
          telemetry.training_ready
            ? 'bg-green-50 border-green-300'
            : 'bg-blue-50 border-blue-300'
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            {telemetry.training_ready ? (
              <CheckCircle className="h-8 w-8 text-green-600 mr-3" />
            ) : (
              <Clock className="h-8 w-8 text-blue-600 mr-3 animate-pulse" />
            )}
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                {telemetry.training_ready
                  ? '✅ Ready for Training!'
                  : '⏳ Data Collection in Progress'}
              </h2>
              <p className="text-gray-700 mt-1">
                {telemetry.training_ready
                  ? 'You can now train the Isolation Forest model'
                  : `${telemetry.hours_remaining.toFixed(1)} hours remaining until training ready`}
              </p>
            </div>
          </div>
          <button 
            onClick={() => setShowRetrainDialog(true)}
            className="px-6 py-3 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-lg font-semibold hover:from-orange-600 hover:to-red-700 transition-all shadow-lg flex items-center"
          >
            <RefreshCw className="h-5 w-5 mr-2" />
            🚨 Retrain Model
          </button>
        </div>

        {/* Progress Bar */}
        {!telemetry.training_ready && (
          <div className="mt-4">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>{telemetry.hours_collected.toFixed(1)} hours collected</span>
              <span>48 hours required</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-4">
              <div
                className="bg-blue-600 h-4 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(progressPercentage, 100)}%` }}
              ></div>
            </div>
            <div className="text-sm text-gray-600 mt-2 text-center">
              {progressPercentage.toFixed(1)}% complete • Est. ready:{' '}
              {new Date(telemetry.estimated_ready).toLocaleString()}
            </div>
          </div>
        )}
      </div>

      {/* Statistics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Total Records */}
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <Database className="h-8 w-8 opacity-80" />
            <div className="text-3xl font-bold">
              {telemetry.total_records.toLocaleString()}
            </div>
          </div>
          <div className="text-blue-100">Total Records</div>
          <div className="text-sm text-blue-200 mt-1">
            {telemetry.unique_snapshots} snapshots
          </div>
        </div>

        {/* Unique Processes */}
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <Activity className="h-8 w-8 opacity-80" />
            <div className="text-3xl font-bold">{telemetry.unique_processes}</div>
          </div>
          <div className="text-purple-100">Unique Processes</div>
          <div className="text-sm text-purple-200 mt-1">
            Discovered patterns
          </div>
        </div>

        {/* Collection Rate */}
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <TrendingUp className="h-8 w-8 opacity-80" />
            <div className="text-3xl font-bold">
              {telemetry.collection_rate.toFixed(1)}
            </div>
          </div>
          <div className="text-green-100">Snapshots/Hour</div>
          <div className="text-sm text-green-200 mt-1">
            Target: 12/hour
          </div>
        </div>

        {/* Active Hosts */}
        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <CheckCircle className="h-8 w-8 opacity-80" />
            <div className="text-3xl font-bold">{telemetry.unique_hosts}</div>
          </div>
          <div className="text-orange-100">Active Hosts</div>
          <div className="text-sm text-orange-200 mt-1">
            Sending data
          </div>
        </div>
      </div>

      {/* Recent Snapshots Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h3 className="text-lg font-semibold text-gray-900">
            Recent Snapshots
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Latest process snapshots from monitored endpoints
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Timestamp
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Hostname
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Processes
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {telemetry.recent_snapshots.length > 0 ? (
                telemetry.recent_snapshots.map((snapshot, index) => (
                  <tr
                    key={index}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(snapshot.timestamp).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                        {snapshot.hostname}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {snapshot.process_count} processes
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="flex items-center text-sm text-green-600">
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Stored
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={4}
                    className="px-6 py-8 text-center text-gray-500"
                  >
                    No snapshots collected yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Time Range Info */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Collection Timeline
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">First Snapshot</span>
              <span className="font-semibold text-gray-900">
                {new Date(telemetry.oldest_snapshot).toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Latest Snapshot</span>
              <span className="font-semibold text-gray-900">
                {new Date(telemetry.newest_snapshot).toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between items-center pt-3 border-t border-gray-200">
              <span className="text-gray-600">Duration</span>
              <span className="font-semibold text-blue-600">
                {telemetry.hours_collected.toFixed(1)} hours
              </span>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg shadow-md p-6 text-white">
          <h3 className="text-lg font-semibold mb-4">Phase 1: Anomaly Detection</h3>
          <div className="space-y-2 text-sm">
            <div className="flex items-center">
              <CheckCircle className="h-4 w-4 mr-2" />
              <span>Data collection active</span>
            </div>
            <div className="flex items-center">
              <CheckCircle className="h-4 w-4 mr-2" />
              <span>Process snapshots every 5 minutes</span>
            </div>
            <div className="flex items-center">
              {telemetry.training_ready ? (
                <CheckCircle className="h-4 w-4 mr-2" />
              ) : (
                <Clock className="h-4 w-4 mr-2 animate-pulse" />
              )}
              <span>
                {telemetry.training_ready
                  ? 'Ready for Isolation Forest training'
                  : 'Collecting training data...'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Dialog */}
      {showRetrainDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-md w-full p-6">
            <div className="flex items-start mb-4">
              <AlertTriangle className="h-8 w-8 text-orange-500 mr-3 flex-shrink-0" />
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  🚨 Panic Button: Retrain ML Model
                </h3>
                <p className="text-gray-700 mb-4">
                  This will immediately retrain the anomaly detection model with all available data.
                </p>
              </div>
            </div>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <h4 className="font-semibold text-blue-900 mb-2">When to use this:</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• You installed new legitimate software (e.g., Obsidian.exe)</li>
                <li>• The model is flagging too many false positives</li>
                <li>• You need to incorporate recent data immediately</li>
              </ul>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-yellow-800">
                <strong>Note:</strong> Training will take 1-3 minutes. The model will be updated automatically when complete.
              </p>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => setShowRetrainDialog(false)}
                disabled={retraining}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-semibold hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleRetrain}
                disabled={retraining}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-lg font-semibold hover:from-orange-600 hover:to-red-700 transition-all shadow-lg disabled:opacity-50 flex items-center justify-center"
              >
                {retraining ? (
                  <>
                    <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
                    Retraining...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-5 w-5 mr-2" />
                    Retrain Now
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
