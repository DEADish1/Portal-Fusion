import React from 'react';

/**
 * Portal Fusion Logo Component
 * Displays the brand logo with overlapping rectangles representing PC/Mac fusion
 */

interface PortalFusionLogoProps {
  variant?: 'icon' | 'horizontal' | 'vertical' | 'animated';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  animated?: boolean;
  className?: string;
  showTagline?: boolean;
}

export const PortalFusionLogo: React.FC<PortalFusionLogoProps> = ({ 
  variant = 'icon', 
  size = 'md',
  animated = false,
  className = '',
  showTagline = false
}) => {
  // Size configurations
  const sizes = {
    xs: {
      box: 'w-6 h-6',
      offset: 'left-3',
      middle: 'left-1.5',
      text: 'text-sm',
      tagline: 'text-xs',
      gap: 'ml-8',
      vGap: 'mt-2'
    },
    sm: {
      box: 'w-8 h-8',
      offset: 'left-4',
      middle: 'left-2',
      text: 'text-lg',
      tagline: 'text-sm',
      gap: 'ml-10',
      vGap: 'mt-3'
    },
    md: {
      box: 'w-10 h-10',
      offset: 'left-5',
      middle: 'left-2.5',
      text: 'text-xl',
      tagline: 'text-sm',
      gap: 'ml-12',
      vGap: 'mt-3'
    },
    lg: {
      box: 'w-12 h-12',
      offset: 'left-6',
      middle: 'left-3',
      text: 'text-2xl',
      tagline: 'text-base',
      gap: 'ml-16',
      vGap: 'mt-4'
    },
    xl: {
      box: 'w-16 h-16',
      offset: 'left-8',
      middle: 'left-4',
      text: 'text-3xl',
      tagline: 'text-lg',
      gap: 'ml-20',
      vGap: 'mt-5'
    }
  };

  const currentSize = sizes[size];
  const animationClass = animated ? 'animate-pulse' : '';
  
  return (
    <div 
      className={`flex ${variant === 'vertical' ? 'flex-col items-center' : 'items-center'} ${animationClass} ${className}`}
    >
      {/* Logo Icon */}
      <div className="relative flex" style={{ height: currentSize.box.split(' ')[1] }}>
        {/* Left Rectangle (PC) - Deep Blue */}
        <div 
          className={`${currentSize.box} bg-[#2563EB] rounded-md absolute left-0 transition-all duration-300 hover:scale-110`}
          style={{ zIndex: 1 }}
        />
        
        {/* Right Rectangle (Mac) - Vibrant Purple */}
        <div 
          className={`${currentSize.box} bg-[#8B5CF6] rounded-md absolute ${currentSize.offset} transition-all duration-300 hover:scale-110`}
          style={{ zIndex: 1 }}
        />
        
        {/* Fusion Overlay - Gradient Middle */}
        <div 
          className={`${currentSize.box} bg-gradient-to-r from-[#2563EB] to-[#8B5CF6] rounded-md absolute ${currentSize.middle} mix-blend-multiply opacity-90`}
          style={{ zIndex: 2 }}
        />
        
        {/* Enhanced animated version with glow effect */}
        {variant === 'animated' && (
          <>
            <div 
              className={`${currentSize.box} bg-[#6366F1] rounded-md absolute ${currentSize.middle} animate-pulse opacity-30`}
              style={{ zIndex: 0 }}
            />
            <div 
              className={`${currentSize.box} bg-gradient-to-r from-[#2563EB] to-[#8B5CF6] rounded-md absolute ${currentSize.middle} blur-md opacity-40`}
              style={{ zIndex: 0 }}
            />
          </>
        )}
      </div>

      {/* Text */}
      {(variant === 'horizontal' || variant === 'vertical') && (
        <div className={`${variant === 'vertical' ? currentSize.vGap : currentSize.gap} ${variant === 'vertical' ? 'text-center' : ''}`}>
          <span className={`font-bold ${currentSize.text} bg-gradient-to-r from-[#2563EB] via-[#6366F1] to-[#8B5CF6] bg-clip-text text-transparent`}>
            Portal Fusion
          </span>
          {showTagline && (
            <p className={`${currentSize.tagline} text-gray-500 mt-1`}>
              Seamless computing, unified
            </p>
          )}
        </div>
      )}
    </div>
  );
};

// Simplified version matching the original component
export const PortalFusionLogoSimple: React.FC<{ 
  variant?: 'icon' | 'horizontal';
  animated?: boolean;
}> = ({ variant = 'icon', animated = false }) => {
  return (
    <div className={`flex items-center ${animated ? 'animate-pulse' : ''}`}>
      <div className="relative flex">
        {/* Left Rectangle (PC) */}
        <div className="w-8 h-8 bg-blue-600 rounded-md absolute left-0" />
        {/* Right Rectangle (Mac) */}
        <div className="w-8 h-8 bg-purple-600 rounded-md absolute left-4" />
        {/* Fusion Overlay */}
        <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-md absolute left-2 mix-blend-multiply" />
      </div>
      {variant === 'horizontal' && (
        <span className="ml-12 font-semibold text-xl">Portal Fusion</span>
      )}
    </div>
  );
};

// Advanced animated version with morphing effect
export const PortalFusionLogoAnimated: React.FC<{ size?: 'sm' | 'md' | 'lg' }> = ({ 
  size = 'md' 
}) => {
  const sizeMap = {
    sm: 'w-6 h-6',
    md: 'w-10 h-10',
    lg: 'w-14 h-14'
  };
  
  const offsetMap = {
    sm: 'left-3',
    md: 'left-5',
    lg: 'left-7'
  };

  return (
    <div className="relative flex items-center justify-center">
      <style jsx>{`
        @keyframes morph-left {
          0%, 100% { transform: translateX(0) scale(1); }
          50% { transform: translateX(10%) scale(1.1); }
        }
        @keyframes morph-right {
          0%, 100% { transform: translateX(0) scale(1); }
          50% { transform: translateX(-10%) scale(1.1); }
        }
        .morph-left {
          animation: morph-left 3s ease-in-out infinite;
        }
        .morph-right {
          animation: morph-right 3s ease-in-out infinite;
        }
      `}</style>
      
      <div className="relative flex">
        {/* Glow effect background */}
        <div 
          className={`${sizeMap[size]} bg-gradient-to-r from-[#2563EB] to-[#8B5CF6] rounded-md absolute left-2 blur-xl opacity-30`}
        />
        
        {/* Left Rectangle (PC) */}
        <div 
          className={`${sizeMap[size]} bg-[#2563EB] rounded-md absolute left-0 morph-left shadow-lg`}
        />
        
        {/* Right Rectangle (Mac) */}
        <div 
          className={`${sizeMap[size]} bg-[#8B5CF6] rounded-md absolute ${offsetMap[size]} morph-right shadow-lg`}
        />
        
        {/* Fusion Overlay */}
        <div 
          className={`${sizeMap[size]} bg-gradient-to-r from-[#2563EB] to-[#8B5CF6] rounded-md absolute left-2 mix-blend-multiply opacity-90`}
        />
      </div>
    </div>
  );
};

// Logo with connection animation
export const PortalFusionLogoConnecting: React.FC<{ 
  isConnected?: boolean;
  size?: 'sm' | 'md' | 'lg';
}> = ({ isConnected = false, size = 'md' }) => {
  const sizeMap = {
    sm: { box: 'w-8 h-8', offset: 4, px: 32 },
    md: { box: 'w-10 h-10', offset: 5, px: 40 },
    lg: { box: 'w-12 h-12', offset: 6, px: 48 }
  };
  
  const config = sizeMap[size];

  return (
    <div className="relative flex items-center">
      <style jsx>{`
        @keyframes connect {
          0% { left: 0; }
          50% { left: ${config.offset * 4}px; }
          100% { left: ${config.offset * 4}px; }
        }
        @keyframes disconnect {
          0% { left: ${config.offset * 4}px; }
          100% { left: 0; }
        }
        .connecting {
          animation: ${isConnected ? 'connect' : 'disconnect'} 0.6s ease-in-out forwards;
        }
      `}</style>
      
      <div className="relative" style={{ width: `${config.px * 2}px`, height: `${config.px}px` }}>
        {/* Left Rectangle (PC) - Static */}
        <div 
          className={`${config.box} bg-[#2563EB] rounded-md absolute left-0 transition-colors duration-300 ${
            isConnected ? 'bg-[#2563EB]' : 'bg-gray-400'
          }`}
        />
        
        {/* Right Rectangle (Mac) - Animated */}
        <div 
          className={`${config.box} bg-[#8B5CF6] rounded-md absolute connecting transition-colors duration-300 ${
            isConnected ? 'bg-[#8B5CF6]' : 'bg-gray-400'
          }`}
        />
        
        {/* Fusion Overlay - Appears when connected */}
        {isConnected && (
          <div 
            className={`${config.box} bg-gradient-to-r from-[#2563EB] to-[#8B5CF6] rounded-md absolute mix-blend-multiply opacity-0 animate-fade-in`}
            style={{ left: `${config.offset * 2}px`, animationDelay: '0.5s', animationFillMode: 'forwards' }}
          />
        )}
        
        {/* Connection line */}
        <div 
          className={`absolute top-1/2 -translate-y-1/2 h-0.5 transition-all duration-500 ${
            isConnected 
              ? 'bg-gradient-to-r from-[#2563EB] to-[#8B5CF6] w-full left-0' 
              : 'bg-gray-300 w-0 left-1/2'
          }`}
        />
      </div>
      
      {/* Status text */}
      <span className={`ml-4 text-sm font-medium transition-colors duration-300 ${
        isConnected ? 'text-[#6366F1]' : 'text-gray-500'
      }`}>
        {isConnected ? 'Connected' : 'Disconnected'}
      </span>
    </div>
  );
};

// Export all variants
export default PortalFusionLogo;
