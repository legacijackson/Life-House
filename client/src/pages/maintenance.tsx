import { Sidebar } from "@/components/sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Maintenance() {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      
      <main className="flex-1 overflow-y-auto">
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="px-6 py-4">
            <h1 className="text-2xl font-bold text-gray-900">Property Maintenance</h1>
            <p className="text-sm text-gray-600">Track and manage Life House property maintenance requests</p>
          </div>
        </header>

        <div className="p-6">
          <Card>
            <CardHeader>
              <CardTitle>Maintenance Tickets</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <p className="text-gray-500">Maintenance ticket system will be implemented here.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
