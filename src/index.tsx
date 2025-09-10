import {
  type CSSProperties,
  forwardRef,
  PropsWithChildren,
  ReactNode,
  useEffect,
  useId,
  useLayoutEffect,
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
  // Guard against invalid dimensions
  if (!width || !height || width <= 0 || height <= 0) {
    console.warn('Invalid dimensions for shader generation:', { width, height });
    return '';
  }
  
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
  // Default to "standard" if mode is empty or undefined
  const safeMode = mode || 'standard';
  switch (safeMode) {
    case 'standard':
      return displacementMap;
    case 'polar':
      return polarDisplacementMap;
    case 'prominent':
      return prominentDisplacementMap;
    case 'shader':
      return shaderMapUrl || displacementMap;
    default:
      throw new Error(`Invalid mode: ${safeMode}`);
  }
};

/* ---------- SVG filter (edge-only displacement) ---------- */
const GlassFilter = ({
  aberrationIntensity,
  displacementScale,
  id,
  mode,
  shaderMapUrl,
}: {
  aberrationIntensity: number;
  displacementScale: number;
  id: string;
  mode: 'standard' | 'polar' | 'prominent' | 'shader';
  shaderMapUrl?: string;
}) => (
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
type GlassContainerProps = PropsWithChildren<{
  aberrationIntensity?: number;
  blurAmount?: number;
  borderRadius?: number;
  className?: string;
  displacementScale?: number;
  glassSize: { height: number; width: number };
  mode?: 'standard' | 'polar' | 'prominent' | 'shader';
  onClick?: () => void;
  onMouseDown?: () => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  onMouseUp?: () => void;
  overLight?: boolean;
  padding?: string;
  saturation?: number;
  style?: CSSProperties;
}>;

const GlassContainer = forwardRef<HTMLDivElement, GlassContainerProps>(
  (
    {
      aberrationIntensity = 2,
      blurAmount = 12,
      borderRadius = 999,
      children,
      className = '',
      displacementScale = 25,
      glassSize,
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
      if (mode === 'shader' && glassSize.width > 0 && glassSize.height > 0) {
        const url = generateShaderDisplacementMap(
          glassSize.width,
          glassSize.height,
        );
        setShaderMapUrl(url);
      }
    }, [mode, glassSize.width, glassSize.height]);

    const backdropStyle = {
      backdropFilter: `blur(${
        (overLight ? 12 : 4) + blurAmount * 32
      }px) saturate(${saturation}%)`,
      filter: isFirefox ? null : `url(#${filterId})`,
    };

    return (
      <div
        className={className}
        onClick={onClick}
        ref={ref}
        style={{
          position: 'absolute',
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
            borderRadius,
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
                borderRadius,
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
  borderRadius?: number;
  children: ReactNode;
  className?: string;
  displacementScale?: number;
  mode?: 'standard' | 'polar' | 'prominent' | 'shader';
  onClick?: () => void;
  overLight?: boolean;
  padding?: string;
  saturation?: number;
  style?: CSSProperties;
};

export default function LiquidGlass({
  aberrationIntensity = 2,
  blurAmount = 0.0625,
  borderRadius = 999,
  children,
  className = '',
  displacementScale = 70,
  mode = 'standard',
  onClick,
  overLight = false,
  padding = '24px 32px',
  saturation = 140,
  style,
}: LiquidGlassProps) {
  const glassRef = useRef<HTMLDivElement>(null);
  const isStickyOrFixed = style?.position === 'fixed' || style?.position === 'sticky';
  const [isHovered, setIsHovered] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [glassSize, setGlassSize] = useState({ height: 0, width: 0 });

  // Mouse tracking removed - no longer needed without elasticity

  // Calculation functions removed - no longer needed without elasticity

  // Update glass size whenever component mounts or window resizes
  useLayoutEffect(() => {
    const updateGlassSize = () => {
      if (glassRef.current) {
        const { offsetHeight, offsetWidth } = glassRef.current;
        setGlassSize({ height: offsetHeight, width: offsetWidth });
      }
    };

    updateGlassSize();
    window.addEventListener('resize', updateGlassSize);
    return () => window.removeEventListener('resize', updateGlassSize);
  }, [isStickyOrFixed]);
  
  // Separate positioning styles from transform styles
  const { position, top, left, right, bottom, zIndex, transform: userTransform, ...otherStyles } = style || {};
  const positioningStyles = isStickyOrFixed ? { position, top, left, right, bottom, zIndex } : {};
  
  const transformStyle = {
    ...(!isStickyOrFixed ? otherStyles : {}), // Only include non-positioning styles for non-fixed elements
    transform: isStickyOrFixed 
      ? `${userTransform || ''} ${isActive && Boolean(onClick) ? "scale(0.96)" : "scale(1)"}`.trim()
      : `translate(-50%, -50%) ${isActive && Boolean(onClick) ? "scale(0.96)" : "scale(1)"}`,
    transition: 'all ease-out 0.2s',
  };

  return (
    <div
      style={isStickyOrFixed ? {
        // For fixed/sticky elements, apply positioning to the container
        ...positioningStyles,
      } : {
        position: 'relative',
        ...style
      }}
    >
      {/* Over light effect */}
      <div
        style={{
          position: isStickyOrFixed ? 'fixed' : 'absolute',
          ...transformStyle,
          backgroundColor: '#111',
          borderRadius,
          height: glassSize.height,
          opacity: overLight ? 0.2 : 0,
          pointerEvents: 'none',
          width: glassSize.width,
        }}
      />
      <div
        style={{
          position: isStickyOrFixed ? 'fixed' : 'absolute',
          ...transformStyle,
          backgroundColor: '#111',
          borderRadius,
          height: glassSize.height,
          opacity: overLight ? 0.2 : 0,
          pointerEvents: 'none',
          width: glassSize.width,
        }}
      />

      <GlassContainer
        aberrationIntensity={aberrationIntensity}
        blurAmount={blurAmount}
        borderRadius={borderRadius}
        className={className}
        displacementScale={
          overLight ? displacementScale * 0.5 : displacementScale
        }
        glassSize={glassSize}
        mode={mode}
        onClick={onClick}
        onMouseDown={() => setIsActive(true)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onMouseUp={() => setIsActive(false)}
        overLight={overLight}
        padding={padding}
        ref={glassRef}
        saturation={saturation}
        style={isStickyOrFixed ? { 
          ...transformStyle,
          willChange: 'transform', // Optimize for frequent changes
          backfaceVisibility: 'hidden' // Prevent flickers
        } : transformStyle}
      >
        {children}
      </GlassContainer>

      {/* Border layer 1 - extracted from glass container */}
      {glassSize.height > 0 && glassSize.width > 0 && (
        <>
          <span
            style={{
              position: isStickyOrFixed ? 'fixed' : 'absolute',
              ...transformStyle,
              background: `linear-gradient(135deg, rgba(255, 255, 255, 0.0) 0%, rgba(255, 255, 255, 0.12) 33%, rgba(255, 255, 255, 0.4) 66%, rgba(255, 255, 255, 0.0) 100%)`,
              borderRadius,
              boxShadow:
                '0 0 0 0.5px rgba(255, 255, 255, 0.5) inset, 0 1px 3px rgba(255, 255, 255, 0.25) inset, 0 1px 4px rgba(0, 0, 0, 0.35)',
              height: glassSize.height,
              ...(isStickyOrFixed ? {} : {
                maskComposite: 'exclude',
                mixBlendMode: 'screen',
              }),
              opacity: 0.2,
              padding: '1.5px',
              pointerEvents: 'none',
              ...(isStickyOrFixed ? {
                WebkitMask: 'linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)',
                WebkitMaskComposite: 'xor',
              } : {
                WebkitMask: 'linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)',
                WebkitMaskComposite: 'xor',
              }),
              width: glassSize.width,
            }}
          />

          {/* Border layer 2 - duplicate with mix-blend-overlay */}
          <span
            style={{
              position: isStickyOrFixed ? 'fixed' : 'absolute',
              ...transformStyle,
              background: `linear-gradient(135deg, rgba(255, 255, 255, 0.0) 0%, rgba(255, 255, 255, 0.15) 33%, rgba(255, 255, 255, 0.3) 66%, rgba(255, 255, 255, 0.0) 100%)`,
              borderRadius,
              boxShadow:
                '0 0 0 0.5px rgba(255, 255, 255, 0.5) inset, 0 1px 3px rgba(255, 255, 255, 0.25) inset, 0 1px 4px rgba(0, 0, 0, 0.35)',
              height: glassSize.height,
              ...(isStickyOrFixed ? {} : {
                maskComposite: 'exclude',
                mixBlendMode: 'overlay',
              }),
              padding: '1.5px',
              pointerEvents: 'none',
              ...(isStickyOrFixed ? {} : {
                WebkitMask: 'linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)',
                WebkitMaskComposite: 'xor',
              }),
              width: glassSize.width,
            }}
          />
        </>
      )}

      {/* Hover effects */}
      {Boolean(onClick) && (
        <>
          <div
            style={{
              backgroundImage:
                'radial-gradient(circle at 50% 0%, rgba(255, 255, 255, 0.5) 0%, rgba(255, 255, 255, 0) 50%)',
              borderRadius,
              height: glassSize.height,
              mixBlendMode: 'overlay',
              opacity: isHovered || isActive ? 0.5 : 0,
              pointerEvents: 'none',
              position: isStickyOrFixed ? 'fixed' : 'absolute',
              transform: transformStyle.transform,
              transition: 'all 0.2s ease-out',
              width: glassSize.width + 1,
            }}
          />
          <div
            style={{
              backgroundImage:
                'radial-gradient(circle at 50% 0%, rgba(255, 255, 255, 1) 0%, rgba(255, 255, 255, 0) 80%)',
              borderRadius,
              height: glassSize.height,
              mixBlendMode: 'overlay',
              opacity: isActive ? 0.5 : 0,
              pointerEvents: 'none',
              position: isStickyOrFixed ? 'fixed' : 'absolute',
              transform: transformStyle.transform,
              transition: 'all 0.2s ease-out',
              width: glassSize.width + 1,
            }}
          />
          <div
            style={{
              position: isStickyOrFixed ? 'fixed' : 'absolute',
              ...transformStyle,
              backgroundImage:
                'radial-gradient(circle at 50% 0%, rgba(255, 255, 255, 1) 0%, rgba(255, 255, 255, 0) 100%)',
              borderRadius,
              height: glassSize.height,
              mixBlendMode: 'overlay',
              opacity: isHovered ? 0.4 : isActive ? 0.8 : 0,
              pointerEvents: 'none',
              transition: 'all 0.2s ease-out',
              width: glassSize.width + 1,
            }}
          />
        </>
      )}
    </div>
  );
}
