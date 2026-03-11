interface IconProps {
  size?: number;
  color?: string;
  className?: string;
}

const defaults = {
  size: 16,
  color: "currentColor",
};

function svgProps(props: IconProps) {
  const size = props.size ?? defaults.size;
  return {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: props.color ?? defaults.color,
    strokeWidth: 2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    className: props.className,
  };
}

export function Plane(props: IconProps) {
  return (
    <svg {...svgProps(props)}>
      <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z" />
    </svg>
  );
}

export function Target(props: IconProps) {
  return (
    <svg {...svgProps(props)}>
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  );
}

export function Radar(props: IconProps) {
  return (
    <svg {...svgProps(props)}>
      <path d="M19.07 4.93A10 10 0 0 0 2 12a10 10 0 0 0 17.07 7.07" />
      <path d="M15.54 8.46A5 5 0 0 0 7 12a5 5 0 0 0 8.54 3.54" />
      <line x1="12" y1="12" x2="12" y2="2" />
    </svg>
  );
}

export function Doc(props: IconProps) {
  return (
    <svg {...svgProps(props)}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  );
}

export function Sliders(props: IconProps) {
  return (
    <svg {...svgProps(props)}>
      <line x1="4" y1="21" x2="4" y2="14" />
      <line x1="4" y1="10" x2="4" y2="3" />
      <line x1="12" y1="21" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12" y2="3" />
      <line x1="20" y1="21" x2="20" y2="16" />
      <line x1="20" y1="12" x2="20" y2="3" />
      <line x1="1" y1="14" x2="7" y2="14" />
      <line x1="9" y1="8" x2="15" y2="8" />
      <line x1="17" y1="16" x2="23" y2="16" />
    </svg>
  );
}

export function Bot(props: IconProps) {
  return (
    <svg {...svgProps(props)}>
      <rect x="3" y="11" width="18" height="10" rx="2" />
      <circle cx="12" cy="5" r="2" />
      <path d="M12 7v4" />
      <line x1="8" y1="16" x2="8" y2="16" />
      <line x1="16" y1="16" x2="16" y2="16" />
    </svg>
  );
}

export function Chart(props: IconProps) {
  return (
    <svg {...svgProps(props)}>
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  );
}

export function Gear(props: IconProps) {
  return (
    <svg {...svgProps(props)}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}

export function Search(props: IconProps) {
  return (
    <svg {...svgProps(props)}>
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

export function Bell(props: IconProps) {
  return (
    <svg {...svgProps(props)}>
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}

export function Check(props: IconProps) {
  return (
    <svg {...svgProps(props)}>
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

export function X(props: IconProps) {
  return (
    <svg {...svgProps(props)}>
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

export function Queue(props: IconProps) {
  return (
    <svg {...svgProps(props)}>
      <line x1="8" y1="6" x2="21" y2="6" />
      <line x1="8" y1="12" x2="21" y2="12" />
      <line x1="8" y1="18" x2="21" y2="18" />
      <line x1="3" y1="6" x2="3.01" y2="6" />
      <line x1="3" y1="12" x2="3.01" y2="12" />
      <line x1="3" y1="18" x2="3.01" y2="18" />
    </svg>
  );
}

export function Upload(props: IconProps) {
  return (
    <svg {...svgProps(props)}>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  );
}

export function Shield(props: IconProps) {
  return (
    <svg {...svgProps(props)}>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}

export function Play(props: IconProps) {
  const size = props.size ?? defaults.size;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={props.color ?? defaults.color}
      stroke="none"
      className={props.className}
    >
      <polygon points="5 3 19 12 5 21 5 3" />
    </svg>
  );
}

export function Stop(props: IconProps) {
  const size = props.size ?? defaults.size;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={props.color ?? defaults.color}
      stroke="none"
      className={props.className}
    >
      <rect x="4" y="4" width="16" height="16" rx="2" />
    </svg>
  );
}

export function Sun(props: IconProps) {
  return (
    <svg {...svgProps(props)}>
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1" x2="12" y2="3" />
      <line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" />
      <line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
  );
}

export function Moon(props: IconProps) {
  return (
    <svg {...svgProps(props)}>
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

export function Layers(props: IconProps) {
  return (
    <svg {...svgProps(props)}>
      <path d="M12 2L2 7l10 5 10-5-10-5z" />
      <path d="M2 17l10 5 10-5" />
      <path d="M2 12l10 5 10-5" />
    </svg>
  );
}

export function Zap(props: IconProps) {
  return (
    <svg {...svgProps(props)}>
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  );
}

export function Gauge(props: IconProps) {
  return (
    <svg {...svgProps(props)}>
      <path d="M12 22c5.5 0 10-4.5 10-10S17.5 2 12 2 2 6.5 2 12s4.5 10 10 10z" />
      <path d="M12 6v6l4 2" />
    </svg>
  );
}

export function Arrow(props: IconProps) {
  return (
    <svg {...svgProps(props)} strokeWidth={2.5}>
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  );
}

export function Menu(props: IconProps) {
  return (
    <svg {...svgProps(props)}>
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  );
}

export const ICONS = {
  Plane,
  Target,
  Radar,
  Doc,
  Sliders,
  Bot,
  Chart,
  Gear,
  Search,
  Bell,
  Check,
  X,
  Queue,
  Upload,
  Shield,
  Play,
  Stop,
  Layers,
  Zap,
  Gauge,
  Arrow,
  Sun,
  Moon,
  Menu,
} as const;
