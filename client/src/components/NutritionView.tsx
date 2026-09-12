import React, { useState } from "react";
import {
  Utensils,
  Ruler,
  Scale,
  Sparkles,
  AlertCircle,
  ShieldCheck,
  Flame,
  Droplets,
  Dumbbell,
  Check,
  ChevronRight,
  ChevronDown,
  Clock,
  Apple,
  Zap,
  Info,
  Edit3,
  Calendar,
} from "lucide-react";
import {
  calculateCricketNutrition,
  checkHasBodyMetrics,
  type DetailedMeal,
  type FoodPortion,
} from "../lib/nutritionEngine";
import { ASSET_IMAGES, handleAssetImageError } from "../lib/media";
import { portableAssets } from "../lib/portableAssets";

export interface Profile {
  name?: string;
  age?: string;
  gender?: string;
  role?: string;
  level?: string;
  goal?: string;
  sessions?: string;
  minutes?: string;
  heightCm?: string;
  weightKg?: string;
  diet?: string;
  availableDays?: string;
  equipment?: string;
  improvementNote?: string;
  avatarUrl?: string;
}

interface NutritionViewProps {
  profile: Profile;
  onUpdateMetrics: (heightCm: string, weightKg: string, diet?: string) => void;
}

export function NutritionView({ profile, onUpdateMetrics }: NutritionViewProps) {
  const hasBodyMetrics = checkHasBodyMetrics({
    heightCm: profile.heightCm,
    weightKg: profile.weightKg,
  });

  const [inputHeight, setInputHeight] = useState(profile.heightCm || "");
  const [inputWeight, setInputWeight] = useState(profile.weightKg || "");
  const [inputDiet, setInputDiet] = useState(profile.diet || "Vegetarian");
  const [showEditDrawer, setShowEditDrawer] = useState(!hasBodyMetrics);
  const [dayMode, setDayMode] = useState<"training" | "match">("training");
  const [activeDietTab, setActiveDietTab] = useState<string>(profile.diet || "Vegetarian");
  const [errorMessage, setErrorMessage] = useState("");

  const nutritionData = calculateCricketNutrition({
    ...profile,
    diet: activeDietTab,
    heightCm: profile.heightCm,
    weightKg: profile.weightKg,
  });

  const currentMeals = dayMode === "match" ? nutritionData.matchDayMeals : nutritionData.meals;
  const currentCalories = dayMode === "match" ? nutritionData.matchDayCalories : nutritionData.calories;
  const currentCarbs = dayMode === "match" ? nutritionData.matchDayCarbs : nutritionData.carbs;

  const handleSaveMetrics = (e: React.FormEvent) => {
    e.preventDefault();
    const h = Number(inputHeight);
    const w = Number(inputWeight);

    if (!h || h < 100 || h > 240) {
      setErrorMessage("Please enter a valid height between 100 cm and 240 cm.");
      return;
    }
    if (!w || w < 30 || w > 220) {
      setErrorMessage("Please enter a valid body weight between 30 kg and 220 kg.");
      return;
    }

    setErrorMessage("");
    onUpdateMetrics(String(h), String(w), inputDiet);
    setActiveDietTab(inputDiet);
    setShowEditDrawer(false);
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Hero Card */}
      <section className="paper-card overflow-hidden">
        <div className="relative h-56 sm:h-64">
          <img
            src={ASSET_IMAGES.nutrition}
            alt="Cricket sports conditioning & athletic fueling"
            className="h-full w-full object-cover"
            onError={(e) => handleAssetImageError(e, "nutrition")}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#142319]/90 via-[#142319]/50 to-transparent" />
          <div className="absolute bottom-6 left-6 right-6 flex flex-wrap items-end justify-between gap-4 text-[#f5efe8]">
            <div>
              <div className="eyebrow flex items-center gap-2 text-[#c7d2c6]">
                <Utensils size={14} className="text-[#e66a2c]" /> Cricket Athletic Fuel Plan
              </div>
              <h2 className="mt-2 font-display text-3xl font-semibold tracking-[-0.05em] sm:text-4xl">
                {hasBodyMetrics ? "Custom Fuel & Exact Meal Portions" : "Measurements Required"}
              </h2>
              <p className="mt-1 text-xs text-[#d0ded0] sm:text-sm">
                {hasBodyMetrics
                  ? `Precision daily grams for ${profile.heightCm} cm · ${profile.weightKg} kg · ${profile.role} · ${profile.level}`
                  : "Enter your height and weight below to calculate calories and exact meal grams."}
              </p>
            </div>
            {hasBodyMetrics && (
              <button
                type="button"
                onClick={() => setShowEditDrawer((prev) => !prev)}
                className="inline-flex items-center gap-2 rounded-xl border border-white/25 bg-white/10 px-4 py-2 text-xs font-bold text-white shadow backdrop-blur transition hover:bg-white/20"
              >
                <Edit3 size={14} /> {showEditDrawer ? "Close Metrics" : "Adjust Height / Weight"}
              </button>
            )}
          </div>
        </div>
      </section>

      {/* 2. Gate View: If Height & Weight are NOT yet provided */}
      {!hasBodyMetrics && (
        <section className="rounded-3xl border border-[#e8ded5] bg-[#fffaf5] p-6 shadow-sm sm:p-8">
          <div className="mx-auto max-w-2xl">
            <div className="flex items-center gap-3">
              <span className="inline-grid h-12 w-12 place-items-center rounded-2xl bg-[#fff0e7] text-[#d65a20]">
                <Scale size={24} />
              </span>
              <div>
                <div className="eyebrow text-[#b45124]">Step 1 · Biometric Baseline</div>
                <h3 className="font-display text-2xl font-semibold tracking-[-0.04em] text-[#2b372d]">
                  Enter height and weight to unlock your meal plan
                </h3>
              </div>
            </div>

            <p className="mt-4 text-sm leading-6 text-[#726960]">
              To give you accurate calorie requirements, macronutrient distributions, and <strong>exact food gram portions</strong> for each meal, CoachIQ requires your biometric baseline. Without your height and weight, generic meal estimates can compromise athletic performance or recovery.
            </p>

            <form onSubmit={handleSaveMetrics} className="mt-6 rounded-2xl border border-[#ebdcd0] bg-white p-5 sm:p-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="field-label">
                  <span className="flex items-center gap-1.5 font-bold">
                    <Ruler size={15} className="text-[#d65a20]" /> Height (cm) <span className="text-[#d65a20]">*</span>
                  </span>
                  <input
                    type="number"
                    min={100}
                    max={240}
                    value={inputHeight}
                    onChange={(e) => {
                      setInputHeight(e.target.value);
                      if (errorMessage) setErrorMessage("");
                    }}
                    placeholder="e.g. 175"
                    className="field-input mt-1.5"
                    required
                  />
                  <span className="mt-1 block text-[11px] text-[#978e84]">Standard range: 120 – 220 cm</span>
                </label>

                <label className="field-label">
                  <span className="flex items-center gap-1.5 font-bold">
                    <Scale size={15} className="text-[#d65a20]" /> Body Weight (kg) <span className="text-[#d65a20]">*</span>
                  </span>
                  <input
                    type="number"
                    min={30}
                    max={220}
                    value={inputWeight}
                    onChange={(e) => {
                      setInputWeight(e.target.value);
                      if (errorMessage) setErrorMessage("");
                    }}
                    placeholder="e.g. 68"
                    className="field-input mt-1.5"
                    required
                  />
                  <span className="mt-1 block text-[11px] text-[#978e84]">Standard range: 35 – 150 kg</span>
                </label>

                <label className="field-label sm:col-span-2">
                  <span className="flex items-center gap-1.5 font-bold">
                    <Utensils size={15} className="text-[#d65a20]" /> Food Preference
                  </span>
                  <select
                    value={inputDiet}
                    onChange={(e) => setInputDiet(e.target.value)}
                    className="field-input mt-1.5"
                  >
                    <option value="Vegetarian">Vegetarian (Paneer, Dal, Oats, Curd, Chana, Ghee)</option>
                    <option value="Non-vegetarian">Non-vegetarian (Eggs, Chicken, Fish, Rice, Dal)</option>
                    <option value="Plant-forward">Plant-forward / Vegan (Tofu, Tempeh, Legumes, Quinoa)</option>
                    <option value="No preference">No preference (Flexible combinations)</option>
                  </select>
                </label>
              </div>

              {errorMessage && (
                <div className="mt-4 flex items-center gap-2 rounded-xl border border-[#f0c2a7] bg-[#fff4ed] p-3 text-xs font-semibold text-[#b45124]">
                  <AlertCircle size={16} /> {errorMessage}
                </div>
              )}

              <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-[#f0ece6] pt-4">
                <div className="flex items-center gap-2 text-xs text-[#8c8278]">
                  <ShieldCheck size={15} className="text-[#497052]" />
                  <span>Stored privately on this device</span>
                </div>
                <button type="submit" className="primary-button">
                  <Sparkles size={16} /> Calculate & Unlock Meal Plan
                </button>
              </div>
            </form>

            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-[#ebdcd0] bg-[#fdfcf9] p-4 text-xs text-[#746b62]">
                <strong className="block text-sm font-bold text-[#2a362c]">BMR & TDEE Accuracy</strong>
                <p className="mt-1 leading-5">Calculates baseline metabolic rate and training-day calorie expenditure using sports-grade formulas.</p>
              </div>
              <div className="rounded-2xl border border-[#ebdcd0] bg-[#fdfcf9] p-4 text-xs text-[#746b62]">
                <strong className="block text-sm font-bold text-[#2a362c]">Exact Gram Portions</strong>
                <p className="mt-1 leading-5">Scales protein, carbs, fats, and fiber in grams to support muscle synthesis and sprint recovery.</p>
              </div>
              <div className="rounded-2xl border border-[#ebdcd0] bg-[#fdfcf9] p-4 text-xs text-[#746b62]">
                <strong className="block text-sm font-bold text-[#2a362c]">Role-Aware Demands</strong>
                <p className="mt-1 leading-5">Fast bowlers, batsmen, and keepers get tailored ratios matching their biomechanical output.</p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 3. Inline Edit Drawer (when user toggles "Adjust Height / Weight") */}
      {hasBodyMetrics && showEditDrawer && (
        <section className="rounded-2xl border border-[#ebdcd0] bg-[#fff8f3] p-5 shadow-sm sm:p-6">
          <div className="flex items-start justify-between">
            <div>
              <div className="eyebrow text-[#b45124]">Update Biometrics</div>
              <h3 className="font-display text-xl font-semibold tracking-[-0.03em] text-[#2b372d]">
                Adjust Height, Weight & Diet
              </h3>
            </div>
            <button
              type="button"
              onClick={() => setShowEditDrawer(false)}
              className="text-xs font-bold text-[#8b8277] hover:text-[#2b372d]"
            >
              Cancel
            </button>
          </div>

          <form onSubmit={handleSaveMetrics} className="mt-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <label className="field-label">
                Height (cm)
                <input
                  type="number"
                  min={100}
                  max={240}
                  value={inputHeight}
                  onChange={(e) => setInputHeight(e.target.value)}
                  className="field-input mt-1"
                  required
                />
              </label>
              <label className="field-label">
                Weight (kg)
                <input
                  type="number"
                  min={30}
                  max={220}
                  value={inputWeight}
                  onChange={(e) => setInputWeight(e.target.value)}
                  className="field-input mt-1"
                  required
                />
              </label>
              <label className="field-label">
                Diet Preference
                <select
                  value={inputDiet}
                  onChange={(e) => setInputDiet(e.target.value)}
                  className="field-input mt-1"
                >
                  <option value="Vegetarian">Vegetarian</option>
                  <option value="Non-vegetarian">Non-vegetarian</option>
                  <option value="Plant-forward">Plant-forward</option>
                  <option value="No preference">No preference</option>
                </select>
              </label>
            </div>

            {errorMessage && (
              <div className="mt-3 text-xs font-semibold text-[#b45124]">
                {errorMessage}
              </div>
            )}

            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowEditDrawer(false)}
                className="ghost-button"
              >
                Close
              </button>
              <button type="submit" className="primary-button">
                <Check size={14} /> Save & Recalculate
              </button>
            </div>
          </form>
        </section>
      )}

      {/* 4. Full Unlocked Meal Plan (Only when Height & Weight are gathered) */}
      {hasBodyMetrics && (
        <>
          {/* Day Mode & Diet Selector Controls */}
          <section className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[#eee6de] bg-[#fbf9f6] p-4">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-[0.1em] text-[#8e8479]">Day Mode:</span>
              <div className="inline-flex rounded-xl border border-[#e4dbd0] bg-[#f3eee7] p-1">
                <button
                  type="button"
                  onClick={() => setDayMode("training")}
                  className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                    dayMode === "training"
                      ? "bg-[#1d3024] text-white shadow-sm"
                      : "text-[#626e64] hover:text-[#1d3024]"
                  }`}
                >
                  Training & Practice Day
                </button>
                <button
                  type="button"
                  onClick={() => setDayMode("match")}
                  className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                    dayMode === "match"
                      ? "bg-[#e66a2c] text-white shadow-sm"
                      : "text-[#626e64] hover:text-[#1d3024]"
                  }`}
                >
                  🏏 Match Day (+15% Carbs)
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-[0.1em] text-[#8e8479]">Diet:</span>
              <div className="inline-flex rounded-xl border border-[#e4dbd0] bg-[#f3eee7] p-1">
                {(["Vegetarian", "Non-vegetarian", "Plant-forward"] as const).map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setActiveDietTab(tab)}
                    className={`rounded-lg px-2.5 py-1 text-xs font-bold transition ${
                      activeDietTab === tab
                        ? "bg-[#1d3024] text-white shadow-sm"
                        : "text-[#626e64] hover:text-[#1d3024]"
                    }`}
                  >
                    {tab.replace("Vegetarian", "Veg").replace("Non-vegetarian", "Non-Veg").replace("Plant-forward", "Vegan")}
                  </button>
                ))}
              </div>
            </div>
          </section>

          {/* Daily Metric Cards */}
          <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <div className="nutrition-metric">
              <div className="flex items-center justify-between text-[#d65a20]">
                <Flame size={18} />
                <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#978e84]">
                  {dayMode === "match" ? "Match Day" : "Daily Energy"}
                </span>
              </div>
              <div className="mt-2 font-display text-2xl font-semibold text-[#1f2b22]">{currentCalories} <span className="text-sm font-medium text-[#847b71]">kcal</span></div>
              <div className="nutrition-label">BMR: {nutritionData.bmr} kcal · TDEE: {nutritionData.tdee}</div>
            </div>

            <div className="nutrition-metric">
              <div className="flex items-center justify-between text-[#386546]">
                <Dumbbell size={18} />
                <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#978e84]">Protein</span>
              </div>
              <div className="mt-2 font-display text-2xl font-semibold text-[#1f2b22]">{nutritionData.protein} <span className="text-sm font-medium text-[#847b71]">g</span></div>
              <div className="nutrition-label">{nutritionData.proteinPerKg}g / kg bodyweight</div>
            </div>

            <div className="nutrition-metric">
              <div className="flex items-center justify-between text-[#b45124]">
                <Zap size={18} />
                <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#978e84]">Carbohydrates</span>
              </div>
              <div className="mt-2 font-display text-2xl font-semibold text-[#1f2b22]">{currentCarbs} <span className="text-sm font-medium text-[#847b71]">g</span></div>
              <div className="nutrition-label">{Math.round((currentCarbs * 4 / currentCalories) * 100)}% of daily fuel</div>
            </div>

            <div className="nutrition-metric">
              <div className="flex items-center justify-between text-[#7d6837]">
                <Utensils size={18} />
                <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#978e84]">Healthy Fats</span>
              </div>
              <div className="mt-2 font-display text-2xl font-semibold text-[#1f2b22]">{nutritionData.fats} <span className="text-sm font-medium text-[#847b71]">g</span></div>
              <div className="nutrition-label">{Math.round((nutritionData.fats * 9 / currentCalories) * 100)}% of daily fuel</div>
            </div>

            <div className="nutrition-metric sm:col-span-2 lg:col-span-1">
              <div className="flex items-center justify-between text-[#2e6884]">
                <Droplets size={18} />
                <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#978e84]">Hydration Target</span>
              </div>
              <div className="mt-2 font-display text-2xl font-semibold text-[#1f2b22]">{nutritionData.waterLiters} <span className="text-sm font-medium text-[#847b71]">L / day</span></div>
              <div className="nutrition-label">+500ml per hour of net practice</div>
            </div>
          </section>

          {/* Detailed Meal Cards with Exact Grams and Portions */}
          <section className="space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <div className="eyebrow">Precision Meal Schedule</div>
                <h3 className="font-display text-2xl font-semibold tracking-[-0.04em] text-[#243328]">
                  Daily Meals & Exact Gram Portions
                </h3>
              </div>
              <span className="rounded-full bg-[#eaf1ea] px-3 py-1 text-xs font-bold text-[#35583f]">
                {activeDietTab} Plan
              </span>
            </div>

            <div className="grid gap-5">
              {currentMeals.map((meal) => (
                <MealCard key={meal.id} meal={meal} />
              ))}
            </div>
          </section>

          {/* Hydration & Supplementation Guide */}
          <section className="grid gap-5 md:grid-cols-2">
            <div className="surface-card p-5 sm:p-6">
              <div className="flex items-center gap-3 text-[#2a627c]">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#e6f1f7]">
                  <Droplets size={20} />
                </span>
                <div>
                  <div className="eyebrow text-[#4f7f98]">Cricket Fluid Protocol</div>
                  <h4 className="font-display text-lg font-semibold text-[#203126]">Electrolytes & Hydration Timing</h4>
                </div>
              </div>
              <ul className="mt-4 space-y-2 text-xs leading-5 text-[#636e65]">
                <li className="flex gap-2">
                  <span className="font-bold text-[#2a627c]">1. Morning:</span>
                  <span>Drink 500ml room-temperature water upon waking to rehydrate internal organs.</span>
                </li>
                <li className="flex gap-2">
                  <span className="font-bold text-[#2a627c]">2. Pre-Session:</span>
                  <span>Sip 300ml with a pinch of salt / electrolyte 45 minutes before stepping onto the pitch.</span>
                </li>
                <li className="flex gap-2">
                  <span className="font-bold text-[#2a627c]">3. During Play:</span>
                  <span>Take 150-200ml every 20-30 minutes at drinks breaks or overs changes.</span>
                </li>
                <li className="flex gap-2">
                  <span className="font-bold text-[#2a627c]">4. Post-Match:</span>
                  <span>Drink 1.25L of fluids for every 1kg of sweat lost during bowling or long batting stints.</span>
                </li>
              </ul>
            </div>

            <div className="coach-note-card p-5 sm:p-6">
              <div className="flex items-center gap-3 text-[#b45124]">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#fff0e7]">
                  <Apple size={20} />
                </span>
                <div>
                  <div className="eyebrow text-[#b45124]">CoachIQ Food Rules</div>
                  <h4 className="font-display text-lg font-semibold text-[#2b362c]">The 3 Golden Rules</h4>
                </div>
              </div>
              <ul className="mt-4 space-y-2 text-xs leading-5 text-[#765d4f]">
                <li className="flex gap-2">
                  <strong className="text-[#3c2a21]">1. No New Foods on Matchday:</strong>
                  <span>Stick to tried-and-tested meals you have eaten during weekday practice.</span>
                </li>
                <li className="flex gap-2">
                  <strong className="text-[#3c2a21]">2. Leucine Spike:</strong>
                  <span>Ensure at least 25g-35g of protein per main meal to trigger muscle protein synthesis.</span>
                </li>
                <li className="flex gap-2">
                  <strong className="text-[#3c2a21]">3. Low GI Pre-Game:</strong>
                  <span>Prioritize whole grains (oats, brown rice, whole wheat) over refined sweets before play.</span>
                </li>
              </ul>
            </div>
          </section>

          {/* 5. Comprehensive Bottom Disclaimer (MANDATORY) */}
          <footer className="mt-8 rounded-2xl border border-[#e5dcd2] bg-[#fbf8f4] p-5 sm:p-6 text-xs text-[#7d756d]">
            <div className="flex items-start gap-3.5">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-[#fff0e7] text-[#b45124]">
                <AlertCircle size={18} />
              </span>
              <div className="space-y-1.5">
                <strong className="block text-xs font-bold uppercase tracking-[0.1em] text-[#37443a]">
                  Important Dietary Advisory
                </strong>
                <p className="leading-relaxed text-[#5e564c]">
                  This meal plan is created based on the information provided. Please consult a certified dietician or sports nutritionist for a proper diet tailored to your individual health requirements.
                </p>
              </div>
            </div>
          </footer>
        </>
      )}

      {!hasBodyMetrics && (
        <footer className="mt-4 rounded-2xl border border-[#e5dcd2] bg-[#fbf8f4] p-5 text-xs text-[#7d756d]">
          <div className="flex items-start gap-3.5">
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-[#fff0e7] text-[#b45124]">
              <AlertCircle size={18} />
            </span>
            <div className="space-y-1.5">
              <strong className="block text-xs font-bold uppercase tracking-[0.1em] text-[#37443a]">
                Important Dietary Advisory
              </strong>
              <p className="leading-relaxed text-[#6f675e]">
                These plans are created based on the information provided. Please consult a certified dietician for a proper, comprehensive diet tailored to your individual athletic needs.
              </p>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
}

function MealCard({ meal }: { meal: DetailedMeal }) {
  const [expanded, setExpanded] = useState(true);

  return (
    <article className="overflow-hidden rounded-2xl border border-[#ebdcd0] bg-[#fcfaf7] shadow-sm transition hover:border-[#dbcac0]">
      {/* Meal Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#ebdcd0] bg-white px-5 py-4 sm:px-6">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#1d3024] font-display text-sm font-bold text-[#f5efe8]">
            {meal.mealNumber}
          </span>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h4 className="font-display text-lg font-bold text-[#233126]">{meal.name}</h4>
              <span className="rounded-full bg-[#f3ede4] px-2.5 py-0.5 text-[10px] font-bold text-[#796f64]">
                {meal.targetKcal} kcal
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-[#8c8277]">
              <Clock size={12} className="text-[#e66a2c]" /> {meal.timing}
            </div>
          </div>
        </div>

        {/* Meal Macro Pills */}
        <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold">
          <span className="rounded-lg bg-[#e8f1e8] px-2.5 py-1 text-[#2f5d3b]">
            {meal.proteinGrams}g Protein
          </span>
          <span className="rounded-lg bg-[#fff0e7] px-2.5 py-1 text-[#b45124]">
            {meal.carbsGrams}g Carbs
          </span>
          <span className="rounded-lg bg-[#f6f2ea] px-2.5 py-1 text-[#786c57]">
            {meal.fatsGrams}g Fats
          </span>
          <button
            type="button"
            onClick={() => setExpanded((prev) => !prev)}
            className="rounded-lg p-1.5 text-[#978e84] hover:bg-[#f0ece6]"
            aria-label={expanded ? "Collapse meal details" : "Expand meal details"}
          >
            <ChevronDown
              size={16}
              className={`transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
            />
          </button>
        </div>
      </div>

      {/* Expanded Meal Items Table */}
      {expanded && (
        <div className="p-5 sm:p-6">
          <div className="mb-4 flex items-center justify-between text-xs text-[#7e746a]">
            <span><strong>Focus:</strong> {meal.focus}</span>
            <span className="text-[11px] font-bold uppercase tracking-[0.1em] text-[#978e84]">
              {meal.items.length} Food Items
            </span>
          </div>

          <div className="overflow-x-auto rounded-xl border border-[#eee6de] bg-white">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-[#eee6de] bg-[#f7f4ee] text-[10px] font-bold uppercase tracking-[0.1em] text-[#867c71]">
                <tr>
                  <th className="py-2.5 pl-4 pr-3">Food Item</th>
                  <th className="px-3 py-2.5">Portion / Grams</th>
                  <th className="hidden px-3 py-2.5 sm:table-cell">Category</th>
                  <th className="py-2.5 pl-3 pr-4">Performance Purpose</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#eee6de]">
                {meal.items.map((item, idx) => (
                  <tr key={idx} className="transition hover:bg-[#faf8f4]">
                    <td className="py-3 pl-4 pr-3 font-semibold text-[#253228]">
                      {item.name}
                    </td>
                    <td className="px-3 py-3 font-mono font-bold text-[#b45124]">
                      <span className="inline-block rounded-md bg-[#fff0e7] px-2 py-0.5 text-xs">
                        {item.amount}
                      </span>
                    </td>
                    <td className="hidden px-3 py-3 sm:table-cell">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.08em] ${
                          item.category === "protein"
                            ? "bg-[#e8f1e8] text-[#2f5d3b]"
                            : item.category === "carbs"
                            ? "bg-[#fff0e7] text-[#b45124]"
                            : item.category === "fats"
                            ? "bg-[#f7f2ea] text-[#786c57]"
                            : "bg-[#eef4f8] text-[#366882]"
                        }`}
                      >
                        {item.category}
                      </span>
                    </td>
                    <td className="py-3 pl-3 pr-4 text-[#6e665d]">
                      {item.why}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Cricket Tip Box */}
          <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-[#e4dcd3] bg-[#f5f1eb] p-3 text-xs text-[#675d53]">
            <Info size={15} className="mt-0.5 shrink-0 text-[#e66a2c]" />
            <span>
              <strong className="text-[#2b372d]">Cricket Conditioning Cue:</strong> {meal.cricketTip}
            </span>
          </div>
        </div>
      )}
    </article>
  );
}
