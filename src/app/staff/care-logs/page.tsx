"use client";

import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { Heart, Clock, FileText, Plus, Search, Filter, Camera, AlertTriangle } from "lucide-react";

export default function StaffCareLogsPage() {
  // Mock data for care logs
  const careLogs = [
    {
      id: "1",
      petName: "Buddy",
      petId: "1",
      staffMember: "Sarah Johnson",
      activity: "Morning Feeding",
      timestamp: "2024-12-15 08:00",
      notes: "Ate all food enthusiastically. No issues observed.",
      status: "Completed",
      photos: ["/api/placeholder/100/100"],
      healthStatus: "Good",
      medicationGiven: null,
      nextActivity: "Exercise at 10:00 AM"
    },
    {
      id: "2",
      petName: "Luna",
      petId: "2",
      staffMember: "Mike Chen",
      activity: "Exercise Session",
      timestamp: "2024-12-15 07:30",
      notes: "Very energetic during play time. Loved the fetch game. No signs of stress.",
      status: "Completed",
      photos: ["/api/placeholder/100/100", "/api/placeholder/100/100"],
      healthStatus: "Good",
      medicationGiven: "Joint supplement as prescribed",
      nextActivity: "Afternoon feeding at 2:00 PM"
    },
    {
      id: "3",
      petName: "Max",
      petId: "3",
      staffMember: "Emily Rodriguez",
      activity: "Health Check",
      timestamp: "2024-12-15 06:00",
      notes: "Arthritis seems to be flaring up. Moving slowly. Gave prescribed pain medication.",
      status: "Completed",
      photos: ["/api/placeholder/100/100"],
      healthStatus: "Needs Attention",
      medicationGiven: "Pain medication as prescribed",
      nextActivity: "Gentle walk at 11:00 AM"
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Completed":
        return "bg-green-100 text-green-800";
      case "In Progress":
        return "bg-blue-100 text-blue-800";
      case "Pending":
        return "bg-yellow-100 text-yellow-800";
      case "Overdue":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getHealthStatusColor = (status: string) => {
    switch (status) {
      case "Good":
        return "bg-green-100 text-green-800";
      case "Needs Attention":
        return "bg-yellow-100 text-yellow-800";
      case "Concern":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Care Logs</h1>
              <p className="text-sm text-gray-600">Track and manage pet care activities</p>
            </div>
            <div className="flex space-x-2">
              <Button variant="outline">
                <Filter className="h-4 w-4 mr-2" />
                Filter
              </Button>
              <Button variant="outline">
                <Search className="h-4 w-4 mr-2" />
                Search
              </Button>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Log Entry
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Today's Logs</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">24</div>
              <p className="text-xs text-muted-foreground">
                Care activities logged
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Tasks</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">8</div>
              <p className="text-xs text-muted-foreground">
                Due soon
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Health Concerns</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">2</div>
              <p className="text-xs text-muted-foreground">
                Need attention
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Medications Given</CardTitle>
              <Heart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">5</div>
              <p className="text-xs text-muted-foreground">
                Today
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Care Log Entries */}
        <div className="space-y-6">
          {careLogs.map((log) => (
            <Card key={log.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-xl">{log.petName}</CardTitle>
                    <CardDescription>
                      {log.activity} • {log.timestamp} • Staff: {log.staffMember}
                    </CardDescription>
                  </div>
                  <div className="flex space-x-2">
                    <Badge className={getStatusColor(log.status)}>
                      {log.status}
                    </Badge>
                    <Badge className={getHealthStatusColor(log.healthStatus)}>
                      {log.healthStatus}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2 space-y-4">
                    <div>
                      <h4 className="font-medium mb-2">Activity Notes:</h4>
                      <p className="text-sm text-gray-700">{log.notes}</p>
                    </div>
                    
                    {log.medicationGiven && (
                      <div>
                        <h4 className="font-medium mb-2">Medication Given:</h4>
                        <p className="text-sm text-gray-700">{log.medicationGiven}</p>
                      </div>
                    )}
                    
                    <div>
                      <h4 className="font-medium mb-2">Next Activity:</h4>
                      <p className="text-sm text-blue-600">{log.nextActivity}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    {log.photos && log.photos.length > 0 && (
                      <div>
                        <h4 className="font-medium mb-2">Photos:</h4>
                        <div className="flex space-x-2">
                          {log.photos.map((photo, index) => (
                            <div key={index} className="w-20 h-20 bg-gray-200 rounded-lg flex items-center justify-center">
                              <Camera className="h-6 w-6 text-gray-400" />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm" className="flex-1">
                        <FileText className="h-4 w-4 mr-1" />
                        View Details
                      </Button>
                      <Button variant="outline" size="sm" className="flex-1">
                        <Camera className="h-4 w-4 mr-1" />
                        Add Photo
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Actions */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Common care log activities
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Button variant="outline" className="h-20 flex-col">
                <Heart className="h-6 w-6 mb-2" />
                <span className="text-sm">Feeding Log</span>
              </Button>
              <Button variant="outline" className="h-20 flex-col">
                <Clock className="h-6 w-6 mb-2" />
                <span className="text-sm">Exercise Log</span>
              </Button>
              <Button variant="outline" className="h-20 flex-col">
                <FileText className="h-6 w-6 mb-2" />
                <span className="text-sm">Health Check</span>
              </Button>
              <Button variant="outline" className="h-20 flex-col">
                <AlertTriangle className="h-6 w-6 mb-2" />
                <span className="text-sm">Incident Report</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
