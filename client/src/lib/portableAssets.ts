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
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 900" width="100%" height="100%">
      <defs>
        <!-- Sunset Sky Gradient -->
        <linearGradient id="sunset-sky" x1="0" y1="0" x2="1" y2="0.6">
          <stop offset="0%" stop-color="#0c1610"/>
          <stop offset="35%" stop-color="#19281c"/>
          <stop offset="65%" stop-color="#4a2e18"/>
          <stop offset="82%" stop-color="#964319"/>
          <stop offset="92%" stop-color="#d66827"/>
          <stop offset="98%" stop-color="#f8a348"/>
          <stop offset="100%" stop-color="#ffe8a3"/>
        </linearGradient>

        <!-- Setting Sun Glow -->
        <radialGradient id="sun-glow" cx="87%" cy="9%" r="35%">
          <stop offset="0%" stop-color="#ffffff"/>
          <stop offset="12%" stop-color="#ffe6a8"/>
          <stop offset="35%" stop-color="#f08836" stop-opacity="0.9"/>
          <stop offset="70%" stop-color="#a84318" stop-opacity="0.4"/>
          <stop offset="100%" stop-color="#1a2b1f" stop-opacity="0"/>
        </radialGradient>

        <!-- Outfield Grass with Sunset Light -->
        <linearGradient id="outfield-turf" x1="0" y1="0.1" x2="0.85" y2="0.9">
          <stop offset="0%" stop-color="#0e1811"/>
          <stop offset="25%" stop-color="#142419"/>
          <stop offset="60%" stop-color="#1d3423"/>
          <stop offset="80%" stop-color="#2a472f"/>
          <stop offset="95%" stop-color="#465c36"/>
          <stop offset="100%" stop-color="#6e6834"/>
        </linearGradient>

        <!-- Pitch Sunset Sheen -->
        <linearGradient id="pitch-sunset" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stop-color="#2d3a2b" stop-opacity="0.6"/>
          <stop offset="40%" stop-color="#695b42" stop-opacity="0.85"/>
          <stop offset="70%" stop-color="#b88b56" stop-opacity="0.95"/>
          <stop offset="100%" stop-color="#f5c282" stop-opacity="0.9"/>
        </linearGradient>

        <!-- Concrete Pavilion Steps -->
        <linearGradient id="concrete-step" x1="0" y1="0" x2="1" y2="0.8">
          <stop offset="0%" stop-color="#181d19"/>
          <stop offset="40%" stop-color="#282d27"/>
          <stop offset="75%" stop-color="#44423a"/>
          <stop offset="100%" stop-color="#585246"/>
        </linearGradient>

        <!-- Bat Willow Wood Tone -->
        <linearGradient id="willow-wood" x1="0" y1="0" x2="1" y2="0.3">
          <stop offset="0%" stop-color="#634529"/>
          <stop offset="35%" stop-color="#a07548"/>
          <stop offset="75%" stop-color="#caa06e"/>
          <stop offset="100%" stop-color="#ebd0a4"/>
        </linearGradient>

        <!-- Water Bottle Specular -->
        <linearGradient id="bottle-glass" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stop-color="#ffffff" stop-opacity="0.15"/>
          <stop offset="20%" stop-color="#ffffff" stop-opacity="0.75"/>
          <stop offset="40%" stop-color="#738f82" stop-opacity="0.3"/>
          <stop offset="80%" stop-color="#ffffff" stop-opacity="0.65"/>
          <stop offset="100%" stop-color="#ffffff" stop-opacity="0.2"/>
        </linearGradient>
      </defs>

      <!-- Sky Background with Warm Horizon -->
      <rect width="1600" height="900" fill="url(#sunset-sky)"/>

      <!-- Sun Radial Atmosphere Bloom -->
      <circle cx="1390" cy="80" r="450" fill="url(#sun-glow)"/>
      <circle cx="1390" cy="80" r="18" fill="#ffffff"/>
      <circle cx="1390" cy="80" r="32" fill="#fff5d0" opacity="0.85"/>

      <!-- Distant Tree Line Silhouettes along Horizon -->
      <path d="M0 105 Q120 90 260 98 T540 92 T860 96 T1160 88 T1340 82 T1480 85 T1600 92 L1600 150 L0 150 Z" fill="#0c150e"/>
      <path d="M600 100 Q800 85 1050 90 T1380 78 T1600 84 L1600 135 L600 135 Z" fill="#132014" opacity="0.9"/>
      <path d="M1250 86 Q1330 74 1420 80 T1600 82 L1600 120 L1250 120 Z" fill="#242215" opacity="0.7"/>

      <!-- Cricket Outfield Lawn -->
      <polygon points="0,115 1600,95 1600,900 0,900" fill="url(#outfield-turf)"/>

      <!-- Mowing Stripes / Perspective Lines on Outfield -->
      <path d="M0 180 Q600 160 1600 140" stroke="#16291b" stroke-width="18" fill="none" opacity="0.4"/>
      <path d="M0 260 Q600 230 1600 200" stroke="#1c3423" stroke-width="26" fill="none" opacity="0.35"/>
      <path d="M0 370 Q700 320 1600 280" stroke="#25422c" stroke-width="40" fill="none" opacity="0.3"/>
      <path d="M0 520 Q800 440 1600 380" stroke="#315237" stroke-width="60" fill="none" opacity="0.25"/>

      <!-- Distant Cricket Pitch Cut into Turf (Golden Sunset Reflection) -->
      <polygon points="980,195 1090,195 1600,310 1360,310" fill="url(#pitch-sunset)"/>
      <line x1="980" y1="200" x2="1090" y2="200" stroke="#ffffff" stroke-width="1.8" opacity="0.6"/>

      <!-- Distant Stumps on the Pitch -->
      <g id="distant-wickets" transform="translate(1320, 205)">
        <rect x="0" y="0" width="3" height="42" fill="#1a1c18" stroke="#f6c888" stroke-width="0.8"/>
        <rect x="6" y="0" width="3" height="42" fill="#1a1c18" stroke="#f6c888" stroke-width="0.8"/>
        <rect x="12" y="0" width="3" height="42" fill="#1a1c18" stroke="#f6c888" stroke-width="0.8"/>
        <rect x="-1" y="-3" width="17" height="2.5" fill="#fce5b5"/>
      </g>

      <!-- Pavilion Wall & Left Column Architecture -->
      <g id="pavilion-pillar">
        <polygon points="0,0 215,0 215,900 0,900" fill="#0c1a12"/>
        <line x1="215" y1="0" x2="215" y2="900" stroke="#1f3426" stroke-width="4"/>
        <polygon points="0,0 120,0 120,900 0,900" fill="#08120d"/>
      </g>

      <!-- Pavilion Steps (Diagonal Grandstand Tier) -->
      <g id="pavilion-steps">
        <polygon points="215,410 1600,810 1600,900 215,900" fill="url(#concrete-step)"/>
        <!-- Step Lip / Edge Highlight -->
        <line x1="215" y1="410" x2="1600" y2="810" stroke="#7e7766" stroke-width="3"/>
        <line x1="215" y1="413" x2="1600" y2="813" stroke="#25241f" stroke-width="4"/>
        <!-- Concrete texture stippling -->
        <path d="M300 480 Q600 560 900 640" stroke="#33332d" stroke-width="2" stroke-dasharray="3 14" fill="none"/>
        <path d="M500 580 Q800 660 1200 760" stroke="#4a473f" stroke-width="2" stroke-dasharray="4 18" fill="none"/>
      </g>

      <!-- ============================================== -->
      <!-- CRICKET EQUIPMENT RESTING ON PAVILION STEP    -->
      <!-- ============================================== -->

      <!-- 1. Cricket Bat laid flat beside player -->
      <g id="bat-on-step" transform="translate(820, 600) rotate(24)">
        <!-- Bat cast shadow -->
        <ellipse cx="140" cy="22" rx="150" ry="14" fill="#080c09" opacity="0.75"/>
        
        <!-- Bat Grip Handle -->
        <rect x="250" y="-8" width="85" height="15" rx="7.5" fill="#e66a2c" stroke="#68290c" stroke-width="1.5"/>
        <!-- Grip wraps -->
        <line x1="265" y1="-8" x2="265" y2="7" stroke="#ffffff" stroke-width="1.2" opacity="0.6"/>
        <line x1="280" y1="-8" x2="280" y2="7" stroke="#ffffff" stroke-width="1.2" opacity="0.6"/>
        <line x1="295" y1="-8" x2="295" y2="7" stroke="#ffffff" stroke-width="1.2" opacity="0.6"/>
        <line x1="310" y1="-8" x2="310" y2="7" stroke="#ffffff" stroke-width="1.2" opacity="0.6"/>
        <circle cx="335" cy="-0.5" r="7.5" fill="#f08836"/>

        <!-- Bat Shoulder & Blade -->
        <polygon points="0,-18 250,-10 250,10 0,18" fill="url(#willow-wood)" stroke="#53371e" stroke-width="1.5"/>
        <!-- Blade top ridge / spine -->
        <line x1="0" y1="0" x2="250" y2="0" stroke="#f6dfb8" stroke-width="2" opacity="0.85"/>
        <!-- Golden Sunset Specular Glow on Bat edge -->
        <line x1="0" y1="-18" x2="250" y2="-10" stroke="#ffebc2" stroke-width="2"/>
        <line x1="0" y1="18" x2="250" y2="10" stroke="#3b2411" stroke-width="2"/>
        <!-- Wood grain subtle lines -->
        <line x1="30" y1="-6" x2="220" y2="-4" stroke="#8b5e34" stroke-width="1" opacity="0.4"/>
        <line x1="40" y1="6" x2="210" y2="4" stroke="#8b5e34" stroke-width="1" opacity="0.4"/>
      </g>

      <!-- 2. Cricket Ball (Red leather shining in sunset) -->
      <g id="red-cricket-ball" transform="translate(900, 755)">
        <!-- Shadow -->
        <ellipse cx="0" cy="18" rx="20" ry="7" fill="#080c09" opacity="0.8"/>
        <!-- Ball core -->
        <circle cx="0" cy="0" r="22" fill="#7a2419"/>
        <radialGradient id="ball-shine" cx="40%" cy="30%" r="70%">
          <stop offset="0%" stop-color="#f89078"/>
          <stop offset="35%" stop-color="#b23220"/>
          <stop offset="75%" stop-color="#6e1d13"/>
          <stop offset="100%" stop-color="#3b0f0a"/>
        </radialGradient>
        <circle cx="0" cy="0" r="22" fill="url(#ball-shine)"/>
        <!-- White Seam Stitches -->
        <path d="M-15 15 C-5 0 5 0 15 -15" stroke="#ffffff" stroke-width="2.2" fill="none" opacity="0.85"/>
        <path d="M-17 13 C-7 -2 3 -2 13 -17" stroke="#ffffff" stroke-width="1.2" stroke-dasharray="2 3" fill="none" opacity="0.75"/>
        <!-- Specular sunset glint -->
        <circle cx="-6" cy="-8" r="4" fill="#ffffff" opacity="0.7"/>
      </g>

      <!-- 3. Water Bottle (Clear cylinder with black lid & water level) -->
      <g id="water-bottle" transform="translate(970, 725)">
        <!-- Shadow -->
        <ellipse cx="0" cy="68" rx="18" ry="7" fill="#080c09" opacity="0.75"/>
        <!-- Bottle Body -->
        <rect x="-14" y="-30" width="28" height="96" rx="9" fill="url(#bottle-glass)" stroke="#8da094" stroke-width="1.2"/>
        <!-- Water interior level -->
        <rect x="-12" y="10" width="24" height="52" rx="6" fill="#699482" opacity="0.35"/>
        <!-- Black Cap & Neck -->
        <rect x="-8" y="-42" width="16" height="13" rx="3" fill="#181c19" stroke="#38423b" stroke-width="1"/>
        <rect x="-11" y="-36" width="22" height="6" rx="2" fill="#242b26"/>
        <!-- Specular Highlight Lines -->
        <line x1="-8" y1="-26" x2="-8" y2="60" stroke="#ffffff" stroke-width="1.8" opacity="0.85"/>
        <line x1="7" y1="-26" x2="7" y2="60" stroke="#ffedd5" stroke-width="1.4" opacity="0.9"/>
      </g>

      <!-- ============================================== -->
      <!-- CRICKETER SEATED IN PAVILION (STUDYING NOTES)  -->
      <!-- ============================================== -->
      <g id="cricketer-studying" transform="translate(260, 200)">
        <!-- Ground / Chair cast shadow -->
        <ellipse cx="280" cy="660" rx="160" ry="38" fill="#080e0a" opacity="0.85"/>

        <!-- Seated chair back frame -->
        <path d="M120 480 Q100 560 90 670" stroke="#e8e2d5" stroke-width="6" fill="none"/>
        <path d="M110 520 Q140 540 180 540" stroke="#e8e2d5" stroke-width="5" fill="none"/>

        <!-- === LEGS & CRICKET BATTING PADS === -->
        <g id="player-legs">
          <!-- Left Leg extended / bent on step -->
          <!-- Thigh -->
          <path d="M220 500 Q320 530 400 560 Q380 610 240 570 Z" fill="#d9d4c7"/>
          
          <!-- Batting Pad on Left Leg (Front View with Cane Ribs) -->
          <g transform="translate(420, 520) rotate(32)">
            <!-- Pad body -->
            <rect x="-25" y="0" width="56" height="175" rx="14" fill="#f0ebe0" stroke="#c2bbb0" stroke-width="2"/>
            <!-- Knee roll -->
            <rect x="-23" y="10" width="52" height="28" rx="7" fill="#e5dfd2" stroke="#b5ad9e" stroke-width="1.5"/>
            <!-- 7 Cane ribs running down pad -->
            <line x1="-18" y1="44" x2="-18" y2="160" stroke="#ffffff" stroke-width="2.5"/>
            <line x1="-12" y1="44" x2="-12" y2="162" stroke="#ffffff" stroke-width="2.5"/>
            <line x1="-6" y1="44" x2="-6" y2="164" stroke="#ffffff" stroke-width="2.5"/>
            <line x1="0" y1="44" x2="0" y2="164" stroke="#ffffff" stroke-width="2.5"/>
            <line x1="6" y1="44" x2="6" y2="162" stroke="#ffffff" stroke-width="2.5"/>
            <line x1="12" y1="44" x2="12" y2="160" stroke="#ffffff" stroke-width="2.5"/>
            <line x1="18" y1="44" x2="18" y2="158" stroke="#ffffff" stroke-width="2.5"/>
            <!-- Sunset golden rim glow on pad outer edge -->
            <path d="M28 10 L28 170" stroke="#ffdfaa" stroke-width="3"/>
            <!-- Pad straps behind -->
            <path d="M-25 70 Q-40 76 -25 82" stroke="#4a443a" stroke-width="3" fill="none"/>
            <path d="M-25 120 Q-40 126 -25 132" stroke="#4a443a" stroke-width="3" fill="none"/>
          </g>

          <!-- Right Leg resting on step -->
          <path d="M190 510 Q280 540 340 590 L300 640 Q220 590 170 560 Z" fill="#b8b2a5"/>
        </g>

        <!-- === TORSO & CRICKET WHITES SHIRT === -->
        <g id="player-torso">
          <!-- Back and shoulders in profile -->
          <path d="M120 280 Q190 250 270 295 Q330 350 335 480 Q240 520 180 510 Q140 430 120 280 Z" fill="#eae4d8"/>
          <!-- Sunset shadow gradient across back -->
          <path d="M120 280 Q150 360 180 510 L140 430 Z" fill="#6c675c" opacity="0.6"/>
          <!-- Orange piping collar & seam trim on cricket whites -->
          <path d="M170 270 Q215 285 240 320" stroke="#e66a2c" stroke-width="2.5" fill="none" opacity="0.9"/>
          <!-- Collar fold -->
          <polygon points="190,265 240,270 230,290 180,285" fill="#fcf9f2" stroke="#d5cebe" stroke-width="1.2"/>
          <!-- Golden sunset rim highlight on shoulders & arm -->
          <path d="M190 265 Q270 295 330 350" stroke="#ffebc2" stroke-width="3.5" fill="none"/>
        </g>

        <!-- === HEAD, HAIR & SIDE PROFILE === -->
        <g id="player-head">
          <!-- Neck -->
          <path d="M195 240 L235 250 L230 275 L185 270 Z" fill="#8c6044"/>
          <!-- Face profile turned towards book (cheek, jawline, nose) -->
          <path d="M225 210 Q255 218 260 238 Q258 252 245 260 L220 255 Z" fill="#a47252"/>
          <!-- Ear -->
          <ellipse cx="230" cy="235" rx="7" ry="10" fill="#916042" stroke="#ffdfb0" stroke-width="1"/>
          <!-- Thick curly dark hair -->
          <path d="M180 215 Q195 175 240 180 Q270 190 265 225 Q250 230 235 210 Q210 215 180 215 Z" fill="#181512"/>
          <circle cx="210" cy="190" r="14" fill="#181512"/>
          <circle cx="235" cy="192" r="15" fill="#181512"/>
          <circle cx="252" cy="205" r="12" fill="#181512"/>
          <circle cx="195" cy="202" r="13" fill="#181512"/>
          <!-- Sunset Rim Light Glowing on Curly Hair Edge -->
          <path d="M195 180 Q240 174 268 194 Q272 215 265 230" stroke="#ffdfaa" stroke-width="3" fill="none"/>
        </g>

        <!-- === ARMS & HANDS HOLDING CRICKET LOGBOOK === -->
        <g id="player-arms">
          <!-- Right Arm reaching forward to support book -->
          <path d="M160 300 Q200 370 280 430 L270 455 Q190 400 145 320 Z" fill="#dfd8cb"/>
          <!-- Right forearm & wrist -->
          <path d="M270 430 L350 470 L340 495 L260 455 Z" fill="#98684a"/>

          <!-- Left Arm & Elbow bent forward -->
          <path d="M260 300 Q330 360 395 440 L380 465 Q310 400 240 330 Z" fill="#f2ede4"/>
          <!-- Left forearm -->
          <path d="M380 445 L470 515 L450 535 L365 465 Z" fill="#a47252"/>
          <!-- Golden sunset rim on left forearm -->
          <path d="M260 300 Q330 360 395 440 L470 515" stroke="#ffe0a6" stroke-width="2.5" fill="none"/>

          <!-- Right Hand gripping book bottom-left -->
          <ellipse cx="360" cy="485" rx="14" ry="10" fill="#a47252"/>
          <path d="M350 480 Q370 475 385 490" stroke="#845538" stroke-width="2" fill="none"/>

          <!-- Left Hand gripping book bottom-right -->
          <ellipse cx="475" cy="535" rx="16" ry="11" fill="#a47252"/>
          <path d="M465 528 Q485 525 500 540" stroke="#845538" stroke-width="2" fill="none"/>
        </g>

        <!-- === OPEN SPIRAL CRICKET NOTEBOOK / LOGBOOK === -->
        <g id="cricket-logbook" transform="translate(320, 390) rotate(16)">
          <!-- Notebook cast shadow -->
          <polygon points="10,25 210,10 205,175 0,185" fill="#0a0f0c" opacity="0.65"/>

          <!-- Hardcover Notebook Backing -->
          <polygon points="0,0 200,-15 195,150 -5,165" fill="#1f2621" stroke="#3d4a40" stroke-width="2"/>

          <!-- Left Page (Open) -->
          <polygon points="4,2 96,-4 92,146 0,152" fill="#faf6ed" stroke="#ded6c5" stroke-width="1"/>
          <!-- Right Page (Open, glowing with sunset light) -->
          <polygon points="98,-4 192,-12 188,138 94,146" fill="#fff9ef" stroke="#ded6c5" stroke-width="1"/>

          <!-- Spiral Wire Binding Spine -->
          <line x1="97" y1="-5" x2="93" y2="147" stroke="#333834" stroke-width="3"/>
          <!-- Spiral rings -->
          <line x1="93" y1="8" x2="101" y2="6" stroke="#ffffff" stroke-width="1.8"/>
          <line x1="93" y1="22" x2="101" y2="20" stroke="#ffffff" stroke-width="1.8"/>
          <line x1="92" y1="36" x2="100" y2="34" stroke="#ffffff" stroke-width="1.8"/>
          <line x1="92" y1="50" x2="100" y2="48" stroke="#ffffff" stroke-width="1.8"/>
          <line x1="91" y1="64" x2="99" y2="62" stroke="#ffffff" stroke-width="1.8"/>
          <line x1="91" y1="78" x2="99" y2="76" stroke="#ffffff" stroke-width="1.8"/>
          <line x1="90" y1="92" x2="98" y2="90" stroke="#ffffff" stroke-width="1.8"/>
          <line x1="90" y1="106" x2="98" y2="104" stroke="#ffffff" stroke-width="1.8"/>
          <line x1="89" y1="120" x2="97" y2="118" stroke="#ffffff" stroke-width="1.8"/>
          <line x1="89" y1="134" x2="97" y2="132" stroke="#ffffff" stroke-width="1.8"/>

          <!-- Left Page Printed Grid / Scorecard Rows -->
          <line x1="12" y1="18" x2="88" y2="12" stroke="#cfc5b4" stroke-width="1"/>
          <line x1="12" y1="32" x2="88" y2="26" stroke="#e0d7c8" stroke-width="0.75"/>
          <line x1="12" y1="46" x2="88" y2="40" stroke="#e0d7c8" stroke-width="0.75"/>
          <line x1="12" y1="60" x2="88" y2="54" stroke="#e0d7c8" stroke-width="0.75"/>
          <line x1="12" y1="74" x2="88" y2="68" stroke="#e0d7c8" stroke-width="0.75"/>
          <line x1="12" y1="88" x2="88" y2="82" stroke="#e0d7c8" stroke-width="0.75"/>
          <line x1="12" y1="102" x2="88" y2="96" stroke="#e0d7c8" stroke-width="0.75"/>
          <line x1="12" y1="116" x2="88" y2="110" stroke="#e0d7c8" stroke-width="0.75"/>
          <line x1="12" y1="130" x2="88" y2="124" stroke="#e0d7c8" stroke-width="0.75"/>

          <!-- Left Page Vertical Table Columns -->
          <line x1="32" y1="16" x2="30" y2="135" stroke="#e0d7c8" stroke-width="0.75"/>
          <line x1="52" y1="14" x2="50" y2="133" stroke="#e0d7c8" stroke-width="0.75"/>
          <line x1="72" y1="13" x2="70" y2="131" stroke="#e0d7c8" stroke-width="0.75"/>

          <!-- Right Page Grid & Training Notes -->
          <line x1="104" y1="12" x2="182" y2="6" stroke="#cfc5b4" stroke-width="1"/>
          <line x1="104" y1="26" x2="182" y2="20" stroke="#e0d7c8" stroke-width="0.75"/>
          <line x1="104" y1="40" x2="182" y2="34" stroke="#e0d7c8" stroke-width="0.75"/>
          <line x1="104" y1="54" x2="182" y2="48" stroke="#e0d7c8" stroke-width="0.75"/>
          <line x1="104" y1="68" x2="182" y2="62" stroke="#e0d7c8" stroke-width="0.75"/>
          <line x1="104" y1="82" x2="182" y2="76" stroke="#e0d7c8" stroke-width="0.75"/>
          <line x1="104" y1="96" x2="182" y2="90" stroke="#e0d7c8" stroke-width="0.75"/>
          <line x1="104" y1="110" x2="182" y2="104" stroke="#e0d7c8" stroke-width="0.75"/>
          <line x1="104" y1="124" x2="182" y2="118" stroke="#e0d7c8" stroke-width="0.75"/>

          <!-- Right Page Vertical Columns -->
          <line x1="124" y1="10" x2="122" y2="130" stroke="#e0d7c8" stroke-width="0.75"/>
          <line x1="148" y1="8" x2="146" y2="128" stroke="#e0d7c8" stroke-width="0.75"/>
          <line x1="168" y1="7" x2="166" y2="126" stroke="#e0d7c8" stroke-width="0.75"/>

          <!-- Golden Sunset Edge Reflection on Notebook Header -->
          <line x1="98" y1="-4" x2="192" y2="-12" stroke="#ffebc2" stroke-width="2"/>
        </g>
      </g>

      <!-- Soft Foreground Vignette Overlay -->
      <radialGradient id="fg-vignette" cx="20%" cy="50%" r="80%">
        <stop offset="0%" stop-color="#000000" stop-opacity="0.3"/>
        <stop offset="50%" stop-color="#000000" stop-opacity="0.1"/>
        <stop offset="100%" stop-color="#000000" stop-opacity="0.35"/>
      </radialGradient>
      <rect width="1600" height="900" fill="url(#fg-vignette)" pointer-events="none"/>
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

  wagonWheelStadium: svg(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 800">
      <defs>
        <radialGradient id="arena-turf" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#2a4e37"/>
          <stop offset="65%" stop-color="#1b3625"/>
          <stop offset="90%" stop-color="#13271b"/>
          <stop offset="100%" stop-color="#0b1710"/>
        </radialGradient>
        <radialGradient id="infield-glow" cx="50%" cy="50%" r="40%">
          <stop offset="0%" stop-color="#346144" stop-opacity="0.9"/>
          <stop offset="100%" stop-color="#22422e" stop-opacity="0.3"/>
        </radialGradient>
        <linearGradient id="stadium-pitch" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stop-color="#d4c29d"/>
          <stop offset="50%" stop-color="#e2d3b4"/>
          <stop offset="100%" stop-color="#d4c29d"/>
        </linearGradient>
      </defs>
      <!-- Stadium circular grass field -->
      <rect width="800" height="800" rx="36" fill="#0c1811"/>
      <circle cx="400" cy="400" r="370" fill="url(#arena-turf)" stroke="#3e6b4d" stroke-width="4"/>
      <!-- Boundary rope pattern -->
      <circle cx="400" cy="400" r="350" fill="none" stroke="#f6f2ec" stroke-width="3.5" stroke-dasharray="8 6" opacity="0.8"/>
      <!-- 30-yard fielding oval -->
      <ellipse cx="400" cy="400" rx="225" ry="195" fill="url(#infield-glow)" stroke="#e66a2c" stroke-width="2.5" stroke-dasharray="6 6" opacity="0.85"/>
      
      <!-- Sector division radial lines -->
      <g stroke="#ffffff" stroke-width="1.2" stroke-opacity="0.25" stroke-dasharray="4 4">
        <line x1="400" y1="50" x2="400" y2="750"/>
        <line x1="50" y1="400" x2="750" y2="400"/>
        <line x1="152" y1="152" x2="648" y2="648"/>
        <line x1="648" y1="152" x2="152" y2="648"/>
      </g>

      <!-- Center Pitch rectangle -->
      <rect x="375" y="310" width="50" height="180" rx="6" fill="url(#stadium-pitch)" stroke="#ffffff" stroke-width="1.5" stroke-opacity="0.6"/>
      <!-- Bowling Crease markings -->
      <line x1="365" y1="330" x2="435" y2="330" stroke="#ffffff" stroke-width="3"/>
      <line x1="365" y1="470" x2="435" y2="470" stroke="#ffffff" stroke-width="3"/>
      <!-- Popping creases -->
      <line x1="355" y1="345" x2="445" y2="345" stroke="#ffffff" stroke-width="2" opacity="0.85"/>
      <line x1="355" y1="455" x2="445" y2="455" stroke="#ffffff" stroke-width="2" opacity="0.85"/>
      <!-- Stumps -->
      <rect x="396" y="326" width="8" height="6" fill="#ffffff"/>
      <rect x="396" y="468" width="8" height="6" fill="#ffffff"/>
      <!-- Batsman impact point -->
      <circle cx="400" cy="455" r="8" fill="#e66a2c" stroke="#ffffff" stroke-width="2.5"/>

      <!-- Sector labels around boundary -->
      <g fill="#a7c3af" font-family="system-ui, sans-serif" font-size="13" font-weight="700" text-anchor="middle" letter-spacing="1">
        <text x="400" y="32">STRAIGHT / LONG OFF</text>
        <text x="640" y="130">COVER</text>
        <text x="745" y="405">POINT</text>
        <text x="640" y="680">THIRD MAN</text>
        <text x="400" y="785">FINE LEG</text>
        <text x="160" y="680">SQUARE LEG</text>
        <text x="55" y="405">MID-WICKET</text>
        <text x="160" y="130">MID-ON</text>
      </g>
    </svg>
  `),

  googleAiEmblem: svg(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <defs>
        <linearGradient id="g-sparkle" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#4285f4"/>
          <stop offset="35%" stop-color="#9b72cb"/>
          <stop offset="70%" stop-color="#d96570"/>
          <stop offset="100%" stop-color="#fbbc05"/>
        </linearGradient>
      </defs>
      <!-- Four-pointed Gemini sparkle -->
      <path d="M50 5 C50 30 70 50 95 50 C70 50 50 70 50 95 C50 70 30 50 5 50 C30 50 50 30 50 5 Z" fill="url(#g-sparkle)"/>
      <circle cx="50" cy="50" r="7" fill="#ffffff" opacity="0.9"/>
    </svg>
  `),

  cricketEquipment: svg(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300">
      <defs>
        <linearGradient id="wood-blade" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#dfbe8b"/>
          <stop offset="100%" stop-color="#be9d68"/>
        </linearGradient>
        <radialGradient id="leather-ball" cx="40%" cy="40%" r="60%">
          <stop offset="0%" stop-color="#e63946"/>
          <stop offset="60%" stop-color="#c1121f"/>
          <stop offset="100%" stop-color="#780000"/>
        </radialGradient>
      </defs>
      <rect width="400" height="300" rx="20" fill="#14241a"/>
      <!-- Cricket Bat diagonal -->
      <g transform="rotate(-30 200 150)">
        <polygon points="175,40 215,40 220,240 170,240" fill="url(#wood-blade)" rx="4"/>
        <line x1="195" y1="40" x2="195" y2="240" stroke="#8a693a" stroke-width="2" opacity="0.4"/>
        <!-- Handle with white grip wrap -->
        <rect x="187" y="-25" width="16" height="70" rx="4" fill="#f8f9fa" stroke="#adb5bd" stroke-width="1.5"/>
        <line x1="187" y1="-5" x2="203" y2="-5" stroke="#ced4da" stroke-width="2"/>
        <line x1="187" y1="15" x2="203" y2="15" stroke="#ced4da" stroke-width="2"/>
      </g>
      <!-- Cricket Ball with white seam -->
      <circle cx="280" cy="190" r="42" fill="url(#leather-ball)" stroke="#ffffff" stroke-width="1.5" stroke-opacity="0.3"/>
      <!-- Stitched seam -->
      <path d="M250 160 C270 190 290 200 315 215" fill="none" stroke="#ffffff" stroke-width="3" stroke-dasharray="3 2.5"/>
      <!-- Leather shine -->
      <ellipse cx="265" cy="175" rx="10" ry="6" fill="#ffffff" opacity="0.4" transform="rotate(-25 265 175)"/>
    </svg>
  `),
} as const;
