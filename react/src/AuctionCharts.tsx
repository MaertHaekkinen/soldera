// src/components/EnergyCharts.tsx
import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  ComposedChart,
  Line,
} from "recharts";
import type { AuctionResults, TechType } from "./types.ts";

interface Props {
  data: AuctionResults[];
}

function mapTechToColor(name: string) {
  switch (name) {
    case "wind_energy_onshore":
      return "#82ca9d";
    case "hydro":
      return "#8884d8";
    case "solar":
      return "#ffc658";
    case "thermal":
      return "#ff7300";
  }
}

function mapTechToLabel(name: string) {
  switch (name) {
    case "wind_energy_onshore":
      return "Wind Energy Onshore";
    case "hydro":
      return "Hydro";
    case "solar":
      return "Solar";
    case "thermal":
      return "Thermal";
  }
}

const AuctionCharts: React.FC<Props> = ({ data }) => {
  if (!data.length) return <h1>No data available</h1>;

  const currentData = data[0];
  // Aggregate data by technology
  const technologyData = currentData.auctions.reduce(
    (
      acc: {
        [key: string]: {
          technology: string;
          volumeAuctioned: number;
          totalVolume: number;
          totalWinners: number;
          averagePrice: number;
        };
      },
      auction,
    ) => {
      const tech = auction.technology;
      if (!acc[tech]) {
        acc[tech] = {
          technology: tech,
          volumeAuctioned: 0,
          totalVolume: 0,
          totalWinners: 0,
          averagePrice: 0,
        };
      }
      acc[tech].totalVolume += auction.volume_sold;
      acc[tech].volumeAuctioned += auction.volume_auctioned;
      acc[tech].totalWinners += auction.number_of_winners;

      if (acc[tech].averagePrice) {
        acc[tech].averagePrice =
          (acc[tech].averagePrice * acc[tech].volumeAuctioned +
            auction.average_price * auction.volume_auctioned) /
          (acc[tech].volumeAuctioned + auction.volume_auctioned);
      } else {
        acc[tech].averagePrice = auction.average_price;
      }
      return acc;
    },
    {},
  );

  const formatPrice = (price: number): number => Number(price.toFixed(3));
  Object.values(technologyData).forEach((entry) => {
    entry.averagePrice = formatPrice(entry.averagePrice);
  });

  // Aggregate data by region
  const regionData = currentData.auctions.reduce(
    (
      acc: {
        [key: string | number]: {
          region: string;
          wind_energy_onshore: number;
          hydro: number;
          solar: number;
          thermal: number;
          wind_energy_onshore_averagePrice: number;
          hydro_averagePrice: number;
          solar_averagePrice: number;
          thermal_averagePrice: number;
          totalVolume: number;
          averagePrice: number;
        };
      },
      auction,
    ) => {
      if (!acc[auction.region]) {
        acc[auction.region] = {
          region: auction.region,
          wind_energy_onshore: 0,
          hydro: 0,
          solar: 0,
          thermal: 0,
          wind_energy_onshore_averagePrice: 0,
          hydro_averagePrice: 0,
          solar_averagePrice: 0,
          thermal_averagePrice: 0,
          totalVolume: 0,
          averagePrice: 0,
        };
      }

      const tech = auction.technology;
      if (typeof tech === "string" && tech in acc[auction.region]) {
        acc[auction.region][tech as TechType] = auction.volume_sold;
        if (tech == "wind_energy_onshore") {
          acc[auction.region]["wind_energy_onshore_averagePrice"] =
            auction.average_price;
        } else if (tech == "hydro") {
          acc[auction.region]["hydro_averagePrice"] = auction.average_price;
        } else if (tech == "solar") {
          acc[auction.region]["solar_averagePrice"] = auction.average_price;
        } else if (tech == "thermal") {
          acc[auction.region]["thermal_averagePrice"] = auction.average_price;
        }
      }
      acc[auction.region].totalVolume += auction.volume_sold;
      return acc;
    },
    {},
  );

  return (
    <>
      <h2>GoO Distribution by Energy Technology, Volumes Sold (MWh)</h2>
      <ResponsiveContainer width={"100%"} height={400}>
        <PieChart>
          <Pie
            data={Object.values(technologyData)}
            dataKey="totalVolume"
            nameKey="technology"
            cx="50%"
            cy="50%"
            outerRadius="400px"
            label={(data) => mapTechToLabel(data.name)}
          >
            {Object.values(technologyData).map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={mapTechToColor(entry.technology)}
              />
            ))}
          </Pie>
          <Tooltip
            formatter={(value: number) => [
              `${value.toLocaleString()} MWh`,
              "Volume",
            ]}
          />
          <Legend formatter={mapTechToLabel} />
        </PieChart>
      </ResponsiveContainer>

      <h2 className="mt-5">Regional GoO Distribution, Volumes Sold (MWh)</h2>
      <ResponsiveContainer width={"100%"} height={400}>
        <BarChart
          data={Object.values(regionData)}
          margin={{ top: 20, right: 30, left: 20, bottom: 100 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="region" angle={-45} textAnchor="end" height={100} />
          <YAxis unit="MWh" width={100} />
          <Tooltip />
          <Legend height={1} />
          <Bar
            dataKey="wind_energy_onshore"
            stackId="a"
            fill="#82ca9d"
            name="Wind Energy Onshore"
          />
          <Bar dataKey="hydro" stackId="a" fill="#8884d8" name="Hydro" />
          <Bar dataKey="solar" stackId="a" fill="#ffc658" name="Solar" />
          <Bar dataKey="thermal" stackId="a" fill="#ff7300" name="Thermal" />
        </BarChart>
      </ResponsiveContainer>

      <h2>Regional GoO Price by Energy Technology (€/MWh)</h2>
      <ResponsiveContainer width={"100%"} height={400}>
        <ComposedChart
          data={Object.values(regionData)}
          margin={{ top: 20, right: 30, left: 20, bottom: 100 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="region" angle={-45} textAnchor="end" height={100} />
          <YAxis unit="€/MWh" width={100} />
          <Tooltip />
          <Legend height={1} />
          <Line
            type="monotone"
            dataKey="hydro_averagePrice"
            stroke="#8884d8"
            name="Hydro"
          />
          <Line
            type="monotone"
            dataKey="solar_averagePrice"
            stroke="#ffc658"
            name="Solar"
          />
          <Line
            type="monotone"
            dataKey="wind_energy_onshore_averagePrice"
            stroke="#82ca9d"
            name="Wind Energy Onshore"
          />
          <Line
            type="monotone"
            dataKey="thermal_averagePrice"
            stroke="#ff7300"
            name="Thermal"
          />
        </ComposedChart>
      </ResponsiveContainer>

      <h2>Energy Technology Distribution and Winners</h2>
      <ResponsiveContainer width={"100%"} height={400}>
        <ComposedChart
          data={Object.values(technologyData)}
          margin={{ top: 20, right: 30, left: 20, bottom: 50 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="technology" />
          <YAxis yAxisId="left" unit=" winners" />
          <YAxis unit="MWh" yAxisId="right" orientation="right" width={100} />
          <Tooltip />
          <Legend />
          <Bar
            yAxisId="left"
            dataKey="totalWinners"
            fill="#8884d8"
            name="Number of Winners"
          />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="averagePrice"
            stroke="#555"
            name="Average Price"
            unit="€/MWh"
          />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="totalVolume"
            stroke="#ff7300"
            name="Volume Sold"
          />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="volumeAuctioned"
            stroke="#af7300"
            name="Volume Auctioned"
          />
        </ComposedChart>
      </ResponsiveContainer>
    </>
  );
};

export default AuctionCharts;
