import { 
  Type, Image, Video, Square, Box, Minus,
  ArrowUpDown, Code, CircleDot, Heading1,
  AlignLeft, Star, Clock, MessageSquare, DollarSign,
  HelpCircle, Grid, MapPin, Share2, FileText, 
  LayoutGrid, Columns, MousePointer
} from "lucide-react";

interface DragOverlayContentProps {
  activeId: string;
}

const ELEMENT_ICONS: Record<string, any> = {
  section: Box,
  row: Columns,
  column: Square,
  heading: Heading1,
  text: AlignLeft,
  image: Image,
  video: Video,
  button: MousePointer,
  spacer: ArrowUpDown,
  divider: Minus,
  icon: Star,
  html: Code,
  countdown: Clock,
  testimonial: MessageSquare,
  pricing: DollarSign,
  faq: HelpCircle,
  gallery: Grid,
  map: MapPin,
  social: Share2,
  form: FileText
};

export const DragOverlayContent = ({ activeId }: DragOverlayContentProps) => {
  // Extract type from activeId (format: "new-{type}" or "{type}-{timestamp}")
  const type = activeId.startsWith('new-') 
    ? activeId.replace('new-', '')
    : activeId.split('-')[0];

  const Icon = ELEMENT_ICONS[type] || Box;

  return (
    <div className="flex items-center gap-2 px-4 py-3 bg-primary text-primary-foreground rounded-lg shadow-xl cursor-grabbing">
      <Icon className="w-5 h-5" />
      <span className="text-sm font-medium capitalize">{type}</span>
    </div>
  );
};
