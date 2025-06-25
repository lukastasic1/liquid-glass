import {
  type CSSProperties,
  forwardRef,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from 'react';
import {
  ShaderDisplacementGenerator,
  fragmentShaders,
} from './shader-utils.tsx';
import {
  displacementMap,
  polarDisplacementMap,
  prominentDisplacementMap,
} from './utils.tsx';

// Generate shader-based displacement map using shaderUtils
const generateShaderDisplacementMap = (
  width: number,
  height: number,
): string => {
  const generator = new ShaderDisplacementGenerator({
    fragment: fragmentShaders.liquidGlass,
    height,
    width,
  });

  const dataUrl = generator.updateShader();
  generator.destroy();

  return dataUrl;
};

const getMap = (
  mode: 'standard' | 'polar' | 'prominent' | 'shader',
  shaderMapUrl?: string,
) => {
  switch (mode) {
    case 'standard':
      return displacementMap;
    case 'polar':
      return polarDisplacementMap;
    case 'prominent':
      return prominentDisplacementMap;
    case 'shader':
      return shaderMapUrl || displacementMap;
    default:
      throw new Error(`Invalid mode: ${mode}`);
  }
};

/* ---------- SVG filter (edge-only displacement) ---------- */
const GlassFilter: React.FC<{
  aberrationIntensity: number;
  displacementScale: number;
  id: string;
  mode: 'standard' | 'polar' | 'prominent' | 'shader';
  shaderMapUrl?: string;
}> = ({ aberrationIntensity, displacementScale, id, mode, shaderMapUrl }) => (
  <svg
    aria-hidden="true"
    height="100%"
    style={{ position: 'absolute' }}
    width="100%"
  >
    <defs>
      <radialGradient cx="50%" cy="50%" id={`${id}-edge-mask`} r="50%">
        <stop offset="0%" stopColor="black" stopOpacity="0" />
        <stop
          offset={`${Math.max(30, 80 - aberrationIntensity * 2)}%`}
          stopColor="black"
          stopOpacity="0"
        />
        <stop offset="100%" stopColor="white" stopOpacity="1" />
      </radialGradient>
      <filter
        colorInterpolationFilters="sRGB"
        height="170%"
        id={id}
        width="170%"
        x="-35%"
        y="-35%"
      >
        <feImage
          height="100%"
          href={getMap(mode, shaderMapUrl)}
          id="feimage"
          preserveAspectRatio="xMidYMid slice"
          result="DISPLACEMENT_MAP"
          width="100%"
          x="0"
          y="0"
        />

        {/* Create edge mask using the displacement map itself */}
        <feColorMatrix
          in="DISPLACEMENT_MAP"
          result="EDGE_INTENSITY"
          type="matrix"
          values="0.3 0.3 0.3 0 0
                 0.3 0.3 0.3 0 0
                 0.3 0.3 0.3 0 0
                 0 0 0 1 0"
        />
        <feComponentTransfer in="EDGE_INTENSITY" result="EDGE_MASK">
          <feFuncA
            tableValues={`0 ${aberrationIntensity * 0.05} 1`}
            type="discrete"
          />
        </feComponentTransfer>

        {/* Original undisplaced image for center */}
        <feOffset dx="0" dy="0" in="SourceGraphic" result="CENTER_ORIGINAL" />

        {/* Red channel displacement with slight offset */}
        <feDisplacementMap
          in="SourceGraphic"
          in2="DISPLACEMENT_MAP"
          result="RED_DISPLACED"
          scale={displacementScale * (mode === 'shader' ? 1 : -1)}
          xChannelSelector="R"
          yChannelSelector="B"
        />
        <feColorMatrix
          in="RED_DISPLACED"
          result="RED_CHANNEL"
          type="matrix"
          values="1 0 0 0 0
                 0 0 0 0 0
                 0 0 0 0 0
                 0 0 0 1 0"
        />

        {/* Green channel displacement */}
        <feDisplacementMap
          in="SourceGraphic"
          in2="DISPLACEMENT_MAP"
          result="GREEN_DISPLACED"
          scale={
            displacementScale *
            ((mode === 'shader' ? 1 : -1) - aberrationIntensity * 0.05)
          }
          xChannelSelector="R"
          yChannelSelector="B"
        />
        <feColorMatrix
          in="GREEN_DISPLACED"
          result="GREEN_CHANNEL"
          type="matrix"
          values="0 0 0 0 0
                 0 1 0 0 0
                 0 0 0 0 0
                 0 0 0 1 0"
        />

        {/* Blue channel displacement with slight offset */}
        <feDisplacementMap
          in="SourceGraphic"
          in2="DISPLACEMENT_MAP"
          result="BLUE_DISPLACED"
          scale={
            displacementScale *
            ((mode === 'shader' ? 1 : -1) - aberrationIntensity * 0.1)
          }
          xChannelSelector="R"
          yChannelSelector="B"
        />
        <feColorMatrix
          in="BLUE_DISPLACED"
          result="BLUE_CHANNEL"
          type="matrix"
          values="0 0 0 0 0
                 0 0 0 0 0
                 0 0 1 0 0
                 0 0 0 1 0"
        />

        {/* Combine all channels with screen blend mode for chromatic aberration */}
        <feBlend
          in="GREEN_CHANNEL"
          in2="BLUE_CHANNEL"
          mode="screen"
          result="GB_COMBINED"
        />
        <feBlend
          in="RED_CHANNEL"
          in2="GB_COMBINED"
          mode="screen"
          result="RGB_COMBINED"
        />

        {/* Add slight blur to soften the aberration effect */}
        <feGaussianBlur
          in="RGB_COMBINED"
          result="ABERRATED_BLURRED"
          stdDeviation={Math.max(0.1, 0.5 - aberrationIntensity * 0.1)}
        />

        {/* Apply edge mask to aberration effect */}
        <feComposite
          in="ABERRATED_BLURRED"
          in2="EDGE_MASK"
          operator="in"
          result="EDGE_ABERRATION"
        />

        {/* Create inverted mask for center */}
        <feComponentTransfer in="EDGE_MASK" result="INVERTED_MASK">
          <feFuncA tableValues="1 0" type="table" />
        </feComponentTransfer>
        <feComposite
          in="CENTER_ORIGINAL"
          in2="INVERTED_MASK"
          operator="in"
          result="CENTER_CLEAN"
        />

        {/* Combine edge aberration with clean center */}
        <feComposite in="EDGE_ABERRATION" in2="CENTER_CLEAN" operator="over" />
      </filter>
    </defs>
  </svg>
);

/* ---------- container ---------- */
const GlassContainer = forwardRef<
  HTMLDivElement,
  React.PropsWithChildren<{
    aberrationIntensity?: number;
    blurAmount?: number;
    className?: string;
    cornerRadius?: number;
    displacementScale?: number;
    glassSize?: { height: number; width: number };
    mode?: 'standard' | 'polar' | 'prominent' | 'shader';
    mouseOffset?: { x: number; y: number };
    onClick?: () => void;
    onMouseDown?: () => void;
    onMouseEnter?: () => void;
    onMouseLeave?: () => void;
    onMouseUp?: () => void;
    overLight?: boolean;
    padding?: string;
    saturation?: number;
    style?: React.CSSProperties;
  }>
>(
  (
    {
      aberrationIntensity = 2,
      blurAmount = 12,
      children,
      className = '',
      cornerRadius = 999,
      displacementScale = 25,
      glassSize = { height: 69, width: 270 },
      mode = 'standard',
      onClick,
      onMouseDown,
      onMouseEnter,
      onMouseLeave,
      onMouseUp,
      overLight = false,
      padding = '24px 32px',
      saturation = 180,
      style,
    },
    ref,
  ) => {
    const filterId = useId();
    const [shaderMapUrl, setShaderMapUrl] = useState<string>('');

    const isFirefox = navigator.userAgent.toLowerCase().includes('firefox');

    // Generate shader displacement map when in shader mode
    useEffect(() => {
      if (mode === 'shader') {
        const url = generateShaderDisplacementMap(
          glassSize.width,
          glassSize.height,
        );
        setShaderMapUrl(url);
      }
    }, [mode, glassSize.width, glassSize.height]);

    const backdropStyle = {
      backdropFilter: `blur(${(overLight ? 12 : 4) + blurAmount * 32}px) saturate(${saturation}%)`,
      filter: isFirefox ? null : `url(#${filterId})`,
    };

    return (
      <div
        className={className}
        onClick={onClick}
        ref={ref}
        style={{
          position: 'relative',
          ...(onClick ? { cursor: 'pointer' } : null),
          ...style,
        }}
      >
        <GlassFilter
          aberrationIntensity={aberrationIntensity}
          displacementScale={displacementScale}
          id={filterId}
          mode={mode}
          shaderMapUrl={shaderMapUrl}
        />

        <div
          onMouseDown={onMouseDown}
          onMouseEnter={onMouseEnter}
          onMouseLeave={onMouseLeave}
          onMouseUp={onMouseUp}
          style={{
            alignItems: 'center',
            borderRadius: `${cornerRadius}px`,
            boxShadow: overLight
              ? '0px 16px 70px rgba(0, 0, 0, 0.75)'
              : '0px 12px 40px rgba(0, 0, 0, 0.25)',
            display: 'inline-flex',
            gap: '24px',
            overflow: 'hidden',
            padding,
            position: 'relative',
            transition: 'all 0.2s ease-in-out',
          }}
        >
          {/* backdrop layer that gets wiggly */}
          <span
            style={
              {
                ...backdropStyle,
                borderRadius: `${cornerRadius}px`,
                inset: '0',
                overflow: 'hidden',
                position: 'absolute',
              } as CSSProperties
            }
          />

          {/* user content stays sharp */}
          <div
            style={{
              color: overLight ? '#000' : '#fff',
              font: '500 20px/1 system-ui',
              position: 'relative',
              textShadow: overLight
                ? '0px 2px 12px rgba(0, 0, 0, 0)'
                : '0px 2px 12px rgba(0, 0, 0, 0.4)',
              transition: 'all 150ms ease-in-out',
              zIndex: 1,
            }}
          >
            {children}
          </div>
        </div>
      </div>
    );
  },
);

GlassContainer.displayName = 'GlassContainer';

export type LiquidGlassProps = {
  aberrationIntensity?: number;
  blurAmount?: number;
  children: React.ReactNode;
  className?: string;
  cornerRadius?: number;
  displacementScale?: number;
  elasticity?: number;
  globalMousePos?: { x: number; y: number };
  mode?: 'standard' | 'polar' | 'prominent' | 'shader';
  mouseContainer?: React.RefObject<HTMLElement | null> | null;
  mouseOffset?: { x: number; y: number };
  onClick?: () => void;
  overLight?: boolean;
  padding?: string;
  saturation?: number;
  style?: React.CSSProperties;
};

export default function LiquidGlass({
  aberrationIntensity = 2,
  blurAmount = 0.0625,
  children,
  className = '',
  cornerRadius = 999,
  displacementScale = 70,
  elasticity = 0.15,
  globalMousePos: externalGlobalMousePos,
  mode = 'standard',
  mouseContainer = null,
  mouseOffset: externalMouseOffset,
  onClick,
  overLight = false,
  padding = '24px 32px',
  saturation = 140,
  style = {},
}: LiquidGlassProps) {
  const glassRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [glassSize, setGlassSize] = useState({ height: 69, width: 270 });
  const [internalGlobalMousePos, setInternalGlobalMousePos] = useState({
    x: 0,
    y: 0,
  });
  const [internalMouseOffset, setInternalMouseOffset] = useState({
    x: 0,
    y: 0,
  });

  // Use external mouse position if provided, otherwise use internal
  const globalMousePos = externalGlobalMousePos || internalGlobalMousePos;
  const mouseOffset = externalMouseOffset || internalMouseOffset;

  // Internal mouse tracking
  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      const container = mouseContainer?.current || glassRef.current;
      if (!container) {
        return;
      }

      const rect = container.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      setInternalMouseOffset({
        x: ((e.clientX - centerX) / rect.width) * 100,
        y: ((e.clientY - centerY) / rect.height) * 100,
      });

      setInternalGlobalMousePos({
        x: e.clientX,
        y: e.clientY,
      });
    },
    [mouseContainer],
  );

  // Set up mouse tracking if no external mouse position is provided
  useEffect(() => {
    if (externalGlobalMousePos && externalMouseOffset) {
      // External mouse tracking is provided, don't set up internal tracking
      return;
    }

    const container = mouseContainer?.current || glassRef.current;
    if (!container) {
      return;
    }

    container.addEventListener('mousemove', handleMouseMove);

    return () => {
      container.removeEventListener('mousemove', handleMouseMove);
    };
  }, [
    handleMouseMove,
    mouseContainer,
    externalGlobalMousePos,
    externalMouseOffset,
  ]);

  // Calculate directional scaling based on mouse position
  const calculateDirectionalScale = useCallback(() => {
    if (!globalMousePos.x || !globalMousePos.y || !glassRef.current) {
      return 'scale(1)';
    }

    const rect = glassRef.current.getBoundingClientRect();
    const pillCenterX = rect.left + rect.width / 2;
    const pillCenterY = rect.top + rect.height / 2;
    const pillWidth = glassSize.width;
    const pillHeight = glassSize.height;

    const deltaX = globalMousePos.x - pillCenterX;
    const deltaY = globalMousePos.y - pillCenterY;

    // Calculate distance from mouse to pill edges (not center)
    const edgeDistanceX = Math.max(0, Math.abs(deltaX) - pillWidth / 2);
    const edgeDistanceY = Math.max(0, Math.abs(deltaY) - pillHeight / 2);
    const edgeDistance = Math.sqrt(
      edgeDistanceX * edgeDistanceX + edgeDistanceY * edgeDistanceY,
    );

    // Activation zone: 200px from edges
    const activationZone = 200;

    // If outside activation zone, no effect
    if (edgeDistance > activationZone) {
      return 'scale(1)';
    }

    // Calculate fade-in factor (1 at edge, 0 at activation zone boundary)
    const fadeInFactor = 1 - edgeDistance / activationZone;

    // Normalize the deltas for direction
    const centerDistance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    if (centerDistance === 0) {
      return 'scale(1)';
    }

    const normalizedX = deltaX / centerDistance;
    const normalizedY = deltaY / centerDistance;

    // Calculate stretch factors with fade-in
    const stretchIntensity =
      Math.min(centerDistance / 300, 1) * elasticity * fadeInFactor;

    // X-axis scaling: stretch horizontally when moving left/right, compress when moving up/down
    const scaleX =
      1 +
      Math.abs(normalizedX) * stretchIntensity * 0.3 -
      Math.abs(normalizedY) * stretchIntensity * 0.15;

    // Y-axis scaling: stretch vertically when moving up/down, compress when moving left/right
    const scaleY =
      1 +
      Math.abs(normalizedY) * stretchIntensity * 0.3 -
      Math.abs(normalizedX) * stretchIntensity * 0.15;

    return `scaleX(${Math.max(0.8, scaleX)}) scaleY(${Math.max(0.8, scaleY)})`;
  }, [globalMousePos, elasticity, glassSize]);

  // Helper function to calculate fade-in factor based on distance from element edges
  const calculateFadeInFactor = useCallback(() => {
    if (!globalMousePos.x || !globalMousePos.y || !glassRef.current) {
      return 0;
    }

    const rect = glassRef.current.getBoundingClientRect();
    const pillCenterX = rect.left + rect.width / 2;
    const pillCenterY = rect.top + rect.height / 2;
    const pillWidth = glassSize.width;
    const pillHeight = glassSize.height;

    const edgeDistanceX = Math.max(
      0,
      Math.abs(globalMousePos.x - pillCenterX) - pillWidth / 2,
    );
    const edgeDistanceY = Math.max(
      0,
      Math.abs(globalMousePos.y - pillCenterY) - pillHeight / 2,
    );
    const edgeDistance = Math.sqrt(
      edgeDistanceX * edgeDistanceX + edgeDistanceY * edgeDistanceY,
    );

    const activationZone = 200;
    return edgeDistance > activationZone
      ? 0
      : 1 - edgeDistance / activationZone;
  }, [globalMousePos, glassSize]);

  // Helper function to calculate elastic translation
  const calculateElasticTranslation = useCallback(() => {
    if (!glassRef.current) {
      return { x: 0, y: 0 };
    }

    const fadeInFactor = calculateFadeInFactor();
    const rect = glassRef.current.getBoundingClientRect();
    const pillCenterX = rect.left + rect.width / 2;
    const pillCenterY = rect.top + rect.height / 2;

    return {
      x: (globalMousePos.x - pillCenterX) * elasticity * 0.1 * fadeInFactor,
      y: (globalMousePos.y - pillCenterY) * elasticity * 0.1 * fadeInFactor,
    };
  }, [globalMousePos, elasticity, calculateFadeInFactor]);

  // Update glass size whenever component mounts or window resizes
  useEffect(() => {
    const updateGlassSize = () => {
      if (glassRef.current) {
        const rect = glassRef.current.getBoundingClientRect();
        setGlassSize({ height: rect.height, width: rect.width });
      }
    };

    updateGlassSize();
    window.addEventListener('resize', updateGlassSize);
    return () => window.removeEventListener('resize', updateGlassSize);
  }, []);

  const transformStyle = `translate(calc(-50% + ${calculateElasticTranslation().x}px), calc(-50% + ${calculateElasticTranslation().y}px)) ${isActive && Boolean(onClick) ? 'scale(0.96)' : calculateDirectionalScale()}`;

  const baseStyle = {
    ...style,
    transform: transformStyle,
    transition: 'all ease-out 0.2s',
  };

  const positionStyles = {
    left: baseStyle.left || '50%',
    position: baseStyle.position || 'relative',
    top: baseStyle.top || '50%',
  };

  return (
    <div style={{ position: 'relative' }}>
      {/* Over light effect */}
      <div
        style={{
          ...positionStyles,
          backgroundColor: '#111',
          borderRadius: `${cornerRadius}px`,
          height: glassSize.height,
          opacity: overLight ? 0.2 : 0,
          pointerEvents: 'none',
          transform: baseStyle.transform,
          transition: baseStyle.transition || 'all 150ms ease-in-out',
          width: glassSize.width,
        }}
      />
      <div
        style={{
          ...positionStyles,
          backgroundColor: '#111',
          borderRadius: `${cornerRadius}px`,
          height: glassSize.height,
          opacity: overLight ? 0.2 : 0,
          pointerEvents: 'none',
          transform: baseStyle.transform,
          transition: baseStyle.transition || 'all 150ms ease-in-out',
          width: glassSize.width,
        }}
      />

      <GlassContainer
        aberrationIntensity={aberrationIntensity}
        blurAmount={blurAmount}
        className={className}
        cornerRadius={cornerRadius}
        displacementScale={
          overLight ? displacementScale * 0.5 : displacementScale
        }
        glassSize={glassSize}
        mode={mode}
        mouseOffset={mouseOffset}
        onClick={onClick}
        onMouseDown={() => setIsActive(true)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onMouseUp={() => setIsActive(false)}
        overLight={overLight}
        padding={padding}
        ref={glassRef}
        saturation={saturation}
        style={baseStyle}
      >
        {children}
      </GlassContainer>

      {/* Border layer 1 - extracted from glass container */}
      <span
        style={{
          ...positionStyles,
          background: `linear-gradient(
          ${135 + mouseOffset.x * 1.2}deg,
          rgba(255, 255, 255, 0.0) 0%,
          rgba(255, 255, 255, ${0.12 + Math.abs(mouseOffset.x) * 0.008}) ${Math.max(10, 33 + mouseOffset.y * 0.3)}%,
          rgba(255, 255, 255, ${0.4 + Math.abs(mouseOffset.x) * 0.012}) ${Math.min(90, 66 + mouseOffset.y * 0.4)}%,
          rgba(255, 255, 255, 0.0) 100%
        )`,
          borderRadius: `${cornerRadius}px`,
          boxShadow:
            '0 0 0 0.5px rgba(255, 255, 255, 0.5) inset, 0 1px 3px rgba(255, 255, 255, 0.25) inset, 0 1px 4px rgba(0, 0, 0, 0.35)',
          height: glassSize.height,
          maskComposite: 'exclude',
          mixBlendMode: 'screen',
          opacity: 0.2,
          padding: '1.5px',
          pointerEvents: 'none',
          transform: baseStyle.transform,
          transition: 'background 150ms ease-in-out',
          WebkitMask:
            'linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)',
          WebkitMaskComposite: 'xor',
          width: glassSize.width,
        }}
      />

      {/* Border layer 2 - duplicate with mix-blend-overlay */}
      <span
        style={{
          ...positionStyles,
          background: `linear-gradient(
          ${135 + mouseOffset.x * 1.2}deg,
          rgba(255, 255, 255, 0.0) 0%,
          rgba(255, 255, 255, ${0.32 + Math.abs(mouseOffset.x) * 0.008}) ${Math.max(10, 33 + mouseOffset.y * 0.3)}%,
          rgba(255, 255, 255, ${0.6 + Math.abs(mouseOffset.x) * 0.012}) ${Math.min(90, 66 + mouseOffset.y * 0.4)}%,
          rgba(255, 255, 255, 0.0) 100%
        )`,
          borderRadius: `${cornerRadius}px`,
          boxShadow:
            '0 0 0 0.5px rgba(255, 255, 255, 0.5) inset, 0 1px 3px rgba(255, 255, 255, 0.25) inset, 0 1px 4px rgba(0, 0, 0, 0.35)',
          height: glassSize.height,
          maskComposite: 'exclude',
          mixBlendMode: 'overlay',
          padding: '1.5px',
          pointerEvents: 'none',
          transform: baseStyle.transform,
          transition: 'background 150ms ease-in-out',
          WebkitMask:
            'linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)',
          WebkitMaskComposite: 'xor',
          width: glassSize.width,
        }}
      />

      {/* Hover effects */}
      {Boolean(onClick) && (
        <>
          <div
            style={{
              ...positionStyles,
              backgroundImage:
                'radial-gradient(circle at 50% 0%, rgba(255, 255, 255, 0.5) 0%, rgba(255, 255, 255, 0) 50%)',
              borderRadius: `${cornerRadius}px`,
              height: glassSize.height,
              mixBlendMode: 'overlay',
              opacity: isHovered || isActive ? 0.5 : 0,
              pointerEvents: 'none',
              transform: baseStyle.transform,
              transition: 'all 0.2s ease-out',
              width: glassSize.width + 1,
            }}
          />
          <div
            style={{
              ...positionStyles,
              backgroundImage:
                'radial-gradient(circle at 50% 0%, rgba(255, 255, 255, 1) 0%, rgba(255, 255, 255, 0) 80%)',
              borderRadius: `${cornerRadius}px`,
              height: glassSize.height,
              mixBlendMode: 'overlay',
              opacity: isActive ? 0.5 : 0,
              pointerEvents: 'none',
              transform: baseStyle.transform,
              transition: 'all 0.2s ease-out',
              width: glassSize.width + 1,
            }}
          />
          <div
            style={{
              ...baseStyle,
              backgroundImage:
                'radial-gradient(circle at 50% 0%, rgba(255, 255, 255, 1) 0%, rgba(255, 255, 255, 0) 100%)',
              borderRadius: `${cornerRadius}px`,
              height: glassSize.height,
              left: baseStyle.left,
              mixBlendMode: 'overlay',
              opacity: isHovered ? 0.4 : isActive ? 0.8 : 0,
              pointerEvents: 'none',
              position: baseStyle.position,
              top: baseStyle.top,
              transition: 'all 0.2s ease-out',
              width: glassSize.width + 1,
            }}
          />
        </>
      )}
    </div>
  );
}
