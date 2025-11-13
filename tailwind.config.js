/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    '../../packages/ui/**/*.{js,ts,jsx,tsx}',
  ],
  darkMode: ['class', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        // Portal Fusion Brand Colors
        'pf': {
          blue: '#2563EB',
          purple: '#8B5CF6',
          indigo: '#6366F1',
          // Light variants
          'blue-light': '#60A5FA',
          'purple-light': '#A78BFA',
          'indigo-light': '#818CF8',
          // Dark variants
          'blue-dark': '#1E40AF',
          'purple-dark': '#7C3AED',
          'indigo-dark': '#5B21B6',
        },
        // Platform specific
        'pc': {
          DEFAULT: '#2563EB',
          light: '#60A5FA',
          dark: '#1E40AF',
        },
        'mac': {
          DEFAULT: '#8B5CF6',
          light: '#A78BFA',
          dark: '#7C3AED',
        },
        'fusion': {
          DEFAULT: '#6366F1',
          light: '#818CF8',
          dark: '#5B21B6',
        },
      },
      backgroundImage: {
        // Gradient variations
        'pf-gradient': 'linear-gradient(135deg, #2563EB 0%, #6366F1 50%, #8B5CF6 100%)',
        'pf-gradient-horizontal': 'linear-gradient(90deg, #2563EB 0%, #8B5CF6 100%)',
        'pf-gradient-vertical': 'linear-gradient(180deg, #2563EB 0%, #8B5CF6 100%)',
        'pf-gradient-radial': 'radial-gradient(circle, #6366F1 0%, #2563EB 50%, #8B5CF6 100%)',
        'pf-gradient-subtle': 'linear-gradient(135deg, rgba(37, 99, 235, 0.1) 0%, rgba(99, 102, 241, 0.1) 50%, rgba(139, 92, 246, 0.1) 100%)',
        // Dark mode gradients
        'pf-gradient-dark': 'linear-gradient(135deg, #3B82F6 0%, #6D28D9 50%, #9333EA 100%)',
        'pf-gradient-dark-subtle': 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(109, 40, 217, 0.1) 50%, rgba(147, 51, 234, 0.1) 100%)',
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', '"Fira Sans"', '"Droid Sans"', '"Helvetica Neue"', 'sans-serif'],
        mono: ['"JetBrains Mono"', '"SF Mono"', 'Consolas', '"Courier New"', 'monospace'],
      },
      animation: {
        'portal-merge': 'portal-merge 2s ease-in-out',
        'portal-rotate': 'portal-rotate 20s linear infinite',
        'portal-rotate-reverse': 'portal-rotate 15s linear infinite reverse',
        'portal-pulse': 'portal-pulse 2s ease-in-out infinite',
        'gradient-shift': 'gradient-shift 3s ease infinite',
        'connection-flow': 'connection-flow 2s linear infinite',
        'ripple': 'ripple 0.6s linear',
        'slide-in': 'slide-in 0.3s ease-out',
        'fade-in': 'fade-in 0.5s ease-out',
        'bounce-subtle': 'bounce-subtle 2s infinite',
        'morph-left': 'morph-left 3s ease-in-out infinite',
        'morph-right': 'morph-right 3s ease-in-out infinite',
        'connect': 'connect 0.6s ease-in-out forwards',
        'disconnect': 'disconnect 0.6s ease-in-out forwards',
      },
      keyframes: {
        'portal-merge': {
          '0%': { 
            transform: 'translateX(-20px)', 
            opacity: '0.7' 
          },
          '50%': { 
            transform: 'translateX(0)', 
            opacity: '0.9' 
          },
          '100%': { 
            transform: 'translateX(0)', 
            opacity: '1' 
          }
        },
        'portal-rotate': {
          'from': { transform: 'rotate(0deg)' },
          'to': { transform: 'rotate(360deg)' }
        },
        'portal-pulse': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' }
        },
        'gradient-shift': {
          '0%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
          '100%': { backgroundPosition: '0% 50%' }
        },
        'connection-flow': {
          '0%': { 
            transform: 'translateX(-100%)', 
            opacity: '0' 
          },
          '50%': { opacity: '1' },
          '100%': { 
            transform: 'translateX(100%)', 
            opacity: '0' 
          }
        },
        'ripple': {
          '0%': { 
            transform: 'scale(0.8)', 
            opacity: '1' 
          },
          '100%': { 
            transform: 'scale(2.4)', 
            opacity: '0' 
          }
        },
        'slide-in': {
          '0%': { 
            transform: 'translateY(-10px)', 
            opacity: '0' 
          },
          '100%': { 
            transform: 'translateY(0)', 
            opacity: '1' 
          }
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' }
        },
        'bounce-subtle': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-5px)' }
        },
        'morph-left': {
          '0%, 100%': { transform: 'translateX(0) scale(1)' },
          '50%': { transform: 'translateX(10%) scale(1.1)' }
        },
        'morph-right': {
          '0%, 100%': { transform: 'translateX(0) scale(1)' },
          '50%': { transform: 'translateX(-10%) scale(1.1)' }
        },
        'connect': {
          '0%': { left: '0' },
          '50%': { left: '20px' },
          '100%': { left: '20px' }
        },
        'disconnect': {
          '0%': { left: '20px' },
          '100%': { left: '0' }
        }
      },
      boxShadow: {
        'pf-sm': '0 1px 2px 0 rgba(37, 99, 235, 0.05)',
        'pf': '0 1px 3px 0 rgba(99, 102, 241, 0.1), 0 1px 2px 0 rgba(99, 102, 241, 0.06)',
        'pf-md': '0 4px 6px -1px rgba(99, 102, 241, 0.1), 0 2px 4px -1px rgba(99, 102, 241, 0.06)',
        'pf-lg': '0 10px 15px -3px rgba(139, 92, 246, 0.1), 0 4px 6px -2px rgba(139, 92, 246, 0.05)',
        'pf-xl': '0 20px 25px -5px rgba(139, 92, 246, 0.1), 0 10px 10px -5px rgba(139, 92, 246, 0.04)',
        'pf-glow': '0 0 20px rgba(99, 102, 241, 0.3)',
        'pf-glow-lg': '0 0 40px rgba(99, 102, 241, 0.4)',
      },
      borderRadius: {
        'pf-sm': '4px',
        'pf': '8px',
        'pf-md': '12px',
        'pf-lg': '16px',
        'pf-xl': '24px',
      },
      spacing: {
        'pf-xs': '0.25rem',
        'pf-sm': '0.5rem',
        'pf': '1rem',
        'pf-md': '1.5rem',
        'pf-lg': '2rem',
        'pf-xl': '3rem',
        'pf-2xl': '4rem',
      },
      transitionDuration: {
        'pf-fast': '150ms',
        'pf': '200ms',
        'pf-slow': '400ms',
      },
      screens: {
        'xs': '475px',
      },
      typography: (theme) => ({
        DEFAULT: {
          css: {
            color: theme('colors.gray.700'),
            a: {
              color: theme('colors.pf.indigo'),
              '&:hover': {
                color: theme('colors.pf.purple'),
              },
            },
            'h1, h2, h3, h4': {
              fontWeight: '700',
              color: theme('colors.gray.900'),
            },
            code: {
              color: theme('colors.pf.indigo'),
              backgroundColor: theme('colors.gray.100'),
              padding: '0.125rem 0.25rem',
              borderRadius: '0.25rem',
              fontWeight: '600',
            },
            'code::before': {
              content: '""',
            },
            'code::after': {
              content: '""',
            },
          },
        },
        dark: {
          css: {
            color: theme('colors.gray.300'),
            a: {
              color: theme('colors.pf.indigo-light'),
              '&:hover': {
                color: theme('colors.pf.purple-light'),
              },
            },
            'h1, h2, h3, h4': {
              color: theme('colors.gray.100'),
            },
            code: {
              color: theme('colors.pf.indigo-light'),
              backgroundColor: theme('colors.gray.800'),
            },
          },
        },
      }),
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
    require('@tailwindcss/forms'),
    require('@tailwindcss/container-queries'),
    // Custom plugin for Portal Fusion utilities
    function({ addUtilities, addComponents, theme }) {
      const newUtilities = {
        // Text gradient utilities
        '.text-gradient-pf': {
          background: 'linear-gradient(135deg, #2563EB 0%, #6366F1 50%, #8B5CF6 100%)',
          '-webkit-background-clip': 'text',
          '-webkit-text-fill-color': 'transparent',
          'background-clip': 'text',
        },
        '.text-gradient-pf-horizontal': {
          background: 'linear-gradient(90deg, #2563EB 0%, #8B5CF6 100%)',
          '-webkit-background-clip': 'text',
          '-webkit-text-fill-color': 'transparent',
          'background-clip': 'text',
        },
        // Platform utilities
        '.platform-pc': {
          color: theme('colors.pc.DEFAULT'),
          borderColor: theme('colors.pc.DEFAULT'),
        },
        '.platform-mac': {
          color: theme('colors.mac.DEFAULT'),
          borderColor: theme('colors.mac.DEFAULT'),
        },
        '.platform-fusion': {
          background: 'linear-gradient(135deg, #2563EB 0%, #6366F1 50%, #8B5CF6 100%)',
          color: 'white',
        },
        // Gradient border utility
        '.gradient-border-pf': {
          position: 'relative',
          background: 'white',
          '&::before': {
            content: '""',
            position: 'absolute',
            inset: '0',
            padding: '2px',
            background: 'linear-gradient(135deg, #2563EB 0%, #6366F1 50%, #8B5CF6 100%)',
            '-webkit-mask': 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
            '-webkit-mask-composite': 'xor',
            'mask-composite': 'exclude',
            borderRadius: 'inherit',
          },
        },
      }

      const newComponents = {
        // Button component
        '.btn-pf': {
          background: 'linear-gradient(135deg, #2563EB 0%, #6366F1 50%, #8B5CF6 100%)',
          color: 'white',
          fontWeight: '600',
          padding: '0.5rem 1.5rem',
          borderRadius: theme('borderRadius.pf'),
          transition: 'all 200ms ease-in-out',
          cursor: 'pointer',
          display: 'inline-block',
          textAlign: 'center',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: theme('boxShadow.pf-lg'),
          },
          '&:active': {
            transform: 'translateY(0)',
          },
        },
        // Card component
        '.card-pf': {
          background: 'white',
          border: '1px solid #E5E7EB',
          borderRadius: theme('borderRadius.pf-md'),
          padding: theme('spacing.pf-lg'),
          transition: 'all 200ms ease-in-out',
          '&:hover': {
            borderColor: theme('colors.pf.indigo'),
            boxShadow: '0 0 0 3px rgba(99, 102, 241, 0.1)',
          },
        },
        // Loading spinner
        '.loading-pf': {
          width: '40px',
          height: '40px',
          border: '3px solid #E5E7EB',
          borderTopColor: '#2563EB',
          borderRightColor: '#6366F1',
          borderBottomColor: '#8B5CF6',
          borderRadius: '50%',
          animation: 'portal-rotate 1s linear infinite',
        },
      }

      addUtilities(newUtilities)
      addComponents(newComponents)
    },
  ],
}
