import {
  ArrowLeft,
  ArrowRight,
  Book,
  BookOpen,
  Bookmark,
  CalendarDays,
  CircleCheck,
  CirclePlay,
  Download,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  GraduationCap,
  Highlighter,
  HeartHandshake,
  House,
  Info,
  Languages,
  LibraryBig,
  Menu,
  MessageSquareText,
  Moon,
  Radio,
  Search,
  Settings,
  Share2,
  Sparkles,
  Sun,
  Type,
  X,
} from 'lucide-react'

// Feature code refers to semantic names rather than a provider-specific icon
// export. This gives the UI one coherent, replaceable line language while
// retaining tree-shaken imports from Lucide.
const icons = {
  arrowLeft: ArrowLeft,
  arrowRight: ArrowRight,
  book: Book,
  bookOpen: BookOpen,
  bookmark: Bookmark,
  calendar: CalendarDays,
  checkCircle: CircleCheck,
  chevronDown: ChevronDown,
  chevronRight: ChevronRight,
  commentary: MessageSquareText,
  download: Download,
  externalLink: ExternalLink,
  gear: Settings,
  graduation: GraduationCap,
  highlight: Highlighter,
  heartHandshake: HeartHandshake,
  home: House,
  info: Info,
  language: Languages,
  library: LibraryBig,
  menu: Menu,
  moon: Moon,
  play: CirclePlay,
  radio: Radio,
  search: Search,
  share: Share2,
  sun: Sun,
  type: Type,
  close: X,
}

const iconSizes = {
  xs: 14,
  sm: 17,
  md: 20,
  lg: 24,
}

export function Icon({ absoluteStrokeWidth = true, name, size = 'md', strokeWidth = 1.75, ...props }) {
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
