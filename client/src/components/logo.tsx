import Life_house_logo_ from "@assets/Life house logo .png";
import Untitled_design__3_ from "@assets/3_1753914027346.png";
import NewLifeHouseLogo from "@assets/12_1753911136397.png";
import LifeHouseHorizontal from "@assets/Untitled design (4)_1753911268257.png";
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
      src={Untitled_design__3_} 
      alt="Life House Reentry" 
      className="object-contain cursor-pointer h-12 ml-[2px] mr-[2px]"
      onClick={handleClick}
    />
  );
}