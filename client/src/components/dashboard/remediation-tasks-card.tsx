import { CheckSquare } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface RemediationTasksCardProps {
  completed: number;
  total: number;
  isLoading?: boolean;
}

export function RemediationTasksCard({ 
  completed, 
  total, 
  isLoading = false 
}: RemediationTasksCardProps) {
  // Calculate completion percentage
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
  
  return (
    <Card>
      <CardContent className="p-5 flex items-center">
        <div className="mr-4 bg-green-50 p-3 rounded-full">
          <CheckSquare className="text-green-600 h-6 w-6" />
        </div>
        
        <div>
          <p className="text-sm text-gray-500">修正タスク</p>
          <div className="flex items-center">
            {isLoading ? (
              <div className="h-8 w-16 bg-gray-200 animate-pulse rounded" />
            ) : (
              <>
                <p className="text-2xl font-semibold text-gray-800">{completed}</p>
                <p className="text-sm text-gray-500 ml-1">/ {total}</p>
                <div className="ml-2 w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="bg-green-500 h-full rounded-full" 
                    style={{ width: `${percentage}%` }}
                  ></div>
                </div>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
