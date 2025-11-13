import React from 'react';

/**
 * Portal Fusion Brand Components Showcase
 * Examples of how to use the brand colors and styles in your React components
 */

// Using CSS custom properties approach
export const ConnectionStatus: React.FC<{ status: 'connected' | 'syncing' | 'disconnected' }> = ({ status }) => {
  return (
    <div className="connection-indicator">
      <span className={`status-${status}`}>
        {status === 'connected' && '🟢 Connected'}
        {status === 'syncing' && '🟡 Syncing...'}
        {status === 'disconnected' && '🔴 Disconnected'}
      </span>
    </div>
  );
};

// Using Tailwind classes
export const DeviceCard: React.FC<{ 
  name: string; 
  platform: 'pc' | 'mac'; 
  isActive?: boolean;
}> = ({ name, platform, isActive = false }) => {
  const platformColors = {
    pc: 'border-pc text-pc hover:bg-blue-50',
    mac: 'border-mac text-mac hover:bg-purple-50',
  };

  return (
    <div className={`
      card-pf 
      ${platformColors[platform]}
      ${isActive ? 'gradient-border-pf' : ''}
      transition-all duration-pf hover:shadow-pf-md
    `}>
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">{name}</h3>
          <p className="text-gray-600 text-sm">
            {platform === 'pc' ? 'Windows PC' : 'macOS Device'}
          </p>
        </div>
        <div className={`w-3 h-3 rounded-full ${isActive ? 'bg-green-500' : 'bg-gray-300'}`} />
      </div>
    </div>
  );
};

// Portal Fusion branded button
export const PortalButton: React.FC<{
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'gradient';
  size?: 'sm' | 'md' | 'lg';
}> = ({ children, onClick, variant = 'primary', size = 'md' }) => {
  const variants = {
    primary: 'btn-pf',
    secondary: 'bg-white text-pf-indigo border-2 border-pf-indigo hover:bg-pf-gradient hover:text-white',
    gradient: 'bg-pf-gradient text-white hover:shadow-pf-glow',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-6 py-2',
    lg: 'px-8 py-3 text-lg',
  };

  return (
    <button
      onClick={onClick}
      className={`
        ${variants[variant]}
        ${sizes[size]}
        font-semibold rounded-pf
        transition-all duration-pf
        transform hover:-translate-y-0.5
        active:translate-y-0
      `}
    >
      {children}
    </button>
  );
};

// Animated Portal Logo
export const PortalLogo: React.FC<{ size?: 'sm' | 'md' | 'lg' }> = ({ size = 'md' }) => {
  const sizes = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-20 h-20',
  };

  return (
    <div className={`relative ${sizes[size]}`}>
      {/* Outer ring - PC */}
      <div className="absolute inset-0 border-2 border-pc rounded-full animate-portal-rotate opacity-60" />
      
      {/* Middle ring - Fusion */}
      <div className="absolute inset-2 border-2 border-fusion rounded-full animate-portal-rotate-reverse" />
      
      {/* Inner ring - Mac */}
      <div className="absolute inset-4 border-2 border-mac rounded-full animate-portal-rotate opacity-60" />
      
      {/* Center dot */}
      <div className="absolute inset-1/2 w-2 h-2 -translate-x-1/2 -translate-y-1/2 bg-pf-gradient rounded-full animate-portal-pulse" />
    </div>
  );
};

// Loading Spinner
export const PortalSpinner: React.FC = () => {
  return <div className="loading-pf" />;
};

// Gradient Text
export const GradientHeading: React.FC<{ children: React.ReactNode; as?: 'h1' | 'h2' | 'h3' }> = ({ 
  children, 
  as: Component = 'h2' 
}) => {
  return (
    <Component className="text-gradient-pf text-4xl font-bold">
      {children}
    </Component>
  );
};

// Platform Switcher
export const PlatformSwitcher: React.FC<{
  activePlatform: 'pc' | 'mac' | 'both';
  onChange: (platform: 'pc' | 'mac' | 'both') => void;
}> = ({ activePlatform, onChange }) => {
  return (
    <div className="inline-flex rounded-pf-lg border border-gray-200 p-1">
      <button
        onClick={() => onChange('pc')}
        className={`
          px-4 py-2 rounded-pf text-sm font-medium transition-all
          ${activePlatform === 'pc' 
            ? 'bg-pc text-white' 
            : 'text-gray-600 hover:text-pc'}
        `}
      >
        PC
      </button>
      <button
        onClick={() => onChange('both')}
        className={`
          px-4 py-2 rounded-pf text-sm font-medium transition-all
          ${activePlatform === 'both' 
            ? 'bg-pf-gradient text-white' 
            : 'text-gray-600 hover:text-fusion'}
        `}
      >
        Both
      </button>
      <button
        onClick={() => onChange('mac')}
        className={`
          px-4 py-2 rounded-pf text-sm font-medium transition-all
          ${activePlatform === 'mac' 
            ? 'bg-mac text-white' 
            : 'text-gray-600 hover:text-mac'}
        `}
      >
        Mac
      </button>
    </div>
  );
};

// Progress Bar with Gradient
export const TransferProgress: React.FC<{ progress: number; fileName: string }> = ({ 
  progress, 
  fileName 
}) => {
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span className="text-gray-700 font-medium">{fileName}</span>
        <span className="text-pf-indigo font-semibold">{progress}%</span>
      </div>
      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
        <div 
          className="h-full bg-pf-gradient transition-all duration-300 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
};

// Connection Flow Animation
export const ConnectionFlow: React.FC<{ isActive: boolean }> = ({ isActive }) => {
  return (
    <div className="relative h-1 bg-gray-200 rounded-full overflow-hidden">
      {isActive && (
        <div className="absolute inset-0">
          <div className="h-full w-1/3 bg-pf-gradient animate-connection-flow" />
        </div>
      )}
    </div>
  );
};

// Feature Card with Gradient Border
export const FeatureCard: React.FC<{
  icon: React.ReactNode;
  title: string;
  description: string;
  isActive?: boolean;
}> = ({ icon, title, description, isActive = false }) => {
  return (
    <div className={`
      relative p-6 rounded-pf-lg
      ${isActive ? 'gradient-border-pf' : 'border border-gray-200'}
      hover:shadow-pf-md transition-all duration-pf
      group cursor-pointer
    `}>
      <div className="flex items-start space-x-4">
        <div className={`
          p-3 rounded-pf
          ${isActive ? 'bg-pf-gradient text-white' : 'bg-gray-100 text-gray-600'}
          group-hover:scale-110 transition-transform duration-pf
        `}>
          {icon}
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <p className="mt-1 text-sm text-gray-600">{description}</p>
        </div>
      </div>
    </div>
  );
};

// Usage Example Component
export const PortalFusionDemo: React.FC = () => {
  const [platform, setPlatform] = React.useState<'pc' | 'mac' | 'both'>('both');
  const [transferProgress, setTransferProgress] = React.useState(65);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <PortalLogo size="lg" />
          </div>
          <GradientHeading as="h1">Portal Fusion</GradientHeading>
          <p className="text-gray-600">Seamless computing, unified</p>
        </div>

        {/* Platform Switcher */}
        <div className="flex justify-center">
          <PlatformSwitcher activePlatform={platform} onChange={setPlatform} />
        </div>

        {/* Devices Grid */}
        <div className="grid md:grid-cols-2 gap-6">
          <DeviceCard name="My PC" platform="pc" isActive={platform === 'pc' || platform === 'both'} />
          <DeviceCard name="MacBook Pro" platform="mac" isActive={platform === 'mac' || platform === 'both'} />
        </div>

        {/* Connection Status */}
        <div className="flex justify-center">
          <ConnectionStatus status="connected" />
        </div>

        {/* Connection Flow */}
        <ConnectionFlow isActive={true} />

        {/* Transfer Progress */}
        <div className="bg-white rounded-pf-lg p-6 shadow-sm">
          <TransferProgress progress={transferProgress} fileName="project-files.zip" />
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-6">
          <FeatureCard
            icon={<span>📋</span>}
            title="Clipboard Sync"
            description="Copy on one device, paste on another"
            isActive={true}
          />
          <FeatureCard
            icon={<span>📁</span>}
            title="File Transfer"
            description="Drag and drop files between devices"
            isActive={false}
          />
          <FeatureCard
            icon={<span>🖥️</span>}
            title="Screen Share"
            description="Use your tablet as a second monitor"
            isActive={false}
          />
        </div>

        {/* Action Buttons */}
        <div className="flex justify-center space-x-4">
          <PortalButton variant="gradient" size="lg">
            Connect Devices
          </PortalButton>
          <PortalButton variant="secondary" size="lg">
            Settings
          </PortalButton>
        </div>

        {/* Loading State */}
        <div className="flex justify-center">
          <PortalSpinner />
        </div>
      </div>
    </div>
  );
};

export default PortalFusionDemo;
