import sys
import os
import unittest

# Add parent directory to path to find the package
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from packages.types.python.translate_enums import enumTranslator
import packages.types.python.generated.data_pb2 as data

class TestEnumTranslator(unittest.TestCase):
    def test_race_phase(self):
        self.assertEqual(enumTranslator.racePhaseEnumToString(data.RACING), "racing")
        self.assertEqual(enumTranslator.racePhaseStringToEnum("racing"), data.RACING)
        self.assertEqual(enumTranslator.racePhaseEnumToString(999), "phase_unknown")

    def test_item(self):
        self.assertEqual(enumTranslator.itemEnumToString(data.GREEN_SHELL), "green_shell")
        self.assertEqual(enumTranslator.itemStringToEnum("green_shell"), data.GREEN_SHELL)
        self.assertEqual(enumTranslator.itemStringToEnum("triple_red_shells"), data.TRIPLE_RED_SHELLS)

    def test_coins(self):
        self.assertEqual(enumTranslator.numCoinsEnumToString(data.COIN_10), "coin_10")
        self.assertEqual(enumTranslator.numCoinsStringToEnum("coin_10"), data.COIN_10)

    def test_case_insensitivity(self):
        self.assertEqual(enumTranslator.racePhaseStringToEnum("RaCiNg"), data.RACING)

if __name__ == "__main__":
    unittest.main()
