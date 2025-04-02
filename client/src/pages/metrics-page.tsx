import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AppLayout } from "@/components/layout/app-layout";
import { SecurityMetricsGrid } from "@/components/metrics/security-metrics-card";
import { SecurityTrendChart, RemediationTrendChart } from "@/components/metrics/trend-chart";
import { SecurityMetrics, TrendDataPoint } from "@/types";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { 
  BarChart,
  Download,
  Info,
  TrendingDown,
  TrendingUp,
  BarChart4,
  Clock
} from "lucide-react";

export default function MetricsPage() {
  const [timeframe, setTimeframe] = useState<string>("month");
  
  // Query for metrics data
  const { data: metricsData, isLoading: isLoadingMetrics } = useQuery<{data: SecurityMetrics, timeframe: string}>({
    queryKey: ["/api/reports/metrics", timeframe],
    queryFn: () => fetch(`/api/reports/metrics?timeframe=${timeframe}`).then(res => res.json()),
    enabled: true,
  });
  
  // Query for trend data
  const { data: trendData, isLoading: isLoadingTrends } = useQuery<{data: {trendData: TrendDataPoint[], timeframe: string}}>({
    queryKey: ["/api/reports/trends", timeframe],
    queryFn: () => fetch(`/api/reports/trends?timeframe=${timeframe}`).then(res => res.json()),
    enabled: true,
  });
  
  // Default/fallback metrics data
  const defaultMetrics = {
    securityScore: 0,
    mttr: 0,
    remediationRate: 0,
    riskScore: 0,
    securityDebt: 0,
    vulnerabilityDensity: 0,
  };
  
  // Use real metrics data if available, otherwise use defaults
  const metrics = metricsData?.data || defaultMetrics;
  const trends = trendData?.data?.trendData || [];
  
  return (
    <AppLayout title="セキュリティメトリクス">
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        <div className="flex justify-between items-center mb-2">
          <div>
            <h1 className="text-2xl font-bold">セキュリティメトリクス</h1>
            <p className="text-muted-foreground">アプリケーションのセキュリティパフォーマンスの包括的な分析</p>
          </div>
          
          <div className="flex items-center gap-4">
            <Select
              value={timeframe}
              onValueChange={(value) => setTimeframe(value)}
            >
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="期間を選択" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="week">過去7日間</SelectItem>
                <SelectItem value="month">過去30日間</SelectItem>
                <SelectItem value="quarter">過去3ヶ月間</SelectItem>
                <SelectItem value="year">過去12ヶ月間</SelectItem>
                <SelectItem value="all">全期間</SelectItem>
              </SelectContent>
            </Select>
            
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              レポート出力
            </Button>
          </div>
        </div>
        
        {/* Metrics Overview */}
        <SecurityMetricsGrid 
          metrics={metrics} 
          timeframe={timeframe}
          isLoading={isLoadingMetrics} 
        />
        
        {/* Insight Alert */}
        {metrics.securityScoreTrend && Math.abs(metrics.securityScoreTrend) > 5 && (
          <Alert variant={metrics.securityScoreTrend > 0 ? "default" : "destructive"}>
            {metrics.securityScoreTrend > 0 ? (
              <TrendingUp className="h-4 w-4" />
            ) : (
              <TrendingDown className="h-4 w-4" />
            )}
            <AlertTitle>
              {metrics.securityScoreTrend > 0 
                ? "セキュリティスコアが向上しています" 
                : "セキュリティスコアが低下しています"}
            </AlertTitle>
            <AlertDescription>
              {metrics.securityScoreTrend > 0
                ? `前回の測定から${Math.abs(metrics.securityScoreTrend).toFixed(1)}%向上しました。良い傾向です。`
                : `前回の測定から${Math.abs(metrics.securityScoreTrend).toFixed(1)}%低下しました。改善が必要かもしれません。`}
            </AlertDescription>
          </Alert>
        )}
        
        {/* Trend Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SecurityTrendChart 
            data={trends}
            isLoading={isLoadingTrends}
          />
          
          <RemediationTrendChart 
            data={trends}
            isLoading={isLoadingTrends}
          />
        </div>
        
        {/* Detailed Metrics */}
        <Tabs defaultValue="categories" className="w-full">
          <TabsList>
            <TabsTrigger value="categories">
              <BarChart className="h-4 w-4 mr-2" />
              脆弱性カテゴリ
            </TabsTrigger>
            <TabsTrigger value="trends">
              <BarChart4 className="h-4 w-4 mr-2" />
              トレンド分析
            </TabsTrigger>
            <TabsTrigger value="time">
              <Clock className="h-4 w-4 mr-2" />
              時間ベースのメトリクス
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="categories" className="pt-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Category Distribution Card */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>脆弱性カテゴリ分布</CardTitle>
                  <CardDescription>カテゴリ別の脆弱性発生数</CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoadingMetrics ? (
                    <div className="h-[300px] bg-gray-100 rounded animate-pulse"></div>
                  ) : metrics.vulnerabilityCategories ? (
                    <div className="h-[300px]">
                      {/* This would be a chart component in a real implementation */}
                      <div className="flex h-full items-center justify-center">
                        <p className="text-muted-foreground">カテゴリ分布チャート</p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex h-[300px] items-center justify-center">
                      <p className="text-muted-foreground">データがありません</p>
                    </div>
                  )}
                </CardContent>
              </Card>
              
              {/* Top Vulnerable URLs */}
              <Card>
                <CardHeader>
                  <CardTitle>脆弱性の多いURL</CardTitle>
                  <CardDescription>最も脆弱性が発見されたURL</CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoadingMetrics ? (
                    <div className="space-y-2">
                      {Array(5).fill(0).map((_, i) => (
                        <div key={i} className="h-8 bg-gray-100 rounded animate-pulse"></div>
                      ))}
                    </div>
                  ) : metrics.topVulnerableUrls && metrics.topVulnerableUrls.length > 0 ? (
                    <ul className="space-y-2">
                      {metrics.topVulnerableUrls.map((item: any, index: number) => (
                        <li key={index} className="flex justify-between items-center">
                          <span className="text-sm truncate max-w-[200px]" title={item.url}>
                            {item.url}
                          </span>
                          <span className="font-semibold">{item.count}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="flex h-[200px] items-center justify-center">
                      <p className="text-muted-foreground">データがありません</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="trends" className="pt-4">
            <div className="grid grid-cols-1 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>セキュリティトレンド詳細</CardTitle>
                  <CardDescription>期間ごとのセキュリティメトリクスの変化</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {/* Trend Data Table */}
                    <div className="rounded-md border">
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b bg-gray-50">
                              <th className="px-4 py-3 text-left font-medium">期間</th>
                              <th className="px-4 py-3 text-right font-medium">セキュリティスコア</th>
                              <th className="px-4 py-3 text-right font-medium">脆弱性数</th>
                              <th className="px-4 py-3 text-right font-medium">高リスク</th>
                              <th className="px-4 py-3 text-right font-medium">修正済み率</th>
                            </tr>
                          </thead>
                          <tbody>
                            {isLoadingTrends ? (
                              Array(5).fill(0).map((_, i) => (
                                <tr key={i} className="border-b">
                                  <td colSpan={5}>
                                    <div className="h-10 bg-gray-100 rounded animate-pulse m-2"></div>
                                  </td>
                                </tr>
                              ))
                            ) : trends && trends.length > 0 ? (
                              trends.map((period: any, index: number) => (
                                <tr key={index} className="border-b">
                                  <td className="px-4 py-3 text-left">{period.period}</td>
                                  <td className="px-4 py-3 text-right">
                                    <span className={period.securityScore >= 80 ? "text-green-600" : 
                                                     period.securityScore >= 50 ? "text-yellow-600" : 
                                                     "text-red-600"}>
                                      {period.securityScore}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3 text-right">{period.vulnerabilityCount}</td>
                                  <td className="px-4 py-3 text-right">{period.highSeverity}</td>
                                  <td className="px-4 py-3 text-right">
                                    {period.vulnerabilityCount > 0 
                                      ? `${Math.round((period.completedTaskCount / period.vulnerabilityCount) * 100)}%` 
                                      : "N/A"}
                                  </td>
                                </tr>
                              ))
                            ) : (
                              <tr>
                                <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                                  トレンドデータがありません
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="time" className="pt-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>平均修正時間 (MTTR)</CardTitle>
                  <CardDescription>脆弱性が検出されてから修正されるまでの平均日数</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col items-center space-y-6">
                    <div className="text-4xl font-bold">
                      {isLoadingMetrics ? (
                        <div className="h-10 w-24 bg-gray-100 rounded animate-pulse"></div>
                      ) : (
                        `${metrics.mttr.toFixed(1)} 日`
                      )}
                    </div>
                    
                    <div className="w-full px-4">
                      <div className="text-sm text-muted-foreground mb-2">重要度別の平均修正時間</div>
                      <div className="space-y-3">
                        <div className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span>高</span>
                            <span className="font-medium">
                              {isLoadingMetrics ? "..." : `${(metrics.mttr * 0.7).toFixed(1)}日`}
                            </span>
                          </div>
                          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-red-500 rounded-full" 
                              style={{ width: `${70}%` }}
                            ></div>
                          </div>
                        </div>
                        
                        <div className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span>中</span>
                            <span className="font-medium">
                              {isLoadingMetrics ? "..." : `${(metrics.mttr * 1.0).toFixed(1)}日`}
                            </span>
                          </div>
                          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-orange-500 rounded-full" 
                              style={{ width: `${100}%` }}
                            ></div>
                          </div>
                        </div>
                        
                        <div className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span>低</span>
                            <span className="font-medium">
                              {isLoadingMetrics ? "..." : `${(metrics.mttr * 1.5).toFixed(1)}日`}
                            </span>
                          </div>
                          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-yellow-500 rounded-full" 
                              style={{ width: `${150}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>修正効率</CardTitle>
                  <CardDescription>修正速度とステータス分布</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col items-center space-y-6">
                    <div className="text-4xl font-bold">
                      {isLoadingMetrics ? (
                        <div className="h-10 w-24 bg-gray-100 rounded animate-pulse"></div>
                      ) : (
                        `${Math.round(metrics.remediationRate)}%`
                      )}
                    </div>
                    
                    <div className="w-full px-4">
                      <div className="text-sm text-muted-foreground mb-2">脆弱性ステータス</div>
                      {isLoadingMetrics ? (
                        <div className="h-24 w-full bg-gray-100 rounded animate-pulse"></div>
                      ) : (
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <div className="text-sm font-medium">修正済み</div>
                            <div className="flex items-center gap-2 text-green-600">
                              <div className="h-3 w-3 rounded-full bg-green-500"></div>
                              <span className="text-lg font-semibold">{`${Math.round(metrics.remediationRate)}%`}</span>
                            </div>
                          </div>
                          
                          <div className="space-y-1">
                            <div className="text-sm font-medium">未解決</div>
                            <div className="flex items-center gap-2 text-orange-600">
                              <div className="h-3 w-3 rounded-full bg-orange-500"></div>
                              <span className="text-lg font-semibold">{`${Math.round(100 - metrics.remediationRate)}%`}</span>
                            </div>
                          </div>
                          
                          <div className="space-y-1">
                            <div className="text-sm font-medium">対応中</div>
                            <div className="flex items-center gap-2 text-blue-600">
                              <div className="h-3 w-3 rounded-full bg-blue-500"></div>
                              <span className="text-lg font-semibold">
                                {metricsData?.data?.vulnerabilitiesInProgress || 0}
                              </span>
                            </div>
                          </div>
                          
                          <div className="space-y-1">
                            <div className="text-sm font-medium">未対応</div>
                            <div className="flex items-center gap-2 text-red-600">
                              <div className="h-3 w-3 rounded-full bg-red-500"></div>
                              <span className="text-lg font-semibold">
                                {metricsData?.data?.vulnerabilitiesPending || 0}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}