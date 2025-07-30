import { useQuery } from '@tanstack/react-query';
import { Badge } from "@/components/ui/badge";
import { Bell, Clock, AlertTriangle } from 'lucide-react';

interface STOPTouchpoint {
  id: string;
  residentId: string;
  residentName: string;
  dueDate: string;
  type: 'check_in' | 'assessment' | 'goal_review' | 'compliance';
  priority: 'normal' | 'urgent';
  status: 'pending' | 'completed' | 'overdue';
}

export function STOPTouchPointCounter() {
  const { data: touchpoints } = useQuery<STOPTouchpoint[]>({
    queryKey: ['/api/staff/stop-touchpoints'],
  });

  const now = new Date();
  const next48Hours = new Date(now.getTime() + 48 * 60 * 60 * 1000);

  const dueSoon = touchpoints?.filter(tp => {
    const dueDate = new Date(tp.dueDate);
    return dueDate <= next48Hours && tp.status === 'pending';
  }) || [];

  const overdue = touchpoints?.filter(tp => {
    const dueDate = new Date(tp.dueDate);
    return dueDate < now && tp.status === 'pending';
  }) || [];

  const urgent = dueSoon.filter(tp => tp.priority === 'urgent');

  const getVariant = () => {
    if (overdue.length > 0) return 'destructive';
    if (urgent.length > 0) return 'default';
    if (dueSoon.length > 0) return 'secondary';
    return 'outline';
  };

  const getIcon = () => {
    if (overdue.length > 0) return <AlertTriangle className="w-4 h-4" />;
    if (dueSoon.length > 0) return <Clock className="w-4 h-4" />;
    return <Bell className="w-4 h-4" />;
  };

  const totalCount = dueSoon.length + overdue.length;

  if (totalCount === 0) return null;

  return (
    <Badge variant={getVariant()} className="flex items-center gap-2">
      {getIcon()}
      <span>STOP TouchPoints: {totalCount}</span>
      {overdue.length > 0 && (
        <span className="text-xs">({overdue.length} overdue)</span>
      )}
    </Badge>
  );
}