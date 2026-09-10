const svg = (markup: string) => `data:image/svg+xml;charset=utf-8,${encodeURIComponent(markup.trim())}`;

export type AvatarPreset = {
  id: string;
  name: string;
  role: string;
  url: string;
};

export const avatarPresets: AvatarPreset[] = [
  {
    id: "batsman-red",
    name: "Red Helmet Batter",
    role: "Top-order Batsman",
    url: svg(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">
        <defs>
          <radialGradient id="bat-bg" cx="40%" cy="30%" r="70%">
            <stop offset="0%" stop-color="#2d4a36"/>
            <stop offset="100%" stop-color="#15241b"/>
          </radialGradient>
          <linearGradient id="helm-grad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#e65100"/>
            <stop offset="100%" stop-color="#b71c1c"/>
          </linearGradient>
        </defs>
        <circle cx="60" cy="60" r="58" fill="url(#bat-bg)" stroke="#3e634a" stroke-width="2"/>
        <!-- Torso & jersey collar -->
        <path d="M26 116 c0-24 16-40 34-40 s34 16 34 40 Z" fill="#f4efe6"/>
        <path d="M52 76 L60 92 L68 76 Z" fill="#15241b"/>
        <!-- Neck -->
        <rect x="52" y="66" width="16" height="14" rx="4" fill="#e8b896"/>
        <!-- Helmet shell -->
        <ellipse cx="60" cy="48" rx="24" ry="22" fill="url(#helm-grad)"/>
        <!-- Peak / visor -->
        <path d="M42 48 Q60 42 78 48 Q82 52 74 53 Q60 48 44 53 Z" fill="#880e4f"/>
        <!-- Ear flap / side shield -->
        <rect x="42" y="48" width="8" height="12" rx="3" fill="#880e4f"/>
        <rect x="70" y="48" width="8" height="12" rx="3" fill="#880e4f"/>
        <!-- Face grill / titanium wire -->
        <path d="M44 54 Q60 62 76 54 M45 60 Q60 68 75 60 M52 50 L52 68 M68 50 L68 68" stroke="#ffffff" stroke-width="2" stroke-linecap="round" fill="none"/>
        <!-- Eyes behind grill -->
        <circle cx="53" cy="49" r="2.2" fill="#2d1b10"/>
        <circle cx="67" cy="49" r="2.2" fill="#2d1b10"/>
      </svg>
    `),
  },
  {
    id: "pace-bowler",
    name: "Pace Bowler",
    role: "Fast Bowler",
    url: svg(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">
        <defs>
          <radialGradient id="pace-bg" cx="40%" cy="30%" r="70%">
            <stop offset="0%" stop-color="#1f3b4d"/>
            <stop offset="100%" stop-color="#0f1e29"/>
          </radialGradient>
        </defs>
        <circle cx="60" cy="60" r="58" fill="url(#pace-bg)" stroke="#2b516b" stroke-width="2"/>
        <!-- Torso -->
        <path d="M26 116 c0-24 16-40 34-40 s34 16 34 40 Z" fill="#f4efe6"/>
        <path d="M50 76 L60 90 L70 76 Z" fill="#e66a2c"/>
        <!-- Neck & Face -->
        <rect x="52" y="66" width="16" height="14" rx="4" fill="#d99f79"/>
        <ellipse cx="60" cy="52" rx="19" ry="21" fill="#d99f79"/>
        <!-- Modern Hair -->
        <path d="M40 48 C40 30 50 24 60 24 C70 24 80 30 80 48 C76 38 68 34 60 35 C52 34 44 38 40 48 Z" fill="#261c14"/>
        <!-- Sweatband on forehead -->
        <rect x="42" y="42" width="36" height="6" rx="2.5" fill="#e66a2c"/>
        <!-- Eyes & smile -->
        <circle cx="53" cy="53" r="2" fill="#1b120c"/>
        <circle cx="67" cy="53" r="2" fill="#1b120c"/>
        <path d="M54 62 Q60 67 66 62" stroke="#1b120c" stroke-width="1.8" stroke-linecap="round" fill="none"/>
        <!-- Red cricket ball seam accent -->
        <circle cx="92" cy="34" r="14" fill="#c62828" stroke="#ffffff" stroke-width="1.5"/>
        <path d="M84 27 Q92 34 100 41" stroke="#ffffff" stroke-width="1.8" stroke-dasharray="1.5 1.5" fill="none"/>
      </svg>
    `),
  },
  {
    id: "spinner-floppy",
    name: "Spin Wizard",
    role: "Spin Bowler",
    url: svg(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">
        <defs>
          <radialGradient id="spin-bg" cx="40%" cy="30%" r="70%">
            <stop offset="0%" stop-color="#3d372c"/>
            <stop offset="100%" stop-color="#1f1b14"/>
          </radialGradient>
        </defs>
        <circle cx="60" cy="60" r="58" fill="url(#spin-bg)" stroke="#574e3d" stroke-width="2"/>
        <!-- Torso -->
        <path d="M26 116 c0-24 16-40 34-40 s34 16 34 40 Z" fill="#f4efe6"/>
        <path d="M50 76 L60 88 L70 76 Z" fill="#365b44"/>
        <!-- Neck & Face -->
        <rect x="52" y="66" width="16" height="14" rx="4" fill="#dfa581"/>
        <ellipse cx="60" cy="56" rx="18" ry="19" fill="#dfa581"/>
        <!-- Eyes & calm focus -->
        <circle cx="54" cy="56" r="2" fill="#1b120c"/>
        <circle cx="66" cy="56" r="2" fill="#1b120c"/>
        <path d="M55 64 Q60 67 65 64" stroke="#1b120c" stroke-width="1.6" stroke-linecap="round" fill="none"/>
        <!-- Classic White Floppy Sun Hat -->
        <ellipse cx="60" cy="46" rx="36" ry="10" fill="#fbfaf6" stroke="#d5cebe" stroke-width="1.5"/>
        <path d="M42 44 C42 28 50 24 60 24 C70 24 78 28 78 44 Z" fill="#fbfaf6" stroke="#d5cebe" stroke-width="1.5"/>
        <rect x="42" y="40" width="36" height="4" fill="#365b44"/>
      </svg>
    `),
  },
  {
    id: "keeper-gold",
    name: "Golden Gloves",
    role: "Wicketkeeper",
    url: svg(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">
        <defs>
          <radialGradient id="keeper-bg" cx="40%" cy="30%" r="70%">
            <stop offset="0%" stop-color="#4a3b2c"/>
            <stop offset="100%" stop-color="#231a10"/>
          </radialGradient>
        </defs>
        <circle cx="60" cy="60" r="58" fill="url(#keeper-bg)" stroke="#69533f" stroke-width="2"/>
        <!-- Torso -->
        <path d="M26 116 c0-24 16-40 34-40 s34 16 34 40 Z" fill="#f4efe6"/>
        <path d="M52 76 L60 90 L68 76 Z" fill="#f59e0b"/>
        <!-- Neck & Face -->
        <rect x="52" y="66" width="16" height="14" rx="4" fill="#e2ad8b"/>
        <ellipse cx="60" cy="52" rx="19" ry="20" fill="#e2ad8b"/>
        <!-- Modern Wicketkeeper Cap -->
        <path d="M41 47 C41 32 50 26 60 26 C70 26 79 32 79 47 Z" fill="#1d3024"/>
        <path d="M41 46 Q60 40 85 45 Q88 49 79 50 Q60 47 41 49 Z" fill="#16251c"/>
        <circle cx="60" cy="36" r="3" fill="#f59e0b"/>
        <!-- Eyes & alert expression -->
        <circle cx="53" cy="52" r="2.2" fill="#1a120b"/>
        <circle cx="67" cy="52" r="2.2" fill="#1a120b"/>
        <path d="M55 61 Q60 65 65 61" stroke="#1a120b" stroke-width="1.8" stroke-linecap="round" fill="none"/>
        <!-- Keeper glove silhouette in corner -->
        <path d="M16 88 C16 78 28 78 30 88 L32 108 L16 108 Z" fill="#f59e0b" stroke="#ffffff" stroke-width="1.2"/>
        <circle cx="23" cy="85" r="3" fill="#1d3024"/>
      </svg>
    `),
  },
  {
    id: "all-rounder-green",
    name: "Turf Captain",
    role: "All-rounder",
    url: svg(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">
        <defs>
          <radialGradient id="cap-bg" cx="40%" cy="30%" r="70%">
            <stop offset="0%" stop-color="#1b4332"/>
            <stop offset="100%" stop-color="#081c15"/>
          </radialGradient>
        </defs>
        <circle cx="60" cy="60" r="58" fill="url(#cap-bg)" stroke="#2d6a4f" stroke-width="2"/>
        <!-- Torso & Captain Blazer -->
        <path d="M26 116 c0-24 16-40 34-40 s34 16 34 40 Z" fill="#1b4332"/>
        <path d="M52 76 L60 98 L68 76 Z" fill="#f4efe6"/>
        <path d="M58 84 L60 92 L62 84 Z" fill="#d97706"/>
        <!-- Neck & Face -->
        <rect x="52" y="64" width="16" height="14" rx="4" fill="#e5b290"/>
        <ellipse cx="60" cy="50" rx="19" ry="20" fill="#e5b290"/>
        <!-- Hair -->
        <path d="M40 45 C40 28 50 24 60 24 C70 24 80 28 80 45 C74 36 67 33 60 34 C53 33 46 36 40 45 Z" fill="#362215"/>
        <!-- Eyes & confident smile -->
        <circle cx="53" cy="51" r="2.2" fill="#1c1109"/>
        <circle cx="67" cy="51" r="2.2" fill="#1c1109"/>
        <path d="M54 60 Q60 66 66 60" stroke="#1c1109" stroke-width="2" stroke-linecap="round" fill="none"/>
        <!-- Captain Armband Badge -->
        <rect x="25" y="92" width="10" height="16" rx="2" fill="#d97706" stroke="#ffffff" stroke-width="1"/>
        <text x="30" y="104" text-anchor="middle" font-size="9" font-weight="900" fill="#ffffff">C</text>
      </svg>
    `),
  },
  {
    id: "pro-coach",
    name: "Master Coach",
    role: "Cricket Coach",
    url: svg(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">
        <defs>
          <radialGradient id="coach-bg" cx="40%" cy="30%" r="70%">
            <stop offset="0%" stop-color="#2c302e"/>
            <stop offset="100%" stop-color="#141716"/>
          </radialGradient>
        </defs>
        <circle cx="60" cy="60" r="58" fill="url(#coach-bg)" stroke="#474d49" stroke-width="2"/>
        <!-- Torso & training jacket -->
        <path d="M26 116 c0-24 16-40 34-40 s34 16 34 40 Z" fill="#1d3024"/>
        <line x1="60" y1="76" x2="60" y2="116" stroke="#e66a2c" stroke-width="2.5"/>
        <!-- Neck & Face -->
        <rect x="52" y="64" width="16" height="14" rx="4" fill="#dfaa89"/>
        <ellipse cx="60" cy="50" rx="19" ry="20" fill="#dfaa89"/>
        <!-- Coach cap -->
        <path d="M41 45 C41 30 50 25 60 25 C70 25 79 30 79 45 Z" fill="#15241b"/>
        <path d="M41 44 Q60 38 84 43 Q87 47 78 48 Q60 45 41 47 Z" fill="#0f1913"/>
        <circle cx="60" cy="35" r="2.5" fill="#e66a2c"/>
        <!-- Eyes & calm experience -->
        <circle cx="53" cy="50" r="2.2" fill="#1a120b"/>
        <circle cx="67" cy="50" r="2.2" fill="#1a120b"/>
        <!-- Coach Whistle around neck -->
        <path d="M52 72 Q60 84 68 72" stroke="#d5cebe" stroke-width="1.5" fill="none"/>
        <rect x="57" y="80" width="6" height="9" rx="2" fill="#c0c0c0" stroke="#717171" stroke-width="0.8"/>
      </svg>
    `),
  },
];

export function compressImageFile(file: File, maxDimension = 240, quality = 0.82): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith("image/")) {
      reject(new Error("Please select an image file (PNG, JPG, or WebP)."));
      return;
    }
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Unable to read this file."));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("Unable to decode the image."));
      img.onload = () => {
        let { width, height } = img;
        if (width > height) {
          if (width > maxDimension) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          }
        } else {
          if (height > maxDimension) {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Browser canvas unavailable."));
          return;
        }
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        ctx.drawImage(img, 0, 0, width, height);
        // Default to webp if supported, or jpeg
        try {
          const dataUrl = canvas.toDataURL("image/webp", quality);
          if (dataUrl.startsWith("data:image/webp")) {
            resolve(dataUrl);
            return;
          }
        } catch {
          // fallback
        }
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}
