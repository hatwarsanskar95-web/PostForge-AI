"use client";

import { motion } from "framer-motion";
import { forwardRef } from "react";

interface TimelineContentProps {
  children: React.ReactNode;
  animationNum: number;
  timelineRef?: any;
  customVariants?: any;
  className?: string;
  as?: any;
}

export const TimelineContent = forwardRef<HTMLDivElement, TimelineContentProps>(
  ({ children, animationNum, customVariants, className, as: Component = "div" }, ref) => {
    const MotionComponent = motion(Component as keyof React.JSX.IntrinsicElements) as any;
    
    return (
      <MotionComponent
        ref={ref}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        custom={animationNum}
        variants={customVariants}
        className={className}
      >
        {children}
      </MotionComponent>
    );
  }
);

TimelineContent.displayName = "TimelineContent";
