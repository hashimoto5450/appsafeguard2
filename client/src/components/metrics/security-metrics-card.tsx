import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { ArrowDown, ArrowUp, Minus, Shield, Clock, AlertCircle } from "lucide-react";

interface MetricProps {
  title: string;
  value: number | string;
  subtitle?: string;
  icon?: React.ReactNode;
  trend?: {
    direction: 'up' | 'down' | 'neutral';
    value: number;
  };
  isGoodTrendUp?: boolean; // Is an "up" trend good for this metric?
  isLoading?: boolean;
  valuePrefix?: string;
  valueSuffix?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function MetricCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  isGoodTrendUp = true,
  isLoading = false,
  valuePrefix = '',
  valueSuffix = '',
  size = 'md',
}: MetricProps) {
  let trendBadge = null;
  
  if (trend) {
    const isPositive = (trend.direction === 'up' && isGoodTrendUp) || 
                       (trend.direction === 'down' && !isGoodTrendUp);
    
    // Define badge color and icon based on trend direction and whether "up" is good
    const badgeClasses = isPositive
      ? "bg-green-100 text-green-800 border-green-200"
      : trend.direction === 'neutral'
        ? "bg-gray-100 text-gray-600 border-gray-200"
        : "bg-red-100 text-red-800 border-red-200";
    
    trendBadge = (
      <Badge variant="outline" className={`flex items-center gap-1 ${badgeClasses}`}>
        {trend.direction === 'up' ? <ArrowUp className="h-3 w-3" /> : 
         trend.direction === 'down' ? <ArrowDown className="h-3 w-3" /> : 
         <Minus className="h-3 w-3" />}
        {trend.value}%
      </Badge>
    );
  }
  
  // Adjust text size based on the size prop
  const titleClass = size === 'sm' ? 'text-sm' : size === 'lg' ? 'text-xl' : 'text-base';
  const valueClass = size === 'sm' ? 'text-2xl' : size === 'lg' ? 'text-4xl font-bold' : 'text-3xl font-semibold';
  const subtitleClass = size === 'sm' ? 'text-xs' : size === 'lg' ? 'text-sm' : 'text-xs';
  
  return (
    <Card className="overflow-hidden">
      <CardHeader className={`pb-2 ${size === 'sm' ? 'p-4' : ''}`}>
        <CardTitle className={`flex items-center justify-between ${titleClass}`}>
          <span>{title}</span>
          {icon}
        </CardTitle>
        {subtitle && <CardDescription>{subtitle}</CardDescription>}
      </CardHeader>
      <CardContent className={`${size === 'sm' ? 'px-4 py-2' : ''}`}>
        {isLoading ? (
          <Skeleton className={size === 'lg' ? 'h-10 w-24' : 'h-8 w-20'} />
        ) : (
          <div className="flex items-center justify-between">
            <div className={valueClass}>
              {valuePrefix}{typeof value === 'number' ? value.toLocaleString() : value}{valueSuffix}
            </div>
            {trendBadge}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface SecurityMetricsGridProps {
  metrics: {
    securityScore: number;
    securityScoreTrend?: number;
    mttr: number; // Mean Time to Remediate (days)
    mttrTrend?: number;
    remediationRate: number; // Percentage
    remediationRateTrend?: number;
    riskScore: number;
    riskScoreTrend?: number;
    securityDebt: number;
    securityDebtTrend?: number;
    vulnerabilityDensity: number;
    vulnerabilityDensityTrend?: number;
  };
  timeframe: string;
  isLoading?: boolean;
}

export function SecurityMetricsGrid({ 
  metrics,
  timeframe,
  isLoading = false 
}: SecurityMetricsGridProps) {
  return (
    <Tabs defaultValue="overview" className="w-full">
      <TabsList className="mb-4">
        <TabsTrigger value="overview">概要</TabsTrigger>
        <TabsTrigger value="performance">パフォーマンス</TabsTrigger>
        <TabsTrigger value="risk">リスク</TabsTrigger>
      </TabsList>
      
      <TabsContent value="overview" className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <MetricCard
            title="セキュリティスコア"
            value={metrics.securityScore}
            icon={<Shield className="h-5 w-5 text-primary-500" />}
            trend={metrics.securityScoreTrend ? {
              direction: metrics.securityScoreTrend > 0 ? 'up' : metrics.securityScoreTrend < 0 ? 'down' : 'neutral',
              value: Math.abs(metrics.securityScoreTrend)
            } : undefined}
            isGoodTrendUp={true}
            isLoading={isLoading}
            valueSuffix="/100"
            size="lg"
          />
          
          <MetricCard
            title="リスクスコア"
            value={metrics.riskScore}
            icon={<AlertCircle className="h-5 w-5 text-orange-500" />}
            trend={metrics.riskScoreTrend ? {
              direction: metrics.riskScoreTrend > 0 ? 'up' : metrics.riskScoreTrend < 0 ? 'down' : 'neutral',
              value: Math.abs(metrics.riskScoreTrend)
            } : undefined}
            isGoodTrendUp={false}
            isLoading={isLoading}
            size="md"
          />
          
          <MetricCard
            title="脆弱性解消率"
            value={Math.round(metrics.remediationRate)}
            icon={<Shield className="h-5 w-5 text-green-500" />}
            trend={metrics.remediationRateTrend ? {
              direction: metrics.remediationRateTrend > 0 ? 'up' : metrics.remediationRateTrend < 0 ? 'down' : 'neutral',
              value: Math.abs(metrics.remediationRateTrend)
            } : undefined}
            isGoodTrendUp={true}
            isLoading={isLoading}
            valueSuffix="%"
            size="md"
          />
        </div>
        
        <div className="text-xs text-muted-foreground mt-2">
          {timeframe === 'all' ? '全期間' : 
           timeframe === 'week' ? '過去7日間' : 
           timeframe === 'month' ? '過去30日間' : 
           timeframe === 'quarter' ? '過去3ヶ月間' : 
           '過去12ヶ月間'}のデータに基づく
        </div>
      </TabsContent>
      
      <TabsContent value="performance" className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <MetricCard
            title="平均修正時間"
            value={metrics.mttr.toFixed(1)}
            subtitle="脆弱性が検出されてから修正されるまでの平均日数"
            icon={<Clock className="h-5 w-5 text-blue-500" />}
            trend={metrics.mttrTrend ? {
              direction: metrics.mttrTrend > 0 ? 'up' : metrics.mttrTrend < 0 ? 'down' : 'neutral',
              value: Math.abs(metrics.mttrTrend)
            } : undefined}
            isGoodTrendUp={false}
            isLoading={isLoading}
            valueSuffix="日"
          />
          
          <MetricCard
            title="脆弱性解消率"
            value={Math.round(metrics.remediationRate)}
            subtitle="検出された脆弱性のうち修正済みの割合"
            trend={metrics.remediationRateTrend ? {
              direction: metrics.remediationRateTrend > 0 ? 'up' : metrics.remediationRateTrend < 0 ? 'down' : 'neutral',
              value: Math.abs(metrics.remediationRateTrend)
            } : undefined}
            isGoodTrendUp={true}
            isLoading={isLoading}
            valueSuffix="%"
          />
          
          <MetricCard
            title="脆弱性密度"
            value={metrics.vulnerabilityDensity.toFixed(1)}
            subtitle="1回のスキャンあたりの平均脆弱性検出数"
            trend={metrics.vulnerabilityDensityTrend ? {
              direction: metrics.vulnerabilityDensityTrend > 0 ? 'up' : metrics.vulnerabilityDensityTrend < 0 ? 'down' : 'neutral',
              value: Math.abs(metrics.vulnerabilityDensityTrend)
            } : undefined}
            isGoodTrendUp={false}
            isLoading={isLoading}
          />
        </div>
      </TabsContent>
      
      <TabsContent value="risk" className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <MetricCard
            title="リスクスコア"
            value={metrics.riskScore}
            subtitle="現在のセキュリティリスク評価 (低いほど良い)"
            icon={<AlertCircle className="h-5 w-5 text-orange-500" />}
            trend={metrics.riskScoreTrend ? {
              direction: metrics.riskScoreTrend > 0 ? 'up' : metrics.riskScoreTrend < 0 ? 'down' : 'neutral',
              value: Math.abs(metrics.riskScoreTrend)
            } : undefined}
            isGoodTrendUp={false}
            isLoading={isLoading}
            size="lg"
          />
          
          <MetricCard
            title="セキュリティ負債"
            value={metrics.securityDebt}
            subtitle="未解決の脆弱性の重み付け合計"
            trend={metrics.securityDebtTrend ? {
              direction: metrics.securityDebtTrend > 0 ? 'up' : metrics.securityDebtTrend < 0 ? 'down' : 'neutral',
              value: Math.abs(metrics.securityDebtTrend)
            } : undefined}
            isGoodTrendUp={false}
            isLoading={isLoading}
          />
          
          <MetricCard
            title="セキュリティスコア"
            value={metrics.securityScore}
            subtitle="総合的なセキュリティ評価スコア (高いほど良い)"
            trend={metrics.securityScoreTrend ? {
              direction: metrics.securityScoreTrend > 0 ? 'up' : metrics.securityScoreTrend < 0 ? 'down' : 'neutral',
              value: Math.abs(metrics.securityScoreTrend)
            } : undefined}
            isGoodTrendUp={true}
            isLoading={isLoading}
            valueSuffix="/100"
          />
        </div>
      </TabsContent>
    </Tabs>
  );
}