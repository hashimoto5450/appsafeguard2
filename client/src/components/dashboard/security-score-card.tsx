import { Shield, TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface SecurityScoreCardProps {
  score: number;
  change?: number;
  isLoading?: boolean;
}

export function SecurityScoreCard({ score, change, isLoading = false }: SecurityScoreCardProps) {
  return (
    <Card>
      <CardContent className="p-5 flex items-center">
        <div className="mr-4 bg-primary-50 p-3 rounded-full">
          <Shield className="text-primary-600 h-6 w-6" />
        </div>
        
        <div>
          <p className="text-sm text-gray-500">セキュリティスコア</p>
          <div className="flex items-center">
            {isLoading ? (
              <div className="h-8 w-16 bg-gray-200 animate-pulse rounded" />
            ) : (
              <>
                <p className="text-2xl font-semibold text-gray-800">{score}</p>

              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
