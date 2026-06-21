// Shared labels for the providers directory (server page + client card).

export const EMIRATES_LABELS_AR: Record<string, string> = {
  'Dubai': 'دبي', 'Abu Dhabi': 'أبوظبي', 'Sharjah': 'الشارقة',
  'Ras Al Khaimah': 'رأس الخيمة', 'Ajman': 'عجمان',
  'Umm Al Quwain': 'أم القيوين', 'Fujairah': 'الفجيرة',
}

export const CATEGORY_LABELS_AR: Record<string, string> = {
  'Restaurant': 'مطعم',
  'Restaurant Management': 'إدارة مطاعم',
  'Fast Food': 'وجبات سريعة',
  'Café & Coffee': 'مقهى وقهوة',
  'Supermarket': 'سوبرماركت',
  'Grocery': 'بقالة',
  'Bakery & Pastry': 'مخبز وحلويات',
  'Catering': 'تموين وضيافة',
  'Hospitality Services': 'خدمات ضيافة',
  'Seafood': 'مأكولات بحرية',
  'Meat & Poultry': 'لحوم ودواجن',
  'Dairy': 'ألبان',
  'Dairy & Eggs': 'ألبان وبيض',
  'Frozen Foods': 'أغذية مجمدة',
  'Beverages & Juices': 'مشروبات وعصائر',
  'Chocolate & Sweets': 'شوكولاتة وحلوى',
  'Spices & Condiments': 'توابل وبهارات',
  'Grains & Flour': 'حبوب ودقيق',
  'Oils & Fats': 'زيوت ودهون',
  'Organic & Natural': 'أغذية عضوية',
  'Health & Nutrition': 'صحة وتغذية',
  'Snacks': 'وجبات خفيفة',
  'Grocery & General Food': 'بقالة وغذاء عام',
  'Food Packaging': 'تعبئة وتغليف',
  'General Trading': 'تجارة عامة',
  'Foodstuff Trading': 'تجارة مواد غذائية',
}

// Curated chip order (rest appended dynamically by live count).
export const TRADING_CATEGORIES = [
  'Foodstuff Trading', 'Restaurant', 'Café & Coffee', 'Catering',
  'Beverages & Juices', 'Oils & Fats', 'Bakery & Pastry', 'Supermarket',
  'Seafood', 'Meat & Poultry', 'Grains & Flour', 'Health & Nutrition',
  'Chocolate & Sweets', 'Spices & Condiments', 'Dairy & Eggs', 'Organic & Natural',
  'Snacks', 'Fast Food', 'Frozen Foods', 'General Trading',
]

export const catLabel = (cat: string, isAr: boolean) =>
  isAr ? (CATEGORY_LABELS_AR[cat] ?? cat) : cat

export const emirateLabel = (em: string | null, isAr: boolean) =>
  isAr ? (EMIRATES_LABELS_AR[em ?? ''] ?? em) : em
