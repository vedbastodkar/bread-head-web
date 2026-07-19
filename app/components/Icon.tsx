// Single icon surface for the whole web app. Replaces the old emoji glyphs with
// SF-Symbol-style line icons (lucide-react). Two ways to use it:
//
//   <Icon name="flame" />                     // semantic name (decorative UI)
//   <Icon sf="chart.pie.fill" />              // iOS SF Symbol key (budget categories)
//
// `sf` maps an iOS SF Symbol name to its closest Lucide icon via keyword rules,
// mirroring the shared category keys the SwiftUI app uses. `name` is the direct
// semantic set used in marketing/app UI. Size defaults to 1em so it inherits the
// surrounding font-size (drop-in for the text glyphs it replaces).
import {
  GraduationCap, CreditCard, Banknote, PieChart, BarChart3, TrendingUp,
  Calendar, Clock, Bell, ShieldCheck, TriangleAlert, Shield, CircleCheck,
  CircleX, Cross, Heart, Star, Flame, ZapOff, Zap, Lightbulb, Brain, BookOpen,
  FileText, Folder, Briefcase, Landmark, House, ShoppingCart, Gift, Plane, Car,
  Fuel, Bus, Bike, Globe, Mail, Smartphone, Camera, Headphones, Gamepad2, Users,
  User, Hand, Handshake, Sparkles, Unlock, Lock, EyeOff, Eye, Flag, Target,
  Droplet, Leaf, Sprout, Utensils, Backpack, Wrench, Settings, RefreshCw,
  ArrowUp, ArrowDown, Plus, Minus, Percent, MessageCircle, Coins, Gem, PiggyBank,
  Sandwich, Receipt, Package, PartyPopper, ClipboardList, Trash2, Pin, Tags,
  PenLine, Diamond, type LucideIcon,
} from 'lucide-react'

// Semantic names used directly in UI (marketing sections, app chrome).
const NAMED: Record<string, LucideIcon> = {
  'book-open': BookOpen,
  unlock: Unlock,
  lightbulb: Lightbulb,
  pen: PenLine,
  'trending-up': TrendingUp,
  mirror: Sparkles,        // "a mirror, not a report card": reflective, no-judgment
  tags: Tags,
  pin: Pin,
  receipt: Receipt,
  star: Star,
  coins: Coins,
  sandwich: Sandwich,
  flame: Flame,
  gem: Gem,
  graduationcap: GraduationCap,
  calendar: Calendar,
  chart: BarChart3,
  'piggy-bank': PiggyBank,
  banknote: Banknote,
  package: Package,
  check: CircleCheck,
  x: CircleX,
  party: PartyPopper,
  clipboard: ClipboardList,
  trash: Trash2,
  diamond: Diamond,
}

// iOS SF Symbol name -> Lucide icon. Keyword-matched, most specific first
// (mirrors the ordering of the old emoji rules so category resolution is stable).
const SF_RULES: [RegExp, LucideIcon][] = [
  [/graduationcap/, GraduationCap],
  [/creditcard/, CreditCard],
  [/banknote|dollarsign|money|cash/, Banknote],
  [/chart\.pie/, PieChart],
  [/chart|xyaxis|uptrend/, BarChart3],
  [/calendar/, Calendar],
  [/clock|alarm|timer|stopwatch|hourglass/, Clock],
  [/bell/, Bell],
  [/checkmark\.shield|shield\.checkmark|lock\.shield/, ShieldCheck],
  [/exclamationmark|warning|triangle\.fill/, TriangleAlert],
  [/shield/, Shield],
  [/checkmark|seal/, CircleCheck],
  [/xmark|cross\.circle/, CircleX],
  [/cross\.case|cross\.fill|medical|heart\.text|stethoscope|pills|bandage/, Cross],
  [/heart/, Heart],
  [/star/, Star],
  [/flame/, Flame],
  [/bolt\.slash/, ZapOff],
  [/bolt/, Zap],
  [/lightbulb/, Lightbulb],
  [/brain/, Brain],
  [/book/, BookOpen],
  [/doc|note|text|paper|newspaper/, FileText],
  [/folder/, Folder],
  [/briefcase/, Briefcase],
  [/building\.columns|bank/, Landmark],
  [/building|house|home/, House],
  [/cart|bag/, ShoppingCart],
  [/gift/, Gift],
  [/airplane/, Plane],
  [/fuelpump/, Fuel],
  [/car\.|car$/, Car],
  [/bus/, Bus],
  [/bicycle/, Bike],
  [/globe|map/, Globe],
  [/envelope|mail/, Mail],
  [/phone|iphone|desktopcomputer|laptopcomputer/, Smartphone],
  [/camera/, Camera],
  [/headphones|music|speaker/, Headphones],
  [/gamecontroller/, Gamepad2],
  [/person\.2|person\.3|figure\.2|people|group/, Users],
  [/person|figure|face/, User],
  [/hand\.raised/, Hand],
  [/sparkles/, Sparkles],
  [/hands|handshake/, Handshake],
  [/lock\.open/, Unlock],
  [/lock|key/, Lock],
  [/eye\.slash/, EyeOff],
  [/eye/, Eye],
  [/flag/, Flag],
  [/target|scope|binoculars/, Target],
  [/drop|water/, Droplet],
  [/leaf|tree/, Leaf],
  [/seedling/, Sprout],
  [/fork\.knife|cup|takeout/, Utensils],
  [/backpack/, Backpack],
  [/gearshape|gear/, Settings],
  [/hammer|wrench/, Wrench],
  [/arrow\.up\.arrow\.down|arrow\.left\.arrow\.right|arrow\.2|squarepath|circlepath/, RefreshCw],
  [/arrow\.up/, ArrowUp],
  [/arrow\.down/, ArrowDown],
  [/plus/, Plus],
  [/minus/, Minus],
  [/percent/, Percent],
  [/bubble|message|text\.bubble/, MessageCircle],
]

function resolveSf(name?: string): LucideIcon {
  if (!name) return Diamond
  for (const [re, icon] of SF_RULES) if (re.test(name)) return icon
  return Banknote // finance-y default
}

type IconProps = {
  name?: string
  sf?: string
  size?: number | string
  strokeWidth?: number
  className?: string
  style?: React.CSSProperties
  'aria-hidden'?: boolean
}

export function Icon({ name, sf, size = '1em', strokeWidth = 2, className, style, ...rest }: IconProps) {
  const Cmp = sf !== undefined ? resolveSf(sf) : (name ? NAMED[name] ?? Diamond : Diamond)
  return (
    <Cmp
      size={size}
      strokeWidth={strokeWidth}
      className={className}
      style={style}
      aria-hidden={rest['aria-hidden'] ?? true}
    />
  )
}

export default Icon
