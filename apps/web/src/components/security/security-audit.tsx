'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import {
  Shield,
  AlertTriangle,
  CheckCircle2,
  Key,
  Lock,
  Unlock,
  UserCheck,
  Activity,
  FileCheck,
  XCircle,
  Info,
} from 'lucide-react';

interface SecurityEvent {
  id: string;
  type: 'authentication' | 'encryption' | 'access' | 'pairing' | 'violation';
  severity: 'info' | 'warning' | 'critical';
  message: string;
  timestamp: Date;
  deviceId?: string;
  deviceName?: string;
  details?: Record<string, unknown>;
}

export function SecurityAudit() {
  const [securityEvents] = useState<SecurityEvent[]>([
    {
      id: '1',
      type: 'pairing',
      severity: 'info',
      message: 'New device paired successfully',
      timestamp: new Date(Date.now() - 3600000),
      deviceName: 'MacBook Pro',
      details: { method: 'QR Code + PIN' },
    },
    {
      id: '2',
      type: 'encryption',
      severity: 'info',
      message: 'End-to-end encryption established',
      timestamp: new Date(Date.now() - 3500000),
      deviceName: 'MacBook Pro',
      details: { algorithm: 'AES-256-GCM' },
    },
    {
      id: '3',
      type: 'access',
      severity: 'warning',
      message: 'Clipboard access from unknown device blocked',
      timestamp: new Date(Date.now() - 1800000),
      deviceName: 'Unknown Device',
    },
  ]);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'authentication':
        return UserCheck;
      case 'encryption':
        return Lock;
      case 'access':
        return Shield;
      case 'pairing':
        return Key;
      case 'violation':
        return AlertTriangle;
      default:
        return Activity;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-destructive/10 text-destructive border-destructive/20';
      case 'warning':
        return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'info':
        return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      default:
        return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <XCircle className="h-5 w-5" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5" />;
      case 'info':
        return <Info className="h-5 w-5" />;
      default:
        return null;
    }
  };

  const securityScore = 85; // Mock score

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Security Audit</h1>
        <p className="text-muted-foreground mt-2">
          Monitor security events and system health
        </p>
      </div>

      {/* Security Score */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border border-border bg-card p-6">
          <div className="flex items-center justify-between">
            <Shield className="h-10 w-10 text-primary" />
            <span className="text-3xl font-bold">{securityScore}%</span>
          </div>
          <p className="text-sm text-muted-foreground mt-4">Security Score</p>
          <div className="mt-2 h-2 rounded-full bg-secondary">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${securityScore}%` }}
            />
          </div>
        </div>

        <div className="rounded-lg border border-border bg-card p-6">
          <div className="rounded-lg bg-green-500/10 p-2 w-fit mb-4">
            <Lock className="h-6 w-6 text-green-500" />
          </div>
          <p className="text-2xl font-bold">AES-256-GCM</p>
          <p className="text-sm text-muted-foreground mt-1">Encryption Standard</p>
        </div>

        <div className="rounded-lg border border-border bg-card p-6">
          <div className="rounded-lg bg-blue-500/10 p-2 w-fit mb-4">
            <Key className="h-6 w-6 text-blue-500" />
          </div>
          <p className="text-2xl font-bold">3</p>
          <p className="text-sm text-muted-foreground mt-1">Paired Devices</p>
        </div>

        <div className="rounded-lg border border-border bg-card p-6">
          <div className="rounded-lg bg-purple-500/10 p-2 w-fit mb-4">
            <FileCheck className="h-6 w-6 text-purple-500" />
          </div>
          <p className="text-2xl font-bold">0</p>
          <p className="text-sm text-muted-foreground mt-1">Security Violations</p>
        </div>
      </div>

      {/* Security Status */}
      <div className="rounded-lg border border-border bg-card shadow-sm">
        <div className="border-b border-border p-6">
          <h2 className="text-lg font-semibold">Security Status</h2>
        </div>

        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between p-4 rounded-lg bg-green-500/10 border border-green-500/20">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              <span className="font-medium">End-to-End Encryption</span>
            </div>
            <span className="text-sm text-green-500">Active</span>
          </div>

          <div className="flex items-center justify-between p-4 rounded-lg bg-green-500/10 border border-green-500/20">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              <span className="font-medium">Device Authentication</span>
            </div>
            <span className="text-sm text-green-500">Enabled</span>
          </div>

          <div className="flex items-center justify-between p-4 rounded-lg bg-green-500/10 border border-green-500/20">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              <span className="font-medium">Secure Pairing</span>
            </div>
            <span className="text-sm text-green-500">Active</span>
          </div>

          <div className="flex items-center justify-between p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              <span className="font-medium">Auto-Lock Timeout</span>
            </div>
            <span className="text-sm text-yellow-500">60 minutes</span>
          </div>
        </div>
      </div>

      {/* Security Events */}
      <div className="rounded-lg border border-border bg-card shadow-sm">
        <div className="border-b border-border p-6">
          <h2 className="text-lg font-semibold">Security Events</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Recent security-related activities
          </p>
        </div>

        <div className="p-6">
          {securityEvents.length === 0 ? (
            <div className="text-center py-12">
              <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No security events logged</p>
            </div>
          ) : (
            <div className="space-y-3">
              {securityEvents.map((event) => {
                const TypeIcon = getTypeIcon(event.type);
                return (
                  <div
                    key={event.id}
                    className={`p-4 rounded-lg border ${getSeverityColor(event.severity)}`}
                  >
                    <div className="flex items-start gap-4">
                      <TypeIcon className="h-5 w-5 mt-0.5" />

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">{event.message}</h4>
                          {getSeverityIcon(event.severity)}
                        </div>

                        <div className="flex items-center gap-2 mt-2 text-sm opacity-80">
                          <span className="capitalize">{event.type}</span>
                          {event.deviceName && (
                            <>
                              <span>•</span>
                              <span>{event.deviceName}</span>
                            </>
                          )}
                          <span>•</span>
                          <span>{format(event.timestamp, 'PPp')}</span>
                        </div>

                        {event.details && (
                          <div className="mt-3 p-2 rounded bg-background/50 text-xs font-mono">
                            {JSON.stringify(event.details, null, 2)}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Recommendations */}
      <div className="rounded-lg border border-border bg-card shadow-sm">
        <div className="border-b border-border p-6">
          <h2 className="text-lg font-semibold">Security Recommendations</h2>
        </div>

        <div className="p-6 space-y-3">
          <div className="flex items-start gap-3 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
            <Info className="h-5 w-5 text-blue-500 mt-0.5" />
            <div>
              <p className="font-medium text-blue-500">Enable Two-Factor Authentication</p>
              <p className="text-sm text-muted-foreground mt-1">
                Add an extra layer of security to your account
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
            <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
            <div>
              <p className="font-medium text-green-500">Regular Security Audits</p>
              <p className="text-sm text-muted-foreground mt-1">
                Review security logs weekly for suspicious activity
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
