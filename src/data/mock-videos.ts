export interface Video {
  id: string; title: string; subject: string; chapter: string; topic: string; language: string; duration: string;
  desc: string; objectives: string[]; takeaways: string[]; hue: string;
  questions: { q: string; options: string[]; answer: number }[];
}
export const VIDEOS: Video[] = [
  { id: "v1", title: "Solving x + a = b with a balance scale", subject: "Mathematics", chapter: "Linear Equations", topic: "Solving equations with one variable", language: "English", duration: "6:30", hue: "from-oxford to-oxford-500",
    desc: "A visual walkthrough of solving one-step equations using a balance scale.", objectives: ["Understand the balance idea", "Solve x + a = b", "Verify solutions"], takeaways: ["Do the same on both sides", "Use inverse operations", "Always check"], questions: [{ q: "Solve x + 5 = 12", options: ["5", "7", "17"], answer: 1 }] },
  { id: "v2", title: "Variables on both sides explained", subject: "Mathematics", chapter: "Linear Equations", topic: "Equations with variables on both sides", language: "English", duration: "8:10", hue: "from-oxford-600 to-crimson",
    desc: "Collect variable terms on one side and constants on the other.", objectives: ["Transpose terms", "Simplify equations"], takeaways: ["Move variables to one side", "Then constants"], questions: [{ q: "Solve 5x = 3x + 10", options: ["2", "5", "10"], answer: 1 }] },
  { id: "v3", title: "फैक्टराइज़ेशन: साझा गुणनखंड (Hindi)", subject: "Mathematics", chapter: "Factorisation", topic: "Common factors", language: "Hindi", duration: "7:45", hue: "from-crimson to-warn",
    desc: "Hindi walkthrough of taking out the common factor from algebraic expressions.", objectives: ["Find the HCF of terms", "Take out common factors"], takeaways: ["HCF of numbers and variables", "Verify by expanding"], questions: [{ q: "Factorise 6x + 9", options: ["3(2x+3)", "6(x+9)", "9(x+1)"], answer: 0 }] },
  { id: "v4", title: "Algebraic identities made simple", subject: "Mathematics", chapter: "Algebraic Expressions", topic: "Standard identities", language: "English", duration: "9:20", hue: "from-oxford to-sun-600",
    desc: "Learn (a+b)², (a−b)² and (a+b)(a−b) with area models.", objectives: ["Derive identities", "Apply in problems"], takeaways: ["(a+b)² = a²+2ab+b²"], questions: [{ q: "(a−b)² = ?", options: ["a²−b²", "a²−2ab+b²", "a²+2ab+b²"], answer: 1 }] },
  { id: "v5", title: "What is pressure?", subject: "Science", chapter: "Force and Pressure", topic: "Pressure", language: "English", duration: "5:50", hue: "from-success to-oxford",
    desc: "Understand pressure through everyday examples — nails, knives and camels' feet.", objectives: ["Define pressure", "Use P = F/A"], takeaways: ["Smaller area → greater pressure"], questions: [{ q: "SI unit of pressure?", options: ["Pascal", "Newton", "Joule"], answer: 0 }] },
  { id: "v6", title: "Atmospheric pressure at home", subject: "Science", chapter: "Force and Pressure", topic: "Atmospheric pressure", language: "English", duration: "6:05", hue: "from-oxford-500 to-success",
    desc: "Simple experiments that show air exerts pressure.", objectives: ["Explain atmospheric pressure"], takeaways: ["Air has weight"], questions: [{ q: "Air exerts pressure?", options: ["Yes", "No"], answer: 0 }] },
  { id: "v7", title: "Friends and foes: microorganisms", subject: "Science", chapter: "Microorganisms", topic: "Useful microorganisms", language: "English", duration: "7:15", hue: "from-success to-sun-600",
    desc: "Useful and harmful microorganisms in daily life.", objectives: ["Classify microorganisms", "Name uses"], takeaways: ["Lactobacillus makes curd"], questions: [{ q: "Curd is made by?", options: ["Yeast", "Lactobacillus"], answer: 1 }] },
  { id: "v8", title: "Types of crops and seasons", subject: "Science", chapter: "Crop Production and Management", topic: "Agricultural practices", language: "Hindi", duration: "6:40", hue: "from-warn to-success",
    desc: "Rabi and Kharif crops in Hindi.", objectives: ["Differentiate Rabi and Kharif"], takeaways: ["Kharif: monsoon; Rabi: winter"], questions: [{ q: "Paddy is a ___ crop", options: ["Rabi", "Kharif"], answer: 1 }] },
];
