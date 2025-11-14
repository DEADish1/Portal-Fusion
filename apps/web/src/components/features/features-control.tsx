'use client';

import { useState } from 'react';
import {
  Copy,
  FileText,
  Monitor,
  Mouse,
  Volume2,
  Camera,
  Globe,
  Lock,
  Bell,
  Camera as CameraIcon,
  Mic,
  Gamepad2,
  Link,
} from 'lucide-react';

interface Feature {
  id: string;
  name: string;
  description: string;
  icon: any;
  category: 'Basic' | 'Advanced' | 'Communication';
  enabled: boolean;
}

export function FeaturesControl() {
  const [features, setFeatures] = useState<Feature[]>([
    {
      id: 'clipboard',
      name: 'Clipboard Sync',
      description: 'Synchronize clipboard content across devices in real-time',
      icon: Copy,
      category: 'Basic',
      enabled: true,
    },
    {
      id: 'fileTransfer',
      name: 'File Transfer',
      description: 'Transfer files between devices with drag-and-drop support',
      icon: FileText,
      category: 'Basic',
      enabled: true,
    },
    {
      id: 'notification',
      name: 'Notification Mirror',
      description: 'Mirror notifications from one device to another',
      icon: Bell,
      category: 'Basic',
      enabled: true,
    },
    {
      id: 'screenshot',
      name: 'Screenshot Sharing',
      description: 'Capture and share screenshots instantly across devices',
      icon: CameraIcon,
      category: 'Basic',
      enabled: true,
    },
    {
      id: 'urlSharing',
      name: 'URL Sharing',
      description: 'Share links and URLs between devices',
      icon: Link,
      category: 'Basic',
      enabled: true,
    },
    {
      id: 'kvm',
      name: 'Universal Keyboard/Mouse',
      description: 'Control one device with another\'s keyboard and mouse',
      icon: Mouse,
      category: 'Advanced',
      enabled: false,
    },
    {
      id: 'secondScreen',
      name: 'Second Screen',
      description: 'Use a remote device as an extended display',
      icon: Monitor,
      category: 'Advanced',
      enabled: false,
    },
    {
      id: 'gestureTranslation',
      name: 'Touch Gesture Translation',
      description: 'Translate touch gestures between different input paradigms',
      icon: Gamepad2,
      category: 'Advanced',
      enabled: false,
    },
    {
      id: 'browser',
      name: 'Browser Tab Sync',
      description: 'Synchronize browser tabs, bookmarks, and history',
      icon: Globe,
      category: 'Advanced',
      enabled: false,
    },
    {
      id: 'password',
      name: 'Password Manager',
      description: 'Securely sync and manage passwords across devices',
      icon: Lock,
      category: 'Advanced',
      enabled: false,
    },
    {
      id: 'audio',
      name: 'System Audio Routing',
      description: 'Route audio streams between devices',
      icon: Volume2,
      category: 'Communication',
      enabled: false,
    },
    {
      id: 'camera',
      name: 'Camera Sharing',
      description: 'Share camera feeds across devices',
      icon: Camera,
      category: 'Communication',
      enabled: false,
    },
    {
      id: 'microphone',
      name: 'Microphone Routing',
      description: 'Route microphone input between devices',
      icon: Mic,
      category: 'Communication',
      enabled: false,
    },
  ]);

  const toggleFeature = (id: string) => {
    setFeatures(prev =>
      prev.map(f => (f.id === id ? { ...f, enabled: !f.enabled } : f))
    );
  };

  const categories: Array<'Basic' | 'Advanced' | 'Communication'> = ['Basic', 'Advanced', 'Communication'];

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Basic':
        return 'text-blue-500 bg-blue-500/10';
      case 'Advanced':
        return 'text-purple-500 bg-purple-500/10';
      case 'Communication':
        return 'text-green-500 bg-green-500/10';
      default:
        return 'text-gray-500 bg-gray-500/10';
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Features</h1>
          <p className="text-muted-foreground mt-2">
            Enable or disable Portal Fusion features
          </p>
        </div>

        <div className="flex gap-2">
          <button className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-accent transition-colors">
            Enable All
          </button>
          <button className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-accent transition-colors">
            Disable All
          </button>
        </div>
      </div>

      {categories.map((category) => (
        <div key={category} className="space-y-4">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-semibold">{category} Features</h2>
            <span className={`text-xs px-2 py-1 rounded-full ${getCategoryColor(category)}`}>
              {features.filter(f => f.category === category && f.enabled).length} enabled
            </span>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {features
              .filter(f => f.category === category)
              .map((feature) => (
                <div
                  key={feature.id}
                  className="rounded-lg border border-border bg-card p-6 shadow-sm hover:shadow-md transition-all"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className={`rounded-lg p-3 ${feature.enabled ? 'bg-primary/10 text-primary' : 'bg-gray-500/10 text-gray-500'}`}>
                        <feature.icon className="h-6 w-6" />
                      </div>

                      <div className="flex-1">
                        <h3 className="font-semibold">{feature.name}</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          {feature.description}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between">
                    <span className={`text-xs px-2 py-1 rounded-full ${feature.enabled ? 'bg-green-500/10 text-green-500' : 'bg-gray-500/10 text-gray-500'}`}>
                      {feature.enabled ? 'Enabled' : 'Disabled'}
                    </span>

                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={feature.enabled}
                        onChange={() => toggleFeature(feature.id)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
                    </label>
                  </div>
                </div>
              ))}
          </div>
        </div>
      ))}
    </div>
  );
}
