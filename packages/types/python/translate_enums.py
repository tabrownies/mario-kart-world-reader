import os
import sys
try:
    import data_pb2
except:
    import utils.packages.types.python.generated.data_pb2 as data_pb2
import os

# Add generated directory to path
sys.path.append(os.path.join(os.path.dirname(__file__), "generated"))


class EnumTranslator:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._init_mappings()
        return cls._instance

    def _init_mappings(self):
        # We will build bidirectional maps for each enum defined in the proto
        self.enums = {
            "RacePhase": data_pb2.RacePhase,
            "RaceCourse": data_pb2.RaceCourse,
            "LapNumber": data_pb2.LapNumber,
            "Placement": data_pb2.Placement,
            "Item": data_pb2.Item,
            "NumCoins": data_pb2.NumCoins,
            "RaceCourseType": data_pb2.RaceCourseInfo.RaceCourseType,
        }

        self.to_str = {}
        self.to_enum = {}

        for name, enum_type in self.enums.items():
            self.to_str[name] = {val: key.lower() for key, val in enum_type.items()}
            self.to_enum[name] = {key.lower(): val for key, val in enum_type.items()}

    # --- RacePhase ---
    def racePhaseEnumToString(self, value):
        return self.to_str["RacePhase"].get(value, "phase_unknown")

    def racePhaseStringToEnum(self, string):
        return self.to_enum["RacePhase"].get(string.lower(), data_pb2.PHASE_UNKNOWN)

    # --- RaceCourse ---
    def raceCourseEnumToString(self, value):
        return self.to_str["RaceCourse"].get(value, "track_unknown")

    def raceCourseStringToEnum(self, string):
        return self.to_enum["RaceCourse"].get(string.lower(), data_pb2.TRACK_UNKNOWN)

    # --- LapNumber ---
    def lapNumberEnumToString(self, value):
        return self.to_str["LapNumber"].get(value, "lap_unknown")

    def lapNumberStringToEnum(self, string):
        return self.to_enum["LapNumber"].get(string.lower(), data_pb2.LAP_UNKNOWN)

    # --- Placement ---
    def placementEnumToString(self, value):
        return self.to_str["Placement"].get(value, "place_unknown")

    def placementStringToEnum(self, string):
        return self.to_enum["Placement"].get(string.lower(), data_pb2.PLACE_UNKNOWN)

    # --- Item ---
    def itemEnumToString(self, value):
        return self.to_str["Item"].get(value, "item_unknown")

    def itemStringToEnum(self, string):
        return self.to_enum["Item"].get(string.lower(), data_pb2.ITEM_UNKNOWN)

    # --- NumCoins ---
    def numCoinsEnumToString(self, value):
        return self.to_str["NumCoins"].get(value, "coin_unknown")

    def numCoinsStringToEnum(self, string):
        return self.to_enum["NumCoins"].get(string.lower(), data_pb2.COIN_UNKNOWN)

    # --- RaceCourseType ---
    def raceCourseTypeEnumToString(self, value):
        return self.to_str["RaceCourseType"].get(value, "course_type_unknown")

    def raceCourseTypeStringToEnum(self, string):
        return self.to_enum["RaceCourseType"].get(
            string.lower(), data_pb2.RaceCourseInfo.COURSE_TYPE_UNKNOWN
        )


# Singleton instance
enumTranslator = EnumTranslator()
