export type TechType = "wind_energy_onshore" | "hydro" | "solar" | "thermal";
export type AuctionResults = {
  date: string;
  number_of_participants: number;
  md5_hash: string;
  auctions: Auction[];
};

export type Auction = {
  region: string;
  technology: TechType;
  volume_auctioned: number;
  average_price: number;
  volume_sold: number;
  number_of_winners: number;
  auction_results: AuctionResults[];
};

export type RefreshResponse = {
  id: string; // Task UUID
};

export type Task = RefreshResponse & {
  id: string;
  status: string;
  enqueued_at: string;
  started_at: string;
  finished_at: string;
};
