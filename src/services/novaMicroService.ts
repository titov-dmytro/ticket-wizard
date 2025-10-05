import { UserPreferences, TicketPackage } from '../types';

export class NovaMicroService {
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = import.meta.env?.VITE_NOVA_MICRO_API_KEY || '';
    this.baseUrl = import.meta.env?.VITE_NOVA_MICRO_BASE_URL || 'https://api.nova-micro.com';
  }

  public async processUserQuery(
    query: string, 
    packages: TicketPackage[], 
    currentPreferences?: UserPreferences
  ): Promise<{
    response: string;
    updatedPreferences?: UserPreferences;
    suggestedPackages?: TicketPackage[];
  }> {
    try {
      // For now, we'll implement a local processing system
      // In production, this would call the actual Nova Micro API
      return await this.processQueryLocally(query, packages, currentPreferences);
    } catch (error) {
      console.error('Error processing query with Nova Micro:', error);
      throw new Error('Failed to process your request. Please try again.');
    }
  }

  private async processQueryLocally(
    query: string, 
    packages: TicketPackage[], 
    currentPreferences?: UserPreferences
  ): Promise<{
    response: string;
    updatedPreferences?: UserPreferences;
    suggestedPackages?: TicketPackage[];
  }> {
    const lowerQuery = query.toLowerCase();
    const preferences = currentPreferences || {};

    // Extract preferences from natural language
    if (lowerQuery.includes('location') || lowerQuery.includes('where')) {
      const locationMatch = query.match(/(?:in|at|near)\s+([a-zA-Z\s]+)/i);
      if (locationMatch) {
        preferences.location = locationMatch[1].trim();
      }
    }

    if (lowerQuery.includes('people') || lowerQuery.includes('group') || lowerQuery.includes('tickets')) {
      const peopleMatch = query.match(/(\d+)\s+(?:people|tickets|group)/i);
      if (peopleMatch) {
        preferences.peopleCount = parseInt(peopleMatch[1]);
      }
    }

    if (lowerQuery.includes('sport') || lowerQuery.includes('game')) {
      const sports = ['basketball', 'football', 'baseball', 'hockey', 'soccer'];
      for (const sport of sports) {
        if (lowerQuery.includes(sport)) {
          preferences.sport = sport;
          break;
        }
      }
    }

    if (lowerQuery.includes('hospitality') || lowerQuery.includes('vip') || lowerQuery.includes('club')) {
      if (lowerQuery.includes('vip')) {
        preferences.hospitalityType = 'VIP';
      } else if (lowerQuery.includes('club')) {
        preferences.hospitalityType = 'Club';
      } else if (lowerQuery.includes('basic')) {
        preferences.hospitalityType = 'Basic';
      }
    }

    if (lowerQuery.includes('date') || lowerQuery.includes('when')) {
      const dateMatch = query.match(/(\d{4}-\d{2}-\d{2})/);
      if (dateMatch) {
        preferences.date = dateMatch[1];
      }
    }

    if (lowerQuery.includes('budget') || lowerQuery.includes('price') || lowerQuery.includes('cost')) {
      const budgetMatch = query.match(/\$?(\d+)(?:\s*-\s*\$?(\d+))?/);
      if (budgetMatch) {
        const min = parseInt(budgetMatch[1]);
        const max = budgetMatch[2] ? parseInt(budgetMatch[2]) : min * 2;
        preferences.budget = { min, max };
      }
    }

    // Generate response based on query type
    let response = this.generateResponse(query, preferences);
    
    // If user is asking for recommendations, find packages
    let suggestedPackages: TicketPackage[] | undefined;
    if (lowerQuery.includes('recommend') || lowerQuery.includes('suggest') || lowerQuery.includes('find') || lowerQuery.includes('show')) {
      // Dynamic import to avoid require() in Vite
      const { RecommendationEngine } = await import('./recommendationEngine');
      const engine = new RecommendationEngine(packages);
      const recommendations = engine.findRecommendations(preferences);
      suggestedPackages = recommendations.map((r: any) => r.package);
      
      if (suggestedPackages && suggestedPackages.length > 0) {
        response += `\n\nI found ${suggestedPackages.length} packages that match your preferences:`;
      } else {
        response += "\n\nI couldn't find exact matches, but here are some similar options:";
        suggestedPackages = packages.slice(0, 3);
      }
    }

    return {
      response,
      updatedPreferences: Object.keys(preferences).length > 0 ? preferences : undefined,
      suggestedPackages
    };
  }

  private generateResponse(query: string, preferences: UserPreferences): string {
    const lowerQuery = query.toLowerCase();
    
    if (lowerQuery.includes('hello') || lowerQuery.includes('hi')) {
      return "Hello! I'm here to help you find the perfect event ticket package. You can tell me about your preferences like location, sport, number of people, or hospitality type, and I'll suggest the best options for you.";
    }
    
    if (lowerQuery.includes('help')) {
      return "I can help you find event ticket packages! Just tell me:\n• Where you want to go (location)\n• What sport you're interested in\n• How many people are in your group\n• What type of hospitality experience you want\n• Your preferred date or budget\n\nI'll then suggest packages that match your criteria!";
    }
    
    if (lowerQuery.includes('thank')) {
      return "You're welcome! I'm here whenever you need help finding the perfect ticket package.";
    }
    
    // Default response
    return "I understand you're looking for event tickets. Let me help you find the perfect package based on your preferences.";
  }
}
