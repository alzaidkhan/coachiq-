const svg = (markup: string) => `data:image/svg+xml;charset=utf-8,${encodeURIComponent(markup.trim())}`;

export const portableAssets = {
  mark: svg(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96">
      <rect width="96" height="96" rx="22" fill="#1d3024"/>
      <!-- Pitch turf line -->
      <path d="M16 70 L80 70" stroke="#2d4a36" stroke-width="4" stroke-linecap="round"/>
      <!-- Cricket ball arc -->
      <path d="M24 60 C36 28 60 28 72 60" fill="none" stroke="#e66a2c" stroke-width="7" stroke-linecap="round"/>
      <circle cx="48" cy="33" r="7.5" fill="#f6f2ec"/>
      <!-- Seam dots -->
      <circle cx="36" cy="46" r="2" fill="#f6f2ec"/>
      <circle cx="60" cy="46" r="2" fill="#f6f2ec"/>
    </svg>
  `),

  hero: svg(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 675">
      <defs>
        <radialGradient id="stadium-sky" cx="50%" cy="20%" r="90%">
          <stop offset="0%" stop-color="#19281e"/>
          <stop offset="45%" stop-color="#121e16"/>
          <stop offset="100%" stop-color="#09100c"/>
        </radialGradient>
        <linearGradient id="floodlight-beam-left" x1="0" y1="0" x2="0.6" y2="1">
          <stop offset="0%" stop-color="#fdfbf7" stop-opacity="0.32"/>
          <stop offset="100%" stop-color="#fdfbf7" stop-opacity="0"/>
        </linearGradient>
        <linearGradient id="floodlight-beam-right" x1="1" y1="0" x2="0.4" y2="1">
          <stop offset="0%" stop-color="#fdfbf7" stop-opacity="0.32"/>
          <stop offset="100%" stop-color="#fdfbf7" stop-opacity="0"/>
        </linearGradient>
        <radialGradient id="turf-glow" cx="50%" cy="75%" r="65%">
          <stop offset="0%" stop-color="#2c4b37"/>
          <stop offset="60%" stop-color="#1e3426"/>
          <stop offset="100%" stop-color="#14221a"/>
        </radialGradient>
        <linearGradient id="pitch-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#c9b58e"/>
          <stop offset="100%" stop-color="#b59f77"/>
        </linearGradient>
      </defs>

      <!-- Night sky & arena -->
      <rect width="1200" height="675" fill="url(#stadium-sky)"/>

      <!-- Stadium grandstand silhouettes -->
      <path d="M0 360 C240 310 420 335 600 320 C780 305 960 330 1200 350 L1200 440 L0 440 Z" fill="#0d1610" opacity="0.85"/>
      <path d="M0 390 C320 355 540 375 750 360 C980 345 1080 375 1200 380 L1200 460 L0 460 Z" fill="#131e16" opacity="0.9"/>

      <!-- Floodlight towers -->
      <g stroke="#3a4c40" stroke-width="3" opacity="0.65">
        <line x1="180" y1="120" x2="160" y2="350"/>
        <line x1="180" y1="120" x2="200" y2="350"/>
        <line x1="165" y1="180" x2="195" y2="180"/>
        <line x1="162" y1="240" x2="198" y2="240"/>
        <line x1="1020" y1="120" x2="1000" y2="350"/>
        <line x1="1020" y1="120" x2="1040" y2="350"/>
        <line x1="1005" y1="180" x2="1035" y2="180"/>
        <line x1="1002" y1="240" x2="1038" y2="240"/>
      </g>
      <!-- Floodlight heads -->
      <ellipse cx="180" cy="115" rx="35" ry="12" fill="#fffcf4"/>
      <ellipse cx="1020" cy="115" rx="35" ry="12" fill="#fffcf4"/>

      <!-- Light Beams shining on turf -->
      <polygon points="180,115 50,675 620,675" fill="url(#floodlight-beam-left)"/>
      <polygon points="1020,115 580,675 1150,675" fill="url(#floodlight-beam-right)"/>

      <!-- Cricket Turf Ground -->
      <ellipse cx="600" cy="560" rx="680" ry="240" fill="url(#turf-glow)"/>

      <!-- Outer boundary rope line -->
      <ellipse cx="600" cy="560" rx="580" ry="195" fill="none" stroke="#f4efe6" stroke-width="4" stroke-opacity="0.25" stroke-dasharray="8 6"/>

      <!-- 30-yard fielding circle -->
      <ellipse cx="600" cy="545" rx="360" ry="115" fill="none" stroke="#e66a2c" stroke-width="2.5" stroke-opacity="0.4" stroke-dasharray="6 8"/>

      <!-- Central Cricket Pitch -->
      <polygon points="560,455 640,455 665,630 535,630" fill="url(#pitch-grad)"/>
      <!-- Crease markings -->
      <line x1="550" y1="472" x2="650" y2="472" stroke="#ffffff" stroke-width="2.5" opacity="0.9"/>
      <line x1="520" y1="612" x2="680" y2="612" stroke="#ffffff" stroke-width="3" opacity="0.9"/>
      <!-- Bowling and batting stumps -->
      <rect x="597" y="462" width="6" height="10" fill="#ffffff" opacity="0.8"/>
      <rect x="597" y="612" width="6" height="14" fill="#ffffff"/>

      <!-- Batsman executing cover drive illustration -->
      <g transform="translate(565, 500) scale(0.95)">
        <!-- Shadow -->
        <ellipse cx="45" cy="110" rx="42" ry="12" fill="#0c160f" opacity="0.6"/>
        <!-- Front foot planted forward -->
        <path d="M40 102 L70 106 L78 114 L50 114 Z" fill="#f4efe6"/>
        <!-- Front leg pad -->
        <path d="M42 68 L60 98 L48 106 L34 76 Z" fill="#ffffff" stroke="#d5cebe" stroke-width="1.5"/>
        <!-- Back leg anchored -->
        <path d="M12 72 L0 100 L-10 108 L18 102 Z" fill="#ffffff" stroke="#d5cebe" stroke-width="1.5"/>
        <!-- Torso & jersey -->
        <path d="M18 40 L46 36 L52 70 L24 72 Z" fill="#1b2f22"/>
        <!-- Shoulders & arms swinging bat -->
        <path d="M22 36 L48 42 L72 34 L82 46 L62 58 L40 50 Z" fill="#1b2f22"/>
        <!-- Helmet -->
        <ellipse cx="38" cy="22" rx="14" ry="13" fill="#e66a2c"/>
        <path d="M36 22 L54 22 L54 28 L38 28 Z" fill="#1b2f22"/>
        <path d="M40 24 L52 24 M40 28 L52 28 M46 22 L46 30" stroke="#ffffff" stroke-width="1.5"/>
        <!-- Bat blade in arc -->
        <polygon points="76,32 104,18 108,24 80,38" fill="#d4a373" stroke="#8c5828" stroke-width="1.2"/>
        <line x1="72" y1="36" x2="78" y2="33" stroke="#261c14" stroke-width="3" stroke-linecap="round"/>
      </g>

      <!-- Ball trajectory laser glow trail -->
      <path d="M660 528 Q780 490 920 450" fill="none" stroke="#e66a2c" stroke-width="4" stroke-linecap="round" opacity="0.9"/>
      <path d="M660 528 Q780 490 920 450" fill="none" stroke="#ffedd5" stroke-width="1.8" stroke-linecap="round"/>
      <circle cx="925" cy="448" r="8" fill="#e66a2c" stroke="#ffffff" stroke-width="2"/>

      <!-- Corner branding mark -->
      <g transform="translate(80, 560)">
        <rect width="200" height="48" rx="14" fill="#15241b" fill-opacity="0.85" stroke="#2e4d38" stroke-width="1.5"/>
        <circle cx="28" cy="24" r="12" fill="#e66a2c"/>
        <text x="50" y="30" fill="#f4efe6" font-family="system-ui, sans-serif" font-size="16" font-weight="800" letter-spacing="1">COACH<tspan fill="#e66a2c">IQ</tspan></text>
      </g>
    </svg>
  `),

  batting: svg(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 400">
      <defs>
        <radialGradient id="bat-turf" cx="50%" cy="40%" r="75%">
          <stop offset="0%" stop-color="#2c4d36"/>
          <stop offset="60%" stop-color="#1a3223"/>
          <stop offset="100%" stop-color="#102016"/>
        </radialGradient>
        <linearGradient id="bat-pitch" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stop-color="#cbb68d"/>
          <stop offset="50%" stop-color="#dcceaf"/>
          <stop offset="100%" stop-color="#cbb68d"/>
        </linearGradient>
      </defs>
      <!-- Background grass field -->
      <rect width="640" height="400" rx="20" fill="url(#bat-turf)"/>
      <!-- Pitch block -->
      <rect x="140" y="70" width="360" height="260" rx="10" fill="url(#bat-pitch)" opacity="0.92"/>
      <!-- Crease markings -->
      <line x1="140" y1="120" x2="500" y2="120" stroke="#ffffff" stroke-width="3" opacity="0.85"/>
      <line x1="140" y1="280" x2="500" y2="280" stroke="#ffffff" stroke-width="3.5" opacity="0.9"/>
      <!-- Batting crease lines -->
      <line x1="200" y1="260" x2="200" y2="330" stroke="#ffffff" stroke-width="2.5" opacity="0.8"/>
      <line x1="440" y1="260" x2="440" y2="330" stroke="#ffffff" stroke-width="2.5" opacity="0.8"/>
      <!-- Stumps -->
      <rect x="314" y="278" width="12" height="18" rx="2" fill="#ffffff"/>

      <!-- Batsman vector illustration -->
      <g transform="translate(260, 110)">
        <!-- Ground contact shadow -->
        <ellipse cx="65" cy="168" rx="55" ry="14" fill="#0a140e" opacity="0.55"/>
        <!-- Front foot drive stride -->
        <path d="M60 148 L105 156 L115 168 L70 168 Z" fill="#ffffff" stroke="#8c8275" stroke-width="1.5"/>
        <path d="M55 95 L90 142 L72 155 L42 105 Z" fill="#ffffff" stroke="#b4aa9c" stroke-width="2"/>
        <!-- Back leg braced -->
        <path d="M20 102 L-5 145 L-18 158 L12 150 Z" fill="#ffffff" stroke="#b4aa9c" stroke-width="2"/>
        <!-- Hips & torso -->
        <path d="M26 55 L70 48 L76 98 L36 102 Z" fill="#1b3024"/>
        <!-- Arm & bat swing -->
        <path d="M38 52 L75 60 L112 50 L124 64 L96 80 L62 70 Z" fill="#1b3024"/>
        <!-- Helmet with visor -->
        <ellipse cx="58" cy="30" rx="20" ry="19" fill="#e66a2c"/>
        <path d="M52 30 Q74 26 84 34 Q86 40 76 40 Z" fill="#112117"/>
        <path d="M58 34 L78 34 M58 40 L78 40 M68 30 L68 42" stroke="#ffffff" stroke-width="2" stroke-linecap="round"/>
        <!-- Willow Cricket Bat -->
        <polygon points="112,46 156,26 162,34 118,54" fill="#e9c46a" stroke="#a26c2e" stroke-width="1.8"/>
        <line x1="106" y1="52" x2="114" y2="48" stroke="#1f2937" stroke-width="4.5" stroke-linecap="round"/>
      </g>

      <!-- Target line / cover drive shot arc -->
      <path d="M420 155 Q490 130 570 95" fill="none" stroke="#e66a2c" stroke-width="4" stroke-dasharray="6 4"/>
      <circle cx="572" cy="94" r="9" fill="#e66a2c" stroke="#ffffff" stroke-width="2.5"/>

      <!-- Badge chip -->
      <g transform="translate(24, 24)">
        <rect width="168" height="34" rx="10" fill="#112117" fill-opacity="0.85" stroke="#2d4d36" stroke-width="1.2"/>
        <circle cx="18" cy="17" r="7" fill="#e66a2c"/>
        <text x="34" y="22" fill="#ffffff" font-family="system-ui, sans-serif" font-size="12" font-weight="700" letter-spacing="0.8">BATTING TECHNIQUE</text>
      </g>
    </svg>
  `),

  bowling: svg(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 400">
      <defs>
        <radialGradient id="bowl-turf" cx="50%" cy="40%" r="75%">
          <stop offset="0%" stop-color="#243d4f"/>
          <stop offset="60%" stop-color="#142430"/>
          <stop offset="100%" stop-color="#0b151c"/>
        </radialGradient>
        <linearGradient id="bowl-pitch" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stop-color="#cbb68d"/>
          <stop offset="50%" stop-color="#dcceaf"/>
          <stop offset="100%" stop-color="#cbb68d"/>
        </linearGradient>
      </defs>
      <!-- Background grass field -->
      <rect width="640" height="400" rx="20" fill="url(#bowl-turf)"/>
      <!-- Pitch block -->
      <rect x="140" y="70" width="360" height="260" rx="10" fill="url(#bowl-pitch)" opacity="0.92"/>
      <!-- Bowling crease line -->
      <line x1="140" y1="280" x2="500" y2="280" stroke="#ffffff" stroke-width="3.5" opacity="0.9"/>
      <!-- Target good-length landing cone -->
      <polygon points="320,135 308,160 332,160" fill="#e66a2c" stroke="#ffffff" stroke-width="1.5"/>
      <ellipse cx="320" cy="160" rx="18" ry="6" fill="#e66a2c" fill-opacity="0.3"/>
      <!-- Stumps at non-striker end -->
      <rect x="314" y="278" width="12" height="18" rx="2" fill="#ffffff"/>

      <!-- Fast Bowler in delivery stride -->
      <g transform="translate(230, 95)">
        <!-- Shadow -->
        <ellipse cx="70" cy="180" rx="60" ry="14" fill="#081014" opacity="0.55"/>
        <!-- Front foot braced landing at bowling crease -->
        <path d="M50 162 L85 168 L94 182 L55 182 Z" fill="#ffffff" stroke="#3b6e82" stroke-width="2"/>
        <line x1="58" y1="105" x2="75" y2="165" stroke="#ffffff" stroke-width="18" stroke-linecap="round"/>
        <!-- Back leg trailing high in follow-through -->
        <line x1="38" y1="110" x2="-10" y2="140" stroke="#ffffff" stroke-width="16" stroke-linecap="round"/>
        <path d="M-12 135 L-26 142 L-18 152 L-6 145 Z" fill="#e66a2c"/>
        <!-- Torso loaded into delivery -->
        <path d="M30 65 L70 58 L68 115 L32 115 Z" fill="#1b2e3b"/>
        <!-- Head & cap -->
        <ellipse cx="56" cy="40" rx="16" ry="17" fill="#dfa581"/>
        <path d="M40 36 C40 24 48 20 58 20 C68 20 74 24 74 36 Z" fill="#e66a2c"/>
        <path d="M52 32 L78 36 L70 42 L48 38 Z" fill="#b94814"/>
        <!-- High Bowling arm release -->
        <line x1="62" y1="58" x2="88" y2="10" stroke="#1b2e3b" stroke-width="12" stroke-linecap="round"/>
        <circle cx="92" cy="6" r="10" fill="#c62828" stroke="#ffffff" stroke-width="2"/>
        <!-- Seam line on ball -->
        <path d="M86 4 Q92 7 98 10" stroke="#ffffff" stroke-width="1.8" stroke-dasharray="1.5 1.5" fill="none"/>
        <!-- Non-bowling arm pulling down for leverage -->
        <line x1="40" y1="65" x2="16" y2="92" stroke="#1b2e3b" stroke-width="11" stroke-linecap="round"/>
      </g>

      <!-- Trajectory arc to target cone -->
      <path d="M322 101 Q321 120 320 148" fill="none" stroke="#f4a261" stroke-width="3" stroke-dasharray="4 3"/>
      <!-- Seam pitch trajectory to batsman off-stump -->
      <path d="M320 160 Q320 180 318 270" fill="none" stroke="#2a9d8f" stroke-width="3.5"/>

      <!-- Badge chip -->
      <g transform="translate(24, 24)">
        <rect width="180" height="34" rx="10" fill="#0d1820" fill-opacity="0.85" stroke="#254256" stroke-width="1.2"/>
        <circle cx="18" cy="17" r="7" fill="#3b6e82"/>
        <text x="34" y="22" fill="#ffffff" font-family="system-ui, sans-serif" font-size="12" font-weight="700" letter-spacing="0.8">BOWLING LINE &amp; LENGTH</text>
      </g>
    </svg>
  `),

  recovery: svg(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 400">
      <defs>
        <radialGradient id="rec-bg" cx="50%" cy="40%" r="70%">
          <stop offset="0%" stop-color="#364b3c"/>
          <stop offset="100%" stop-color="#18271e"/>
        </radialGradient>
      </defs>
      <rect width="640" height="400" rx="20" fill="url(#rec-bg)"/>
      <!-- Recovery workout mat -->
      <polygon points="120,290 520,290 470,350 70,350" fill="#2d4534" stroke="#486953" stroke-width="2"/>
      <!-- Foam roller -->
      <g transform="translate(180, 240)">
        <ellipse cx="20" cy="50" rx="18" ry="32" fill="#e66a2c"/>
        <rect x="20" y="18" width="110" height="64" fill="#f4a261"/>
        <ellipse cx="130" cy="50" rx="18" ry="32" fill="#e66a2c" stroke="#b94814" stroke-width="2"/>
        <line x1="45" y1="20" x2="45" y2="82" stroke="#b94814" stroke-width="2.5"/>
        <line x1="75" y1="20" x2="75" y2="82" stroke="#b94814" stroke-width="2.5"/>
        <line x1="105" y1="20" x2="105" y2="82" stroke="#b94814" stroke-width="2.5"/>
      </g>
      <!-- Stainless steel hydration flask -->
      <g transform="translate(390, 200)">
        <rect x="15" y="45" width="45" height="100" rx="12" fill="#e2e8f0" stroke="#94a3b8" stroke-width="2"/>
        <rect x="26" y="24" width="23" height="22" rx="4" fill="#334155"/>
        <rect x="33" y="12" width="9" height="12" rx="3" fill="#e66a2c"/>
        <line x1="20" y1="80" x2="55" y2="80" stroke="#cbd5e1" stroke-width="3"/>
      </g>
      <!-- Mobility resistance band loop -->
      <path d="M220 180 Q320 130 420 180 Q320 220 220 180 Z" fill="none" stroke="#e66a2c" stroke-width="8" stroke-linecap="round"/>
      <!-- Stopwatch / timing pulse -->
      <g transform="translate(480, 100)">
        <circle cx="40" cy="40" r="32" fill="#1d3024" stroke="#e66a2c" stroke-width="4"/>
        <line x1="40" y1="40" x2="40" y2="22" stroke="#ffffff" stroke-width="3" stroke-linecap="round"/>
        <line x1="40" y1="40" x2="54" y2="40" stroke="#e66a2c" stroke-width="3" stroke-linecap="round"/>
        <rect x="36" y="2" width="8" height="8" rx="2" fill="#e66a2c"/>
      </g>
      <!-- Badge chip -->
      <g transform="translate(24, 24)">
        <rect width="175" height="34" rx="10" fill="#121e17" fill-opacity="0.85" stroke="#2d4d36" stroke-width="1.2"/>
        <circle cx="18" cy="17" r="7" fill="#365b44"/>
        <text x="34" y="22" fill="#ffffff" font-family="system-ui, sans-serif" font-size="12" font-weight="700" letter-spacing="0.8">MOBILITY &amp; RESET</text>
      </g>
    </svg>
  `),

  nutrition: svg(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 400">
      <defs>
        <radialGradient id="nut-bg" cx="50%" cy="40%" r="70%">
          <stop offset="0%" stop-color="#3d2d22"/>
          <stop offset="100%" stop-color="#1c140e"/>
        </radialGradient>
      </defs>
      <rect width="640" height="400" rx="20" fill="url(#nut-bg)"/>
      <!-- Balanced athlete meal plate -->
      <ellipse cx="320" cy="220" rx="165" ry="120" fill="#faf6f0" stroke="#e5ded3" stroke-width="6"/>
      <ellipse cx="320" cy="220" rx="135" ry="96" fill="#f4ece1"/>
      <!-- Protein section -->
      <path d="M225 220 C225 180 270 160 320 160 L320 220 Z" fill="#e66a2c" stroke="#ffffff" stroke-width="2"/>
      <text x="270" y="195" fill="#ffffff" font-size="11" font-weight="bold">PROTEIN</text>
      <!-- Clean Carbs section -->
      <path d="M320 160 C370 160 415 180 415 220 L320 220 Z" fill="#f4a261" stroke="#ffffff" stroke-width="2"/>
      <text x="340" y="195" fill="#ffffff" font-size="11" font-weight="bold">CARBS</text>
      <!-- Greens & Micronutrients section -->
      <path d="M225 220 C225 270 415 270 415 220 Z" fill="#365b44" stroke="#ffffff" stroke-width="2"/>
      <text x="290" y="248" fill="#ffffff" font-size="11" font-weight="bold">GREENS &amp; FATS</text>

      <!-- Hydration tumbler -->
      <g transform="translate(490, 80)">
        <polygon points="20,40 50,40 45,110 25,110" fill="#3b6e82" fill-opacity="0.75" stroke="#ffffff" stroke-width="2"/>
        <line x1="22" y1="65" x2="48" y2="65" stroke="#ffffff" stroke-width="2" opacity="0.6"/>
        <circle cx="35" cy="25" r="8" fill="#f4a261"/>
      </g>
      <!-- Macro pills floating -->
      <g transform="translate(60, 110)">
        <rect width="110" height="30" rx="15" fill="#1d3024" stroke="#365b44" stroke-width="1.5"/>
        <circle cx="16" cy="15" r="6" fill="#e66a2c"/>
        <text x="30" y="20" fill="#f4efe6" font-size="11" font-weight="700">Fuel timing</text>
      </g>
      <!-- Badge chip -->
      <g transform="translate(24, 24)">
        <rect width="175" height="34" rx="10" fill="#17110c" fill-opacity="0.85" stroke="#4a372a" stroke-width="1.2"/>
        <circle cx="18" cy="17" r="7" fill="#e66a2c"/>
        <text x="34" y="22" fill="#ffffff" font-family="system-ui, sans-serif" font-size="12" font-weight="700" letter-spacing="0.8">CRICKET NUTRITION</text>
      </g>
    </svg>
  `),
} as const;
