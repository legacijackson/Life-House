import { Card, CardContent } from "@/components/ui/card";
import { Users, FileText, TrendingUp, AlertTriangle } from "lucide-react";

interface StatsCardsProps {
  stats?: {
    activeResidents: number;
    pendingNotes: number;
    avgStage: number;
    openTickets: number;
  };
}

export function StatsCards({ stats }: StatsCardsProps) {
  const defaultStats = {
    activeResidents: 12,
    pendingNotes: 5,
    avgStage: 4.2,
    openTickets: 3,
  };

  const data = stats || defaultStats;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">My Active Residents</p>
              <p className="text-3xl font-bold text-gray-900">{data.activeResidents}</p>
              <p className="text-sm text-green-600 mt-1">+2 this month</p>
            </div>
            <div className="bg-primary/10 rounded-lg p-3">
              <Users className="w-6 h-6 text-primary" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending Notes</p>
              <p className="text-3xl font-bold text-gray-900">{data.pendingNotes}</p>
              <p className="text-sm text-yellow-600 mt-1">Due today</p>
            </div>
            <div className="bg-yellow-100 rounded-lg p-3">
              <FileText className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Avg. Program Stage</p>
              <p className="text-3xl font-bold text-gray-900">{data.avgStage}</p>
              <p className="text-sm text-green-600 mt-1">+0.3 vs last month</p>
            </div>
            <div className="bg-green-100 rounded-lg p-3">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Open Tickets</p>
              <p className="text-3xl font-bold text-gray-900">{data.openTickets}</p>
              <p className="text-sm text-red-600 mt-1">1 urgent</p>
            </div>
            <div className="bg-red-100 rounded-lg p-3">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
