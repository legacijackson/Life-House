import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

interface LogoProps {
  variant?: 'color' | 'white' | 'lightgreen' | 'whitepurple';
  layout?: 'horizontal' | 'icon';
  className?: string;
}

export function Logo({ variant, layout = 'horizontal', className = '' }: LogoProps) {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Determine which variant to use based on theme and props
  const effectiveVariant = variant || (mounted && theme === 'dark' ? 'white' : 'color');
  
  const logoMap = {
    'color-horizontal': '/assets/brand/lifehouse_color_horizontal.png',
    'color-icon': '/assets/brand/lifehouse_color_icon.png',
    'white-horizontal': '/assets/brand/lifehouse_white_horizontal.png',
    'white-icon': '/assets/brand/lifehouse_white_icon.png',
    'whitepurple-horizontal': '/assets/brand/lifehouse_whitepurple_horizontal.png',
    'whitepurple-icon': '/assets/brand/lifehouse_whitepurple_horizontal.png', // Use horizontal as fallback
    'lightgreen-horizontal': '/assets/brand/lifehouse_lightgreen_horizontal.png',
    'lightgreen-icon': '/assets/brand/lifehouse_lightgreen_icon.png',
  };

  const logoKey = `${effectiveVariant}-${layout}`;
  const logoSrc = logoMap[logoKey as keyof typeof logoMap] || logoMap['color-horizontal'];

  return (
    <img 
      src={logoSrc} 
      alt="Life House Reentry" 
      className={`${layout === 'horizontal' ? 'h-10' : 'h-8 w-8'} ${className}`}
    />
  );
}