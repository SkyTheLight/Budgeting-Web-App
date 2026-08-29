import { 
  Utensils, 
  Car, 
  Briefcase, 
  Gamepad2, 
  Zap, 
  ShoppingBag, 
  Heart, 
  MoreHorizontal,
  TrendingUp,
  Home,
  Phone,
  CreditCard,
  DollarSign
} from "lucide-react";


export interface CategoryConfig {
  label: string;
  icon: React.ElementType;
  color: string;
}

export const categories: Record<string, CategoryConfig> = {
  Food: { label: "Food", icon: Utensils, color: "text-orange-500" },
  Transport: { label: "Transport", icon: Car, color: "text-blue-500" },
  Salary: { label: "Salary", icon: Briefcase, color: "text-green-500" },
  Entertainment: { label: "Entertainment", icon: Gamepad2, color: "text-purple-500" },
  Utilities: { label: "Utilities", icon: Zap, color: "text-yellow-500" },
  Shopping: { label: "Shopping", icon: ShoppingBag, color: "text-pink-500" },
  Health: { label: "Health", icon: Heart, color: "text-red-500" },
  Other: { label: "Other", icon: MoreHorizontal, color: "text-gray-500" },
  Income: { label: "Income", icon: TrendingUp, color: "text-emerald-500" },
  Rent: { label: "Rent", icon: Home, color: "text-indigo-500" },
  Phone: { label: "Phone", icon: Phone, color: "text-cyan-500" },
  Insurance: { label: "Insurance", icon: CreditCard, color: "text-teal-500" },
  Investment: { label: "Investment", icon: DollarSign, color: "text-amber-500" },
};

export function getCategoryIcon(category: string) {
  const Icon = categories[category]?.icon || MoreHorizontal;
  const colorClass = categories[category]?.color || "text-gray-500";
  return { Icon, colorClass };
}

export const categoryList = [
  "Food",
  "Transport",
  "Salary",
  "Entertainment",
  "Utilities",
  "Shopping",
  "Health",
  "Other",
];
