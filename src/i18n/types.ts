// ============================================================
// i18n Types & Language Definitions — Outpost Commander
// NASA Space Apps Multi-Language Architecture
// ============================================================

export type SupportedLanguage = "en" | "es" | "fr" | "de" | "ja" | "pt";

export interface LanguageMeta {
  code: SupportedLanguage;
  name: string;
  nativeName: string;
  flag: string;
  region: string;
}

export const SUPPORTED_LANGUAGES: LanguageMeta[] = [
  {
    code: "en",
    name: "English",
    nativeName: "English",
    flag: "🇺🇸",
    region: "NASA Standard / International",
  },
  {
    code: "es",
    name: "Spanish",
    nativeName: "Español",
    flag: "🇪🇸",
    region: "Space Apps Latinoamérica y España",
  },
  {
    code: "fr",
    name: "French",
    nativeName: "Français",
    flag: "🇫🇷",
    region: "Agence Spatiale Canadienne & ESA",
  },
  {
    code: "de",
    name: "German",
    nativeName: "Deutsch",
    flag: "🇩🇪",
    region: "DLR & European Astronaut Centre",
  },
  {
    code: "ja",
    name: "Japanese",
    nativeName: "日本語",
    flag: "🇯🇵",
    region: "JAXA & アルテミス計画",
  },
  {
    code: "pt",
    name: "Portuguese",
    nativeName: "Português",
    flag: "🇧🇷",
    region: "Space Apps Brasil e Portugal",
  },
];

export interface TranslationSchema {
  common: {
    nasaSpaceApps: string;
    telemetryLive: string;
    outpostCommander: string;
    versionTag: string;
    dsnLink: string;
    targetAges: string;
    sound: string;
    muted: string;
    ambientAudio?: string;
    launch: string;
    launchMission: string;
    readyToCommand: string;
    tenSolMission: string;
    playAgain: string;
    retry: string;
    switchPlanet: string;
    nasaData: string;
    nasaDataBank: string;
    howToPlay: string;
    close: string;
    confirm: string;
    sol: string;
    mw: string;
    targetAcquired: string;
    dataSource: string;
    zeroSignUp: string;
    footerTagline: string;
    audienceTagline: string;
    language: string;
    selectLanguage: string;
  };
  briefing: {
    briefingBadge: string;
    title: string;
    subtitle: string;
    step1Title: string;
    step2Title: string;
    solarSunlight: string;
    radiationRisk: string;
    temperatureSwing: string;
    launchAs: string;
    inspectInstruments: string;
  };
  destinations: {
    moon: {
      name: string;
      subtitle: string;
      badge: string;
      tagline: string;
      sunlightValue: string;
      sunlightRating: string;
      radiationValue: string;
      radiationRating: string;
      tempValue: string;
      tempRating: string;
      tempSwingRange: string;
      nasaMission: string;
      summary: string;
    };
    mars: {
      name: string;
      subtitle: string;
      badge: string;
      tagline: string;
      sunlightValue: string;
      sunlightRating: string;
      radiationValue: string;
      radiationRating: string;
      tempValue: string;
      tempRating: string;
      tempSwingRange: string;
      nasaMission: string;
      summary: string;
    };
    europa?: {
      name: string;
      subtitle: string;
      badge: string;
      tagline: string;
      sunlightValue: string;
      sunlightRating: string;
      radiationValue: string;
      radiationRating: string;
      tempValue: string;
      tempRating: string;
      tempSwingRange: string;
      nasaMission: string;
      summary: string;
    };
    titan?: {
      name: string;
      subtitle: string;
      badge: string;
      tagline: string;
      sunlightValue: string;
      sunlightRating: string;
      radiationValue: string;
      radiationRating: string;
      tempValue: string;
      tempRating: string;
      tempSwingRange: string;
      nasaMission: string;
      summary: string;
    };
  };
  difficulties: {
    cadet: {
      title: string;
      commanderRank: string;
      tagline: string;
      description: string;
      targetAudience: string;
    };
    commander: {
      title: string;
      commanderRank: string;
      tagline: string;
      description: string;
      targetAudience: string;
    };
    flight_director: {
      title: string;
      commanderRank: string;
      tagline: string;
      description: string;
      targetAudience: string;
    };
  };
  subsystems: {
    powerGrid: {
      name: string;
      shortName: string;
      description: string;
      kidExplanation: string;
      healthy: string;
      warning: string;
      critical: string;
    };
    lifeSupport: {
      name: string;
      shortName: string;
      description: string;
      kidExplanation: string;
      healthy: string;
      warning: string;
      critical: string;
    };
    radiationShielding: {
      name: string;
      shortName: string;
      description: string;
      kidExplanation: string;
      healthy: string;
      warning: string;
      critical: string;
    };
  };
  game: {
    solIndicator: string;
    powerBudget: string;
    effectiveBudget: string;
    allocated: string;
    remaining: string;
    overBudgetWarning: string;
    underBudgetNotice: string;
    runSim: string;
    simulating: string;
    lockInAllocation: string;
    crewStatus: string;
    crewMorale: string;
    radiationDose: string;
    foodReserves: string;
    oxygenBuffer: string;
    safeLimit: string;
    daysRemaining: string;
    cadetAdviceTitle: string;
    thermalFatigue: string;
    micrometeoroidAlert: string;
    solDebriefTitle: string;
    proceedNextSol: string;
    finishMission: string;
    nominal: string;
    caution: string;
    warning: string;
    critical: string;
  };
  events: Record<string, { label: string; description: string; kidFriendlyDescription: string }>;
  incidents: {
    emergencyAlert: string;
    selectDirective: string;
    tradeOffAnalysis: string;
    stemExplanation: string;
    confirmDirective: string;
  };
  debrief: {
    title: string;
    commanderRank: string;
    missionScore: string;
    subsystemIntegrity: string;
    crewSafetyRecord: string;
    flightRecorder: string;
    viewCertificate: string;
    playAgain: string;
    switchDestination: string;
    rankMaster: string;
    rankSenior: string;
    rankSurvivor: string;
    rankJunior: string;
    rankTrainee: string;
    insightsTitle: string;
    realDataComparison: string;
  };
  certificate: {
    agency: string;
    command: string;
    officialAward: string;
    certifies: string;
    hasCompleted: string;
    scoreAchieved: string;
    signatureTitle: string;
    downloadPng: string;
    printPdf: string;
    editName: string;
    saveName: string;
    commanderPlaceholder: string;
    badgeAlt: string;
    verifiedStamp: string;
  };
  nasaModal: {
    title: string;
    subtitle: string;
    tabInstruments: string;
    tabSurfacePower: string;
    tabCrewHealth: string;
    tabMissions: string;
    citationsHeader: string;
    officialMissionArchive: string;
  };
  tutorial: {
    welcome: string;
    step1Title: string;
    step1Body: string;
    step2Title: string;
    step2Body: string;
    step3Title: string;
    step3Body: string;
    next: string;
    prev: string;
    skip: string;
    start: string;
  };
  shell: {
    navMission: string;
    navData: string;
    navTeachers: string;
    navSettings: string;
    navDesign: string;
    subtitle: string;
    beginMission: string;
    rank: string;
    xpTo: string;
    maxRank: string;
    lastUnlock: string;
    noObjectives: string;
    setEyebrow: string;
    setTitle: string;
    setLead: string;
    display: string;
    displayMeta: string;
    reduceMotion: string;
    reduceMotionText: string;
    system: string;
    on: string;
    off: string;
    colorblind: string;
    colorblindText: string;
    colorblindToggle: string;
    celebrations: string;
    celebrationsText: string;
    full: string;
    subtle: string;
    soundPanel: string;
    soundMeta: string;
    interfaceSounds: string;
    interfaceSoundsText: string;
    soundToggle: string;
    muteAll: string;
    muteAllText: string;
    muted: string;
    language: string;
    available: string;
    interfaceLanguage: string;
    interfaceLanguageText: string;
  };
}
