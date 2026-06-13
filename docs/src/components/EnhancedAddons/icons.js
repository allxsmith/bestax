const iconProps = {
  width: 26,
  height: 26,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
};

// Chain link — a button styled as a link
function LinkButtonIcon() {
  return (
    <svg {...iconProps}>
      <path d="M10 13a5 5 0 0 0 7.07 0l3.18-3.18a5 5 0 0 0-7.07-7.07L11.5 4.4" />
      <path d="M14 11a5 5 0 0 0-7.07 0l-3.18 3.18a5 5 0 0 0 7.07 7.07l1.67-1.66" />
    </svg>
  );
}

// Sliding frames — carousel
function CarouselIcon() {
  return (
    <svg {...iconProps}>
      <rect x="6" y="5" width="12" height="14" rx="1.5" />
      <path d="M2.5 8v8M21.5 8v8" />
    </svg>
  );
}

// Panel with expanding chevron — collapse
function CollapseIcon() {
  return (
    <svg {...iconProps}>
      <rect x="3" y="3" width="18" height="6" rx="1.5" />
      <path d="M3 14h18M3 19h12M9 6h9" />
    </svg>
  );
}

// Modal bubble with action buttons — dialog
function DialogIcon() {
  return (
    <svg {...iconProps}>
      <rect x="3" y="4" width="18" height="14" rx="2" />
      <path d="M7 14h4M14 14h3M7 8.5h10" />
      <path d="M9 18v3l3-3" />
    </svg>
  );
}

// Spinner arc — loading
function LoadingIcon() {
  return (
    <svg {...iconProps}>
      <path d="M12 3a9 9 0 1 1-6.36 2.64" />
      <path d="M12 7v5l3 2" />
    </svg>
  );
}

// Slide-out panel — sidebar
function SidebarIcon() {
  return (
    <svg {...iconProps}>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M9 3v18M12.5 9.5 15 12l-2.5 2.5" />
    </svg>
  );
}

// Connected progress dots — steps
function StepsIcon() {
  return (
    <svg {...iconProps}>
      <circle cx="5" cy="12" r="2.2" />
      <circle cx="12" cy="12" r="2.2" />
      <circle cx="19" cy="12" r="2.2" />
      <path d="M7.2 12h2.6M14.2 12h2.6" />
    </svg>
  );
}

// Bell — toast notifications
function ToastIcon() {
  return (
    <svg {...iconProps}>
      <path d="M6 9a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6" />
      <path d="M10 19a2 2 0 0 0 4 0" />
    </svg>
  );
}

// Speech bubble hint — tooltip
function TooltipIcon() {
  return (
    <svg {...iconProps}>
      <rect x="3" y="3" width="18" height="12" rx="2" />
      <path d="M12 15v3l-3-3" />
      <path d="M8 9h.01M12 9h.01M16 9h.01" />
    </svg>
  );
}

const ADDON_ICONS = {
  linkbutton: LinkButtonIcon,
  carousel: CarouselIcon,
  collapse: CollapseIcon,
  dialog: DialogIcon,
  loading: LoadingIcon,
  sidebar: SidebarIcon,
  steps: StepsIcon,
  toast: ToastIcon,
  tooltip: TooltipIcon,
};

export default ADDON_ICONS;
