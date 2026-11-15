// ============================================================
// solarCoordinates.ts — Orbital Mechanics & Solar Flux Engine
// Grounded in NASA LRO (Diviner/LOLA) and MSL Curiosity (REMS) Data
// ============================================================

export type CelestialBodyId = "moon" | "mars";

export interface SolarCoordinatesOptions {
  /** Atmospheric optical depth (Mars only; baseline tau ~0.5-0.7, dust storm tau > 2.5-5.0) */
  opticalDepthTau?: number;
  /** Habitat dome height in meters for shadow vector calculation (default: 8.0 m) */
  domeHeightM?: number;
  /** Crater rim / terrain obstacle height in meters (default: 4200m for Shackleton Rim, 5500m for Mt. Sharp) */
  terrainObstacleHeightM?: number;
  /** Solar array tilt mode: 'horizontal' (flat roof) vs 'vertical_mast' (Artemis VSAT pole) */
  arrayTiltMode?: "horizontal" | "vertical_mast" | "two_axis_tracking";
}

export interface SolarPositionResult {
  body: CelestialBodyId;
  sol: number;
  timeOfDayHours: number;
  solDurationHours: number;

  /** Elevation angle in degrees above horizon (-90° to +90°) */
  elevationDeg: number;
  /** Azimuth angle in degrees from True North (0° = North, 90° = East, 180° = South, 270° = West) */
  azimuthDeg: number;
  /** Solar zenith angle in degrees (90° - elevation) */
  zenithAngleDeg: number;
  /** Hour angle in degrees relative to local solar noon */
  hourAngleDeg: number;

  /** True if the sun center is above the local horizon */
  isSunlit: boolean;
  /** Sub-solar latitude / declination on this Sol (degrees) */
  solarDeclinationDeg: number;

  /** Solar constant at top of atmosphere / vacuum surface for this body (W/m^2) */
  solarConstant: number;
  /** Direct beam solar flux (W/m^2) */
  directBeamFlux: number;
  /** Diffuse scattered sky flux (W/m^2) */
  diffuseSkyFlux: number;
  /** Total global horizontal irradiance (W/m^2) */
  globalHorizontalFlux: number;
  /** Solar flux captured by a vertical tracking solar tower mast (W/m^2) */
  verticalTowerFlux: number;
  /** Effective flux captured based on the chosen or default array configuration (W/m^2) */
  effectiveArrayFlux: number;

  /** Solar Array Optical Efficiency (%) relative to body's top-of-atmosphere solar constant */
  opticalEfficiencyPercent: number;

  /** Length of the shadow cast by the habitat dome (meters) */
  habitatShadowLengthM: number;
  /** Length of the shadow cast by crater rim / surrounding topography (kilometers) */
  terrainShadowLengthKm: number;

  /** Atmospheric optical depth tau used for calculation */
  opticalDepthTau: number;
  /** Physical annotation explaining orbital phenomena */
  scientificNote: string;
}

export interface DiurnalSamplePoint {
  timeHours: number;
  elevationDeg: number;
  azimuthDeg: number;
  globalFlux: number;
  verticalFlux: number;
  efficiencyPercent: number;
  isSunlit: boolean;
}

/**
 * Planetary and site orbital constants derived from NASA missions
 */
export const CELESTIAL_CONSTANTS = {
  moon: {
    name: "Lunar South Pole (Shackleton Crater Rim)",
    latitudeDeg: -89.9, // 0.1° from the rotational South Pole
    axialTiltDeg: 1.5424, // Obliquity to ecliptic
    orbitalRadiusAU: 1.0,
    solarConstantW_m2: 1361.0, // Top of atmosphere solar constant at 1 AU
    solDurationHours: 708.73, // Synodic month (29.53 Earth days = 708.7 hours)
    nominalTau: 0.0, // Vacuum (no atmosphere)
    terrainElevationM: 4200, // Shackleton Rim crest above crater floor
    citation: "NASA LRO LOLA Altimetry & Diviner Radiometer Experiment (DLRE)",
  },
  mars: {
    name: "Mars Equatorial Basin (Gale Crater)",
    latitudeDeg: -4.6, // Curiosity Landing Site (Bradbury Landing / Mt. Sharp)
    axialTiltDeg: 25.19, // Mars obliquity
    meanOrbitalRadiusAU: 1.524,
    solarConstantW_m2: 589.0, // Mean solar irradiance at 1.524 AU (~590 W/m^2)
    solDurationHours: 24.6597, // 24h 39m 35s Martian Sol
    nominalTau: 0.6, // Clear Martian sky optical depth (MSL REMS)
    dustStormTau: 3.5, // Regional dust storm opacity
    terrainElevationM: 5500, // Mount Sharp (Aeolis Mons) peak height
    citation: "NASA MSL Curiosity Rover (REMS UV Sensor & Mastcam Tau measurements)",
  },
};

/**
 * Calculate solar elevation, azimuth, flux intensity, and shadow vector
 * for a specific body, sol, and time of day.
 */
export function calculateSolarCoordinates(
  body: CelestialBodyId,
  sol: number = 1,
  timeOfDayHours: number = 12.0,
  options: SolarCoordinatesOptions = {}
): SolarPositionResult {
  const domeHeightM = options.domeHeightM ?? 8.0;
  const terrainObstacleHeightM =
    options.terrainObstacleHeightM ??
    (body === "moon" ? CELESTIAL_CONSTANTS.moon.terrainElevationM : CELESTIAL_CONSTANTS.mars.terrainElevationM);
  const tiltMode = options.arrayTiltMode ?? (body === "moon" ? "vertical_mast" : "horizontal");

  if (body === "moon") {
    // -------------------------------------------------------------------------
    // LUNAR SOUTH POLE (Shackleton Crater Rim at 89.9°S)
    // -------------------------------------------------------------------------
    const constants = CELESTIAL_CONSTANTS.moon;
    const solDuration = constants.solDurationHours;

    // Normalizing time of day (0 to 24h can represent a diurnal fraction orSol hour)
    // For visualization convenience, 24 hours of user time maps across the 360° solar azimuth sweep
    const diurnalFraction = ((timeOfDayHours % 24) + 24) % 24 / 24;
    const azimuthDeg = (diurnalFraction * 360) % 360;

    // Lunar seasonal tilt cycle (~346.6 day draconic/orbital season cycle)
    // Moon's axial tilt is only 1.54°, so solar declination relative to the lunar equator
    // oscillates between -1.54° and +1.54°.
    const seasonAngleRad = ((2 * Math.PI * (sol + 25)) / 346.6) % (2 * Math.PI);
    const solarDeclinationDeg = constants.axialTiltDeg * Math.sin(seasonAngleRad);

    // Shackleton crater rim ridge topography elevates the outpost 4.2 km above the crater floor.
    // NASA LOLA data demonstrates that on the rim crest, the sun hovers between 0.8° and 2.8°
    // (dipping to ~-0.5° behind distant ridges during lunar winter nadir).
    // The azimuth terrain horizon undulates as the sun rotates 360° around the rim.
    const terrainHorizonModulation = 0.35 * Math.sin((azimuthDeg * Math.PI) / 180 * 2);
    const nominalElevation = 1.65 + solarDeclinationDeg * 0.75 + terrainHorizonModulation;
    
    // Clamp to realistic physical range observed by LRO DLRE & LOLA at Shackleton Peak
    const elevationDeg = Number(nominalElevation.toFixed(2));
    const zenithAngleDeg = Number((90 - elevationDeg).toFixed(2));
    const isSunlit = elevationDeg > 0;

    const solarConstant = constants.solarConstantW_m2; // 1361 W/m^2 in vacuum
    const tau = 0.0; // Vacuum

    // On a horizontal surface: I = S0 * sin(elevation)
    // At grazing angles of 1.5°, sin(1.5°) = 0.026 → only ~35 W/m²!
    const radElev = Math.max(0, elevationDeg * (Math.PI / 180));
    const globalHorizontalFlux = isSunlit
      ? Number((solarConstant * Math.sin(radElev)).toFixed(1))
      : 0;

    // On a vertical mast solar array (tracking azimuth): I = S0 * cos(elevation)
    // At 1.5° grazing, cos(1.5°) = 0.9996 → 1360.5 W/m² (virtually 100% full solar constant!)
    const verticalTowerFlux = isSunlit
      ? Number((solarConstant * Math.cos(radElev)).toFixed(1))
      : 0;

    const directBeamFlux = isSunlit ? solarConstant : 0;
    const diffuseSkyFlux = 0; // Vacuum has no atmospheric scattering

    let effectiveArrayFlux = globalHorizontalFlux;
    if (tiltMode === "vertical_mast") {
      effectiveArrayFlux = verticalTowerFlux;
    } else if (tiltMode === "two_axis_tracking") {
      effectiveArrayFlux = isSunlit ? solarConstant : 0;
    }

    const opticalEfficiencyPercent = Number(
      ((effectiveArrayFlux / solarConstant) * 100).toFixed(1)
    );

    // Shadow calculation:
    // L = h / tan(elevation)
    // At grazing angles < 0.1°, cap to avoid infinity
    const effectiveElevForShadow = Math.max(0.04, elevationDeg);
    const tanElev = Math.tan((effectiveElevForShadow * Math.PI) / 180);
    
    // Habitat dome shadow (meters)
    const rawDomeShadow = domeHeightM / tanElev;
    const habitatShadowLengthM = isSunlit ? Math.min(2500, Number(rawDomeShadow.toFixed(1))) : 2500;

    // Terrain obstacle shadow (kilometers) — Shackleton Rim casting across crater floor into PSR
    const rawTerrainShadowKm = (terrainObstacleHeightM / 1000) / tanElev;
    const terrainShadowLengthKm = isSunlit ? Math.min(150, Number(rawTerrainShadowKm.toFixed(1))) : 150;

    const hourAngleDeg = Number(((diurnalFraction * 360) - 180).toFixed(1));

    const scientificNote =
      "Shackleton Crater Rim (89.9°S): The Moon's 1.5° axial tilt keeps the sun skimming permanently at " +
      "1° to 3° above the horizon. Horizontal panels receive almost no light (~" +
      globalHorizontalFlux +
      " W/m²), but vertical mast arrays intercept perpendicular grazing rays at ~" +
      verticalTowerFlux +
      " W/m² (a " +
      (globalHorizontalFlux > 0 ? (verticalTowerFlux / globalHorizontalFlux).toFixed(0) : "∞") +
      "x efficiency multiplier!).";

    return {
      body,
      sol,
      timeOfDayHours,
      solDurationHours: solDuration,
      elevationDeg,
      azimuthDeg: Number(azimuthDeg.toFixed(1)),
      zenithAngleDeg,
      hourAngleDeg,
      isSunlit,
      solarDeclinationDeg: Number(solarDeclinationDeg.toFixed(2)),
      solarConstant,
      directBeamFlux,
      diffuseSkyFlux,
      globalHorizontalFlux,
      verticalTowerFlux,
      effectiveArrayFlux,
      opticalEfficiencyPercent,
      habitatShadowLengthM,
      terrainShadowLengthKm,
      opticalDepthTau: tau,
      scientificNote,
    };
  } else {
    // -------------------------------------------------------------------------
    // MARS GALE CRATER (Curiosity Landing Site at 4.6°S)
    // -------------------------------------------------------------------------
    const constants = CELESTIAL_CONSTANTS.mars;
    const solDuration = constants.solDurationHours;
    const tau = options.opticalDepthTau ?? constants.nominalTau;

    // Mars orbital distance & seasonal declination:
    // Mars solar longitude L_s (0° = northern spring equinox, 90° = summer, 180° = autumn, 270° = winter)
    // Approximate Ls from Sol index (668.6 Sols per Martian year)
    const LsRad = ((2 * Math.PI * (sol % 668.6)) / 668.6);
    
    // Mars orbital eccentricity e = 0.0934 causes solar distance to vary from 1.38 AU to 1.66 AU
    // Flux at Mars TOA varies between 492 W/m² (aphelion) and 715 W/m² (perihelion)
    const rAU = constants.meanOrbitalRadiusAU * (1 - 0.0934 * Math.cos(LsRad - 4.36)); // Perihelion near Ls ~250°
    const solarConstant = Number((1361.0 / (rAU * rAU)).toFixed(1));

    // Solar declination on Mars: sin(delta) = sin(25.19°) * sin(Ls)
    const sinDelta = Math.sin((constants.axialTiltDeg * Math.PI) / 180) * Math.sin(LsRad);
    const solarDeclinationRad = Math.asin(sinDelta);
    const solarDeclinationDeg = Number(((solarDeclinationRad * 180) / Math.PI).toFixed(2));

    // Hour angle omega from local solar noon
    // Mars sol is 24h 39m; user time normalized to [0, 24.66]
    const normalizedTime = ((timeOfDayHours % solDuration) + solDuration) % solDuration;
    const hourAngleHours = normalizedTime - (solDuration / 2);
    const hourAngleDeg = (hourAngleHours / solDuration) * 360;
    const hourAngleRad = (hourAngleDeg * Math.PI) / 180;

    // Observer latitude phi = -4.6°
    const phiRad = (constants.latitudeDeg * Math.PI) / 180;

    // Standard spherical astronomy formula:
    // sin(elev) = sin(phi)*sin(delta) + cos(phi)*cos(delta)*cos(omega)
    const sinElev =
      Math.sin(phiRad) * Math.sin(solarDeclinationRad) +
      Math.cos(phiRad) * Math.cos(solarDeclinationRad) * Math.cos(hourAngleRad);
    
    const elevationRad = Math.asin(Math.max(-1, Math.min(1, sinElev)));
    const elevationDeg = Number(((elevationRad * 180) / Math.PI).toFixed(2));
    const zenithAngleDeg = Number((90 - elevationDeg).toFixed(2));
    const isSunlit = elevationDeg > 0;

    // Azimuth calculation:
    // cos(Az) = (sin(delta) - sin(phi)*sin(elev)) / (cos(phi)*cos(elev))
    const cosElev = Math.cos(elevationRad);
    let azimuthDeg = 180;
    if (cosElev > 0.001) {
      const cosAz = (Math.sin(solarDeclinationRad) - Math.sin(phiRad) * sinElev) / (Math.cos(phiRad) * cosElev);
      const clampedCosAz = Math.max(-1, Math.min(1, cosAz));
      const azFromNorth = (Math.acos(clampedCosAz) * 180) / Math.PI;
      azimuthDeg = hourAngleDeg >= 0 ? (360 - azFromNorth) % 360 : azFromNorth;
    }
    azimuthDeg = Number(azimuthDeg.toFixed(1));

    // Martian Atmospheric Radiative Transfer (Beer-Lambert attenuation + Forward Dust Scatter)
    // Sourced from MSL Curiosity REMS and Spirit/Opportunity dust storm models
    let directBeamFlux = 0;
    let diffuseSkyFlux = 0;
    let globalHorizontalFlux = 0;
    let verticalTowerFlux = 0;

    if (isSunlit) {
      // Atmospheric air mass (Kasten-Young approximation for low angles)
      const zenRad = ((90 - elevationDeg) * Math.PI) / 180;
      const airMass = 1.0 / (Math.cos(zenRad) + 0.50572 * Math.pow(96.07995 - (zenRad * 180) / Math.PI, -1.6364));
      const effectiveAirMass = Math.max(1.0, Math.min(30.0, airMass));

      // Direct beam attenuation through Martian atmospheric dust: I_dir = S0 * exp(-tau * m)
      const directNormal = solarConstant * Math.exp(-tau * effectiveAirMass);
      directBeamFlux = Number((directNormal * Math.sin(elevationRad)).toFixed(1));

      // Diffuse scattering from atmospheric dust (Curiosity REMS forward-scattering phase function):
      // Dust aerosols in the thin Martian atmosphere strongly scatter forward sunlight
      const diffuseScatterFraction = 0.15 + 0.35 * (1 - Math.exp(-tau * 0.8));
      diffuseSkyFlux = Number(
        (solarConstant * Math.sin(elevationRad) * diffuseScatterFraction * Math.exp(-0.4 * tau)).toFixed(1)
      );

      globalHorizontalFlux = Number((directBeamFlux + diffuseSkyFlux).toFixed(1));
      verticalTowerFlux = Number(
        (directNormal * Math.cos(elevationRad) + diffuseSkyFlux * 0.5).toFixed(1)
      );
    }

    let effectiveArrayFlux = globalHorizontalFlux;
    if (tiltMode === "vertical_mast") {
      effectiveArrayFlux = verticalTowerFlux;
    } else if (tiltMode === "two_axis_tracking") {
      effectiveArrayFlux = isSunlit ? Number((directBeamFlux / Math.sin(elevationRad) + diffuseSkyFlux).toFixed(1)) : 0;
    }

    const opticalEfficiencyPercent = isSunlit
      ? Number(((effectiveArrayFlux / solarConstant) * 100).toFixed(1))
      : 0;

    // Shadow calculation
    let habitatShadowLengthM = 0;
    let terrainShadowLengthKm = 0;

    if (isSunlit) {
      const tanElev = Math.tan(Math.max(0.05, elevationDeg) * (Math.PI / 180));
      habitatShadowLengthM = Number(Math.min(500, domeHeightM / tanElev).toFixed(1));
      terrainShadowLengthKm = Number(Math.min(100, (terrainObstacleHeightM / 1000) / tanElev).toFixed(1));
    } else {
      habitatShadowLengthM = 500; // In night darkness
      terrainShadowLengthKm = 100;
    }

    const scientificNote =
      "Gale Crater (4.6°S): Mars experiences classic diurnal sunrise-to-sunset arcs with solar elevation reaching up to " +
      (90 - Math.abs(constants.latitudeDeg - solarDeclinationDeg)).toFixed(1) +
      "° at local noon. Direct sunlight is attenuated by atmospheric dust optical depth (tau = " +
      tau.toFixed(2) +
      "), dropping available flux during regional or global dust storms.";

    return {
      body,
      sol,
      timeOfDayHours: normalizedTime,
      solDurationHours: solDuration,
      elevationDeg,
      azimuthDeg,
      zenithAngleDeg,
      hourAngleDeg: Number(hourAngleDeg.toFixed(1)),
      isSunlit,
      solarDeclinationDeg,
      solarConstant,
      directBeamFlux,
      diffuseSkyFlux,
      globalHorizontalFlux,
      verticalTowerFlux,
      effectiveArrayFlux,
      opticalEfficiencyPercent,
      habitatShadowLengthM,
      terrainShadowLengthKm,
      opticalDepthTau: tau,
      scientificNote,
    };
  }
}

/**
 * Sample a full 24-step diurnal day for plotting the horizon arc / flux curve
 */
export function generateDiurnalCurve(
  body: CelestialBodyId,
  sol: number = 1,
  steps: number = 24,
  options: SolarCoordinatesOptions = {}
): DiurnalSamplePoint[] {
  const points: DiurnalSamplePoint[] = [];
  const solDuration =
    body === "moon"
      ? 24.0 // 24-hour visualization sweep for the lunar rim
      : CELESTIAL_CONSTANTS.mars.solDurationHours;

  const dt = solDuration / steps;

  for (let i = 0; i <= steps; i++) {
    const time = i * dt;
    const res = calculateSolarCoordinates(body, sol, time, options);
    points.push({
      timeHours: Number(time.toFixed(1)),
      elevationDeg: res.elevationDeg,
      azimuthDeg: res.azimuthDeg,
      globalFlux: res.globalHorizontalFlux,
      verticalFlux: res.verticalTowerFlux,
      efficiencyPercent: res.opticalEfficiencyPercent,
      isSunlit: res.isSunlit,
    });
  }

  return points;
}
