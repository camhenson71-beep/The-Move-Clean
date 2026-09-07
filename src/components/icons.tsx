import React from "react";

type IconProps = { className?: string };

function Icon({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {children}
    </svg>
  );
}

export const Sparkles = ({ className }: IconProps) => (
  <Icon className={className}>
    <path d="M12 3l1.8 4.8L18.5 9.5 13.8 11.3 12 16l-1.8-4.7L5.5 9.5l4.7-1.7L12 3z" />
    <path d="M19 14l.9 2.3L22 17.2l-2.1.9L19 20.4l-.9-2.3-2.1-.9 2.1-.9L19 14z" />
  </Icon>
);
export const MapPin = ({ className }: IconProps) => (
  <Icon className={className}><path d="M12 21s7-6.1 7-11.5A7 7 0 0 0 5 9.5C5 14.9 12 21 12 21z" /><circle cx="12" cy="9.5" r="2.3" /></Icon>
);
export const Clock = ({ className }: IconProps) => (
  <Icon className={className}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3.5 2" /></Icon>
);
export const DollarSign = ({ className }: IconProps) => (
  <Icon className={className}><line x1="12" y1="2" x2="12" y2="22" /><path d="M16.5 6.8c0-1.5-1.7-2.6-4-2.6-2.6 0-4.4 1.3-4.4 3.1 0 4.1 8.4 1.8 8.4 5.9 0 1.9-1.9 3.2-4.5 3.2-2.3 0-4-1-4-2.6" /></Icon>
);
export const ArrowRight = ({ className }: IconProps) => (
  <Icon className={className}><line x1="4" y1="12" x2="20" y2="12" /><polyline points="13 5 20 12 13 19" /></Icon>
);
export const Send = ({ className }: IconProps) => (
  <Icon className={className}><path d="M21 3L3 10.5l7 2.5 2 7L21 3z" /><path d="M10 13l4-4" /></Icon>
);
export const Bookmark = ({ className, filled }: IconProps & { filled?: boolean }) => (
  <Icon className={className}><path d="M6 3.5h12v18l-6-4.5-6 4.5v-18z" fill={filled ? "currentColor" : "none"} /></Icon>
);
export const Share2 = ({ className }: IconProps) => (
  <Icon className={className}><circle cx="18" cy="5" r="2.3" /><circle cx="6" cy="12" r="2.3" /><circle cx="18" cy="19" r="2.3" /><line x1="8.1" y1="10.8" x2="15.9" y2="6.2" /><line x1="8.1" y1="13.2" x2="15.9" y2="17.8" /></Icon>
);
export const ChevronLeft = ({ className }: IconProps) => (
  <Icon className={className}><polyline points="15 18 9 12 15 6" /></Icon>
);
export const Calendar = ({ className }: IconProps) => (
  <Icon className={className}><rect x="3.5" y="5" width="17" height="16" rx="1.5" /><line x1="3.5" y1="9.5" x2="20.5" y2="9.5" /><line x1="8" y1="3" x2="8" y2="7" /><line x1="16" y1="3" x2="16" y2="7" /></Icon>
);
export const Plane = ({ className }: IconProps) => (
  <Icon className={className}><path d="M3 13l7-2 4-8 2 1-2.5 7.5 6.5 2v2l-6.5-1L11 20l2 1v1l-3.5-1-1-3-3.5 1v-1.4l2.7-1.9-2.7-2.2z" /></Icon>
);
export const Ticket = ({ className }: IconProps) => (
  <Icon className={className}><path d="M4 8a2 2 0 0 0 0 4v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2a2 2 0 0 1 0-4V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v2z" /><line x1="12" y1="6" x2="12" y2="18" strokeDasharray="2 2" /></Icon>
);
export const Settings = ({ className }: IconProps) => (
  <Icon className={className}><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" /></Icon>
);
export const X = ({ className }: IconProps) => (
  <Icon className={className}><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></Icon>
);
