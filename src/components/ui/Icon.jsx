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
  Ellipsis,
  ExternalLink,
  GraduationCap,
  Highlighter,
  Heart,
  HeartHandshake,
  House,
  Info,
  LayoutGrid,
  Languages,
  LibraryBig,
  Menu,
  MessageSquareText,
  Moon,
  NotebookPen,
  Radio,
  Search,
  Settings,
  Share2,
  SlidersHorizontal,
  Sparkles,
  SquarePen,
  Sun,
  Type,
  UserRound,
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
  edit: SquarePen,
  externalLink: ExternalLink,
  gear: Settings,
  graduation: GraduationCap,
  grid: LayoutGrid,
  highlight: Highlighter,
  heart: Heart,
  heartHandshake: HeartHandshake,
  home: House,
  info: Info,
  language: Languages,
  library: LibraryBig,
  menu: Menu,
  moon: Moon,
  more: Ellipsis,
  note: NotebookPen,
  play: CirclePlay,
  radio: Radio,
  search: Search,
  share: Share2,
  sliders: SlidersHorizontal,
  spark: Sparkles,
  sun: Sun,
  type: Type,
  user: UserRound,
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
