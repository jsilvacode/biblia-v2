import {
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  BookOpen,
  Bookmark,
  CalendarDays,
  CircleCheck,
  CircleAlert,
  CircleHelp,
  CirclePlay,
  Copy,
  Download,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  GraduationCap,
  Highlighter,
  Headphones,
  HeartHandshake,
  House,
  Info,
  Languages,
  LibraryBig,
  LockKeyhole,
  Landmark,
  Feather,
  ScrollText,
  Megaphone,
  Cross,
  Mail,
  Menu,
  MessageSquareText,
  Moon,
  Radio,
  RotateCcw,
  RotateCw,
  Search,
  Settings2,
  Share2,
  Pause,
  Sparkles,
  Sun,
  Type,
  Repeat,
  Volume2,
  X,
} from 'lucide-react'

// Feature code refers to semantic names rather than a provider-specific icon
// export. This gives the UI one coherent, replaceable line language while
// retaining tree-shaken imports from Lucide.
const icons = {
  arrowLeft: ArrowLeft,
  arrowRight: ArrowRight,
  arrowUp: ArrowUp,
  book: BookOpen,
  bookOpen: BookOpen,
  bookmark: Bookmark,
  calendar: CalendarDays,
  checkCircle: CircleCheck,
  circleAlert: CircleAlert,
  circleHelp: CircleHelp,
  chevronDown: ChevronDown,
  chevronRight: ChevronRight,
  commentary: MessageSquareText,
  copy: Copy,
  download: Download,
  externalLink: ExternalLink,
  gear: Settings2,
  graduation: GraduationCap,
  highlight: Highlighter,
  headphones: Headphones,
  heartHandshake: HeartHandshake,
  home: House,
  info: Info,
  language: Languages,
  library: LibraryBig,
  landmark: Landmark,
  feather: Feather,
  scroll: ScrollText,
  megaphone: Megaphone,
  cross: Cross,
  mail: Mail,
  sparkles: Sparkles,
  lock: LockKeyhole,
  menu: Menu,
  moon: Moon,
  play: CirclePlay,
  pause: Pause,
  radio: Radio,
  repeat: Repeat,
  rewind: RotateCcw,
  forward: RotateCw,
  search: Search,
  share: Share2,
  sun: Sun,
  type: Type,
  volume: Volume2,
  close: X,
}

const iconSizes = {
  xs: 14,
  sm: 17,
  md: 20,
  lg: 24,
}

export function Icon({ absoluteStrokeWidth = false, name, size = 'md', strokeWidth = 1.6, ...props }) {
  const Glyph = icons[name] ?? Sparkles
  const resolvedSize = typeof size === 'string' ? (iconSizes[size] ?? iconSizes.md) : size

  return (
    <Glyph
      absoluteStrokeWidth={absoluteStrokeWidth}
      aria-hidden="true"
      size={resolvedSize}
      strokeWidth={strokeWidth}
      {...props}
    />
  )
}
