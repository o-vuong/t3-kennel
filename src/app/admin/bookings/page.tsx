"use client";

import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { Calendar, Clock, DollarSign, Users, Search, Filter, Eye, Edit, Trash2 } from "lucide-react";

export default function AdminBookingsPage() {
  // Mock data for all bookings
  const bookings = [
    {
      id: "1",
      customerName: "John Customer",
      customerEmail: "customer@example.com",
      petName: "Buddy",
      petBreed: "Golden Retriever",
      kennelType: "Large Kennel",
      kennelNumber: "L-01",
      checkIn: "2024-12-15",
      checkOut: "2024-12-17",
      status: "Confirmed",
      totalCost: 110,
      depositPaid: 55,
      balanceDue: 55,
      createdAt: "2024-12-01",
      lastModified: "2024-12-01"
    },
    {
      id: "2",
      customerName: "John Customer",
      customerEmail: "customer@example.com",
      petName: "Luna",
      petBreed: "Border Collie",
      kennelType: "Medium Kennel",
      kennelNumber: "M-02",
      checkIn: "2024-12-20",
      checkOut: "2024-12-22",
      status: "Pending",
      totalCost: 90,
      depositPaid: 45,
      balanceDue: 45,
      createdAt: "2024-12-10",
      lastModified: "2024-12-10"
    },
    {
      id: "3",
      customerName: "Jane Smith",
      customerEmail: "jane@example.com",
      petName: "Max",
      petBreed: "Beagle",
      kennelType: "Small Kennel",
      kennelNumber: "S-03",
      checkIn: "2024-12-28",
      checkOut: "2024-12-30",
      status: "Confirmed",
      totalCost: 70,
      depositPaid: 35,
      balanceDue: 35,
      createdAt: "2024-12-12",
      lastModified: "2024-12-12"
    },
    {
      id: "4",
      customerName: "Bob Wilson",
      customerEmail: "bob@example.com",
      petName: "Charlie",
      petBreed: "Labrador",
      kennelType: "XL Kennel",
      kennelNumber: "XL-01",
      checkIn: "2024-12-25",
      checkOut: "2024-12-27",
      status: "Cancelled",
      totalCost: 130,
      depositPaid: 65,
      balanceDue: 0,
      createdAt: "2024-12-05",
      lastModified: "2024-12-10"
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Confirmed":
        return "bg-green-100 text-green-800";
      case "Pending":
        return "bg-yellow-100 text-yellow-800";
      case "Completed":
        return "bg-blue-100 text-blue-800";
      case "Cancelled":
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
              <h1 className="text-2xl font-bold text-gray-900">Booking Management</h1>
              <p className="text-sm text-gray-600">Manage all kennel bookings and reservations</p>
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
                <Calendar className="h-4 w-4 mr-2" />
                New Booking
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
              <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">24</div>
              <p className="text-xs text-muted-foreground">
                This month
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">$2,340</div>
              <p className="text-xs text-muted-foreground">
                This month
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Occupancy Rate</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">87%</div>
              <p className="text-xs text-muted-foreground">
                Current occupancy
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Approval</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">3</div>
              <p className="text-xs text-muted-foreground">
                Need review
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Booking Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Bookings</CardTitle>
            <CardDescription>
              Complete list of kennel bookings and reservations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {bookings.map((booking) => (
                <div key={booking.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
                    {/* Customer Info */}
                    <div className="lg:col-span-3">
                      <div className="flex items-center space-x-3">
                        <div>
                          <p className="font-medium">{booking.customerName}</p>
                          <p className="text-sm text-gray-600">{booking.customerEmail}</p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Pet Info */}
                    <div className="lg:col-span-2">
                      <p className="font-medium">{booking.petName}</p>
                      <p className="text-sm text-gray-600">{booking.petBreed}</p>
                    </div>
                    
                    {/* Kennel Info */}
                    <div className="lg:col-span-2">
                      <p className="font-medium">{booking.kennelType}</p>
                      <p className="text-sm text-gray-600">{booking.kennelNumber}</p>
                    </div>
                    
                    {/* Dates */}
                    <div className="lg:col-span-2">
                      <p className="text-sm font-medium">{booking.checkIn} - {booking.checkOut}</p>
                      <p className="text-sm text-gray-600">
                        {Math.ceil((new Date(booking.checkOut).getTime() - new Date(booking.checkIn).getTime()) / (1000 * 60 * 60 * 24))} days
                      </p>
                    </div>
                    
                    {/* Status & Cost */}
                    <div className="lg:col-span-2">
                      <div className="flex items-center justify-between mb-2">
                        <Badge className={getStatusColor(booking.status)}>
                          {booking.status}
                        </Badge>
                        <span className="font-bold">${booking.totalCost}</span>
                      </div>
                      <div className="text-sm text-gray-600">
                        Balance: ${booking.balanceDue}
                      </div>
                    </div>
                    
                    {/* Actions */}
                    <div className="lg:col-span-1">
                      <div className="flex space-x-1">
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="text-red-600">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Revenue Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
          <Card>
            <CardHeader>
              <CardTitle>Revenue Breakdown</CardTitle>
              <CardDescription>
                Monthly revenue by kennel type
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Large Kennels</span>
                  <span className="font-bold">$880</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Medium Kennels</span>
                  <span className="font-bold">$720</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Small Kennels</span>
                  <span className="font-bold">$560</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">XL Kennels</span>
                  <span className="font-bold">$260</span>
                </div>
                <div className="border-t pt-2">
                  <div className="flex justify-between items-center font-bold">
                    <span>Total</span>
                    <span>$2,420</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Booking Status</CardTitle>
              <CardDescription>
                Current booking status distribution
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="text-sm font-medium">Confirmed</span>
                  </div>
                  <span className="font-bold">18</span>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                    <span className="text-sm font-medium">Pending</span>
                  </div>
                  <span className="font-bold">4</span>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    <span className="text-sm font-medium">Completed</span>
                  </div>
                  <span className="font-bold">15</span>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <span className="text-sm font-medium">Cancelled</span>
                  </div>
                  <span className="font-bold">2</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
