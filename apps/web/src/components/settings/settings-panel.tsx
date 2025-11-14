'use client';

import { useState } from 'react';
import {
  Settings as SettingsIcon,
  Shield,
  Bell,
  Zap,
  HardDrive,
  Network,
  Palette,
  Save,
} from 'lucide-react';

export function SettingsPanel() {
  const [settings, setSettings] = useState({
    // General
    autoStart: true,
    minimizeToTray: true,
    showNotifications: true,
    soundEnabled: true,

    // Network
    port: 8080,
    maxConnections: 10,
    enableIPv6: false,
    discoveryInterval: 5000,

    // Storage
    maxStorageSize: 1024, // MB
    autoDeleteOldLogs: true,
    logRetentionDays: 30,

    // Security
    requireEncryption: true,
    requireAuthentication: true,
    sessionTimeout: 60, // minutes
    allowRemoteControl: false,

    // Performance
    compressionEnabled: true,
    maxTransferSpeed: 0, // 0 = unlimited
    bufferSize: 4096,
    maxConcurrentTransfers: 5,

    // Appearance
    theme: 'system',
    accentColor: '#6366F1',
    fontSize: 'medium',
  });

  const updateSetting = (key: string, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const sections = [
    {
      id: 'general',
      title: 'General Settings',
      icon: SettingsIcon,
      settings: [
        { key: 'autoStart', label: 'Start on system boot', type: 'toggle' },
        { key: 'minimizeToTray', label: 'Minimize to system tray', type: 'toggle' },
        { key: 'showNotifications', label: 'Show notifications', type: 'toggle' },
        { key: 'soundEnabled', label: 'Enable sounds', type: 'toggle' },
      ],
    },
    {
      id: 'network',
      title: 'Network Configuration',
      icon: Network,
      settings: [
        { key: 'port', label: 'Server Port', type: 'number', min: 1024, max: 65535 },
        { key: 'maxConnections', label: 'Max Connections', type: 'number', min: 1, max: 100 },
        { key: 'enableIPv6', label: 'Enable IPv6', type: 'toggle' },
        { key: 'discoveryInterval', label: 'Discovery Interval (ms)', type: 'number', min: 1000, max: 60000 },
      ],
    },
    {
      id: 'storage',
      title: 'Storage & Logs',
      icon: HardDrive,
      settings: [
        { key: 'maxStorageSize', label: 'Max Storage (MB)', type: 'number', min: 100, max: 10000 },
        { key: 'autoDeleteOldLogs', label: 'Auto-delete old logs', type: 'toggle' },
        { key: 'logRetentionDays', label: 'Log Retention (days)', type: 'number', min: 1, max: 365 },
      ],
    },
    {
      id: 'security',
      title: 'Security',
      icon: Shield,
      settings: [
        { key: 'requireEncryption', label: 'Require Encryption', type: 'toggle' },
        { key: 'requireAuthentication', label: 'Require Authentication', type: 'toggle' },
        { key: 'sessionTimeout', label: 'Session Timeout (min)', type: 'number', min: 5, max: 480 },
        { key: 'allowRemoteControl', label: 'Allow Remote Control', type: 'toggle' },
      ],
    },
    {
      id: 'performance',
      title: 'Performance',
      icon: Zap,
      settings: [
        { key: 'compressionEnabled', label: 'Enable Compression', type: 'toggle' },
        { key: 'maxTransferSpeed', label: 'Max Transfer Speed (KB/s, 0=unlimited)', type: 'number', min: 0, max: 100000 },
        { key: 'bufferSize', label: 'Buffer Size (bytes)', type: 'number', min: 1024, max: 65536 },
        { key: 'maxConcurrentTransfers', label: 'Max Concurrent Transfers', type: 'number', min: 1, max: 20 },
      ],
    },
    {
      id: 'appearance',
      title: 'Appearance',
      icon: Palette,
      settings: [
        { key: 'theme', label: 'Theme', type: 'select', options: ['system', 'light', 'dark'] },
        { key: 'accentColor', label: 'Accent Color', type: 'color' },
        { key: 'fontSize', label: 'Font Size', type: 'select', options: ['small', 'medium', 'large'] },
      ],
    },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground mt-2">
            Configure Portal Fusion to your preferences
          </p>
        </div>

        <button className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
          <Save className="h-4 w-4" />
          Save Changes
        </button>
      </div>

      <div className="space-y-6">
        {sections.map((section) => (
          <div
            key={section.id}
            className="rounded-lg border border-border bg-card shadow-sm"
          >
            <div className="border-b border-border p-6">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-primary/10 p-2 text-primary">
                  <section.icon className="h-5 w-5" />
                </div>
                <h2 className="text-lg font-semibold">{section.title}</h2>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {section.settings.map((setting) => (
                <div
                  key={setting.key}
                  className="flex items-center justify-between"
                >
                  <div>
                    <label className="font-medium text-sm">{setting.label}</label>
                    {setting.type === 'number' && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Range: {setting.min} - {setting.max}
                      </p>
                    )}
                  </div>

                  {setting.type === 'toggle' && (
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings[setting.key as keyof typeof settings] as boolean}
                        onChange={(e) => updateSetting(setting.key, e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
                    </label>
                  )}

                  {setting.type === 'number' && (
                    <input
                      type="number"
                      value={settings[setting.key as keyof typeof settings] as number}
                      onChange={(e) => updateSetting(setting.key, Number(e.target.value))}
                      min={setting.min}
                      max={setting.max}
                      className="w-32 rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  )}

                  {setting.type === 'select' && (
                    <select
                      value={settings[setting.key as keyof typeof settings] as string}
                      onChange={(e) => updateSetting(setting.key, e.target.value)}
                      className="w-40 rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring capitalize"
                    >
                      {setting.options?.map((option) => (
                        <option key={option} value={option} className="capitalize">
                          {option}
                        </option>
                      ))}
                    </select>
                  )}

                  {setting.type === 'color' && (
                    <input
                      type="color"
                      value={settings[setting.key as keyof typeof settings] as string}
                      onChange={(e) => updateSetting(setting.key, e.target.value)}
                      className="h-10 w-20 rounded-lg border border-border cursor-pointer"
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-lg border border-destructive/50 bg-destructive/5 p-6">
        <h3 className="font-semibold text-destructive mb-2">Danger Zone</h3>
        <p className="text-sm text-muted-foreground mb-4">
          These actions are irreversible. Please proceed with caution.
        </p>

        <div className="flex gap-4">
          <button className="rounded-lg border border-destructive/50 px-4 py-2 text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors">
            Reset All Settings
          </button>
          <button className="rounded-lg border border-destructive/50 px-4 py-2 text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors">
            Clear All Data
          </button>
        </div>
      </div>
    </div>
  );
}
