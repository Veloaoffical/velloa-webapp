"use client"

import { Bar, BarChart, XAxis, Legend, ResponsiveContainer, Cell, Tooltip, TooltipProps, Area, AreaChart, CartesianGrid } from "recharts"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Pie, PieChart, Sector } from "recharts"
import { NameType, ValueType } from "recharts/types/component/DefaultTooltipContent"
import { TrendingUp } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface LeaseDataItem {
  status: string;
  value: number;
  percentage: number;
}

type PieChartPayload = LeaseDataItem;

type BarChartPayload = {
  name: string;
  value: number;
  color: string;
}

type ActiveShapeProps = {
  cx: number;
  cy: number;
  innerRadius: number;
  outerRadius: number;
  startAngle: number;
  endAngle: number;
  fill: string;
  payload: LeaseDataItem;
}

export default function HomePage() {
  const taskData = [
    {
      name: 'Tenant Requests',
      'Not Started': 50,
      'In Progress': 10,
      'Overdue': 234,
    },
    {
      name: 'Owner Requests',
      'Not Started': 30,
      'In Progress': 5,
      'Overdue': 45,
    },
    {
      name: 'Work Requests',
      'Not Started': 40,
      'In Progress': 8,
      'Overdue': 67,
    },
    {
      name: 'Internal Task',
      'Not Started': 35,
      'In Progress': 12,
      'Overdue': 89,
    },
  ]

  const leaseData = [
    { status: "Not Started", value: 9, percentage: 64 },
    { status: "Renewal Offer", value: 2, percentage: 14 },
    { status: "Draft Lease", value: 2, percentage: 14 },
    { status: "Not Renewing", value: 1, percentage: 7 },
  ]

  const weeklyTaskData = [
    { day: "Today", "Not Started": 2, "In Progress": 3, "Completed": 0 },
    { day: "Thu", "Not Started": 1, "In Progress": 2, "Completed": 0 },
    { day: "Fri", "Not Started": 1, "In Progress": 1, "Completed": 0 },
    { day: "Sat", "Not Started": 0, "In Progress": 2, "Completed": 0 },
    { day: "Sun", "Not Started": 1, "In Progress": 0, "Completed": 0 },
    { day: "Mon", "Not Started": 0, "In Progress": 1, "Completed": 0 },
    { day: "Tue", "Not Started": 1, "In Progress": 1, "Completed": 0 },
  ]

  const chartConfig = {
    'Not Started': {
      label: 'Not Started',
      color: 'hsl(var(--chart-1))', // salmon/pink
    },
    'In Progress': {
      label: 'In Progress',
      color: 'hsl(var(--chart-2))', // teal
    },
    'Overdue': {
      label: 'Overdue',
      color: 'hsl(var(--chart-3))', // dark blue-gray
    },
    'Completed': {
      label: 'Completed',
      color: 'hsl(var(--chart-4))', // yellow
    }
  } satisfies ChartConfig

  const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))'];

  const renderActiveShape = function(props: unknown) {
    const { 
      cx, 
      cy, 
      innerRadius, 
      outerRadius, 
      startAngle, 
      endAngle, 
      fill, 
      payload 
    } = props as ActiveShapeProps;
    
    return (
      <g>
        <text x={cx} y={cy} dy={8} textAnchor="middle" fill={fill}>
          {payload.status}
        </text>
        <Sector
          cx={cx}
          cy={cy}
          innerRadius={innerRadius}
          outerRadius={outerRadius}
          startAngle={startAngle}
          endAngle={endAngle}
          fill={fill}
        />
        <Sector
          cx={cx}
          cy={cy}
          startAngle={startAngle}
          endAngle={endAngle}
          innerRadius={outerRadius + 6}
          outerRadius={outerRadius + 10}
          fill={fill}
        />
      </g>
    );
  };

  const CustomTooltip = ({ active, payload }: TooltipProps<ValueType, NameType>) => {
    if (active && payload && payload.length) {
      const firstPayload = payload[0].payload;
      
      if ('status' in firstPayload) {
        const data = firstPayload as PieChartPayload;
        return (
          <div className="bg-white p-2 border rounded-lg shadow-lg">
            <div className="font-semibold">{data.status}</div>
            <div>Count: {data.value}</div>
            <div>Percentage: {data.percentage}%</div>
          </div>
        );
      }
      
      return (
        <div className="bg-white p-2 border rounded-lg shadow-lg">
          {payload.map((entry) => {
            const data = entry as unknown as BarChartPayload;
            return (
              <div key={data.name} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: data.color }} />
                <span>{data.name}: {data.value}</span>
              </div>
            );
          })}
        </div>
      );
    }
    return null;
  };

  const recentRequests = [
    {
      id: 1,
      tenant: "Sarah Johnson",
      request: "AC not working properly",
      status: "urgent",
      time: "2 hours ago",
      unit: "Unit 204"
    },
    {
      id: 2,
      tenant: "Mike Peterson",
      request: "Leaking faucet in kitchen",
      status: "pending",
      time: "5 hours ago",
      unit: "Unit 107"
    },
    {
      id: 3,
      tenant: "Emma Davis",
      request: "Broken window lock",
      status: "in_progress",
      time: "1 day ago",
      unit: "Unit 315"
    },
    {
      id: 4,
      tenant: "Emma Davis",
      request: "Broken window lock",
      status: "in_progress",
      time: "1 day ago",
      unit: "Unit 315"
    },
    {
      id: 5,
      tenant: "Emma Davis",
      request: "Broken window lock",
      status: "in_progress",
      time: "1 day ago",
      unit: "Unit 315"
    },  
   
  ];

  const profitLossData = [
    { month: "January 2023", revenue: 25000, expenses: 18000, netIncome: 7000 },
    { month: "February 2023", revenue: 28000, expenses: 19000, netIncome: 9000 },
    { month: "March 2023", revenue: 32000, expenses: 24000, netIncome: 8000 }
  ]

  const profitLossConfig = {
    revenue: {
      label: 'Revenue',
      color: 'hsl(var(--chart-3))', // yellow
    },
    expenses: {
      label: 'Expenses',
      color: 'hsl(0, 84%, 60%)', // matching red-600
    },
    netIncome: {
      label: 'Net Income',
      color: 'hsl(217, 91%, 60%)', // matching blue-600
    }
  } satisfies ChartConfig

  return (
    <div className="h-screen w-full p-8 space-y-8 bg-background">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Welcome Back, Albert Alcantare</h1>
          <p className="text-muted-foreground">Here&apos;s what&apos;s happening with your properties today.</p>
        </div>
        <div className="flex gap-3">
          <Select defaultValue="all-properties">
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select Property" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all-properties">All Properties</SelectItem>
              <SelectItem value="property-1">Property 1</SelectItem>
              <SelectItem value="property-2">Property 2</SelectItem>
            </SelectContent>
          </Select>

          <Select defaultValue="all-portfolios">
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select Portfolio" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all-portfolios">All Portfolios</SelectItem>
              <SelectItem value="portfolio-1">Portfolio 1</SelectItem>
              <SelectItem value="portfolio-2">Portfolio 2</SelectItem>
            </SelectContent>
          </Select>

          <Select defaultValue="view-as">
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="View As" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="view-as">View As</SelectItem>
              <SelectItem value="owner">Owner</SelectItem>
              <SelectItem value="manager">Manager</SelectItem>
              <SelectItem value="tenant">Tenant</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>


      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="hover:bg-accent/5 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Prepaid Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">$1,000,000</div>
            <p className="text-xs text-muted-foreground">+20.1% from last month</p>
          </CardContent>
        </Card>
        <Card className="hover:bg-accent/5 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Outstanding Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">$410,000</div>
            <p className="text-xs text-muted-foreground">+4.5% from last month</p>
          </CardContent>
        </Card>
        <Card className="hover:bg-accent/5 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Pending Applications</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">39</div>
            <p className="text-xs text-muted-foreground">12 new this week</p>
          </CardContent>
        </Card>
        <Card className="hover:bg-accent/5 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Occupancy Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">78%</div>
            <p className="text-xs text-muted-foreground">+2.4% from last month</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section - Three columns */}
      <div className="grid grid-cols-3 gap-4">
        {/* Profit/Loss Chart */}
        <Card className="hover:bg-accent/5 transition-colors">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Profit & Loss</CardTitle>
              <button className="text-xs text-primary hover:underline">View details</button>
            </div>
            <CardDescription className="text-xs">Last 3 months to date</CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <ChartContainer config={profitLossConfig}>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart
                  data={profitLossData}
                  margin={{
                    top: 5,
                    right: 10,
                    left: 10,
                    bottom: 0,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="month"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    fontSize={11}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stackId="1"
                    stroke="var(--color-revenue)"
                    fill="var(--color-revenue)"
                    fillOpacity={0.4}
                  />
                  <Area
                    type="monotone"
                    dataKey="expenses"
                    stackId="1"
                    stroke="var(--color-expenses)"
                    fill="var(--color-expenses)"
                    fillOpacity={0.4}
                  />
                  <Area
                    type="monotone"
                    dataKey="netIncome"
                    stroke="var(--color-netIncome)"
                    fill="var(--color-netIncome)"
                    fillOpacity={0.4}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </ChartContainer>
            <div className="mt-2 flex items-center gap-2 text-sm">
              <div className="grid gap-1">
                <div className="flex items-center gap-2 font-medium leading-none">
                  Net Income: CAD$100,458.11 <TrendingUp className="h-4 w-4" />
                </div>
                <div className="text-xs text-muted-foreground">
                  January - March 2023
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:bg-accent/5 transition-colors">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Recent Tenant Requests</CardTitle>
              <button className="text-xs text-primary hover:underline">View all</button>
            </div>
            <CardDescription className="text-xs">You have 6 new requests today</CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2">
              {recentRequests.map((request) => (
                <div key={request.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
                      <svg
                        className="w-4 h-4 text-green-600"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M9 12l2 2 4-4" />
                        <rect width="18" height="18" x="3" y="3" rx="2" />
                      </svg>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium truncate">{request.request}</p>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">{request.time}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{request.tenant}</span>
                      <span>•</span>
                      <span>{request.unit}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        
        <Card className="hover:bg-accent/5 transition-colors">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Tasks by Status</CardTitle>
              <button className="text-xs text-primary hover:underline">View details</button>
            </div>
            <CardDescription className="text-xs">Open tasks distribution</CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <ChartContainer config={chartConfig} className="w-full">
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={taskData}>
                  <XAxis
                    dataKey="name"
                    tickLine={false}
                    tickMargin={10}
                    axisLine={false}
                    fontSize={11}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                  <Tooltip content={CustomTooltip} />
                  <Bar
                    dataKey="Not Started"
                    stackId="a"
                    radius={[0, 0, 4, 4]}
                    barSize={25}
                    fill="hsl(var(--chart-1))"
                  />
                  <Bar
                    dataKey="In Progress"
                    stackId="a"
                    barSize={25}
                    fill="hsl(var(--chart-2))"
                  />
                  <Bar
                    dataKey="Overdue"
                    stackId="a"
                    radius={[4, 4, 0, 0]}
                    barSize={25}
                    fill="hsl(var(--chart-3))"
                  />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card className="hover:bg-accent/5 transition-colors">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Lease Renewals</CardTitle>
              <button className="text-xs text-primary hover:underline">View all</button>
            </div>
            <CardDescription className="text-xs">Next 120 days</CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <ChartContainer
              config={chartConfig}
              className="mx-auto h-[220px]"
            >
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={leaseData}
                    dataKey="value"
                    nameKey="status"
                    innerRadius={50}
                    outerRadius={70}
                    activeShape={renderActiveShape}
                    cx="50%"
                    cy="50%"
                  >
                    {leaseData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={CustomTooltip} />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                </PieChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card className="hover:bg-accent/5 transition-colors">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Weekly Tasks</CardTitle>
              <button className="text-xs text-primary hover:underline">View calendar</button>
            </div>
            <div className="flex gap-3 text-xs">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: 'hsl(var(--chart-1))' }}></div>
                <span className="text-muted-foreground">Not Started: 6</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: 'hsl(var(--chart-2))' }}></div>
                <span className="text-muted-foreground">In Progress: 10</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: 'hsl(var(--chart-4))' }}></div>
                <span className="text-muted-foreground">Completed: 0</span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <ChartContainer config={chartConfig}>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={weeklyTaskData}>
                  <XAxis
                    dataKey="day"
                    tickLine={false}
                    tickMargin={10}
                    axisLine={false}
                    fontSize={11}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                  <Tooltip content={CustomTooltip} />
                  <Bar
                    dataKey="Not Started"
                    stackId="a"
                    fill="hsl(var(--chart-1))"
                    radius={[0, 0, 4, 4]}
                    barSize={25}
                  />
                  <Bar
                    dataKey="In Progress"
                    stackId="a"
                    fill="hsl(var(--chart-2))"
                    barSize={25}
                  />
                  <Bar
                    dataKey="Completed"
                    stackId="a"
                      fill="hsl(var(--chart-4))"
                    radius={[4, 4, 0, 0]}
                    barSize={25}
                  />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card className="hover:bg-accent/5 transition-colors">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Upcoming Inspections</CardTitle>
              <button className="text-xs text-primary hover:underline">View all</button>
            </div>
            <CardDescription className="text-xs">Next 30 days</CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <ChartContainer config={chartConfig}>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={[
                  { type: "Move-out", count: 12, color: 'hsl(var(--chart-1))' },
                  { type: "Move-in", count: 8, color: 'hsl(var(--chart-2))' },
                  { type: "Routine", count: 15, color: 'hsl(var(--chart-3))' },
                  { type: "Special", count: 5, color: 'hsl(var(--chart-4))' }
                ]}>
                  <XAxis
                    dataKey="type"
                    tickLine={false}
                    tickMargin={10}
                    axisLine={false}
                    fontSize={11}
                  />
                  <Tooltip content={CustomTooltip} />
                  <Bar
                    dataKey="count"
                    fill="var(--color-not-started)"
                    radius={[4, 4, 4, 4]}
                    barSize={25}
                  >
                    {
                      [0, 1, 2, 3].map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={`hsl(var(--chart-${index + 1}))`} />
                      ))
                    }
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
