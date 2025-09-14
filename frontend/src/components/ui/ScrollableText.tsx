import React, { useState, useRef, useEffect } from 'react';

interface ScrollableTextProps {
  text: string;
  className?: string;
  maxWidth?: string;
}

const ScrollableText: React.FC<ScrollableTextProps> = ({ 
  text, 
  className = '', 
  maxWidth = '100%' 
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isOverflowing, setIsOverflowing] = useState(false);
  const [scrollPosition, setScrollPosition] = useState(0);
  const textRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>();

  // 检查文本是否溢出
  useEffect(() => {
    const checkOverflow = () => {
      if (textRef.current && containerRef.current) {
        const textWidth = textRef.current.scrollWidth;
        const containerWidth = containerRef.current.clientWidth;
        setIsOverflowing(textWidth > containerWidth);
      }
    };

    checkOverflow();
    window.addEventListener('resize', checkOverflow);
    return () => window.removeEventListener('resize', checkOverflow);
  }, [text]);

  // 滚动动画
  useEffect(() => {
    if (isHovered && isOverflowing) {
      const startTime = Date.now();
      const duration = 2000; // 2秒滚动到末尾
      const delay = 500; // 0.5秒延迟开始
      
      const animate = () => {
        const elapsed = Date.now() - startTime;
        
        if (elapsed < delay) {
          // 延迟阶段，保持在起始位置
          setScrollPosition(0);
        } else {
          const progress = Math.min((elapsed - delay) / duration, 1);
          
          if (textRef.current && containerRef.current) {
            const maxScroll = textRef.current.scrollWidth - containerRef.current.clientWidth;
            const easeInOutQuad = progress < 0.5 
              ? 2 * progress * progress 
              : 1 - Math.pow(-2 * progress + 2, 2) / 2;
            
            setScrollPosition(maxScroll * easeInOutQuad);
          }
        }
        
        if (elapsed < delay + duration && isHovered) {
          animationRef.current = requestAnimationFrame(animate);
        }
      };
      
      animationRef.current = requestAnimationFrame(animate);
    } else {
      // 重置滚动位置
      setScrollPosition(0);
    }
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isHovered, isOverflowing]);

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
  };

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden ${className}`}
      style={{ maxWidth }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      title={isOverflowing ? text : undefined}
    >
      <div
        ref={textRef}
        className="whitespace-nowrap transition-transform duration-100 ease-out"
        style={{
          transform: `translateX(-${scrollPosition}px)`,
        }}
      >
        {text}
      </div>
    </div>
  );
};

export default ScrollableText;