export const BOARDS = [
  { id: "CBSE", label: "CBSE", desc: "Central Board of Secondary Education" },
  { id: "ICSE", label: "ICSE / CISCE", desc: "Council for the Indian School Certificate Examinations" },
  { id: "State Board", label: "State Board", desc: "Your state's school education board" },
  { id: "Other", label: "Other", desc: "International or other boards" },
];

export const CLASSES = ["1","2","3","4","5","6","7","8","9","10","11","12"];
export const SESSIONS = ["2025–26", "2026–27", "2027–28"];
export const MEDIUMS = ["English", "Hindi", "Regional language"];
export const ALL_SUBJECTS = ["Mathematics", "Science", "English", "Social Science", "Hindi", "Computer Science", "Sanskrit", "EVS"];

export const LANGUAGES: { name: string; native: string; status: "Available in demo" | "Planned" | "Requires validation" }[] = [
  { name: "Assamese", native: "অসমীয়া", status: "Planned" },
  { name: "Bengali", native: "বাংলা", status: "Requires validation" },
  { name: "Bodo", native: "बर'", status: "Planned" },
  { name: "Dogri", native: "डोगरी", status: "Planned" },
  { name: "Gujarati", native: "ગુજરાતી", status: "Requires validation" },
  { name: "Hindi", native: "हिन्दी", status: "Available in demo" },
  { name: "Kannada", native: "ಕನ್ನಡ", status: "Requires validation" },
  { name: "Kashmiri", native: "کٲشُر", status: "Planned" },
  { name: "Konkani", native: "कोंकणी", status: "Planned" },
  { name: "Maithili", native: "मैथिली", status: "Planned" },
  { name: "Malayalam", native: "മലയാളം", status: "Requires validation" },
  { name: "Manipuri", native: "মৈতৈলোন্", status: "Planned" },
  { name: "Marathi", native: "मराठी", status: "Requires validation" },
  { name: "Nepali", native: "नेपाली", status: "Planned" },
  { name: "Odia", native: "ଓଡ଼ିଆ", status: "Planned" },
  { name: "Punjabi", native: "ਪੰਜਾਬੀ", status: "Requires validation" },
  { name: "Sanskrit", native: "संस्कृतम्", status: "Planned" },
  { name: "Santali", native: "ᱥᱟᱱᱛᱟᱲᱤ", status: "Planned" },
  { name: "Sindhi", native: "سنڌي", status: "Planned" },
  { name: "Tamil", native: "தமிழ்", status: "Requires validation" },
  { name: "Telugu", native: "తెలుగు", status: "Requires validation" },
  { name: "Urdu", native: "اردو", status: "Planned" },
];
// English is the primary demo language; the 22 scheduled languages are listed separately.
export const UI_LANGUAGES = ["English", ...LANGUAGES.map((l) => l.name)];

export const LEARNING_PREFS = [
  { id: "Visual explanations", icon: "Eye", desc: "Diagrams, colour and pictures" },
  { id: "Step-by-step teaching", icon: "ListOrdered", desc: "One small step at a time" },
  { id: "Examples from daily life", icon: "Home", desc: "Everyday situations you know" },
  { id: "Examination-focused teaching", icon: "GraduationCap", desc: "What scores marks" },
  { id: "Interactive questions", icon: "MessageCircleQuestion", desc: "Questions as we go" },
  { id: "Story-based explanations", icon: "BookOpen", desc: "Learn through stories" },
];

export const TEACHING_STYLES = [
  { id: "Friendly teacher", desc: "Warm, encouraging, uses everyday examples." },
  { id: "Strict examination teacher", desc: "Concise, marks-oriented, flags common exam mistakes." },
  { id: "Step-by-step mathematics teacher", desc: "Breaks every problem into small numbered steps." },
  { id: "Visual teacher", desc: "Leans on diagrams, tables and colour." },
  { id: "Socratic teacher", desc: "Guides you with questions instead of giving answers." },
  { id: "Story-based teacher", desc: "Wraps concepts in short, memorable stories." },
  { id: "Revision teacher", desc: "Fast recap, key formulas and quick checks." },
];

export const CHAPTERS: Record<string, string[]> = {
  Mathematics: ["Rational Numbers","Linear Equations","Understanding Quadrilaterals","Data Handling","Squares and Square Roots","Cubes and Cube Roots","Comparing Quantities","Algebraic Expressions","Factorisation","Exponents and Powers"],
  Science: ["Crop Production and Management","Microorganisms","Synthetic Fibres and Plastics","Materials: Metals and Non-Metals","Coal and Petroleum","Combustion and Flame","Conservation of Plants and Animals","Cell Structure","Reproduction in Animals","Force and Pressure"],
  English: ["The Best Christmas Present","The Tsunami","Glimpses of the Past","Bepin Choudhury's Lapse of Memory","The Summit Within"],
  "Social Science": ["How, When and Where","From Trade to Territory","Ruling the Countryside","Tribals, Dikus and the Vision of a Golden Age","The Indian Constitution","Understanding Secularism"],
};

export const TOPICS: Record<string, string[]> = {
  "Linear Equations": ["Solving equations with one variable","Equations with variables on both sides","Reducing equations to simpler form","Word problems"],
  Factorisation: ["Common factors","Regrouping terms","Identities","Division of algebraic expressions"],
  "Algebraic Expressions": ["Terms and coefficients","Addition and subtraction","Multiplication","Standard identities"],
  "Exponents and Powers": ["Laws of exponents","Negative exponents","Standard form"],
  "Force and Pressure": ["Types of force","Pressure","Atmospheric pressure"],
  Microorganisms: ["Types of microorganisms","Useful microorganisms","Harmful microorganisms"],
  "Crop Production and Management": ["Agricultural practices","Irrigation","Harvesting and storage"],
};

export const SUBJECT_COLORS: Record<string, string> = {
  Mathematics: "#002147", Science: "#16A34A", English: "#DC143C", "Social Science": "#D97706",
  Hindi: "#7C3AED", "Computer Science": "#0891B2", Sanskrit: "#BE185D", EVS: "#65A30D",
};

export const COURSE_OUTLINE = [
  { chapter: "Linear Equations in One Variable", topics: [
    { id: "le-1", title: "What is a linear equation?", done: true },
    { id: "le-2", title: "Solving x + a = b", done: false, current: true },
    { id: "le-3", title: "Variables on both sides", done: false },
    { id: "le-4", title: "Equations with brackets and fractions", done: false },
    { id: "le-5", title: "Word problems", done: false },
  ]},
  { chapter: "Rational Numbers", topics: [
    { id: "rn-1", title: "Properties of rational numbers", done: true },
    { id: "rn-2", title: "Representation on number line", done: true },
  ]},
  { chapter: "Algebraic Expressions", topics: [
    { id: "ae-1", title: "Terms, factors and coefficients", done: true },
    { id: "ae-2", title: "Standard identities", done: false },
  ]},
];
