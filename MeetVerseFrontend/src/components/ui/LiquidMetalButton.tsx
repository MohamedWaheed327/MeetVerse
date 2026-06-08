import { liquidMetalFragmentShader, ShaderMount } from "@paper-design/shaders";
import type React from "react";
import { useEffect, useMemo, useRef, useState } from "react";

// Custom shader string that replaces the circle shape with a capsule shape.
// This supports wide/stretched buttons by dynamically adapting to the canvas aspect ratio.
const customLiquidMetalShader = liquidMetalFragmentShader
  .replace(
    "uniform bool u_isImage;",
    "uniform bool u_isImage;\nuniform float u_scale;\nuniform float u_offsetX;\nuniform float u_offsetY;"
  )
  .replace(
    /\s*else\s+if\s*\(\s*u_shape\s*<\s*2\.\s*\)\s*\{[\s\S]*?\}/,
    `else if (u_shape < 2.) {
      // capsule shape (replaces circle to support stretched/wide buttons)
      float ratio = v_responsiveBoxGivenSize.x / v_responsiveBoxGivenSize.y;
      vec2 graphicOffset = vec2(-u_offsetX, u_offsetY);
      vec2 respUV = (v_responsiveUV * u_scale - graphicOffset);
      if (ratio > 1.) {
        respUV.y /= ratio;
      } else {
        respUV.x *= ratio;
      }
      float w = 0.5;
      float h = 0.5 / ratio;
      float r = h;
      float d = max(0.0, w - r);
      float dist_from_segment = length(respUV - vec2(clamp(respUV.x, -d, d), 0.0));
      edge = pow(clamp(dist_from_segment / r, 0., 1.), 18.);
      uv = respUV;
      uv += .5;
      uv.y = 1. - uv.y;
    }`
  )
  .replace(
    `  vec3 color = vec3(0.);
  vec3 color1 = vec3(.98, 0.98, 1.);
  vec3 color2 = vec3(.1, .1, .1 + .1 * smoothstep(.7, 1.3, diagTLtoBR));`,
    `  vec3 color = vec3(0.);
  vec3 color1 = vec3(0.0);
  vec3 color2 = vec3(0.0);`
  )
  .replace(
    `  float colorDispersion = (1. - bump);`,
    `  vec3 cBlue = vec3(0.25, 0.55, 1.0);
  vec3 cIndigo = vec3(0.55, 0.45, 1.0);
  vec3 cViolet = vec3(0.75, 0.35, 1.0);
  vec3 themeGradient = mix(cBlue, cIndigo, smoothstep(0.0, 0.5, uv.x));
  themeGradient = mix(themeGradient, cViolet, smoothstep(0.5, 1.0, uv.x));
  color1 = mix(themeGradient * 1.5, vec3(1.0, 1.0, 1.0), 0.5 * bump);
  color2 = 0.15 * themeGradient;

  float colorDispersion = (1. - bump);`
  )
  .replace(
    `  color = vec3(r, g, b);
  color *= opacity;`,
    `  color = vec3(r, g, b);
  color = mix(color, themeGradient * 1.6, edge);
  color *= opacity;`
  );



interface LiquidMetalButtonProps {
  children?: React.ReactNode;
  onClick?: () => void;
  className?: string;
  size?: "sm" | "md" | "lg" | "xl" | "xxl";
  width?: number | "full";
  speed?: number;
  repetition?: number;
  softness?: number;
  shiftRed?: number;
  shiftBlue?: number;
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
}

export function LiquidMetalButton({
  children = "Click me",
  onClick,
  className = "",
  size = "md",
  width,
  speed = 0.6,
  repetition = 4,
  softness = 0.5,
  shiftRed = 0.3,
  shiftBlue = 0.3,
  type = "button",
  disabled = false,
}: LiquidMetalButtonProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const [ripples, setRipples] = useState<
    Array<{ x: number; y: number; id: number }>
  >([]);
  const shaderRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const shaderMountRef = useRef<any>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const rippleId = useRef(0);
  const currentSpeed = useRef(speed);

  const dimensions = useMemo(() => {
    let baseWidth = 148;
    let baseHeight = 46;
    let fontSize = 14;

    switch (size) {
      case "sm":
        baseWidth = 120;
        baseHeight = 40;
        fontSize = 13;
        break;
      case "lg":
        baseWidth = 180;
        baseHeight = 52;
        fontSize = 16;
        break;
      case "xl":
        baseWidth = 220;
        baseHeight = 52;
        fontSize = 16;
        break;
      case "xxl":
        baseWidth = 260;
        baseHeight = 52;
        fontSize = 16;
        break;
      case "md":
      default:
        baseWidth = 148;
        baseHeight = 46;
        fontSize = 14;
        break;
    }

    let finalWidth: string;
    let finalInnerWidth: string;
    let finalShaderWidth: string;

    if (width === "full") {
      finalWidth = "100%";
      finalInnerWidth = "calc(100% - 4px)";
      finalShaderWidth = "100%";
    } else if (typeof width === "number") {
      finalWidth = `${width}px`;
      finalInnerWidth = `${width - 4}px`;
      finalShaderWidth = `${width}px`;
    } else {
      finalWidth = `${baseWidth}px`;
      finalInnerWidth = `${baseWidth - 4}px`;
      finalShaderWidth = `${baseWidth}px`;
    }

    return {
      width: finalWidth,
      height: baseHeight,
      innerWidth: finalInnerWidth,
      innerHeight: baseHeight - 4,
      shaderWidth: finalShaderWidth,
      shaderHeight: baseHeight,
      fontSize,
    };
  }, [size, width]);

  useEffect(() => {
    const styleId = "shader-canvas-style-liquid-metal";
    if (!document.getElementById(styleId)) {
      const style = document.createElement("style");
      style.id = styleId;
      style.textContent = `
        .shader-container-lm canvas {
          width: 100% !important;
          height: 100% !important;
          display: block !important;
          position: absolute !important;
          top: 0 !important;
          left: 0 !important;
          border-radius: 100px !important;
        }
        @keyframes lm-ripple-animation {
          0% {
            transform: translate(-50%, -50%) scale(0);
            opacity: 0.6;
          }
          100% {
            transform: translate(-50%, -50%) scale(4);
            opacity: 0;
          }
        }
      `;
      document.head.appendChild(style);
    }

    const loadShader = async () => {
      try {
        if (shaderRef.current) {
          if (shaderMountRef.current?.dispose) {
            shaderMountRef.current.dispose();
          }

          shaderMountRef.current = new ShaderMount(
            shaderRef.current,
            customLiquidMetalShader,
            {
              u_repetition: repetition,
              u_softness: softness,
              u_shiftRed: shiftRed,
              u_shiftBlue: shiftBlue,
              u_distortion: 0,
              u_contour: 0,
              u_angle: 45,
              u_scale: 8,
              u_shape: 1,
              u_offsetX: 0.1,
              u_offsetY: -0.1,
            },
            undefined,
            speed,
          );
        }
      } catch (error) {
        console.error("Failed to load liquid metal shader:", error);
      }
    };

    loadShader();

    return () => {
      if (shaderMountRef.current?.dispose) {
        shaderMountRef.current.dispose();
        shaderMountRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Custom ResizeObserver to manually force handleResize on mount when layout/dimensions change
  useEffect(() => {
    if (!shaderRef.current) return;

    const observer = new ResizeObserver(([entry]) => {
      const mount = shaderMountRef.current as any;
      if (mount && entry) {
        // Fallback to contentRect if devicePixelContentBoxSize or borderBoxSize is unavailable
        let w = entry.contentRect.width;
        let h = entry.contentRect.height;

        if (entry.borderBoxSize?.[0]) {
          w = entry.borderBoxSize[0].inlineSize;
          h = entry.borderBoxSize[0].blockSize;
        }

        mount.parentWidth = w;
        mount.parentHeight = h;

        if (entry.devicePixelContentBoxSize?.[0]) {
          mount.devicePixelsSupported = true;
          mount.parentDevicePixelWidth = entry.devicePixelContentBoxSize[0].inlineSize;
          mount.parentDevicePixelHeight = entry.devicePixelContentBoxSize[0].blockSize;
        } else {
          mount.devicePixelsSupported = false;
        }

        mount.handleResize?.();
      }
    });

    observer.observe(shaderRef.current);
    return () => observer.disconnect();
  }, []);

  const handleMouseEnter = () => {
    if (disabled) return;
    setIsHovered(true);
    shaderMountRef.current?.setSpeed?.(1);
  };

  const handleMouseLeave = () => {
    if (disabled) return;
    setIsHovered(false);
    setIsPressed(false);
    shaderMountRef.current?.setSpeed?.(speed);
  };

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled) {
      e.preventDefault();
      return;
    }
    if (shaderMountRef.current?.setSpeed) {
      shaderMountRef.current.setSpeed(2.4);
      setTimeout(() => {
        if (currentSpeed.current !== speed) {
          shaderMountRef.current?.setSpeed?.(1);
        } else {
          shaderMountRef.current?.setSpeed?.(speed);
        }
      }, 300);
    }

    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const ripple = { x, y, id: rippleId.current++ };

      setRipples((prev) => [...prev, ripple]);
      setTimeout(() => {
        setRipples((prev) => prev.filter((r) => r.id !== ripple.id));
      }, 600);
    }

    onClick?.();
  };

  return (
    <div 
      className={`relative ${width === "full" ? "block w-full" : "inline-block"} ${className} ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
      style={width === "full" ? { width: "100%" } : {}}
    >
      <div
        style={{
          perspective: "1000px",
          perspectiveOrigin: "50% 50%",
          width: width === "full" ? "100%" : "auto",
        }}
      >
        <div
          style={{
            position: "relative",
            width: dimensions.width,
            height: `${dimensions.height}px`,
            transformStyle: "preserve-3d",
            transition:
              "all 0.8s cubic-bezier(0.34, 1.56, 0.64, 1), width 0.4s ease, height 0.4s ease",
            transform: "none",
          }}
        >
          {/* Floating text layer */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: dimensions.width,
              height: `${dimensions.height}px`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
              transformStyle: "preserve-3d",
              transition:
                "all 0.8s cubic-bezier(0.34, 1.56, 0.64, 1), width 0.4s ease, height 0.4s ease, gap 0.4s ease",
              transform: "translateZ(20px)",
              zIndex: 30,
              pointerEvents: "none",
            }}
          >
            <span
              style={{
                fontSize: `${dimensions.fontSize}px`,
                color: "#999999",
                fontWeight: 500,
                textShadow: "0px 1px 2px rgba(0, 0, 0, 0.5)",
                transition: "all 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)",
                transform: "scale(1)",
                whiteSpace: "nowrap",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
              }}
            >
              {children}
            </span>
          </div>

          {/* Dark inner fill layer */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: dimensions.width,
              height: `${dimensions.height}px`,
              transformStyle: "preserve-3d",
              transition:
                "all 0.8s cubic-bezier(0.34, 1.56, 0.64, 1), width 0.4s ease, height 0.4s ease",
              transform: `translateZ(10px) ${isPressed ? "translateY(1px) scale(0.98)" : "translateY(0) scale(1)"}`,
              zIndex: 20,
            }}
          >
            <div
              style={{
                width: dimensions.innerWidth,
                height: `${dimensions.innerHeight}px`,
                margin: "2px",
                borderRadius: "100px",
                background:
                  "linear-gradient(180deg, #202020 0%, #000000 100%)",
                boxShadow: isPressed
                  ? "inset 0px 2px 4px rgba(0, 0, 0, 0.4), inset 0px 1px 2px rgba(0, 0, 0, 0.3)"
                  : "none",
                transition:
                  "all 0.8s cubic-bezier(0.34, 1.56, 0.64, 1), width 0.4s ease, height 0.4s ease, box-shadow 0.15s cubic-bezier(0.4, 0, 0.2, 1)",
              }}
            />
          </div>

          {/* Shader layer (the liquid metal chrome) */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: dimensions.width,
              height: `${dimensions.height}px`,
              transformStyle: "preserve-3d",
              transition:
                "all 0.8s cubic-bezier(0.34, 1.56, 0.64, 1), width 0.4s ease, height 0.4s ease",
              transform: `translateZ(0px) ${isPressed ? "translateY(1px) scale(0.98)" : "translateY(0) scale(1)"}`,
              zIndex: 10,
            }}
          >
            <div
              style={{
                height: `${dimensions.height}px`,
                width: dimensions.width,
                borderRadius: "100px",
                boxShadow: isPressed
                  ? "0px 0px 0px 1px rgba(0, 0, 0, 0.5), 0px 1px 2px 0px rgba(0, 0, 0, 0.3)"
                  : isHovered
                    ? "0px 0px 0px 1px rgba(0, 0, 0, 0.4), 0px 12px 6px 0px rgba(0, 0, 0, 0.05), 0px 8px 5px 0px rgba(0, 0, 0, 0.1), 0px 4px 4px 0px rgba(0, 0, 0, 0.15), 0px 1px 2px 0px rgba(0, 0, 0, 0.2)"
                    : "0px 0px 0px 1px rgba(0, 0, 0, 0.3), 0px 36px 14px 0px rgba(0, 0, 0, 0.02), 0px 20px 12px 0px rgba(0, 0, 0, 0.08), 0px 9px 9px 0px rgba(0, 0, 0, 0.12), 0px 2px 5px 0px rgba(0, 0, 0, 0.15)",
                transition:
                  "all 0.8s cubic-bezier(0.34, 1.56, 0.64, 1), width 0.4s ease, height 0.4s ease, box-shadow 0.15s cubic-bezier(0.4, 0, 0.2, 1)",
                background: "rgb(0 0 0 / 0)",
              }}
            >
              <div
                ref={shaderRef}
                className="shader-container-lm"
                style={{
                  borderRadius: "100px",
                  overflow: "hidden",
                  position: "relative",
                  width: dimensions.shaderWidth,
                  maxWidth: dimensions.shaderWidth,
                  height: `${dimensions.shaderHeight}px`,
                  transition: "width 0.4s ease, height 0.4s ease",
                }}
              />
            </div>
          </div>

          {/* Invisible click target */}
          <button
            type={type}
            disabled={disabled}
            ref={buttonRef}
            onClick={handleClick}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            onMouseDown={() => !disabled && setIsPressed(true)}
            onMouseUp={() => !disabled && setIsPressed(false)}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: dimensions.width,
              height: `${dimensions.height}px`,
              background: "transparent",
              border: "none",
              cursor: disabled ? "not-allowed" : "pointer",
              outline: "none",
              zIndex: 40,
              transformStyle: "preserve-3d",
              transform: "translateZ(25px)",
              transition:
                "all 0.8s cubic-bezier(0.34, 1.56, 0.64, 1), width 0.4s ease, height 0.4s ease",
              overflow: "hidden",
              borderRadius: "100px",
            }}
            aria-label={typeof children === "string" ? children : "button"}
          >
            {ripples.map((ripple) => (
              <span
                key={ripple.id}
                style={{
                  position: "absolute",
                  left: `${ripple.x}px`,
                  top: `${ripple.y}px`,
                  width: "20px",
                  height: "20px",
                  borderRadius: "50%",
                  background:
                    "radial-gradient(circle, rgba(255, 255, 255, 0.4) 0%, rgba(255, 255, 255, 0) 70%)",
                  pointerEvents: "none",
                  animation: "lm-ripple-animation 0.6s ease-out",
                }}
              />
            ))}
          </button>
        </div>
      </div>
    </div>
  );
}
