"use client";

import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { Plus, Calendar, Clock, MapPin, Phone, ArrowLeft, Edit, Trash2 } from "lucide-react";
import Link from "next/link";

export default function CustomerBookingsPage() {
  // Mock data - in production this would come from the database
  const bookings = [
    {
      id: "1",
      petName: "Buddy",
      kennelType: "Large Kennel",
      checkIn: "2024-12-15",
      checkOut: "2024-12-17",
      status: "Confirmed",
      totalCost: 110,
      notes: "Special dietary requirements",
      careInstructions: "Needs 2 walks per day",
      createdAt: "2024-12-01"
    },
    {
      id: "2",
      petName: "Luna",
      kennelType: "Medium Kennel", 
      checkIn: "2024-12-20",
      checkOut: "2024-12-22",
      status: "Pending",
      totalCost: 90,
      notes: "First time staying",
      careInstructions: "Loves playing fetch",
      createdAt: "2024-12-10"
    },
    {
      id: "3",
      petName: "Max",
      kennelType: "Small Kennel",
      checkIn: "2024-11-28",
      checkOut: "2024-11-30",
      status: "Completed",
      totalCost: 70,
      notes: "Completed stay",
      careInstructions: "Needs joint supplements",
      createdAt: "2024-11-20"
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
            <div className="flex items-center space-x-4">
              <Link href="/customer/home">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">My Bookings</h1>
                <p className="text-sm text-gray-600">Manage your pet's kennel reservations</p>
              </div>
            </div>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Booking
            </Button>
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
              <div className="text-2xl font-bold">3</div>
              <p className="text-xs text-muted-foreground">
                All time bookings
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Upcoming</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">2</div>
              <p className="text-xs text-muted-foreground">
                Confirmed bookings
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
              <span className="text-2xl font-bold">$270</span>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                This year
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Stay</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">2.3</div>
              <p className="text-xs text-muted-foreground">
                Days per booking
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Booking Cards */}
        <div className="space-y-6">
          {bookings.map((booking) => (
            <Card key={booking.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-xl">{booking.petName}</CardTitle>
                    <CardDescription>{booking.kennelType}</CardDescription>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge className={getStatusColor(booking.status)}>
                      {booking.status}
                    </Badge>
                    <span className="text-lg font-bold">${booking.totalCost}</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="space-y-2">
                    <div className="flex items-center text-sm">
                      <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                      <span className="text-gray-600">Check-in:</span>
                    </div>
                    <p className="font-medium">{booking.checkIn}</p>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center text-sm">
                      <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                      <span className="text-gray-600">Check-out:</span>
                    </div>
                    <p className="font-medium">{booking.checkOut}</p>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center text-sm">
                      <span className="text-gray-600">Notes:</span>
                    </div>
                    <p className="text-sm">{booking.notes}</p>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center text-sm">
                      <span className="text-gray-600">Care Instructions:</span>
                    </div>
                    <p className="text-sm">{booking.careInstructions}</p>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-4 border-t mt-4">
                  <div className="text-sm text-gray-600">
                    Created: {booking.createdAt}
                  </div>
                  <div className="flex space-x-2">
                    {booking.status !== "Completed" && booking.status !== "Cancelled" && (
                      <>
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4 mr-1" />
                          Modify
                        </Button>
                        <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                          <Trash2 className="h-4 w-4 mr-1" />
                          Cancel
                        </Button>
                      </>
                    )}
                    <Button variant="outline" size="sm">
                      View Details
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Booking Tips */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Booking Tips</CardTitle>
            <CardDescription>
              Make the most of your pet's stay with our kennel
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <h4 className="font-medium">Before Your Pet's Stay:</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Update vaccination records</li>
                  <li>• Pack favorite toys and blankets</li>
                  <li>• Provide detailed care instructions</li>
                  <li>• Bring any special dietary requirements</li>
                </ul>
              </div>
              <div className="space-y-3">
                <h4 className="font-medium">During Your Pet's Stay:</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Check daily care logs online</li>
                  <li>• Receive photo updates via app</li>
                  <li>• Contact staff for any concerns</li>
                  <li>• Monitor your pet's activities</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
