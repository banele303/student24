"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useGetAuthUserQuery } from "@/state/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Building2, Users, Home, Banknote, MapPin } from "lucide-react";

// Define colors for charts
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82ca9d'];

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState("month");
  const { data: authUser } = useGetAuthUserQuery();
  const router = useRouter();

  // Mock data for demonstration - replace with actual API calls
  const propertyData = [
    { name: 'Apartments', count: 42 },
    { name: 'Houses', count: 28 },
    { name: 'Shared Rooms', count: 35 },
    { name: 'Studios', count: 15 },
    { name: 'Dorms', count: 10 },
  ];

  const cityData = [
    { name: 'Johannesburg', count: 45 },
    { name: 'Cape Town', count: 35 },
    { name: 'Durban', count: 25 },
    { name: 'Pretoria', count: 20 },
    { name: 'Port Elizabeth', count: 15 },
    { name: 'Other', count: 10 },
  ];

  const priceRangeData = [
    { name: 'R0-R2,000', count: 15 },
    { name: 'R2,001-R4,000', count: 30 },
    { name: 'R4,001-R6,000', count: 40 },
    { name: 'R6,001-R8,000', count: 25 },
    { name: 'R8,001-R10,000', count: 15 },
    { name: 'R10,001+', count: 5 },
  ];

  const landlordActivityData = [
    { name: 'John Properties', properties: 12, applications: 35, leases: 8 },
    { name: 'Student Housing Co', properties: 8, applications: 22, leases: 6 },
    { name: 'University Rentals', properties: 15, applications: 40, leases: 12 },
    { name: 'City Apartments', properties: 6, applications: 18, leases: 4 },
    { name: 'SA Housing', properties: 9, applications: 25, leases: 7 },
  ];

  const studentActivityData = [
    { month: 'Jan', applications: 45, favorites: 120, leases: 15 },
    { month: 'Feb', applications: 50, favorites: 140, leases: 18 },
    { month: 'Mar', applications: 65, favorites: 160, leases: 22 },
    { month: 'Apr', applications: 80, favorites: 200, leases: 30 },
    { month: 'May', applications: 95, favorites: 220, leases: 35 },
  ];

  // COLORS array is already defined globally

  // Summary statistics
  const totalProperties = propertyData.reduce((sum, item) => sum + item.count, 0);
  const totalLandlords = 35; // Mock value
  const totalStudents = 250; // Mock value
  const totalLeases = 85; // Mock value

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tight">Analytics Dashboard</h1>
        <div className="flex items-center gap-4">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select time range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Last 7 days</SelectItem>
              <SelectItem value="month">Last 30 days</SelectItem>
              <SelectItem value="quarter">Last 3 months</SelectItem>
              <SelectItem value="year">Last 12 months</SelectItem>
            </SelectContent>
          </Select>
          <Button 
            variant="outline" 
            onClick={() => router.push('/admin')}
          >
            Back to Dashboard
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="p-4 bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Properties</p>
              <h3 className="text-2xl font-bold">{totalProperties}</h3>
            </div>
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-full">
              <Home className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Landlords</p>
              <h3 className="text-2xl font-bold">{totalLandlords}</h3>
            </div>
            <div className="p-2 bg-green-100 dark:bg-green-900 rounded-full">
              <Building2 className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Students</p>
              <h3 className="text-2xl font-bold">{totalStudents}</h3>
            </div>
            <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-full">
              <Users className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Active Leases</p>
              <h3 className="text-2xl font-bold">{totalLeases}</h3>
            </div>
            <div className="p-2 bg-yellow-100 dark:bg-yellow-900 rounded-full">
              <Banknote className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
            </div>
          </div>
        </Card>
      </div>

      {/* Tabs for different analytics views */}
      <Tabs defaultValue="properties" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="properties">Property Analytics</TabsTrigger>
          <TabsTrigger value="landlords">Landlord Analytics</TabsTrigger>
          <TabsTrigger value="students">Student Analytics</TabsTrigger>
        </TabsList>
        
        {/* Property Analytics */}
        <TabsContent value="properties" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Property Types */}
            <Card className="p-4">
              <h3 className="text-lg font-semibold mb-4">Property Types</h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={propertyData}
                      cx="50%"
                      cy="50%"
                      labelLine={true}
                      label={(entry) => `${entry.name}: ${(entry.percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {propertyData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </Card>
            
            {/* Property Locations */}
            <Card className="p-4">
              <h3 className="text-lg font-semibold mb-4">Property Locations</h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={cityData}
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 80, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={80} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="count" fill="#8884d8" name="Properties" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
            
            {/* Price Ranges */}
            <Card className="p-4">
              <h3 className="text-lg font-semibold mb-4">Price Ranges</h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={priceRangeData}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="count" fill="#82ca9d" name="Properties" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
            
            {/* Property Availability */}
            <Card className="p-4">
              <h3 className="text-lg font-semibold mb-4">Property Status</h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Available', value: 85 },
                        { name: 'Occupied', value: 110 },
                        { name: 'Under Maintenance', value: 15 },
                      ]}
                      cx="50%"
                      cy="50%"
                      labelLine={true}
                      label={({ name, percent }: { name: string; percent: number }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      <Cell fill="#82ca9d" />
                      <Cell fill="#8884d8" />
                      <Cell fill="#ffc658" />
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>
        </TabsContent>
        
        {/* Landlord Analytics */}
        <TabsContent value="landlords" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Top Landlords by Properties */}
            <Card className="p-4">
              <h3 className="text-lg font-semibold mb-4">Top Landlords by Properties</h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={landlordActivityData}
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={100} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="properties" fill="#8884d8" name="Properties" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
            
            {/* Top Landlords by Applications */}
            <Card className="p-4">
              <h3 className="text-lg font-semibold mb-4">Top Landlords by Applications</h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={landlordActivityData}
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={100} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="applications" fill="#82ca9d" name="Applications" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
            
            {/* Top Landlords by Leases */}
            <Card className="p-4">
              <h3 className="text-lg font-semibold mb-4">Top Landlords by Leases</h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={landlordActivityData}
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={100} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="leases" fill="#ffc658" name="Leases" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
            
            {/* Landlord Status */}
            <Card className="p-4">
              <h3 className="text-lg font-semibold mb-4">Landlord Status</h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Active', value: 25 },
                        { name: 'Pending', value: 5 },
                        { name: 'Disabled', value: 3 },
                        { name: 'Banned', value: 2 },
                      ]}
                      cx="50%"
                      cy="50%"
                      labelLine={true}
                      label={({ name, percent }: { name: string; percent: number }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      <Cell fill="#82ca9d" />
                      <Cell fill="#ffc658" />
                      <Cell fill="#8884d8" />
                      <Cell fill="#ff8042" />
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>
        </TabsContent>
        
        {/* Student Analytics */}
        <TabsContent value="students" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Student Activity Over Time */}
            <Card className="p-4 md:col-span-2">
              <h3 className="text-lg font-semibold mb-4">Student Activity Over Time</h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={studentActivityData}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="favorites" fill="#8884d8" name="Favorites" />
                    <Bar dataKey="applications" fill="#82ca9d" name="Applications" />
                    <Bar dataKey="leases" fill="#ffc658" name="Leases" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
            
            {/* Student Preferences - Property Types */}
            <Card className="p-4">
              <h3 className="text-lg font-semibold mb-4">Student Preferences - Property Types</h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Apartments', value: 45 },
                        { name: 'Shared Rooms', value: 30 },
                        { name: 'Studios', value: 15 },
                        { name: 'Houses', value: 10 },
                      ]}
                      cx="50%"
                      cy="50%"
                      labelLine={true}
                      label={({ name, percent }: { name: string; percent: number }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {COLORS.map((color, index) => (
                        <Cell key={`cell-${index}`} fill={color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </Card>
            
            {/* Student Preferences - Price Range */}
            <Card className="p-4">
              <h3 className="text-lg font-semibold mb-4">Student Preferences - Price Range</h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'R0-R2,000', value: 10 },
                        { name: 'R2,001-R4,000', value: 35 },
                        { name: 'R4,001-R6,000', value: 40 },
                        { name: 'R6,001+', value: 15 },
                      ]}
                      cx="50%"
                      cy="50%"
                      labelLine={true}
                      label={({ name, percent }: { name: string; percent: number }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {COLORS.map((color, index) => (
                        <Cell key={`cell-${index}`} fill={color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
