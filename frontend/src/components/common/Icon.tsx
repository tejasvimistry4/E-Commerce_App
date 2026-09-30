import React from "react";
import * as FeatherIcons from "react-icons/fi";
import { FaFire } from "react-icons/fa";
import { LogoIcon } from "../../assets/icons/custom/LogoIcon";

export type IconName =
  | "package"
  | "truck"
  | "clock"
  | "check"
  | "check-circle"
  | "x-circle"
  | "close"
  | "x"
  | "search"
  | "arrow-right"
  | "arrow-left"
  | "chevron-left"
  | "chevron-right"
  | "chevron-down"
  | "chevron-up"
  | "shopping-bag"
  | "cart"
  | "map-pin"
  | "credit-card"
  | "copy"
  | "calendar"
  | "printer"
  | "shield"
  | "lock"
  | "user"
  | "phone"
  | "mail"
  | "file-text"
  | "tag"
  | "alert-triangle"
  | "help-circle"
  | "info"
  | "plus"
  | "edit"
  | "trash"
  | "filter"
  | "sliders"
  | "dollar"
  | "eye"
  | "eye-off"
  | "grid"
  | "list"
  | "heart"
  | "star"
  | "layers"
  | "users"
  | "activity"
  | "award"
  | "logout"
  | "refresh"
  | "rotate-ccw"
  | "external-link"
  | "globe"
  | "zap"
  | "percent"
  | "gift"
  | "trending-up"
  | "trending-down"
  | "message-square"
  | "folder"
  | "more-vertical"
  | "upload-cloud"
  | "fire"
  | "download"
  | "file"
  | "logo";

export interface ReusableIconProps extends React.SVGProps<SVGSVGElement> {
  name: IconName;
  size?: number | string;
  className?: string;
  color?: string;
}

const ICON_MAP: Record<IconName, React.ComponentType<any>> = {
  package: FeatherIcons.FiPackage,
  truck: FeatherIcons.FiTruck,
  clock: FeatherIcons.FiClock,
  check: FeatherIcons.FiCheck,
  "check-circle": FeatherIcons.FiCheckCircle,
  "x-circle": FeatherIcons.FiXCircle,
  close: FeatherIcons.FiX,
  x: FeatherIcons.FiX,
  search: FeatherIcons.FiSearch,
  "arrow-right": FeatherIcons.FiArrowRight,
  "arrow-left": FeatherIcons.FiArrowLeft,
  "chevron-left": FeatherIcons.FiChevronLeft,
  "chevron-right": FeatherIcons.FiChevronRight,
  "chevron-down": FeatherIcons.FiChevronDown,
  "chevron-up": FeatherIcons.FiChevronUp,
  "shopping-bag": FeatherIcons.FiShoppingBag,
  cart: FeatherIcons.FiShoppingCart,
  "map-pin": FeatherIcons.FiMapPin,
  "credit-card": FeatherIcons.FiCreditCard,
  copy: FeatherIcons.FiCopy,
  calendar: FeatherIcons.FiCalendar,
  printer: FeatherIcons.FiPrinter,
  shield: FeatherIcons.FiShield,
  lock: FeatherIcons.FiLock,
  user: FeatherIcons.FiUser,
  phone: FeatherIcons.FiPhone,
  mail: FeatherIcons.FiMail,
  "file-text": FeatherIcons.FiFileText,
  tag: FeatherIcons.FiTag,
  "alert-triangle": FeatherIcons.FiAlertTriangle,
  "help-circle": FeatherIcons.FiHelpCircle,
  info: FeatherIcons.FiInfo,
  plus: FeatherIcons.FiPlus,
  edit: FeatherIcons.FiEdit2,
  trash: FeatherIcons.FiTrash2,
  filter: FeatherIcons.FiSliders,
  sliders: FeatherIcons.FiSliders,
  dollar: FeatherIcons.FiDollarSign,
  eye: FeatherIcons.FiEye,
  "eye-off": FeatherIcons.FiEyeOff,
  grid: FeatherIcons.FiGrid,
  list: FeatherIcons.FiList,
  heart: FeatherIcons.FiHeart,
  star: FeatherIcons.FiStar,
  layers: FeatherIcons.FiLayers,
  users: FeatherIcons.FiUsers,
  activity: FeatherIcons.FiActivity,
  award: FeatherIcons.FiAward,
  logout: FeatherIcons.FiLogOut,
  refresh: FeatherIcons.FiRefreshCw,
  "rotate-ccw": FeatherIcons.FiRotateCcw,
  "external-link": FeatherIcons.FiExternalLink,
  globe: FeatherIcons.FiGlobe,
  zap: FeatherIcons.FiZap,
  percent: FeatherIcons.FiPercent,
  gift: FeatherIcons.FiGift,
  "trending-up": FeatherIcons.FiTrendingUp,
  "trending-down": FeatherIcons.FiTrendingDown,
  "message-square": FeatherIcons.FiMessageSquare,
  folder: FeatherIcons.FiFolder,
  "more-vertical": FeatherIcons.FiMoreVertical,
  "upload-cloud": FeatherIcons.FiUploadCloud,
  fire: FaFire,
  download: FeatherIcons.FiDownload,
  file: FeatherIcons.FiFile,
  logo: LogoIcon,
};

export const Icon: React.FC<ReusableIconProps> = ({
  name,
  size = 20,
  className = "",
  color,
  ...props
}) => {
  const Component = ICON_MAP[name];

  if (!Component) {
    return null;
  }

  return <Component size={size} className={className} color={color} {...props} />;
};

export default Icon;
