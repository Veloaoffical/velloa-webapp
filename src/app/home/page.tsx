"use client"

import { Bar, BarChart, XAxis, Legend, ResponsiveContainer, Cell, Tooltip, TooltipProps } from "recharts"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { ChartConfig, ChartContainer } from "@/components/ui/chart"
import { Pie, PieChart, Sector } from "recharts"
import { NameType, ValueType } from "recharts/types/component/DefaultTooltipContent"

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
      color: 'hsl(217, 91%, 60%)', // blue
    },
    'In Progress': {
      label: 'In Progress',
      color: 'hsl(271, 91%, 65%)', // purple
    },
    'Overdue': {
      label: 'Overdue',
      color: 'hsl(142, 76%, 36%)', // green
    },
    'Completed': {
      label: 'Completed',
      color: 'hsl(142, 76%, 36%)', // green
    }
  } satisfies ChartConfig

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

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

  return (
    <div className="h-screen w-full p-8">
      {/* Header */}
      <div className="flex items-center  justify-between mb-8">
        <h1 className="text-2xl font-semibold">Welcome Back, John Murphy</h1>
        <div className="flex gap-4">
          <select className="rounded-md border p-2">
            <option>Property</option>
          </select>
          <select className="rounded-md border p-2">
            <option>Portfolio</option>
          </select>
          <select className="rounded-md border p-2">
            <option>View As</option>
          </select>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-6 mb-8">
        <Card className="shadow-none">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Prepaid revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">$1,000,000</div>
          </CardContent>
        </Card>
        <Card className="shadow-none">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Outstanding revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">$410,000</div>
          </CardContent>
        </Card>
        <Card className="shadow-none">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pending Applications
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-500">39</div>
          </CardContent>
        </Card>
        <Card className="shadow-none">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Occupancy rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">78%</div>
          </CardContent>
        </Card>
      </div>

      {/* Tasks and Charts Section */}
      <div className="grid grid-cols-2 gap-6">
        <Card className="w-full shadow-none">
          <CardHeader className="pb-0">
            <CardTitle>Recent Tenant Requests</CardTitle>
          </CardHeader>
          <CardContent className="pt-1">
            {/* Add tenant requests list here */}
          </CardContent>
        </Card>
        
        <Card className="w-full shadow-none">
          <CardHeader className="pb-0">
            <CardTitle>Tasks - Open by Status</CardTitle>
          </CardHeader>
          <CardContent className="pt-1">
            <ChartContainer config={chartConfig} className="w-full">
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={taskData}>
                  <XAxis
                    dataKey="name"
                    tickLine={false}
                    tickMargin={10}
                    axisLine={false}
                  />
                  <Legend />
                  <Tooltip content={CustomTooltip} />
                  <Bar
                    dataKey="Not Started"
                    stackId="a"
                    fill="var(--color-not-started)"
                    radius={[0, 0, 4, 4]}
                    barSize={30}
                  />
                  <Bar
                    dataKey="In Progress"
                    stackId="a"
                    fill="var(--color-in-progress)"
                    barSize={30}
                  />
                  <Bar
                    dataKey="Overdue"
                    stackId="a"
                    fill="var(--color-overdue)"
                    radius={[4, 4, 0, 0]}
                    barSize={30}
                  />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* New row for Lease Renewals and Weekly Tasks */}
      <div className="grid grid-cols-2 gap-6 mt-4">
        <Card className="shadow-none">
          <CardHeader className="pb-0">
            <CardTitle>Lease Renewals Funnel</CardTitle>
            <CardDescription>Next 120 days</CardDescription>
          </CardHeader>
          <CardContent className="pt-1">
            <ChartContainer
              config={chartConfig}
              className="mx-auto h-[300px]"
            >
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={leaseData}
                    dataKey="value"
                    nameKey="status"
                    innerRadius={60}
                    outerRadius={80}
                    activeShape={renderActiveShape}
                    cx="50%"
                    cy="50%"
                  >
                    {leaseData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={CustomTooltip} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card className="shadow-none">
          <CardHeader className="pb-0">
            <CardTitle>Tasks for this week</CardTitle>
            <div className="flex gap-4 text-sm text-muted-foreground">
              <div>Not Started: 6</div>
              <div>In Progress: 10</div>
              <div>Completed: 0</div>
            </div>
          </CardHeader>
          <CardContent className="pt-1">
            <ChartContainer config={chartConfig}>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={weeklyTaskData}>
                  <XAxis
                    dataKey="day"
                    tickLine={false}
                    tickMargin={10}
                    axisLine={false}
                  />
                  <Legend />
                  <Tooltip content={CustomTooltip} />
                  <Bar
                    dataKey="Not Started"
                    stackId="a"
                    fill="var(--color-not-started)"
                    radius={[0, 0, 4, 4]}
                    barSize={30}
                  />
                  <Bar
                    dataKey="In Progress"
                    stackId="a"
                    fill="var(--color-in-progress)"
                    barSize={30}
                  />
                  <Bar
                    dataKey="Completed"
                    stackId="a"
                    fill="var(--color-completed)"
                    radius={[4, 4, 0, 0]}
                    barSize={30}
                  />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
