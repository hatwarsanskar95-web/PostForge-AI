"use client";

import { useState, useEffect, useRef } from "react";
import { ArrowRight, Zap, Sparkles, PenTool, Briefcase, Award, Image as ImageIcon, FileUser } from "lucide-react";

const iconMap: Record<string, React.ElementType> = {
  pentool: PenTool,
  briefcase: Briefcase,
  award: Award,
  imageicon: ImageIcon,
  fileuser: FileUser,
  sparkles: Sparkles,
};
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useRouter } from "next/navigation";

export interface TimelineItem {
  id: number;
  title: string;
  date: string;
  content: string;
  category: string;
  icon: string;
  relatedIds: number[];
  status: "completed" | "in-progress" | "pending";
  energy: number;
  route: string;
}

interface RadialOrbitalTimelineProps {
  timelineData: TimelineItem[];
}

export default function RadialOrbitalTimeline({
  timelineData,
}: RadialOrbitalTimelineProps) {
  const router = useRouter();
  const [expandedItems, setExpandedItems] = useState<Record<number, boolean>>({});
  const [viewMode] = useState<"orbital">("orbital");
  const [rotationAngle, setRotationAngle] = useState<number>(0);
  const [autoRotate, setAutoRotate] = useState<boolean>(true);
  const [pulseEffect, setPulseEffect] = useState<Record<number, boolean>>({});
  const [centerOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [activeNodeId, setActiveNodeId] = useState<number | null>(null);


  const containerRef = useRef<HTMLDivElement>(null);
  const orbitRef = useRef<HTMLDivElement>(null);
  const nodeRefs = useRef<Record<number, HTMLDivElement | null>>({});

  const handleContainerClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === containerRef.current || e.target === orbitRef.current) {
      setExpandedItems({});
      setActiveNodeId(null);
      setPulseEffect({});
      setAutoRotate(true);
    }
  };

  const toggleItem = (id: number) => {
    setExpandedItems((prev) => {
      const newState = { ...prev };
      Object.keys(newState).forEach((key) => {
        if (parseInt(key) !== id) {
          newState[parseInt(key)] = false;
        }
      });

      newState[id] = !prev[id];

      if (!prev[id]) {
        setActiveNodeId(id);
        setAutoRotate(false);

        const relatedItems = getRelatedItems(id);
        const newPulseEffect: Record<number, boolean> = {};
        relatedItems.forEach((relId) => {
          newPulseEffect[relId] = true;
        });
        setPulseEffect(newPulseEffect);

        centerViewOnNode(id);
      } else {
        setActiveNodeId(null);
        setAutoRotate(true);
        setPulseEffect({});
      }

      return newState;
    });
  };

  // 15-second rotation speed
  // 15 seconds = 15000ms. If we run at 16ms intervals (approx 60fps), we need 360 / (15000 / 16) = 0.384 degrees per tick.
  useEffect(() => {
    let rotationTimer: NodeJS.Timeout;

    if (autoRotate && viewMode === "orbital") {
      rotationTimer = setInterval(() => {
        setRotationAngle((prev) => {
          const newAngle = (prev + 0.384) % 360;
          return Number(newAngle.toFixed(3));
        });
      }, 16);
    }

    return () => {
      if (rotationTimer) {
        clearInterval(rotationTimer);
      }
    };
  }, [autoRotate, viewMode]);

  const centerViewOnNode = (nodeId: number) => {
    if (viewMode !== "orbital" || !nodeRefs.current[nodeId]) return;

    const nodeIndex = timelineData.findIndex((item) => item.id === nodeId);
    const totalNodes = timelineData.length;
    const targetAngle = (nodeIndex / totalNodes) * 360;

    // Rotate so that the active node aligns at the top (270 degrees)
    setRotationAngle(270 - targetAngle);
  };

  const calculateNodePosition = (index: number, total: number) => {
    const angle = ((index / total) * 360 + rotationAngle) % 360;
    const radius = 220; // Slightly larger radius for readability
    const radian = (angle * Math.PI) / 180;

    const x = Number((radius * Math.cos(radian)).toFixed(3));
    const y = Number((radius * Math.sin(radian)).toFixed(3));

    const zIndex = Math.round(100 + 50 * Math.cos(radian));
    const opacity = Number(Math.max(
      0.5,
      Math.min(1, 0.4 + 0.6 * ((1 + Math.sin(radian)) / 2))
    ).toFixed(3));

    return { x, y, angle: Number(angle.toFixed(3)), zIndex, opacity };
  };

  const getRelatedItems = (itemId: number): number[] => {
    const currentItem = timelineData.find((item) => item.id === itemId);
    return currentItem ? currentItem.relatedIds : [];
  };

  const isRelatedToActive = (itemId: number): boolean => {
    if (!activeNodeId) return false;
    const relatedItems = getRelatedItems(activeNodeId);
    return relatedItems.includes(itemId);
  };

  const getStatusStyles = (status: TimelineItem["status"]): string => {
    switch (status) {
      case "completed":
        return "text-white bg-blue-600 border-blue-500";
      case "in-progress":
        return "text-black bg-white border-black";
      case "pending":
        return "text-white bg-zinc-800 border-zinc-700";
      default:
        return "text-white bg-zinc-800 border-zinc-700";
    }
  };

  const handleNodeClick = (item: TimelineItem) => {
    // Toggle expansion/centering, no auto-redirect
    toggleItem(item.id);
  };

  return (
    <div
      className="w-full min-h-[500px] h-[70vh] flex flex-col items-center justify-center bg-black overflow-hidden relative rounded-2xl border border-white/5 select-none"
      ref={containerRef}
      onClick={handleContainerClick}
    >
      <div className="absolute top-6 left-6 z-10 text-left">
        <h3 className="text-white font-bold text-lg">LinkedIn Creator Suite</h3>
        <p className="text-white/40 text-xs mt-1">Select a node or let it rotate. Redirects automatically on click.</p>
      </div>

      <div className="relative w-full max-w-4xl h-full flex items-center justify-center">
        <div
          className="absolute w-full h-full flex items-center justify-center"
          ref={orbitRef}
          style={{
            perspective: "1000px",
            transform: `translate(${centerOffset.x}px, ${centerOffset.y}px)`,
          }}
        >
          {/* Centered Pulse Orbit */}
          <div className="absolute w-20 h-20 rounded-full bg-gradient-to-br from-blue-600 via-purple-600 to-pink-500 animate-pulse flex items-center justify-center z-10">
            <div className="absolute w-24 h-24 rounded-full border border-blue-500/30 animate-ping opacity-70"></div>
            <div
              className="absolute w-28 h-28 rounded-full border border-purple-500/20 animate-ping opacity-50"
              style={{ animationDelay: "0.5s" }}
            ></div>
            <div className="w-10 h-10 rounded-full bg-black/80 flex items-center justify-center border border-white/10 shadow-lg shadow-purple-500/25">
              <Sparkles size={16} className="text-blue-400 animate-pulse" />
            </div>
          </div>

          {/* Orbit Line Ring */}
          <div className="absolute w-[440px] h-[440px] rounded-full border border-white/5 pointer-events-none"></div>

          {/* Spoke Lines */}
          {timelineData.map((item, index) => {
            const position = calculateNodePosition(index, timelineData.length);
            return (
              <div
                key={`spoke-${item.id}`}
                className="absolute top-1/2 left-1/2 h-px bg-white/5 origin-left pointer-events-none z-0"
                style={{
                  width: '220px',
                  transform: `rotate(${position.angle}deg)`,
                }}
                suppressHydrationWarning
              />
            );
          })}

          {timelineData.map((item, index) => {
            const position = calculateNodePosition(index, timelineData.length);
            const isExpanded = expandedItems[item.id];
            const isRelated = isRelatedToActive(item.id);
            const isPulsing = pulseEffect[item.id];
            const Icon = iconMap[item.icon] || Sparkles;

            const nodeStyle = {
              top: "50%",
              left: "50%",
              transform: `translate(calc(-50% + ${position.x}px), calc(-50% + ${position.y}px))`,
              zIndex: isExpanded ? 200 : position.zIndex,
              opacity: isExpanded ? 1 : position.opacity,
            };

            return (
              <div
                key={item.id}
                ref={(el) => { nodeRefs.current[item.id] = el; }}
                className="absolute transition-all duration-700 cursor-pointer flex flex-col items-center"
                style={nodeStyle}
                onClick={(e) => {
                  e.stopPropagation();
                  handleNodeClick(item);
                }}
                suppressHydrationWarning
              >
                {/* Glow ring under node */}
                <div
                  className={`absolute rounded-full -inset-2 transition-all ${
                    isPulsing ? "animate-pulse" : ""
                  }`}
                  style={{
                    background: `radial-gradient(circle, rgba(59,130,246,0.15) 0%, rgba(0,0,0,0) 70%)`,
                    width: `${item.energy * 0.5 + 48}px`,
                    height: `${item.energy * 0.5 + 48}px`,
                    left: `-${(item.energy * 0.5 + 48 - 40) / 2}px`,
                    top: `-${(item.energy * 0.5 + 48 - 40) / 2}px`,
                  }}
                ></div>

                {/* Node Icon Circle */}
                <div
                  className={`
                  w-12 h-12 rounded-full flex items-center justify-center
                  ${
                    isExpanded
                      ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white"
                      : isRelated
                      ? "bg-blue-950 text-blue-300"
                      : "bg-zinc-950 text-white/80 hover:text-white border border-white/10 hover:border-white/30"
                  }
                  border-2 
                  ${
                    isExpanded
                      ? "border-white shadow-xl shadow-blue-500/20"
                      : isRelated
                      ? "border-blue-500 animate-pulse"
                      : "border-white/10"
                  }
                  transition-all duration-300 transform hover:scale-110
                  ${isExpanded ? "scale-125" : ""}
                `}
                >
                  <Icon size={18} />
                </div>

                {/* Title below node */}
                <div
                  className={`
                  absolute top-14 whitespace-nowrap
                  text-[10px] tracking-wider uppercase
                  transition-all duration-300
                  ${isExpanded ? "text-blue-400 scale-110 font-bold" : "text-white font-bold"}
                `}
                >
                  {item.title}
                </div>

                {/* Expanded Details Card */}
                {isExpanded && (
                  <Card className="absolute top-24 left-1/2 -translate-x-1/2 w-64 bg-zinc-950/90 backdrop-blur-lg border-white/10 shadow-2xl shadow-blue-500/10 overflow-visible z-50">
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-px h-3 bg-white/20"></div>
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-center">
                        <Badge
                          className={`px-2 py-0.5 text-[9px] ${getStatusStyles(
                            item.status
                          )}`}
                        >
                          {item.status.toUpperCase()}
                        </Badge>
                        <span className="text-[10px] font-mono text-white/40">
                          {item.date}
                        </span>
                      </div>
                      <CardTitle className="text-sm mt-2 text-white font-bold">
                        {item.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="text-[11px] text-white/70">
                      <p>{item.content}</p>

                      <div className="mt-3 pt-3 border-t border-white/5">
                        <div className="flex justify-between items-center mb-1">
                          <span className="flex items-center text-white/50 text-[10px]">
                            <Zap size={10} className="mr-1 text-yellow-400" />
                            Activity Index
                          </span>
                          <span className="font-mono text-white/90 text-[10px]">{item.energy}%</span>
                        </div>
                        <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
                            style={{ width: `${item.energy}%` }}
                          ></div>
                        </div>
                      </div>

                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(item.route);
                        }}
                        className="w-full mt-4 h-8 bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5"
                      >
                        Launch Generator
                        <ArrowRight size={12} />
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
