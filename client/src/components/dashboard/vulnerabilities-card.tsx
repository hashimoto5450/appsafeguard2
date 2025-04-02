import { Bug } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface VulnerabilitiesCardProps {
  total: number;
  high: number;
  medium: number;
  low: number;
  isLoading?: boolean;
}

export function VulnerabilitiesCard({ 
  total, 
  high, 
  medium, 
  low, 
  isLoading = false 
}: VulnerabilitiesCardProps) {
  return (
    <Card>
      <CardContent className="p-5 flex items-center">
        <div className="mr-4 bg-red-50 p-3 rounded-full">
          <Bug className="text-red-600 h-6 w-6" />
        </div>
        
        <div>
          <p className="text-sm text-gray-500">検出された脆弱性</p>
          <div className="flex items-center">
            {isLoading ? (
              <div className="h-8 w-16 bg-gray-200 animate-pulse rounded" />
            ) : (
              <>
                <p className="text-2xl font-semibold text-gray-800">{total}</p>
                <div className="ml-4 flex items-center space-x-2">
                  <div className="flex items-center">
                    <span className="h-3 w-3 bg-red-500 rounded-full mr-1"></span>
                    <span className="text-xs">{high}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="h-3 w-3 bg-orange-500 rounded-full mr-1"></span>
                    <span className="text-xs">{medium}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="h-3 w-3 bg-yellow-500 rounded-full mr-1"></span>
                    <span className="text-xs">{low}</span>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
