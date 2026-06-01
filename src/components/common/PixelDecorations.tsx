interface PixelHeartProps {
  color?: string;
  size?: number;
}

export function PixelHeart({ color = 'currentColor', size = 14 }: PixelHeartProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 14 12" fill="none" aria-hidden="true">
      <rect x="1" y="2" width="2" height="2" fill={color} />
      <rect x="3" y="2" width="2" height="2" fill={color} />
      <rect x="9" y="2" width="2" height="2" fill={color} />
      <rect x="11" y="2" width="2" height="2" fill={color} />
      <rect x="1" y="4" width="12" height="2" fill={color} />
      <rect x="3" y="6" width="8" height="2" fill={color} />
      <rect x="5" y="8" width="4" height="2" fill={color} />
      <rect x="6" y="10" width="2" height="2" fill={color} />
    </svg>
  );
}

interface PixelPlusProps {
  color?: string;
  size?: number;
}

export function PixelPlus({ color = 'currentColor', size = 10 }: PixelPlusProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 10 10" fill="none" aria-hidden="true">
      <rect x="4" y="0" width="2" height="10" fill={color} />
      <rect x="0" y="4" width="10" height="2" fill={color} />
    </svg>
  );
}
