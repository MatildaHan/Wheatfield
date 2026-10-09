<template>
  <div
    class="parallax-layer layer-bg"
    :style="{ transform: transform, opacity: opacity }"
  >
    <svg
      class="scene-svg"
      viewBox="0 0 1920 1080"
      preserveAspectRatio="xMidYMid slice"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#efe8da" />
          <stop offset="48%" stop-color="#f4efe5" />
          <stop offset="100%" stop-color="#e8e3d4" />
        </linearGradient>
        <linearGradient id="mistGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#edf3ee" stop-opacity="0.9" />
          <stop offset="100%" stop-color="#d8e7dc" stop-opacity="0.12" />
        </linearGradient>
        <linearGradient id="rockGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#c99393" />
          <stop offset="55%" stop-color="#b47d7c" />
          <stop offset="100%" stop-color="#986766" />
        </linearGradient>
        <filter id="hd-soft" x="-2%" y="-2%" width="104%" height="104%">
          <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="4" seed="2" result="n" />
          <feDisplacementMap in="SourceGraphic" in2="n" scale="2.5" xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </defs>

      <rect x="0" y="0" width="1920" height="1080" fill="url(#skyGrad)" />

      <!-- Paper wash and dry-brush sky -->
      <g opacity="0.42" filter="url(#hd-soft)">
        <path d="M0 0 H1920 V260 Q1730 240 1560 250 Q1290 260 1080 220 Q860 178 640 195 Q430 210 210 170 Q120 154 0 162Z" fill="#eef2ec" />
        <path d="M0 70 Q180 48 360 82 Q520 112 710 98 Q910 84 1060 118 Q1240 156 1460 124 Q1670 94 1920 120 V0 H0Z" fill="#e7ebe6" opacity="0.7" />
        <path d="M140 118 Q280 94 420 126 Q548 154 708 148" stroke="#d9d6cb" stroke-width="12" stroke-linecap="round" fill="none" opacity="0.45" />
        <path d="M1010 110 Q1165 92 1315 126 Q1425 148 1588 140" stroke="#ddd8ce" stroke-width="10" stroke-linecap="round" fill="none" opacity="0.38" />
      </g>

      <!-- Hand-drawn clouds -->
      <g class="cloud-a" filter="url(#hd-soft)" opacity="0.92">
        <path d="M255 238 Q230 195 265 172 Q300 150 344 164 Q362 132 408 137 Q458 142 470 184 Q522 184 540 222 Q558 260 526 280 Q500 298 453 292 Q420 316 366 304 Q314 304 286 282 Q254 276 248 254 Z" fill="#f7f4ee" />
        <path d="M286 228 Q316 188 370 190 Q424 190 454 226" stroke="#d8d0c4" stroke-width="4" stroke-linecap="round" fill="none" opacity="0.5" />
      </g>
      <g class="cloud-b" filter="url(#hd-soft)" opacity="0.82">
        <path d="M1490 206 Q1468 172 1496 148 Q1528 124 1568 138 Q1588 114 1628 118 Q1672 122 1688 160 Q1735 164 1750 196 Q1766 230 1738 248 Q1712 266 1668 262 Q1640 286 1592 278 Q1546 282 1520 262 Q1498 254 1490 206 Z" fill="#f6f2ea" />
        <path d="M1528 200 Q1560 170 1606 170 Q1650 170 1682 198" stroke="#d9d2c8" stroke-width="4" stroke-linecap="round" fill="none" opacity="0.46" />
      </g>
      <g class="cloud-a" filter="url(#hd-soft)" opacity="0.7">
        <path d="M870 184 Q850 160 872 142 Q898 124 930 132 Q944 112 974 114 Q1008 116 1022 142 Q1058 146 1072 170 Q1084 194 1062 208 Q1040 224 1004 220 Q982 236 944 232 Q906 236 888 220 Q872 214 870 184 Z" fill="#f7f4ee" />
      </g>

      <!-- Distant layered hills -->
      <g v-if="!skyOnly">
      <g filter="url(#hd-soft)">
        <path d="M0 530 Q132 510 238 528 Q332 484 446 500 Q560 522 680 486 Q812 446 930 470 Q1024 486 1126 460 Q1244 430 1358 454 Q1458 474 1560 452 Q1692 430 1920 468 L1920 640 Q1774 626 1622 624 Q1438 622 1296 610 Q1100 592 938 602 Q746 612 590 602 Q420 592 284 602 Q144 614 0 632Z" fill="#ced4cc" opacity="0.82" />
        <path d="M0 588 Q168 556 314 570 Q452 544 584 562 Q700 580 806 560 Q924 536 1052 546 Q1178 556 1288 536 Q1410 514 1520 530 Q1632 546 1920 522 L1920 694 Q1738 688 1598 694 Q1414 702 1252 694 Q1082 686 926 696 Q764 704 612 696 Q452 688 292 698 Q160 708 0 712Z" fill="#a7bac0" opacity="0.54" />
        <path d="M1100 504 Q1142 470 1172 470 Q1208 470 1220 506 Q1194 534 1150 532 Q1120 530 1100 504 Z" fill="#d6dae0" opacity="0.6" />
      </g>

      <!-- Bush masses and distant trees -->
      <g filter="url(#hd-soft)" opacity="0.88">
        <path d="M90 664 Q126 620 194 624 Q260 626 298 664 Q314 706 282 738 Q236 766 166 758 Q108 756 82 718 Q68 692 90 664 Z" fill="#9cb6b9" />
        <path d="M136 656 Q170 634 216 638 Q254 640 278 668" stroke="#5c7074" stroke-width="3" stroke-linecap="round" fill="none" opacity="0.55" />
        <path d="M368 642 Q406 598 486 604 Q550 610 594 650 Q606 694 564 720 Q510 742 438 736 Q390 734 362 704 Q348 676 368 642 Z" fill="#a9c0c0" />
        <path d="M418 636 Q458 610 514 618 Q548 624 570 654" stroke="#61787a" stroke-width="3" stroke-linecap="round" fill="none" opacity="0.46" />
        <path d="M1322 654 Q1356 612 1430 614 Q1510 616 1560 660 Q1574 704 1532 734 Q1480 762 1402 754 Q1350 752 1318 720 Q1304 692 1322 654 Z" fill="#9fb7b8" />
        <path d="M1370 646 Q1412 620 1470 626 Q1512 632 1534 660" stroke="#617477" stroke-width="3" stroke-linecap="round" fill="none" opacity="0.46" />
        <path d="M1644 626 Q1690 586 1762 592 Q1826 596 1878 640 Q1892 686 1842 716 Q1788 744 1716 736 Q1676 734 1648 708 Q1628 678 1644 626 Z" fill="#98afb2" />
        <path d="M1686 624 Q1736 600 1790 608 Q1830 614 1854 644" stroke="#5d7276" stroke-width="3" stroke-linecap="round" fill="none" opacity="0.48" />
        <path d="M618 618 Q642 562 700 550 Q754 550 782 606 Q760 642 706 650 Q654 650 618 618 Z" fill="#5a6662" opacity="0.66" />
        <path d="M1606 598 Q1634 546 1684 540 Q1734 540 1768 594 Q1746 636 1690 642 Q1640 640 1606 598 Z" fill="#4d5857" opacity="0.7" />
      </g>

      <!-- Rocks -->
      <g filter="url(#hd-soft)">
        <path d="M42 738 Q56 642 86 570 Q110 516 162 484 Q210 458 268 470 Q306 484 336 522 Q358 562 360 626 Q360 712 330 790 Q304 844 258 880 Q192 900 126 882 Q84 860 58 820 Q40 786 42 738 Z" fill="url(#rockGrad)" opacity="0.96" />
        <path d="M118 520 Q138 620 146 712" stroke="#654d4d" stroke-width="4" stroke-linecap="round" fill="none" opacity="0.7" />
        <path d="M202 500 Q212 578 220 668" stroke="#654d4d" stroke-width="4" stroke-linecap="round" fill="none" opacity="0.56" />
        <path d="M272 536 Q268 592 272 654" stroke="#654d4d" stroke-width="3" stroke-linecap="round" fill="none" opacity="0.44" />
        <path d="M102 584 Q90 598 88 628" stroke="#654d4d" stroke-width="3" stroke-linecap="round" fill="none" opacity="0.52" />
        <path d="M238 642 Q248 656 246 690" stroke="#654d4d" stroke-width="3" stroke-linecap="round" fill="none" opacity="0.46" />
      </g>
      <g filter="url(#hd-soft)" opacity="0.9">
        <path d="M1380 712 Q1406 660 1450 630 Q1496 602 1546 616 Q1578 636 1592 676 Q1598 712 1584 748 Q1560 790 1508 814 Q1454 826 1418 798 Q1388 772 1380 712 Z" fill="url(#rockGrad)" />
        <path d="M1460 646 Q1456 694 1464 742" stroke="#694f4f" stroke-width="3" stroke-linecap="round" fill="none" opacity="0.52" />
        <path d="M1514 640 Q1518 688 1512 728" stroke="#694f4f" stroke-width="2.6" stroke-linecap="round" fill="none" opacity="0.38" />
      </g>
      <g filter="url(#hd-soft)" opacity="0.76">
        <path d="M1028 654 Q1044 620 1070 604 Q1094 592 1120 604 Q1136 622 1138 646 Q1136 676 1114 698 Q1088 712 1058 704 Q1038 694 1028 654 Z" fill="#bb857e" />
        <path d="M1078 618 Q1080 650 1076 678" stroke="#684f4f" stroke-width="2.5" stroke-linecap="round" fill="none" opacity="0.44" />
      </g>

      <!-- Mist strip near horizon -->
      <path d="M0 622 Q208 612 400 622 Q618 632 826 620 Q1046 606 1260 620 Q1510 636 1920 624 L1920 674 Q1538 684 1274 680 Q1040 676 826 686 Q614 696 390 690 Q214 686 0 694Z" fill="url(#mistGrad)" opacity="0.52" filter="url(#hd-soft)" />
      </g>
    </svg>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  skyOnly?: boolean
  transform: string
  opacity: string
}>()
</script>

<style scoped>
.parallax-layer { position: absolute; inset: -40px; will-change: transform, filter, opacity; }
.layer-bg { z-index: 1; filter: saturate(0.92) brightness(1.02) blur(0.2px); }
.scene-svg { width: 110%; height: 110%; position: absolute; top: -5%; left: -5%; }
</style>
