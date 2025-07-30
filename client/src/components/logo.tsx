import Life_house_logo_ from "@assets/Life house logo .png";
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
      src={Life_house_logo_} 
      alt="Life House Reentry" 
      className="object-contain cursor-pointer h-12 ml-[2px] mr-[2px]"
      onClick={handleClick}
    />
  );
}