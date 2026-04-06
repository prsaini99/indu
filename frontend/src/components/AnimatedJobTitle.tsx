
import { useState, useEffect } from 'react';

interface AnimatedJobTitleProps {
  titles: string[];
  className?: string;
}

const AnimatedJobTitle = ({ titles, className = '' }: AnimatedJobTitleProps) => {
  const [currentTitleIndex, setCurrentTitleIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Handle the animation cycling
    const interval = setInterval(() => {
      setIsVisible(false); // Start fade out
      
      // After fade out, change the title
      setTimeout(() => {
        setCurrentTitleIndex((prevIndex) => (prevIndex + 1) % titles.length);
        setIsVisible(true); // Start fade in with new title
      }, 500); // Match the CSS transition duration
      
    }, 3000); // Change every 3 seconds
    
    return () => clearInterval(interval);
  }, [titles.length]);

  return (
    <span 
      className={`inline-block transition-opacity duration-500 ${isVisible ? 'opacity-100' : 'opacity-0'} text-talent-primary font-bold ${className}`}
    >
      {titles[currentTitleIndex]}
    </span>
  );
};

export default AnimatedJobTitle;
