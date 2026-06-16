import { useEffect, useState } from 'react';
import { trpc } from '@/lib/trpc';
import { useAuth } from '@/_core/hooks/useAuth';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { AlertCircle, CheckCircle, Clock, TrendingDown, TrendingUp } from 'lucide-react';

interface TransactionMetrics {
  totalTransactions: number;
  successfulTransactions: number;
  failedTransactions: number;
  errorRate: number;
  averageProcessingTime: number;
  lastUpdateTime: string;
}

interface AlertHistory {
  id: string;
  timestamp: string;
  severity: 'critical' | 'warning' | 'info';
  message: string;
  resolved: boolean;
}

export default function MonitoringDashboard() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [metrics, setMetrics] = useState<TransactionMetrics | null>(null);
  const [alerts, setAlerts] = useState<AlertHistory[]>([]);
  const [performanceData, setPerformanceData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch monitoring data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        // Mock data for demonstration
        const mockMetrics: TransactionMetrics = {
          totalTransactions: 1250,
          successfulTransactions: 1198,
          failedTransactions: 52,
          errorRate: 4.16,
          averageProcessingTime: 2.3,
          lastUpdateTime: new Date().toISOString(),
        };

        const mockAlerts: AlertHistory[] = [
          {
            id: '1',
            timestamp: new Date(Date.now() - 3600000).toISOString(),
            severity: 'warning',
            message: t('monitoring.alert_high_error_rate'),
            resolved: true,
          },
          {
            id: '2',
            timestamp: new Date(Date.now() - 1800000).toISOString(),
            severity: 'info',
            message: t('monitoring.alert_event_listener_reconnected'),
            resolved: false,
          },
        ];

        const mockPerformanceData = [
          { time: '00:00', successRate: 98.5, errorRate: 1.5, avgTime: 2.1 },
          { time: '04:00', successRate: 97.8, errorRate: 2.2, avgTime: 2.4 },
          { time: '08:00', successRate: 99.2, errorRate: 0.8, avgTime: 1.9 },
          { time: '12:00', successRate: 96.5, errorRate: 3.5, avgTime: 2.8 },
          { time: '16:00', successRate: 98.1, errorRate: 1.9, avgTime: 2.2 },
          { time: '20:00', successRate: 99.0, errorRate: 1.0, avgTime: 2.0 },
          { time: '23:59', successRate: 95.8, errorRate: 4.2, avgTime: 3.1 },
        ];

        setMetrics(mockMetrics);
        setAlerts(mockAlerts);
        setPerformanceData(mockPerformanceData);
      } catch (error) {
        console.error('Failed to fetch monitoring data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, [t]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <Clock className="w-12 h-12 animate-spin mx-auto mb-4" />
          <p>{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  const successRate = metrics ? ((metrics.successfulTransactions / metrics.totalTransactions) * 100).toFixed(2) : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{t('monitoring.title')}</h1>
        <p className="text-muted-foreground mt-2">{t('monitoring.subtitle')}</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">{t('monitoring.total_transactions')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.totalTransactions || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">{t('monitoring.all_time')}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              {t('monitoring.success_rate')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{successRate}%</div>
            <p className="text-xs text-muted-foreground mt-1">{metrics?.successfulTransactions} {t('monitoring.successful')}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-500" />
              {t('monitoring.error_rate')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.errorRate.toFixed(2)}%</div>
            <p className="text-xs text-muted-foreground mt-1">{metrics?.failedTransactions} {t('monitoring.failed')}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">{t('monitoring.avg_processing_time')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.averageProcessingTime.toFixed(2)}s</div>
            <p className="text-xs text-muted-foreground mt-1">{t('monitoring.per_transaction')}</p>
          </CardContent>
        </Card>
      </div>

      {/* Performance Chart */}
      <Card>
        <CardHeader>
          <CardTitle>{t('monitoring.performance_trend')}</CardTitle>
          <CardDescription>{t('monitoring.last_24_hours')}</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={performanceData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="successRate" stroke="#10b981" name={t('monitoring.success_rate')} />
              <Line type="monotone" dataKey="errorRate" stroke="#ef4444" name={t('monitoring.error_rate')} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Processing Time Chart */}
      <Card>
        <CardHeader>
          <CardTitle>{t('monitoring.processing_time_trend')}</CardTitle>
          <CardDescription>{t('monitoring.average_time_per_hour')}</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={performanceData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="avgTime" fill="#3b82f6" name={t('monitoring.processing_time_seconds')} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Alert History */}
      <Card>
        <CardHeader>
          <CardTitle>{t('monitoring.alert_history')}</CardTitle>
          <CardDescription>{t('monitoring.recent_system_alerts')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {alerts.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">{t('monitoring.no_alerts')}</p>
            ) : (
              alerts.map((alert) => (
                <Alert key={alert.id} className={alert.severity === 'critical' ? 'border-red-500' : alert.severity === 'warning' ? 'border-yellow-500' : 'border-blue-500'}>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{alert.message}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(alert.timestamp).toLocaleString()}
                      </p>
                    </div>
                    <Badge variant={alert.resolved ? 'secondary' : 'destructive'}>
                      {alert.resolved ? t('monitoring.resolved') : t('monitoring.active')}
                    </Badge>
                  </AlertDescription>
                </Alert>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* System Health Status */}
      <Card>
        <CardHeader>
          <CardTitle>{t('monitoring.system_health')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-8 h-8 text-green-500" />
              <div>
                <p className="font-medium">{t('monitoring.blockchain_service')}</p>
                <p className="text-sm text-muted-foreground">{t('monitoring.operational')}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <CheckCircle className="w-8 h-8 text-green-500" />
              <div>
                <p className="font-medium">{t('monitoring.event_listener')}</p>
                <p className="text-sm text-muted-foreground">{t('monitoring.operational')}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <CheckCircle className="w-8 h-8 text-green-500" />
              <div>
                <p className="font-medium">{t('monitoring.database')}</p>
                <p className="text-sm text-muted-foreground">{t('monitoring.operational')}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
