import { useState, useEffect } from 'react';

function getWindowDimensions(): { height: number; width: number } {
  const { innerWidth: width, innerHeight: height } = window;

  if (!width)
    return {
      width: 0,
      height: height,
    };

  return {
    width,
    height,
  };
}

export default function useWindowSize(): { height: number; width: number } {
  const [windowDimensions, setWindowDimensions] = useState(getWindowDimensions());

  useEffect(() => {
    function handleResize() {
      setWindowDimensions(getWindowDimensions());
    }

    window.addEventListener('resize', handleResize);

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return windowDimensions;
}
