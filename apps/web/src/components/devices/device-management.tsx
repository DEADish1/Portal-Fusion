'use client';

import { useState } from 'react';
import { useDashboardStore } from '@/store/dashboard-store';
import { DeviceCard } from './device-card';
import { DeviceDetails } from './device-details';
import { Plus, Search } from 'lucide-react';

export function DeviceManagement() {
  const devices = useDashboardStore((state) => state.devices);
  const [selectedDevice, setSelectedDevice] = useState(devices[0] || null);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredDevices = devices.filter((device) =>
    device.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    device.platform.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Devices</h1>
          <p className="text-muted-foreground mt-2">
            Manage your connected devices and their features
          </p>
        </div>

        <button className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
          <Plus className="h-4 w-4" />
          Add Device
        </button>
      </div>

      <div className="flex gap-6">
        {/* Device list */}
        <div className="w-1/3">
          <div className="sticky top-6 space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search devices..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-lg border border-border bg-background pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            {/* Devices */}
            <div className="space-y-2 max-h-[calc(100vh-250px)] overflow-y-auto">
              {filteredDevices.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground text-sm">No devices found</p>
                </div>
              ) : (
                filteredDevices.map((device) => (
                  <DeviceCard
                    key={device.id}
                    device={device}
                    selected={selectedDevice?.id === device.id}
                    onClick={() => setSelectedDevice(device)}
                  />
                ))
              )}
            </div>
          </div>
        </div>

        {/* Device details */}
        <div className="flex-1">
          {selectedDevice ? (
            <DeviceDetails device={selectedDevice} />
          ) : (
            <div className="rounded-lg border border-border bg-card p-12 text-center">
              <div className="text-6xl mb-4">📱</div>
              <p className="text-muted-foreground">Select a device to view details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
