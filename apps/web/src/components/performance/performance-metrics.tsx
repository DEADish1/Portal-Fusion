'use client';

import { useState } from 'react';
import { formatBytes, formatDuration } from '@/lib/utils';
import {
  Activity,
  Cpu,
  HardDrive,
  Network,
  Zap,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

export function PerformanceMetrics() {
  // Mock data for charts
  const [networkData] = useState([
    { time: '00:00', download: 120, upload: 45 },
    { time: '04:00', download: 200, upload: 80 },
    { time: '08:00', download: 450, upload: 150 },
    { time: '12:00', download: 380, upload: 120 },
    { time: '16:00', download: 520, upload: 180 },
    { time: '20:00', download: 300, upload: 90 },
    { time: '24:00', download: 150, upload: 60 },
  ]);

  const [transferData] = useState([
    { name: 'Mon', files: 12, size: 450 },
    { name: 'Tue', files: 19, size: 780 },
    { name: 'Wed', files: 15, size: 620 },
    { name: 'Thu', files: 25, size: 950 },
    { name: 'Fri', files: 22, size: 850 },
    { name: 'Sat', files: 8, size: 320 },
    { name: 'Sun', files: 5, size: 180 },
  ]);

  const [latencyData] = useState([
    { time: '00:00', latency: 15 },
    { time: '04:00', latency: 18 },
    { time: '08:00', latency: 25 },
    { time: '12:00', latency: 22 },
    { time: '16:00', latency: 30 },
    { time: '20:00', latency: 20 },
    { time: '24:00', latency: 16 },
  ]);

  const metrics = [
    {
      title: 'CPU Usage',
      value: '23%',
      change: '+2%',
      trend: 'up',
      icon: Cpu,
      color: 'text-blue-500',
      bg: 'bg-blue-500/10',
    },
    {
      title: 'Memory Usage',
      value: '1.2 GB',
      change: '-5%',
      trend: 'down',
      icon: HardDrive,
      color: 'text-purple-500',
      bg: 'bg-purple-500/10',
    },
    {
      title: 'Network Speed',
      value: '520 KB/s',
      change: '+15%',
      trend: 'up',
      icon: Network,
      color: 'text-green-500',
      bg: 'bg-green-500/10',
    },
    {
      title: 'Avg Latency',
      value: '22 ms',
      change: '-8%',
      trend: 'down',
      icon: Zap,
      color: 'text-orange-500',
      bg: 'bg-orange-500/10',
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Performance</h1>
        <p className="text-muted-foreground mt-2">
          Monitor system performance and resource usage
        </p>
      </div>

      {/* Metric Cards */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map((metric) => (
          <div
            key={metric.title}
            className="rounded-lg border border-border bg-card p-6 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <div className={`rounded-lg p-2 ${metric.bg}`}>
                <metric.icon className={`h-5 w-5 ${metric.color}`} />
              </div>
              <div
                className={`flex items-center gap-1 text-xs ${
                  metric.trend === 'up' ? 'text-green-500' : 'text-red-500'
                }`}
              >
                {metric.trend === 'up' ? (
                  <TrendingUp className="h-3 w-3" />
                ) : (
                  <TrendingDown className="h-3 w-3" />
                )}
                {metric.change}
              </div>
            </div>
            <div className="mt-4">
              <p className="text-sm font-medium text-muted-foreground">
                {metric.title}
              </p>
              <p className="mt-2 text-2xl font-bold">{metric.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Network Traffic */}
      <div className="rounded-lg border border-border bg-card shadow-sm">
        <div className="border-b border-border p-6">
          <h2 className="text-lg font-semibold">Network Traffic</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Download and upload speeds over time
          </p>
        </div>

        <div className="p-6">
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={networkData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis
                dataKey="time"
                className="text-xs"
                stroke="currentColor"
                opacity={0.5}
              />
              <YAxis
                className="text-xs"
                stroke="currentColor"
                opacity={0.5}
                tickFormatter={(value) => `${value} KB/s`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
                formatter={(value) => `${value} KB/s`}
              />
              <Area
                type="monotone"
                dataKey="download"
                stackId="1"
                stroke="#6366F1"
                fill="#6366F1"
                fillOpacity={0.6}
              />
              <Area
                type="monotone"
                dataKey="upload"
                stackId="2"
                stroke="#10B981"
                fill="#10B981"
                fillOpacity={0.6}
              />
            </AreaChart>
          </ResponsiveContainer>

          <div className="flex justify-center gap-6 mt-4">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-[#6366F1]" />
              <span className="text-sm text-muted-foreground">Download</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-[#10B981]" />
              <span className="text-sm text-muted-foreground">Upload</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* File Transfers */}
        <div className="rounded-lg border border-border bg-card shadow-sm">
          <div className="border-b border-border p-6">
            <h2 className="text-lg font-semibold">File Transfers</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Weekly transfer activity
            </p>
          </div>

          <div className="p-6">
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={transferData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis
                  dataKey="name"
                  className="text-xs"
                  stroke="currentColor"
                  opacity={0.5}
                />
                <YAxis
                  className="text-xs"
                  stroke="currentColor"
                  opacity={0.5}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                />
                <Bar dataKey="files" fill="#6366F1" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Latency */}
        <div className="rounded-lg border border-border bg-card shadow-sm">
          <div className="border-b border-border p-6">
            <h2 className="text-lg font-semibold">Connection Latency</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Average response time
            </p>
          </div>

          <div className="p-6">
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={latencyData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis
                  dataKey="time"
                  className="text-xs"
                  stroke="currentColor"
                  opacity={0.5}
                />
                <YAxis
                  className="text-xs"
                  stroke="currentColor"
                  opacity={0.5}
                  tickFormatter={(value) => `${value} ms`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                  formatter={(value) => `${value} ms`}
                />
                <Line
                  type="monotone"
                  dataKey="latency"
                  stroke="#F59E0B"
                  strokeWidth={2}
                  dot={{ fill: '#F59E0B', r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* System Resources */}
      <div className="rounded-lg border border-border bg-card shadow-sm">
        <div className="border-b border-border p-6">
          <h2 className="text-lg font-semibold">System Resources</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Current resource allocation
          </p>
        </div>

        <div className="p-6 space-y-6">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">CPU Usage</span>
              <span className="text-sm text-muted-foreground">23%</span>
            </div>
            <div className="h-2 rounded-full bg-secondary">
              <div
                className="h-full rounded-full bg-blue-500 transition-all"
                style={{ width: '23%' }}
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Memory Usage</span>
              <span className="text-sm text-muted-foreground">1.2 GB / 8 GB</span>
            </div>
            <div className="h-2 rounded-full bg-secondary">
              <div
                className="h-full rounded-full bg-purple-500 transition-all"
                style={{ width: '15%' }}
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Disk Usage</span>
              <span className="text-sm text-muted-foreground">450 MB / 1 GB</span>
            </div>
            <div className="h-2 rounded-full bg-secondary">
              <div
                className="h-full rounded-full bg-green-500 transition-all"
                style={{ width: '45%' }}
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Network Bandwidth</span>
              <span className="text-sm text-muted-foreground">520 KB/s / 1 MB/s</span>
            </div>
            <div className="h-2 rounded-full bg-secondary">
              <div
                className="h-full rounded-full bg-orange-500 transition-all"
                style={{ width: '52%' }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
