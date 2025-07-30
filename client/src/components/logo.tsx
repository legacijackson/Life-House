interface LogoProps {
  className?: string;
  onClick?: () => void;
}

export function Logo({ className = '', onClick }: LogoProps) {
  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      // Default behavior: navigate to home page
      window.location.href = '/';
    }
  };

  return (
    <img 
      src="/universal-logo.png" 
      alt="Life House Reentry" 
      className={`object-contain cursor-pointer ${className}`}
      onClick={handleClick}
    />
  );
}