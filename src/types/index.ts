export interface TicketPackage {
  id: string;
  price: number;
  venue: string;
  date: string;
  sportType: string;
  seatingCategory: string;
  hospitalityType: string;
  hospitalityVenue: string;
  hospitalityLevel: string;
  location: string;
  availableTickets: number;
  description: string;
}

export interface UserPreferences {
  location?: string;
  peopleCount?: number;
  sport?: string;
  hospitalityType?: string;
  date?: string;
  budget?: {
    min: number;
    max: number;
  };
}

export interface ChatMessage {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
  suggestions?: TicketPackage[];
}

export interface RecommendationScore {
  package: TicketPackage;
  score: number;
  reasons: string[];
}
