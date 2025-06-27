from typing import Literal

Technology = Literal["Eolien onshore", "Hydraulique", "Solaire", "Thermique"]
EnergyTechnology = Literal["Onshore wind", "Hydro", "Solar", "Thermal"]
DiscoveryStatus = Literal["started", "successful", "failed"]

ENERGY_TECHNOLOGY_MAPPING: dict[Technology, EnergyTechnology] = {
    "Eolien onshore": "wind_energy_onshore",
    "Hydraulique": "hydro",
    "Solaire": "solar",
    "Thermique": "thermal",
}
