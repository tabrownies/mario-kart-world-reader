import * as data from "./generated/data";

export class EnumTranslator {
  private static instance: EnumTranslator;

  private constructor() {}

  public static getInstance(): EnumTranslator {
    if (!EnumTranslator.instance) {
      EnumTranslator.instance = new EnumTranslator();
    }
    return EnumTranslator.instance;
  }

  // --- RacePhase ---
  public racePhaseEnumToString(value: data.RacePhase): string {
    const str = data.racePhaseToJSON(value);
    return str === "UNRECOGNIZED" ? "phase_unknown" : str.toLowerCase();
  }

  public racePhaseStringToEnum(str: string): data.RacePhase {
    return data.racePhaseFromJSON(str.toUpperCase());
  }

  // --- RaceCourse ---
  public raceCourseEnumToString(value: data.RaceCourse): string {
    const str = data.raceCourseToJSON(value);
    return str === "UNRECOGNIZED" ? "track_unknown" : str.toLowerCase();
  }

  public raceCourseStringToEnum(str: string): data.RaceCourse {
    return data.raceCourseFromJSON(str.toUpperCase());
  }

  // --- LapNumber ---
  public lapNumberEnumToString(value: data.LapNumber): string {
    const str = data.lapNumberToJSON(value);
    return str === "UNRECOGNIZED" ? "lap_unknown" : str.toLowerCase();
  }

  public lapNumberStringToEnum(str: string): data.LapNumber {
    return data.lapNumberFromJSON(str.toUpperCase());
  }

  // --- Placement ---
  public placementEnumToString(value: data.Placement): string {
    const str = data.placementToJSON(value);
    return str === "UNRECOGNIZED" ? "place_unknown" : str.toLowerCase();
  }

  public placementStringToEnum(str: string): data.Placement {
    return data.placementFromJSON(str.toUpperCase());
  }

  // --- Item ---
  public itemEnumToString(value: data.Item): string {
    const str = data.itemToJSON(value);
    return str === "UNRECOGNIZED" ? "item_unknown" : str.toLowerCase();
  }

  public itemStringToEnum(str: string): data.Item {
    return data.itemFromJSON(str.toUpperCase());
  }

  // --- NumCoins ---
  public numCoinsEnumToString(value: data.NumCoins): string {
    const str = data.numCoinsToJSON(value);
    return str === "UNRECOGNIZED" ? "coin_unknown" : str.toLowerCase();
  }

  public numCoinsStringToEnum(str: string): data.NumCoins {
    return data.numCoinsFromJSON(str.toUpperCase());
  }

  // --- RaceCourseType ---
  public raceCourseTypeEnumToString(value: data.RaceCourseInfo_RaceCourseType): string {
    const str = data.raceCourseInfo_RaceCourseTypeToJSON(value);
    return str === "UNRECOGNIZED" ? "course_type_unknown" : str.toLowerCase();
  }

  public raceCourseTypeStringToEnum(str: string): data.RaceCourse_RaceCourseType {
    return data.raceCourseInfo_RaceCourseTypeFromJSON(str.toUpperCase());
  }
}

export const enumTranslator = EnumTranslator.getInstance();
