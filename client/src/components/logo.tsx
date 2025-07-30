interface LogoProps {
  variant?: 'main' | 'blue' | 'white';
  className?: string;
}

export function Logo({ variant = 'main', className = '' }: LogoProps) {
  // Logo selection based on variant
  const logoSrc = variant === 'white' 
    ? '/white-logo.png'
    : variant === 'blue'
    ? '/blue-logo.png'
    : '/main-logo.png';

  return (
    <img 
      src={logoSrc} 
      alt="Life House Reentry" 
      className={`object-contain ${className}`}
    />
  );
}