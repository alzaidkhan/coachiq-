export interface FoodPortion {
  name: string;
  amount: string; // e.g., "160g cooked", "3 large eggs (150g)", "2 rotis (80g)"
  grams: number;
  category: "protein" | "carbs" | "fats" | "micronutrients" | "hydration";
  why: string;
}

export interface DetailedMeal {
  id: string;
  mealNumber: string;
  name: string;
  timing: string;
  targetKcal: number;
  proteinGrams: number;
  carbsGrams: number;
  fatsGrams: number;
  focus: string;
  items: FoodPortion[];
  cricketTip: string;
}

export interface NutritionBreakdown {
  hasBodyMetrics: boolean;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  waterLiters: number;
  proteinPerKg: number;
  bmr: number;
  tdee: number;
  matchDayCalories: number;
  matchDayCarbs: number;
  meals: DetailedMeal[];
  matchDayMeals: DetailedMeal[];
}

export interface PlayerBioInput {
  heightCm?: string | number;
  weightKg?: string | number;
  age?: string | number;
  gender?: string;
  role?: string;
  level?: string;
  sessions?: string | number;
  minutes?: string | number;
  diet?: string;
}

export function checkHasBodyMetrics(bio: PlayerBioInput): boolean {
  const h = Number(bio.heightCm);
  const w = Number(bio.weightKg);
  return Boolean(h && h >= 100 && h <= 250 && w && w >= 30 && w <= 220);
}

export function calculateCricketNutrition(bio: PlayerBioInput): NutritionBreakdown {
  const hasBodyMetrics = checkHasBodyMetrics(bio);

  if (!hasBodyMetrics) {
    return {
      hasBodyMetrics: false,
      calories: 0,
      protein: 0,
      carbs: 0,
      fats: 0,
      waterLiters: 0,
      proteinPerKg: 0,
      bmr: 0,
      tdee: 0,
      matchDayCalories: 0,
      matchDayCarbs: 0,
      meals: [],
      matchDayMeals: [],
    };
  }

  const height = Number(bio.heightCm) || 172;
  const weight = Number(bio.weightKg) || 68;
  const age = Number(bio.age) || 21;
  const gender = bio.gender || "Male";
  const sessions = Number(bio.sessions) || 3;
  const role = bio.role || "All-rounder";
  const level = bio.level || "Intermediate";
  const diet = bio.diet || "Vegetarian";

  // 1. Basal Metabolic Rate (Mifflin-St Jeor)
  let bmr = 10 * weight + 6.25 * height - 5 * age;
  if (gender === "Female") {
    bmr -= 161;
  } else {
    bmr += 5;
  }

  // 2. Cricket Activity Multiplier
  // Fast bowlers & all-rounders have high eccentric run-up and delivery stride load
  let roleMultiplier = 1.48;
  if (role === "Fast bowler" || role === "Bowler") {
    roleMultiplier = 1.58;
  } else if (role === "All-rounder") {
    roleMultiplier = 1.55;
  } else if (role === "Wicketkeeper") {
    roleMultiplier = 1.52;
  } else if (role === "Batsman") {
    roleMultiplier = 1.48;
  } else if (role === "Spin bowler" || role === "Spinner") {
    roleMultiplier = 1.46;
  }

  // Training frequency adjustment
  const sessionModifier = Math.min(Math.max((sessions - 3) * 0.04, -0.06), 0.12);
  const levelModifier = level === "Advanced" ? 120 : level === "Intermediate" ? 60 : 0;

  const tdee = Math.round(bmr * (roleMultiplier + sessionModifier) + levelModifier);
  const calories = Math.max(tdee, 1800);

  // 3. Macronutrient Targets
  // Fast bowling / sprinting requires 1.7 - 2.0g/kg protein for tendon and muscular recovery
  const proteinRatio = (role === "Fast bowler" || role === "All-rounder") ? 1.8 : 1.6;
  const protein = Math.round(weight * proteinRatio);
  const fats = Math.round((calories * 0.25) / 9);
  const carbs = Math.round((calories - (protein * 4 + fats * 9)) / 4);

  // Match day demands extra glycogen for long innings or multiple bowling spells
  const matchDayCalories = Math.round(calories * 1.15);
  const matchDayCarbs = Math.round(carbs * 1.22);

  // Hydration baseline: 35ml per kg bodyweight + sweat replacement
  const waterLiters = Math.round((weight * 0.035 + (sessions >= 4 ? 0.75 : 0.5)) * 10) / 10;

  // Weight scale factor relative to 70kg standard athlete
  const scale = Math.max(weight / 70, 0.7);

  const meals = generateMeals(diet, calories, protein, carbs, fats, scale, false);
  const matchDayMeals = generateMeals(diet, matchDayCalories, protein, matchDayCarbs, fats, scale, true);

  return {
    hasBodyMetrics: true,
    calories,
    protein,
    carbs,
    fats,
    waterLiters,
    proteinPerKg: Number(proteinRatio.toFixed(1)),
    bmr: Math.round(bmr),
    tdee,
    matchDayCalories,
    matchDayCarbs,
    meals,
    matchDayMeals,
  };
}

function generateMeals(
  diet: string,
  calories: number,
  totalProtein: number,
  totalCarbs: number,
  totalFats: number,
  scale: number,
  isMatchDay: boolean
): DetailedMeal[] {
  const isNonVeg = diet === "Non-vegetarian";
  const isPlant = diet === "Plant-forward";

  // Meal 1: Breakfast (approx. 27% kcal)
  // Meal 2: Lunch (approx. 33% kcal)
  // Meal 3: Evening Pre-Practice Snack (approx. 16% kcal)
  // Meal 4: Dinner (approx. 24% kcal)

  if (isNonVeg) {
    return [
      {
        id: "meal-1",
        mealNumber: "01",
        name: isMatchDay ? "Pre-Match Power Breakfast" : "Morning Powerhouse & Net Prep",
        timing: "7:00 AM – 8:30 AM (2 hrs prior to morning session)",
        targetKcal: Math.round(calories * 0.28),
        proteinGrams: Math.round(totalProtein * 0.28),
        carbsGrams: Math.round(totalCarbs * 0.28),
        fatsGrams: Math.round(totalFats * 0.26),
        focus: "High-bioavailability protein with complex, slow-release carbohydrates",
        items: [
          {
            name: "Whole Eggs + Egg Whites",
            amount: `${Math.round(2 + scale)} whole eggs + 2 whites (${Math.round(180 * scale)}g)`,
            grams: Math.round(180 * scale),
            category: "protein",
            why: "Complete amino acid profile for muscle synthesis",
          },
          {
            name: "Toasted Multigrain or Sourdough Bread",
            amount: `${Math.round(2 * scale)} slices (${Math.round(75 * scale)}g)`,
            grams: Math.round(75 * scale),
            category: "carbs",
            why: "Sustained carbohydrate release for morning bowling/batting drills",
          },
          {
            name: "Fresh Banana or Seasonal Berries",
            amount: `1 medium (${Math.round(120 * scale)}g)`,
            grams: Math.round(120 * scale),
            category: "carbs",
            why: "Potassium & fast glycogen to prevent early cramp",
          },
          {
            name: "Natural Peanut Butter or Almond Butter",
            amount: `1 tbsp (${Math.round(16 * scale)}g)`,
            grams: Math.round(16 * scale),
            category: "fats",
            why: "Essential fatty acids and sustained satiety",
          },
        ],
        cricketTip: isMatchDay
          ? "Eat this at least 2.5 hours before the toss to ensure full gastric emptying before warm-ups."
          : "Hydrate with 400ml of water and a pinch of pink rock salt during breakfast.",
      },
      {
        id: "meal-2",
        mealNumber: "02",
        name: isMatchDay ? "Innings Break / Post-Session Refuel" : "Post-Training Recovery & Synthesis",
        timing: "12:30 PM – 1:45 PM (Within 60 mins of training)",
        targetKcal: Math.round(calories * 0.33),
        proteinGrams: Math.round(totalProtein * 0.35),
        carbsGrams: Math.round(totalCarbs * 0.33),
        fatsGrams: Math.round(totalFats * 0.28),
        focus: "Rapid muscle glycogen replenishment and lean tissue repair",
        items: [
          {
            name: "Grilled Chicken Breast or Baked Salmon",
            amount: `${Math.round(170 * scale)}g raw weighed`,
            grams: Math.round(170 * scale),
            category: "protein",
            why: "Lean leucine-rich protein for rapid muscle recovery",
          },
          {
            name: "Steamed Brown or Basmati Rice",
            amount: `${Math.round(200 * scale)}g cooked`,
            grams: Math.round(200 * scale),
            category: "carbs",
            why: "Primary glycogen refill for running between wickets",
          },
          {
            name: "Yellow Moong / Toor Dal",
            amount: `1 medium bowl (${Math.round(160 * scale)}g)`,
            grams: Math.round(160 * scale),
            category: "protein",
            why: "Digestible plant protein and gut-friendly fiber",
          },
          {
            name: "Sautéed Broccoli, Spinach & Carrots",
            amount: `${Math.round(150 * scale)}g steamed`,
            grams: Math.round(150 * scale),
            category: "micronutrients",
            why: "Antioxidants to reduce post-bowling inflammation",
          },
          {
            name: "Cold-Pressed Olive Oil or Ghee",
            amount: `1 tsp (${Math.round(6 * scale)}g)`,
            grams: Math.round(6 * scale),
            category: "fats",
            why: "Fat-soluble vitamin absorption (A, D, E, K)",
          },
        ],
        cricketTip: "Pair with an electrolyte or coconut water if you bowled more than 4 overs in heat.",
      },
      {
        id: "meal-3",
        mealNumber: "03",
        name: "Pre-Practice / Afternoon Energy Boost",
        timing: "4:30 PM – 5:30 PM (60-90 mins before evening session)",
        targetKcal: Math.round(calories * 0.16),
        proteinGrams: Math.round(totalProtein * 0.15),
        carbsGrams: Math.round(totalCarbs * 0.18),
        fatsGrams: Math.round(totalFats * 0.18),
        focus: "Lightweight energy that avoids stomach heaviness on the field",
        items: [
          {
            name: "Low-Fat Greek Yogurt / Fresh Hung Curd",
            amount: `${Math.round(150 * scale)}g`,
            grams: Math.round(150 * scale),
            category: "protein",
            why: "Probiotics and slow casein digestion",
          },
          {
            name: "Spiced Roasted Chana (Chickpeas)",
            amount: `${Math.round(40 * scale)}g`,
            grams: Math.round(40 * scale),
            category: "carbs",
            why: "Crunchy complex carb with iron and magnesium",
          },
          {
            name: "Fresh Crisp Apple or Orange",
            amount: `1 medium (${Math.round(140 * scale)}g)`,
            grams: Math.round(140 * scale),
            category: "carbs",
            why: "Natural fructose and hydration",
          },
          {
            name: "Raw Almonds or Walnuts",
            amount: `${Math.round(20 * scale)}g (approx. 12-14 nuts)`,
            grams: Math.round(20 * scale),
            category: "fats",
            why: "Magnesium to prevent nighttime hamstring tightness",
          },
        ],
        cricketTip: "Avoid fried stadium snacks or heavy pastries during this window.",
      },
      {
        id: "meal-4",
        mealNumber: "04",
        name: "Dinner & Overnight Musculoskeletal Repair",
        timing: "7:45 PM – 9:00 PM (At least 2 hrs before sleep)",
        targetKcal: Math.round(calories * 0.23),
        proteinGrams: Math.round(totalProtein * 0.22),
        carbsGrams: Math.round(totalCarbs * 0.21),
        fatsGrams: Math.round(totalFats * 0.28),
        focus: "Anti-inflammatory recovery and sleep-promoting nutrients",
        items: [
          {
            name: "Lean Chicken Curry, Fish Fillet or Tandoori Breast",
            amount: `${Math.round(160 * scale)}g cooked`,
            grams: Math.round(160 * scale),
            category: "protein",
            why: "Overnight protein synthesis for tissue reconstruction",
          },
          {
            name: "Whole Wheat Phulkas / Rotis",
            amount: `${Math.round(2 * scale)} rotis (${Math.round(80 * scale)}g)`,
            grams: Math.round(80 * scale),
            category: "carbs",
            why: "Complex carbohydrate base to restore liver glycogen",
          },
          {
            name: "Mixed Seasonal Sabzi (Gourd, Beans, Peas)",
            amount: `1 large bowl (${Math.round(160 * scale)}g)`,
            grams: Math.round(160 * scale),
            category: "micronutrients",
            why: "Micronutrients and gentle digestive fiber",
          },
          {
            name: "Low-Fat Cucumber Mint Raita",
            amount: `${Math.round(100 * scale)}g`,
            grams: Math.round(100 * scale),
            category: "hydration",
            why: "Cooling electrolyte support and calcium for bone density",
          },
        ],
        cricketTip: "Keep dinner low in refined sugars to maximize deep sleep and human growth hormone release.",
      },
    ];
  }

  if (isPlant) {
    return [
      {
        id: "meal-1",
        mealNumber: "01",
        name: isMatchDay ? "Plant-Powered Matchday Breakfast" : "Morning Tofu & Complex Carb Fuel",
        timing: "7:00 AM – 8:30 AM (2 hrs prior to morning session)",
        targetKcal: Math.round(calories * 0.28),
        proteinGrams: Math.round(totalProtein * 0.27),
        carbsGrams: Math.round(totalCarbs * 0.29),
        fatsGrams: Math.round(totalFats * 0.26),
        focus: "Plant protein matrix with sustained-release whole grains",
        items: [
          {
            name: "Organic Tofu Scramble with Turmeric & Spinach",
            amount: `${Math.round(200 * scale)}g firm tofu`,
            grams: Math.round(200 * scale),
            category: "protein",
            why: "Complete plant protein and anti-inflammatory turmeric",
          },
          {
            name: "Artisan Sourdough or 100% Rye Bread",
            amount: `${Math.round(2 * scale)} slices (${Math.round(80 * scale)}g)`,
            grams: Math.round(80 * scale),
            category: "carbs",
            why: "Clean ferment carbs easy on sensitive digestion",
          },
          {
            name: "Sliced Hass Avocado",
            amount: `${Math.round(50 * scale)}g`,
            grams: Math.round(50 * scale),
            category: "fats",
            why: "Monounsaturated fats for joint health",
          },
          {
            name: "Shelled Hemp Hearts & Chia Seeds",
            amount: `${Math.round(15 * scale)}g`,
            grams: Math.round(15 * scale),
            category: "protein",
            why: "Omega-3 fatty acids for cardiovascular endurance",
          },
        ],
        cricketTip: "Drink 350ml warm water with fresh lemon to kickstart morning metabolic activation.",
      },
      {
        id: "meal-2",
        mealNumber: "02",
        name: "Legume & Ancient Grain Recovery Bowl",
        timing: "12:30 PM – 1:45 PM (Post-training window)",
        targetKcal: Math.round(calories * 0.33),
        proteinGrams: Math.round(totalProtein * 0.34),
        carbsGrams: Math.round(totalCarbs * 0.34),
        fatsGrams: Math.round(totalFats * 0.28),
        focus: "High-protein pulses paired with complete amino acid grains",
        items: [
          {
            name: "Spiced Chickpeas (Chana) & Red Kidney Beans (Rajma)",
            amount: `${Math.round(220 * scale)}g cooked`,
            grams: Math.round(220 * scale),
            category: "protein",
            why: "Dense protein and sustained energy reserves",
          },
          {
            name: "Steamed Tri-Color Quinoa or Brown Rice",
            amount: `${Math.round(200 * scale)}g cooked`,
            grams: Math.round(200 * scale),
            category: "carbs",
            why: "Complete amino acid profile grain base",
          },
          {
            name: "Steamed Kale, Zucchini & Bell Peppers",
            amount: `${Math.round(160 * scale)}g`,
            grams: Math.round(160 * scale),
            category: "micronutrients",
            why: "Vitamin C to enhance plant-based iron absorption",
          },
          {
            name: "Pumpkin & Sunflower Seed Crunch",
            amount: `${Math.round(16 * scale)}g`,
            grams: Math.round(16 * scale),
            category: "fats",
            why: "Zinc and magnesium for cellular tissue repair",
          },
        ],
        cricketTip: "Squeeze fresh lemon juice over your legumes to triple non-heme iron absorption.",
      },
      {
        id: "meal-3",
        mealNumber: "03",
        name: "Pre-Session Edamame & Fruit Fuel",
        timing: "4:30 PM – 5:30 PM",
        targetKcal: Math.round(calories * 0.16),
        proteinGrams: Math.round(totalProtein * 0.16),
        carbsGrams: Math.round(totalCarbs * 0.18),
        fatsGrams: Math.round(totalFats * 0.18),
        focus: "Fast-absorbing plant carbs and easy-to-digest branch chain amino acids",
        items: [
          {
            name: "Steamed Edamame (in pods) or Soy Yogurt",
            amount: `${Math.round(150 * scale)}g`,
            grams: Math.round(150 * scale),
            category: "protein",
            why: "Fast-acting BCAAs for muscle preservation",
          },
          {
            name: "Soft Medjool Dates or 1 Ripe Banana",
            amount: `2 pieces (${Math.round(45 * scale)}g) or 1 banana (${Math.round(120 * scale)}g)`,
            grams: Math.round(50 * scale),
            category: "carbs",
            why: "Immediate glucose for high-intensity sprinting",
          },
          {
            name: "Raw Cashews & Almonds",
            amount: `${Math.round(22 * scale)}g`,
            grams: Math.round(22 * scale),
            category: "fats",
            why: "Sustained fuel preventing mid-session blood sugar drops",
          },
        ],
        cricketTip: "Keep portions measured to avoid any sluggishness during fielding drills.",
      },
      {
        id: "meal-4",
        mealNumber: "04",
        name: "Overnight Tempeh & Roasted Root Repair",
        timing: "7:45 PM – 9:00 PM",
        targetKcal: Math.round(calories * 0.23),
        proteinGrams: Math.round(totalProtein * 0.23),
        carbsGrams: Math.round(totalCarbs * 0.19),
        fatsGrams: Math.round(totalFats * 0.28),
        focus: "Fermented plant proteins and restful recovery complex carbs",
        items: [
          {
            name: "Pan-Seared Organic Tempeh or Marinated Seitan",
            amount: `${Math.round(180 * scale)}g cooked`,
            grams: Math.round(180 * scale),
            category: "protein",
            why: "Gut-friendly fermented whole bean protein matrix",
          },
          {
            name: "Roasted Sweet Potatoes or 2 Multigrain Rotis",
            amount: `${Math.round(180 * scale)}g sweet potato or 2 rotis (${Math.round(80 * scale)}g)`,
            grams: Math.round(180 * scale),
            category: "carbs",
            why: "Rich in beta-carotene for cellular recovery",
          },
          {
            name: "Roasted Cauliflower, Peas & Green Beans",
            amount: `${Math.round(170 * scale)}g`,
            grams: Math.round(170 * scale),
            category: "micronutrients",
            why: "Sulphur-rich cruciferous antioxidants",
          },
          {
            name: "Fresh Green Herb Salad with Olive Oil & Lemon",
            amount: `1 bowl (${Math.round(120 * scale)}g)`,
            grams: Math.round(120 * scale),
            category: "hydration",
            why: "Fiber, hydration and polyphenols",
          },
        ],
        cricketTip: "Drink a warm cup of chamomile or ashwagandha tea 45 minutes before sleep.",
      },
    ];
  }

  // Vegetarian (Default standard for cricket athlete conditioning)
  return [
    {
      id: "meal-1",
      mealNumber: "01",
      name: isMatchDay ? "Matchday High-Energy Oats & Paneer" : "High-Protein Cricket Breakfast",
      timing: "7:00 AM – 8:30 AM (2 hrs prior to morning session)",
      targetKcal: Math.round(calories * 0.28),
      proteinGrams: Math.round(totalProtein * 0.28),
      carbsGrams: Math.round(totalCarbs * 0.28),
      fatsGrams: Math.round(totalFats * 0.26),
      focus: "High-protein complex carbohydrates with sustained energy curve",
      items: [
        {
          name: "Rolled Oats cooked in Low-Fat Milk / Soy Milk",
          amount: `${Math.round(80 * scale)}g dry oats + 250ml milk`,
          grams: Math.round(80 * scale),
          category: "carbs",
          why: "Beta-glucan slow-release glycogen for 3-hour field sessions",
        },
        {
          name: "Fresh Low-Fat Paneer Bhurji OR Whey Protein Scoop",
          amount: `${Math.round(150 * scale)}g paneer OR 1 scoop (${Math.round(32 * scale)}g)`,
          grams: Math.round(150 * scale),
          category: "protein",
          why: "Rapid muscle protein synthesis and essential amino acids",
        },
        {
          name: "Ripe Banana or Pomegranate Seeds",
          amount: `1 medium (${Math.round(120 * scale)}g)`,
          grams: Math.round(120 * scale),
          category: "carbs",
          why: "Electrolytes and fast-acting monosaccharides",
        },
        {
          name: "Chia Seeds & Crushed Almonds",
          amount: `${Math.round(16 * scale)}g`,
          grams: Math.round(16 * scale),
          category: "fats",
          why: "Omega-3 fatty acids and joint lubrication",
        },
      ],
      cricketTip: isMatchDay
        ? "Finish this meal 2 to 2.5 hours before the first ball is bowled."
        : "Hydrate with at least 500ml of water throughout your morning routine.",
    },
    {
      id: "meal-2",
      mealNumber: "02",
      name: "High-Power Dal, Paneer & Rice Thali",
      timing: "12:30 PM – 1:45 PM (Post-training recovery)",
      targetKcal: Math.round(calories * 0.33),
      proteinGrams: Math.round(totalProtein * 0.34),
      carbsGrams: Math.round(totalCarbs * 0.33),
      fatsGrams: Math.round(totalFats * 0.28),
      focus: "Comprehensive glycogen restoration and muscle tissue remodeling",
      items: [
        {
          name: "Low-Fat Grilled Paneer or Soya Chunks Curry",
          amount: `${Math.round(160 * scale)}g paneer OR ${Math.round(60 * scale)}g dry soya`,
          grams: Math.round(160 * scale),
          category: "protein",
          why: "High leucine concentration for fast-twitch muscle fibers",
        },
        {
          name: "Steamed Brown or Basmati Rice",
          amount: `${Math.round(200 * scale)}g cooked`,
          grams: Math.round(200 * scale),
          category: "carbs",
          why: "Replenishes muscle glycogen depleted during batting & sprinting",
        },
        {
          name: "Thick Tadka Dal (Toor / Moong / Chana)",
          amount: `1 large bowl (${Math.round(180 * scale)}g cooked)`,
          grams: Math.round(180 * scale),
          category: "protein",
          why: "Potassium, plant protein and complex carbohydrates",
        },
        {
          name: "Sautéed French Beans, Carrots & Spinach",
          amount: `${Math.round(160 * scale)}g`,
          grams: Math.round(160 * scale),
          category: "micronutrients",
          why: "Vitamins A, C, and magnesium to fight oxidative stress",
        },
        {
          name: "Pure Desi Ghee or Cold-Pressed Oil",
          amount: `1 tsp (${Math.round(6 * scale)}g)`,
          grams: Math.round(6 * scale),
          category: "fats",
          why: "Nutrient absorption and gut barrier protection",
        },
      ],
      cricketTip: "Take 10 minutes of relaxed walking post-lunch to aid smooth digestion before afternoon reviews.",
    },
    {
      id: "meal-3",
      mealNumber: "03",
      name: "Pre-Practice Curd, Makhana & Chana Crunch",
      timing: "4:30 PM – 5:30 PM (60-90 mins before nets)",
      targetKcal: Math.round(calories * 0.16),
      proteinGrams: Math.round(totalProtein * 0.16),
      carbsGrams: Math.round(totalCarbs * 0.18),
      fatsGrams: Math.round(totalFats * 0.18),
      focus: "Lightweight, gut-soothing energy with zero gastrointestinal distress",
      items: [
        {
          name: "Thick Fresh Curd / Dahi (with cumin & rock salt)",
          amount: `${Math.round(160 * scale)}g`,
          grams: Math.round(160 * scale),
          category: "protein",
          why: "Gut microbiome cooling and steady casein protein",
        },
        {
          name: "Spiced Roasted Makhana (Foxnuts) & Roasted Chana",
          amount: `${Math.round(50 * scale)}g combined`,
          grams: Math.round(50 * scale),
          category: "carbs",
          why: "Low GI complex carbs that keep energy steady during nets",
        },
        {
          name: "1 Fresh Seasonal Pear or Apple",
          amount: `1 medium (${Math.round(140 * scale)}g)`,
          grams: Math.round(140 * scale),
          category: "carbs",
          why: "Hydration and fructose for immediate central nervous system alert",
        },
        {
          name: "Raw Walnuts & Almonds",
          amount: `${Math.round(20 * scale)}g (approx. 10-12 pieces)`,
          grams: Math.round(20 * scale),
          category: "fats",
          why: "Alpha-linolenic acid (ALA) for cardiovascular support",
        },
      ],
      cricketTip: "Sip 250ml water with a slice of lemon 30 minutes before stepping into the nets.",
    },
    {
      id: "meal-4",
      mealNumber: "04",
      name: "Dinner & Muscle Repair Thali",
      timing: "7:45 PM – 9:00 PM (2-3 hrs prior to bed)",
      targetKcal: Math.round(calories * 0.23),
      proteinGrams: Math.round(totalProtein * 0.23),
      carbsGrams: Math.round(totalCarbs * 0.21),
      fatsGrams: Math.round(totalFats * 0.28),
      focus: "Nighttime tissue repair and restorative electrolyte balance",
      items: [
        {
          name: "Soya Tikka / Sprouted Moong & Paneer Curry",
          amount: `${Math.round(160 * scale)}g`,
          grams: Math.round(160 * scale),
          category: "protein",
          why: "Sustained amino acid release across the 8-hour sleep window",
        },
        {
          name: "Whole Wheat Chapatis / Phulkas",
          amount: `${Math.round(2 * scale)} chapatis (${Math.round(80 * scale)}g)`,
          grams: Math.round(80 * scale),
          category: "carbs",
          why: "Satisfying fiber-rich complex grains",
        },
        {
          name: "Stir-Fried Seasonal Vegetables (Lauki, Bhindi, Methi)",
          amount: `1 bowl (${Math.round(160 * scale)}g)`,
          grams: Math.round(160 * scale),
          category: "micronutrients",
          why: "Micronutrients, dietary fiber and cellular hydration",
        },
        {
          name: "Low-Fat Cucumber Beetroot Raita",
          amount: `${Math.round(120 * scale)}g`,
          grams: Math.round(120 * scale),
          category: "hydration",
          why: "Beetroot nitrates promote overnight blood flow and tendon recovery",
        },
      ],
      cricketTip: "Avoid heavy spicy gravies late at night to keep resting heart rate low during sleep.",
    },
  ];
}
