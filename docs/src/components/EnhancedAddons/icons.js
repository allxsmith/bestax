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

// A keycap with its heavier bottom edge, and a letter on it
function KbdIcon() {
  return (
    <svg {...iconProps}>
      <rect x="4" y="4" width="16" height="16" rx="3" />
      <path d="M4 16.5h16" />
      <path d="M10 8v5M10 10.5l4-2.5M11.5 10l2.5 3" />
    </svg>
  );
}

// Person in a frame — avatar
function AvatarIcon() {
  return (
    <svg {...iconProps}>
      <circle cx="12" cy="9" r="3.2" />
      <path d="M5.5 19a6.6 6.6 0 0 1 13 0" />
    </svg>
  );
}

// Corner count indicator — badge
function BadgeIcon() {
  return (
    <svg {...iconProps}>
      <rect x="3" y="6" width="12" height="12" rx="2" />
      <circle cx="18" cy="6" r="3" fill="currentColor" stroke="none" />
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

// Two cards side by side, the first picked with a check and a heavier edge
function ChoiceCardIcon() {
  return (
    <svg {...iconProps}>
      <rect x="1.5" y="5" width="9.5" height="14" rx="2" strokeWidth="2.6" />
      <path d="M4 12l2 2 3-4" />
      <rect x="13" y="5" width="9.5" height="14" rx="2" />
      <path d="M15.5 10h5M15.5 13.5h3.5" />
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

// A field with its list opened under it, the first row checked: combobox
function ComboboxIcon() {
  return (
    <svg {...iconProps}>
      <rect x="3" y="3" width="18" height="6" rx="1.5" />
      <path d="M6.5 6h5" />
      <rect x="3" y="11" width="18" height="10" rx="1.5" />
      <path d="M6 14.6l1.3 1.3 2.2-2.4" />
      <path d="M11.5 14.5h6M11.5 18h6" />
    </svg>
  );
}

// A box with a search field across its top and rows of commands under it
function CommandIcon() {
  return (
    <svg {...iconProps}>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="7.5" cy="7.5" r="1.8" />
      <path d="M8.8 8.8l1.4 1.4M12.5 7.5h5" />
      <path d="M3 12h18" />
      <path d="M7 15.5h10M7 18.5h6" />
    </svg>
  );
}

// A table with a sorted header and a checked first row
function DataTableIcon() {
  return (
    <svg {...iconProps}>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="M3 9h18M3 14.5h18M9 9v11" />
      <path d="M14 5.5l1.5 1.8 1.5-1.8" />
      <path d="M4.8 11.6l1 1 1.7-1.9" />
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

// A picture in a circle over a title and a line of text, centered
function EmptyStateIcon() {
  return (
    <svg {...iconProps}>
      <circle cx="12" cy="7.5" r="4.5" />
      <path d="M10 7.5h4" />
      <path d="M6.5 16h11M9 20h6" />
    </svg>
  );
}

// A dashed box with an arrow dropping into it
function DropzoneIcon() {
  return (
    <svg {...iconProps}>
      <path
        d="M4 9v9a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9"
        strokeDasharray="3 2.5"
      />
      <path d="M12 3v10M8.5 9.5 12 13l3.5-3.5" />
    </svg>
  );
}

// A box whose top border breaks for its legend, with two fields inside
function FieldsetIcon() {
  return (
    <svg {...iconProps}>
      <path d="M5 6a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-2" />
      <path d="M9 6h4" />
      <path d="M7 12h10M7 16h10" />
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

// The pointer, and a menu of actions opening at its tip: context menu
function ContextMenuIcon() {
  return (
    <svg {...iconProps}>
      <path d="M2 2.5v6.5l1.7-1.5 1.3 2.5 1.3-.7-1.3-2.5 2.3-.3z" />
      <rect x="8" y="7" width="13" height="14.5" rx="2" />
      <path d="M11 11h7M11 14.5h7M11 18h4" />
    </svg>
  );
}

// A link with the pointer resting on it, and the card it opens below: hover card
function HoverCardIcon() {
  return (
    <svg {...iconProps}>
      <path d="M3 6h7" />
      <path d="M13 2.5v6.5l1.7-1.5 1.3 2.5 1.3-.7-1.3-2.5 2.3-.3z" />
      <rect x="3" y="12" width="18" height="9.5" rx="2" />
      <circle cx="7.5" cy="16.75" r="1.9" />
      <path d="M11.5 15.5h6M11.5 18h4" />
    </svg>
  );
}

// A row of four boxes, two filled, the caret in the third: pin input
function PinInputIcon() {
  return (
    <svg {...iconProps}>
      <rect x="1.5" y="7" width="4.5" height="10" rx="1" />
      <rect x="7" y="7" width="4.5" height="10" rx="1" />
      <rect x="12.5" y="7" width="4.5" height="10" rx="1" />
      <rect x="18" y="7" width="4.5" height="10" rx="1" />
      <circle cx="3.75" cy="12" r="0.6" />
      <circle cx="9.25" cy="12" r="0.6" />
      <path d="M14.75 10v4" />
    </svg>
  );
}

// A button with a panel opened below it, pointing back up: popover
function PopoverIcon() {
  return (
    <svg {...iconProps}>
      <rect x="8" y="2.5" width="8" height="4" rx="1.5" />
      <rect x="3" y="10" width="18" height="11" rx="2" />
      <path d="M11 10l1-2 1 2M7 14.5h10M7 17.5h6" />
    </svg>
  );
}

// Element rising into view over motion lines — reveal on scroll
function RevealIcon() {
  return (
    <svg {...iconProps}>
      <rect x="5" y="3" width="14" height="11" rx="1.5" />
      <path d="M9.5 9.5 12 7l2.5 2.5" />
      <path d="M5 18h14M8 21h8" />
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

// Three rows, each a short faint label beside a longer value, the values lined up
function DescriptionListIcon() {
  return (
    <svg {...iconProps}>
      <path d="M4 6h4M4 12h4M4 18h4" strokeOpacity="0.45" />
      <path d="M11 6h9M11 12h6M11 18h8" />
    </svg>
  );
}

// A ring with its arc filled most of the way round
function RingProgressIcon() {
  return (
    <svg {...iconProps}>
      <circle cx="12" cy="12" r="8" strokeOpacity="0.35" />
      <path d="M12 4a8 8 0 1 1-7.6 5.5" />
    </svg>
  );
}

// Lines of text in a box, with a thin scrollbar and its thumb at the side
function ScrollAreaIcon() {
  return (
    <svg {...iconProps}>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M7 8h7M7 12h7M7 16h5" />
      <path d="M18 7v4" />
    </svg>
  );
}

// Two panes in a box, the line between them with a grip on it
function SplitterIcon() {
  return (
    <svg {...iconProps}>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="M10 4v16" />
      <path d="M10 10.5v3" strokeWidth="3" />
    </svg>
  );
}

// Dots on a line down the side, each with a line of text beside it
function TimelineIcon() {
  return (
    <svg {...iconProps}>
      <path d="M6 7v10" />
      <circle cx="6" cy="5" r="2" />
      <circle cx="6" cy="12" r="2" />
      <circle cx="6" cy="19" r="2" />
      <path d="M11 5h9M11 12h7M11 19h8" />
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

// An open parent's chevron and row, with two rows under its guide line
function TreeViewIcon() {
  return (
    <svg {...iconProps}>
      <path d="M3.5 5l2.5 2.5L8.5 5" />
      <path d="M11 6.25h9.5" />
      <path d="M6 11v8.5" />
      <path d="M10 13h10.5M10 18.5h7" />
    </svg>
  );
}

const ADDON_ICONS = {
  linkbutton: LinkButtonIcon,
  kbd: KbdIcon,
  avatar: AvatarIcon,
  badge: BadgeIcon,
  carousel: CarouselIcon,
  choicecard: ChoiceCardIcon,
  collapse: CollapseIcon,
  combobox: ComboboxIcon,
  command: CommandIcon,
  contextmenu: ContextMenuIcon,
  datatable: DataTableIcon,
  descriptionlist: DescriptionListIcon,
  dialog: DialogIcon,
  dropzone: DropzoneIcon,
  emptystate: EmptyStateIcon,
  fieldset: FieldsetIcon,
  hovercard: HoverCardIcon,
  loading: LoadingIcon,
  pininput: PinInputIcon,
  popover: PopoverIcon,
  reveal: RevealIcon,
  ringprogress: RingProgressIcon,
  scrollarea: ScrollAreaIcon,
  sidebar: SidebarIcon,
  splitter: SplitterIcon,
  steps: StepsIcon,
  timeline: TimelineIcon,
  toast: ToastIcon,
  tooltip: TooltipIcon,
  treeview: TreeViewIcon,
};

export default ADDON_ICONS;
