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

// Cube — primitive building block
function ElementsIcon() {
  return (
    <svg {...iconProps}>
      <path d="M12 2 21 7v10l-9 5-9-5V7l9-5Z" />
      <path d="M12 12 21 7M12 12v10M12 12 3 7" />
    </svg>
  );
}

// Puzzle piece — composed widgets
function ComponentsIcon() {
  return (
    <svg {...iconProps}>
      <path d="M10 3.5a2 2 0 1 1 4 0V5h4a1 1 0 0 1 1 1v4h-1.5a2 2 0 1 0 0 4H19v4a1 1 0 0 1-1 1h-4v-1.5a2 2 0 1 0-4 0V19H6a1 1 0 0 1-1-1v-4H3.5a2 2 0 1 1 0-4H5V6a1 1 0 0 1 1-1h4V3.5Z" />
    </svg>
  );
}

// Checklist — form controls
function FormIcon() {
  return (
    <svg {...iconProps}>
      <rect x="3" y="4" width="6" height="6" rx="1.5" />
      <path d="m4.8 7 1.4 1.4L8.5 6M13 7h8" />
      <rect x="3" y="14" width="6" height="6" rx="1.5" />
      <path d="M13 17h8" />
    </svg>
  );
}

// Dashboard panes — page structure
function LayoutIcon() {
  return (
    <svg {...iconProps}>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M3 9h18M10 9v12" />
    </svg>
  );
}

// Three vertical bars — column layout
function ColumnsIcon() {
  return (
    <svg {...iconProps}>
      <rect x="3" y="4" width="4.5" height="16" rx="1" />
      <rect x="9.75" y="4" width="4.5" height="16" rx="1" />
      <rect x="16.5" y="4" width="4.5" height="16" rx="1" />
    </svg>
  );
}

// 2x2 squares — CSS grid
function GridIcon() {
  return (
    <svg {...iconProps}>
      <rect x="3" y="3" width="7.5" height="7.5" rx="1.5" />
      <rect x="13.5" y="3" width="7.5" height="7.5" rx="1.5" />
      <rect x="3" y="13.5" width="7.5" height="7.5" rx="1.5" />
      <rect x="13.5" y="13.5" width="7.5" height="7.5" rx="1.5" />
    </svg>
  );
}

// Sliders — utilities and configuration
function HelpersIcon() {
  return (
    <svg {...iconProps}>
      <path d="M4 7h10M18 7h2M4 12h2M10 12h10M4 17h10M18 17h2" />
      <circle cx="16" cy="7" r="2" />
      <circle cx="8" cy="12" r="2" />
      <circle cx="16" cy="17" r="2" />
    </svg>
  );
}

const CATEGORY_ICONS = {
  elements: ElementsIcon,
  components: ComponentsIcon,
  form: FormIcon,
  layout: LayoutIcon,
  columns: ColumnsIcon,
  grid: GridIcon,
  helpers: HelpersIcon,
};

export default CATEGORY_ICONS;
