export type Genre =
  | "Action"
  | "Adventure"
  | "Crime"
  | "Documentary"
  | "Drama"
  | "Mystery"
  | "Romance"
  | "Sci-Fi"
  | "Thriller";

export type MaturityRating = "PG" | "12" | "15" | "18";

export interface ViewingProgress {
  percent: number;
  episodeLabel?: string;
}

export interface MediaTitle {
  id: string;
  name: string;
  artworkId: string;
  match: number;
  rating: MaturityRating;
  runtime: string;
  genres: Genre[];
  year: number;
  kind: "movie" | "series";
  progress?: ViewingProgress;
}

export interface Movie extends MediaTitle {
  kind: "movie";
}

export interface Series extends MediaTitle {
  kind: "series";
  seasons: number;
}

export interface ContentRowData {
  title: string;
  items: MediaTitle[];
  variant?: "standard" | "top-ten" | "continue-watching";
}

export interface FeaturedTitle {
  title: MediaTitle;
  backdropId: string;
  description: string;
}
