"use client";

import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { ArrowLeft, Calendar, Plus, Filter } from "lucide-react";
import Link from "next/link";

export default function CustomerCalendarPage() {
  // Mock calendar data
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();
  
  const bookings = [
    {
      id: "1",
      petName: "Buddy",
      kennelType: "Large Kennel",
      checkIn: new Date(2024, 11, 15), // December 15
      checkOut: new Date(2024, 11, 17), // December 17
      status: "Confirmed"
    },
    {
      id: "2",
      petName: "Luna",
      kennelType: "Medium Kennel",
      checkIn: new Date(2024, 11, 20), // December 20
      checkOut: new Date(2024, 11, 22), // December 22
      status: "Pending"
    },
    {
      id: "3",
      petName: "Max",
      kennelType: "Small Kennel",
      checkIn: new Date(2024, 11, 28), // December 28
      checkOut: new Date(2024, 11, 30), // December 30
      status: "Confirmed"
    }
  ];

  // Generate calendar days
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
  
  const calendarDays = [];
  
  // Add empty cells for days before the first day of the month
  for (let i = 0; i < firstDayOfMonth; i++) {
    calendarDays.push(null);
  }
  
  // Add days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(currentYear, currentMonth, day);
    const dayBookings = bookings.filter(booking => 
      (booking.checkIn <= date && booking.checkOut >= date)
    );
    calendarDays.push({ day, date, bookings: dayBookings });
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Confirmed":
        return "bg-green-100 text-green-800 border-green-200";
      case "Pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "Completed":
        return "bg-blue-100 text-blue-800 border-blue-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
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
                <h1 className="text-2xl font-bold text-gray-900">Booking Calendar</h1>
                <p className="text-sm text-gray-600">View your pet's upcoming stays</p>
              </div>
            </div>
            <div className="flex space-x-2">
              <Button variant="outline">
                <Filter className="h-4 w-4 mr-2" />
                Filter
              </Button>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Booking
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Calendar Header */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-2xl">
                  {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </CardTitle>
                <CardDescription>Your pet's booking schedule</CardDescription>
              </div>
              <div className="flex space-x-2">
                <Button variant="outline" size="sm">
                  Previous Month
                </Button>
                <Button variant="outline" size="sm">
                  Next Month
                </Button>
              </div>
            </div>
          </CardHeader>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calendar */}
          <div className="lg:col-span-2">
            <Card>
              <CardContent className="p-6">
                {/* Days of week header */}
                <div className="grid grid-cols-7 gap-1 mb-4">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                    <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">
                      {day}
                    </div>
                  ))}
                </div>

                {/* Calendar grid */}
                <div className="grid grid-cols-7 gap-1">
                  {calendarDays.map((dayData, index) => (
                    <div
                      key={index}
                      className={`
                        min-h-[100px] border border-gray-200 p-2 text-sm
                        ${dayData ? 'bg-white' : 'bg-gray-50'}
                        ${dayData?.date.toDateString() === new Date().toDateString() 
                          ? 'bg-blue-50 border-blue-300' 
                          : ''
                        }
                      `}
                    >
                      {dayData && (
                        <>
                          <div className="font-medium mb-2">{dayData.day}</div>
                          <div className="space-y-1">
                            {dayData.bookings.map((booking) => (
                              <div
                                key={booking.id}
                                className={`
                                  text-xs p-1 rounded border text-center cursor-pointer
                                  ${getStatusColor(booking.status)}
                                `}
                              >
                                {booking.petName}
                              </div>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Booking Details Sidebar */}
          <div className="space-y-6">
            {/* Upcoming Bookings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calendar className="h-5 w-5 mr-2" />
                  Upcoming Bookings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {bookings.filter(b => b.checkIn > new Date()).map((booking) => (
                  <div key={booking.id} className="border rounded-lg p-3">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-medium">{booking.petName}</p>
                        <p className="text-sm text-gray-600">{booking.kennelType}</p>
                      </div>
                      <Badge className={getStatusColor(booking.status)}>
                        {booking.status}
                      </Badge>
                    </div>
                    <div className="text-sm text-gray-600">
                      <p>{booking.checkIn.toLocaleDateString()} - {booking.checkOut.toLocaleDateString()}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Legend */}
            <Card>
              <CardHeader>
                <CardTitle>Legend</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-100 border border-green-200 rounded"></div>
                  <span className="text-sm">Confirmed</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-yellow-100 border border-yellow-200 rounded"></div>
                  <span className="text-sm">Pending</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-blue-100 border border-blue-200 rounded"></div>
                  <span className="text-sm">Completed</span>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button className="w-full justify-start" variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Book New Stay
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <Calendar className="h-4 w-4 mr-2" />
                  View All Bookings
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <Filter className="h-4 w-4 mr-2" />
                  Filter Calendar
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
