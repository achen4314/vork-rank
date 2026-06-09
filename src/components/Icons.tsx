import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

const baseProps = {
  fill: "none",
  stroke: "currentColor",
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  strokeWidth: 2,
  viewBox: "0 0 24 24",
};

export function ArrowLeftIcon(props: IconProps) {
  return (
    <svg aria-hidden="true" {...baseProps} {...props}>
      <path d="m12 19-7-7 7-7" />
      <path d="M19 12H5" />
    </svg>
  );
}

export function ArrowUpRightIcon(props: IconProps) {
  return (
    <svg aria-hidden="true" {...baseProps} {...props}>
      <path d="M7 17 17 7" />
      <path d="M7 7h10v10" />
    </svg>
  );
}

export function AlertCircleIcon(props: IconProps) {
  return (
    <svg aria-hidden="true" {...baseProps} {...props}>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 8v4" />
      <path d="M12 16h.01" />
    </svg>
  );
}

export function BuildingIcon(props: IconProps) {
  return (
    <svg aria-hidden="true" {...baseProps} {...props}>
      <path d="M4 21V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16" />
      <path d="M18 8h2a2 2 0 0 1 2 2v11" />
      <path d="M8 7h4" />
      <path d="M8 11h4" />
      <path d="M8 15h4" />
      <path d="M4 21h18" />
    </svg>
  );
}

export function CalendarIcon(props: IconProps) {
  return (
    <svg aria-hidden="true" {...baseProps} {...props}>
      <path d="M8 2v4" />
      <path d="M16 2v4" />
      <rect width="18" height="18" x="3" y="4" rx="2" />
      <path d="M3 10h18" />
    </svg>
  );
}

export function CheckIcon(props: IconProps) {
  return (
    <svg aria-hidden="true" {...baseProps} {...props}>
      <path d="m20 6-11 11-5-5" />
    </svg>
  );
}

export function ClockIcon(props: IconProps) {
  return (
    <svg aria-hidden="true" {...baseProps} {...props}>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 6v6l4 2" />
    </svg>
  );
}

export function ChevronLeftIcon(props: IconProps) {
  return (
    <svg aria-hidden="true" {...baseProps} {...props}>
      <path d="m15 18-6-6 6-6" />
    </svg>
  );
}

export function ChevronRightIcon(props: IconProps) {
  return (
    <svg aria-hidden="true" {...baseProps} {...props}>
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}

export function CopyIcon(props: IconProps) {
  return (
    <svg aria-hidden="true" {...baseProps} {...props}>
      <rect width="13" height="13" x="9" y="9" rx="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

export function FlagIcon(props: IconProps) {
  return (
    <svg aria-hidden="true" {...baseProps} {...props}>
      <path d="M4 22V4" />
      <path d="M4 4h12l-1 4 1 4H4" />
    </svg>
  );
}

export function GridIcon(props: IconProps) {
  return (
    <svg aria-hidden="true" {...baseProps} {...props}>
      <rect width="7" height="7" x="3" y="3" rx="1" />
      <rect width="7" height="7" x="14" y="3" rx="1" />
      <rect width="7" height="7" x="3" y="14" rx="1" />
      <rect width="7" height="7" x="14" y="14" rx="1" />
    </svg>
  );
}

export function HashIcon(props: IconProps) {
  return (
    <svg aria-hidden="true" {...baseProps} {...props}>
      <path d="M4 9h16" />
      <path d="M4 15h16" />
      <path d="M10 3 8 21" />
      <path d="m16 3-2 18" />
    </svg>
  );
}

export function LoaderIcon(props: IconProps) {
  return (
    <svg aria-hidden="true" {...baseProps} {...props}>
      <path d="M21 12a9 9 0 1 1-6.2-8.56" />
    </svg>
  );
}

export function MapPinIcon(props: IconProps) {
  return (
    <svg aria-hidden="true" {...baseProps} {...props}>
      <path d="M20 10c0 4.8-8 12-8 12S4 14.8 4 10a8 8 0 0 1 16 0Z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

export function PrinterIcon(props: IconProps) {
  return (
    <svg aria-hidden="true" {...baseProps} {...props}>
      <path d="M6 9V2h12v7" />
      <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
      <path d="M6 14h12v8H6z" />
    </svg>
  );
}

export function ResetIcon(props: IconProps) {
  return (
    <svg aria-hidden="true" {...baseProps} {...props}>
      <path d="M3 12a9 9 0 1 0 3-6.7" />
      <path d="M3 4v6h6" />
    </svg>
  );
}

export function SearchIcon(props: IconProps) {
  return (
    <svg aria-hidden="true" {...baseProps} {...props}>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}

export function UserIcon(props: IconProps) {
  return (
    <svg aria-hidden="true" {...baseProps} {...props}>
      <path d="M20 21a8 8 0 0 0-16 0" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

export function UsersIcon(props: IconProps) {
  return (
    <svg aria-hidden="true" {...baseProps} {...props}>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

export function XIcon(props: IconProps) {
  return (
    <svg aria-hidden="true" {...baseProps} {...props}>
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}

export function SendIcon(props: IconProps) {
  return (
    <svg aria-hidden="true" {...baseProps} {...props}>
      <path d="m22 2-7 20-4-9-9-4Z" />
      <path d="M22 2 11 13" />
    </svg>
  );
}

export function MailIcon(props: IconProps) {
  return (
    <svg aria-hidden="true" {...baseProps} {...props}>
      <rect width="20" height="16" x="2" y="4" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  );
}

export function ShieldIcon(props: IconProps) {
  return (
    <svg aria-hidden="true" {...baseProps} {...props}>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}

export function CheckCircleIcon(props: IconProps) {
  return (
    <svg aria-hidden="true" {...baseProps} {...props}>
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <path d="m9 11 3 3L22 4" />
    </svg>
  );
}

export function LogOutIcon(props: IconProps) {
  return (
    <svg aria-hidden="true" {...baseProps} {...props}>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path d="m16 17 5-5-5-5" />
      <path d="M21 12H9" />
    </svg>
  );
}
