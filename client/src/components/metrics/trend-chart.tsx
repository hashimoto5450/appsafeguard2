import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";

// Using recharts for visualizations
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  AreaChart,
  Area,
} from "recharts";

interface TrendData {
  period: string;
  [key: string]: any;
}

interface TrendChartProps {
  data: TrendData[];
  title: string;
  description?: string;
  metrics: Array<{
    name: string;
    dataKey: string;
    color: string;
    type?: 'line' | 'bar' | 'area';
  }>;
  xAxisKey?: string;
  chartType?: 'line' | 'bar' | 'area';
  height?: number;
  isLoading?: boolean;
}

export function TrendChart({
  data,
  title,
  description,
  metrics,
  xAxisKey = 'period',
  chartType = 'line',
  height = 300,
  isLoading = false,
}: TrendChartProps) {
  const [selectedMetric, setSelectedMetric] = useState<string | null>(
    metrics.length > 0 ? metrics[0].dataKey : null
  );

  // If loading, show skeleton
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
        <CardContent>
          <div className="h-[300px] bg-gray-100 rounded animate-pulse"></div>
        </CardContent>
      </Card>
    );
  }

  // If no data, show empty state
  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex flex-col items-center justify-center">
            <p className="text-gray-500">データがありません</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Return the chart based on type
  const renderChart = () => {
    // Create a filtered set of metrics for display
    const displayMetrics = selectedMetric ? 
      metrics.filter(m => m.dataKey === selectedMetric) : 
      metrics;

    switch (chartType) {
      case 'line':
        return (
          <ResponsiveContainer width="100%" height={height}>
            <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 25 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey={xAxisKey} 
                tick={{ fontSize: 12 }}
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Legend />
              {displayMetrics.map((metric) => (
                <Line
                  key={metric.dataKey}
                  type="monotone"
                  dataKey={metric.dataKey}
                  name={metric.name}
                  stroke={metric.color}
                  activeDot={{ r: 6 }}
                  strokeWidth={2}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        );
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={height}>
            <BarChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 25 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey={xAxisKey} 
                tick={{ fontSize: 12 }}
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Legend />
              {displayMetrics.map((metric) => (
                <Bar
                  key={metric.dataKey}
                  dataKey={metric.dataKey}
                  name={metric.name}
                  fill={metric.color}
                  radius={[4, 4, 0, 0]}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        );
      case 'area':
        return (
          <ResponsiveContainer width="100%" height={height}>
            <AreaChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 25 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey={xAxisKey} 
                tick={{ fontSize: 12 }}
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Legend />
              {displayMetrics.map((metric) => (
                <Area
                  key={metric.dataKey}
                  type="monotone"
                  dataKey={metric.dataKey}
                  name={metric.name}
                  fill={metric.color}
                  stroke={metric.color}
                  fillOpacity={0.3}
                />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        );
      default:
        return null;
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div>
          <CardTitle className="text-xl">{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </div>
        {metrics.length > 1 && (
          <Select
            value={selectedMetric || ''}
            onValueChange={(value) => setSelectedMetric(value)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="指標を選択" />
            </SelectTrigger>
            <SelectContent>
              {metrics.map((metric) => (
                <SelectItem key={metric.dataKey} value={metric.dataKey}>
                  {metric.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </CardHeader>
      <CardContent>{renderChart()}</CardContent>
    </Card>
  );
}

interface SecurityTrendChartProps {
  data: TrendData[];
  isLoading?: boolean;
}

export function SecurityTrendChart({ data, isLoading = false }: SecurityTrendChartProps) {
  return (
    <TrendChart
      data={data}
      title="セキュリティスコアの推移"
      description="時間経過に伴うセキュリティ指標の変化"
      metrics={[
        { name: 'セキュリティスコア', dataKey: 'securityScore', color: '#22C55E' },
        { name: '高リスク脆弱性', dataKey: 'highSeverity', color: '#EF4444' },
        { name: '中リスク脆弱性', dataKey: 'mediumSeverity', color: '#F97316' },
        { name: '低リスク脆弱性', dataKey: 'lowSeverity', color: '#EAB308' },
      ]}
      chartType="line"
      height={350}
      isLoading={isLoading}
    />
  );
}

export function RemediationTrendChart({ data, isLoading = false }: SecurityTrendChartProps) {
  const chartData = data.map(item => ({
    ...item,
    remediationRate: item.vulnerabilityCount > 0 
      ? (item.fixedVulnerabilityCount / item.vulnerabilityCount) * 100 
      : 0
  }));

  return (
    <TrendChart
      data={chartData}
      title="脆弱性対応状況の推移"
      description="時間経過に伴う脆弱性と修正状況"
      metrics={[
        { name: '検出された脆弱性', dataKey: 'vulnerabilityCount', color: '#EF4444' },
        { name: '修正済み脆弱性', dataKey: 'fixedVulnerabilityCount', color: '#22C55E' },
        { name: '修正率 (%)', dataKey: 'remediationRate', color: '#3B82F6' },
      ]}
      chartType="bar"
      height={350}
      isLoading={isLoading}
    />
  );
}