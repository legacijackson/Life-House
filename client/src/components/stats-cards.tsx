import { Card, CardContent } from "@/components/ui/card";
import { Users, FileText, TrendingUp, AlertTriangle, BookOpen, Share2, NotebookPen } from "lucide-react";

interface StatsCardsProps {
  stats?: {
    activeResidents: number;
    pendingNotes: number;
    avgStage: number;
    openTickets: number;
    totalCaseNotes: number;
    totalResources: number;
    totalReferrals: number;
  };
}

export function StatsCards({ stats }: StatsCardsProps) {
  const data = {
    activeResidents: stats?.activeResidents ?? 0,
    pendingNotes: stats?.pendingNotes ?? 0,
    avgStage: stats?.avgStage ?? 0,
    openTickets: stats?.openTickets ?? 0,
    totalCaseNotes: stats?.totalCaseNotes ?? 0,
    totalResources: stats?.totalResources ?? 0,
    totalReferrals: stats?.totalReferrals ?? 0,
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4">
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

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Case Notes</p>
              <p className="text-3xl font-bold text-gray-900">{data.totalCaseNotes}</p>
              <p className="text-sm text-blue-600 mt-1">+12 this week</p>
            </div>
            <div className="bg-blue-100 rounded-lg p-3">
              <NotebookPen className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Resources</p>
              <p className="text-3xl font-bold text-gray-900">{data.totalResources}</p>
              <p className="text-sm text-purple-600 mt-1">+3 new added</p>
            </div>
            <div className="bg-purple-100 rounded-lg p-3">
              <BookOpen className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Referrals</p>
              <p className="text-3xl font-bold text-gray-900">{data.totalReferrals}</p>
              <p className="text-sm text-indigo-600 mt-1">+8 this month</p>
            </div>
            <div className="bg-indigo-100 rounded-lg p-3">
              <Share2 className="w-6 h-6 text-indigo-600" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
