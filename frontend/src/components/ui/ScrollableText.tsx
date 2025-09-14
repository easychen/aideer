import React, { useState, useRef, useEffect } from 'react';

interface ScrollableTextProps {
  text: string;
  className?: string;
  maxWidth?: string;
  isHovered?: boolean;
}

const ScrollableText: React.FC<ScrollableTextProps> = ({ 
  text, 
  className = '', 
  maxWidth = '100%',
  isHovered: externalIsHovered 
}) => {
  const [internalIsHovered, setInternalIsHovered] = useState(false);
  const isHovered = externalIsHovered !== undefined ? externalIsHovered : internalIsHovered;
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
      let startTime = Date.now();
      const scrollDuration = 4000; // 4秒滚动到末尾
      const pauseAtEndDuration = 1000; // 在末尾停留1秒
      const pauseAtStartDuration = 1000; // 在头部停留1秒
      const totalCycleDuration = scrollDuration + pauseAtEndDuration + pauseAtStartDuration;
      
      const animate = () => {
        const elapsed = Date.now() - startTime;
        const cyclePosition = elapsed % totalCycleDuration;
        
        if (cyclePosition < scrollDuration) {
          // 滚动阶段：从头部滚动到末尾
          const progress = cyclePosition / scrollDuration;
          
          if (textRef.current && containerRef.current) {
            const maxScroll = textRef.current.scrollWidth - containerRef.current.clientWidth;
            const easeInOutQuad = progress < 0.5 
              ? 2 * progress * progress 
              : 1 - Math.pow(-2 * progress + 2, 2) / 2;
            
            setScrollPosition(maxScroll * easeInOutQuad);
          }
        } else if (cyclePosition < scrollDuration + pauseAtEndDuration) {
          // 在末尾停留阶段
          if (textRef.current && containerRef.current) {
            const maxScroll = textRef.current.scrollWidth - containerRef.current.clientWidth;
            setScrollPosition(maxScroll);
          }
        } else {
          // 在头部停留阶段
          setScrollPosition(0);
        }
        
        if (isHovered) {
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
    if (externalIsHovered === undefined) {
      setInternalIsHovered(true);
    }
  };

  const handleMouseLeave = () => {
    if (externalIsHovered === undefined) {
      setInternalIsHovered(false);
    }
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