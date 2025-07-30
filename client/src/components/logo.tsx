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
    'color-horizontal': '/assets/brand/blue horizontal_1753856825753.png',
    'color-icon': '/assets/brand/blue large icon_1753856825753.png',
    'white-horizontal': '/assets/brand/white horizontal_1753856825754.png',
    'white-icon': '/assets/brand/white large icon_1753856825753.png',
    'whitepurple-horizontal': '/assets/brand/white with purple logo horizontal_1753856825754.png',
    'whitepurple-icon': '/assets/brand/Life House large icon_1753856825753.png',
    'lightgreen-horizontal': '/assets/brand/light green horizontal_1753856825754.png',
    'lightgreen-icon': '/assets/brand/light green large icon _1753856825752.png',
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