import React, { useState } from 'react';
import {
  PortalFusionLogo,
  PortalFusionLogoSimple,
  PortalFusionLogoAnimated,
  PortalFusionLogoConnecting,
} from './PortalFusionLogo';

/**
 * Portal Fusion Logo Showcase
 * Demonstrates all logo variants and their usage
 */

export const LogoShowcase: React.FC = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [selectedSize, setSelectedSize] = useState<'xs' | 'sm' | 'md' | 'lg' | 'xl'>('md');
  const [animated, setAnimated] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8">
      <div className="max-w-7xl mx-auto space-y-12">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-[#2563EB] via-[#6366F1] to-[#8B5CF6] bg-clip-text text-transparent">
            Portal Fusion Logo System
          </h1>
          <p className="mt-2 text-gray-600">
            Overlapping rectangles representing the fusion of PC and Mac platforms
          </p>
        </div>

        {/* Controls */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <h2 className="text-xl font-semibold mb-4">Interactive Controls</h2>
          <div className="flex flex-wrap gap-4">
            {/* Size selector */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Size</label>
              <div className="flex gap-2">
                {(['xs', 'sm', 'md', 'lg', 'xl'] as const).map((size) => (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    className={`px-3 py-1 rounded-md text-sm font-medium transition-all ${
                      selectedSize === size
                        ? 'bg-gradient-to-r from-[#2563EB] to-[#8B5CF6] text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {size.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            {/* Animation toggle */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Animation</label>
              <button
                onClick={() => setAnimated(!animated)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  animated
                    ? 'bg-gradient-to-r from-[#2563EB] to-[#8B5CF6] text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {animated ? 'Enabled' : 'Disabled'}
              </button>
            </div>

            {/* Connection toggle */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Connection</label>
              <button
                onClick={() => setIsConnected(!isConnected)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  isConnected
                    ? 'bg-gradient-to-r from-[#2563EB] to-[#8B5CF6] text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {isConnected ? 'Connected' : 'Disconnected'}
              </button>
            </div>
          </div>
        </div>

        {/* Logo Variants Grid */}
        <div className="grid md:grid-cols-2 gap-8">
          {/* Icon Variant */}
          <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold mb-4">Icon Only</h3>
            <div className="flex justify-center items-center h-32 bg-gray-50 rounded-lg">
              <PortalFusionLogo 
                variant="icon" 
                size={selectedSize} 
                animated={animated}
              />
            </div>
            <pre className="mt-4 text-xs bg-gray-900 text-gray-300 p-3 rounded-md overflow-x-auto">
{`<PortalFusionLogo 
  variant="icon"
  size="${selectedSize}"
  animated={${animated}}
/>`}
            </pre>
          </div>

          {/* Horizontal Variant */}
          <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold mb-4">Horizontal</h3>
            <div className="flex justify-center items-center h-32 bg-gray-50 rounded-lg">
              <PortalFusionLogo 
                variant="horizontal" 
                size={selectedSize} 
                animated={animated}
              />
            </div>
            <pre className="mt-4 text-xs bg-gray-900 text-gray-300 p-3 rounded-md overflow-x-auto">
{`<PortalFusionLogo 
  variant="horizontal"
  size="${selectedSize}"
  animated={${animated}}
/>`}
            </pre>
          </div>

          {/* Vertical Variant */}
          <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold mb-4">Vertical with Tagline</h3>
            <div className="flex justify-center items-center h-32 bg-gray-50 rounded-lg">
              <PortalFusionLogo 
                variant="vertical" 
                size={selectedSize} 
                animated={animated}
                showTagline={true}
              />
            </div>
            <pre className="mt-4 text-xs bg-gray-900 text-gray-300 p-3 rounded-md overflow-x-auto">
{`<PortalFusionLogo 
  variant="vertical"
  size="${selectedSize}"
  animated={${animated}}
  showTagline={true}
/>`}
            </pre>
          </div>

          {/* Animated Variant */}
          <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold mb-4">Enhanced Animation</h3>
            <div className="flex justify-center items-center h-32 bg-gray-50 rounded-lg">
              <PortalFusionLogo 
                variant="animated" 
                size={selectedSize}
              />
            </div>
            <pre className="mt-4 text-xs bg-gray-900 text-gray-300 p-3 rounded-md overflow-x-auto">
{`<PortalFusionLogo 
  variant="animated"
  size="${selectedSize}"
/>`}
            </pre>
          </div>
        </div>

        {/* Special Variants */}
        <div className="space-y-8">
          <h2 className="text-2xl font-bold text-center">Special Variants</h2>
          
          {/* Simple Version */}
          <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold mb-4">Simple Version (Original)</h3>
            <div className="flex justify-center items-center h-32 bg-gray-50 rounded-lg">
              <PortalFusionLogoSimple 
                variant="horizontal" 
                animated={animated}
              />
            </div>
            <pre className="mt-4 text-xs bg-gray-900 text-gray-300 p-3 rounded-md overflow-x-auto">
{`<PortalFusionLogoSimple 
  variant="horizontal"
  animated={${animated}}
/>`}
            </pre>
          </div>

          {/* Animated Morphing */}
          <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold mb-4">Morphing Animation</h3>
            <div className="flex justify-center items-center h-32 bg-gray-50 rounded-lg">
              <PortalFusionLogoAnimated size="lg" />
            </div>
            <pre className="mt-4 text-xs bg-gray-900 text-gray-300 p-3 rounded-md overflow-x-auto">
{`<PortalFusionLogoAnimated 
  size="lg"
/>`}
            </pre>
          </div>

          {/* Connection Status */}
          <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold mb-4">Connection Status Logo</h3>
            <div className="flex justify-center items-center h-32 bg-gray-50 rounded-lg">
              <PortalFusionLogoConnecting 
                isConnected={isConnected}
                size="lg"
              />
            </div>
            <pre className="mt-4 text-xs bg-gray-900 text-gray-300 p-3 rounded-md overflow-x-auto">
{`<PortalFusionLogoConnecting 
  isConnected={${isConnected}}
  size="lg"
/>`}
            </pre>
          </div>
        </div>

        {/* Usage Examples */}
        <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-200">
          <h2 className="text-xl font-semibold mb-6">Usage Examples</h2>
          <div className="space-y-6">
            {/* Navigation Bar */}
            <div>
              <h3 className="font-medium mb-2">Navigation Bar</h3>
              <div className="bg-gray-900 p-4 rounded-lg flex items-center justify-between">
                <PortalFusionLogo variant="horizontal" size="sm" className="text-white" />
                <div className="flex gap-4 text-gray-300 text-sm">
                  <span>Devices</span>
                  <span>Settings</span>
                  <span>Help</span>
                </div>
              </div>
            </div>

            {/* App Icon */}
            <div>
              <h3 className="font-medium mb-2">App Icon</h3>
              <div className="flex gap-4">
                <div className="bg-white p-2 rounded-2xl shadow-lg border border-gray-200">
                  <PortalFusionLogo variant="icon" size="lg" />
                </div>
                <div className="bg-gray-900 p-2 rounded-2xl">
                  <PortalFusionLogo variant="icon" size="lg" />
                </div>
              </div>
            </div>

            {/* Loading State */}
            <div>
              <h3 className="font-medium mb-2">Loading State</h3>
              <div className="flex items-center justify-center p-8 bg-gray-50 rounded-lg">
                <div className="text-center">
                  <PortalFusionLogo variant="animated" size="lg" />
                  <p className="mt-4 text-gray-600">Connecting your devices...</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Color Reference */}
        <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-200">
          <h2 className="text-xl font-semibold mb-4">Brand Colors</h2>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="w-full h-20 bg-[#2563EB] rounded-lg mb-2"></div>
              <p className="font-medium">PC Blue</p>
              <p className="text-sm text-gray-500">#2563EB</p>
            </div>
            <div className="text-center">
              <div className="w-full h-20 bg-[#6366F1] rounded-lg mb-2"></div>
              <p className="font-medium">Fusion</p>
              <p className="text-sm text-gray-500">#6366F1</p>
            </div>
            <div className="text-center">
              <div className="w-full h-20 bg-[#8B5CF6] rounded-lg mb-2"></div>
              <p className="font-medium">Mac Purple</p>
              <p className="text-sm text-gray-500">#8B5CF6</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LogoShowcase;
