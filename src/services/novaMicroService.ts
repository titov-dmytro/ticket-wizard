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
      // Use vector search for better semantic understanding
      return await this.processQueryWithVectorSearch(query, packages, currentPreferences);
    } catch (error) {
      console.error('Error processing query with Nova Micro:', error);
      throw new Error('Failed to process your request. Please try again.');
    }
  }

  private async processQueryWithVectorSearch(
    query: string, 
    packages: TicketPackage[], 
    currentPreferences?: UserPreferences
  ): Promise<{
    response: string;
    updatedPreferences?: UserPreferences;
    suggestedPackages?: TicketPackage[];
  }> {
    const lowerQuery = query.toLowerCase();
    
    // Handle greeting and help queries directly
    if (lowerQuery.includes('hello') || lowerQuery.includes('hi')) {
      return {
        response: "Hello! I'm here to help you find the perfect event ticket package. You can tell me about your preferences like location, sport, number of people, or hospitality type, and I'll suggest the best options for you."
      };
    }
    
    if (lowerQuery.includes('help')) {
      return {
        response: "I can help you find event ticket packages! Just tell me:\n• Where you want to go (location)\n• What sport you're interested in\n• How many people are in your group\n• What type of hospitality experience you want\n• Your preferred date or budget\n\nI'll then suggest packages that match your criteria!"
      };
    }
    
    if (lowerQuery.includes('thank')) {
      return {
        response: "You're welcome! I'm here whenever you need help finding the perfect ticket package."
      };
    }

    // Use vector search for semantic matching
    const { VectorRecommendationEngine } = await import('./vectorRecommendationEngine');
    const vectorEngine = new VectorRecommendationEngine(packages);
    
    // Check if user is looking for recommendations
    const isLookingForTickets = lowerQuery.includes('recommend') || lowerQuery.includes('suggest') || 
                               lowerQuery.includes('find') || lowerQuery.includes('show') || 
                               lowerQuery.includes('want') || lowerQuery.includes('looking') ||
                               lowerQuery.includes('tickets') || lowerQuery.includes('events') || 
                               lowerQuery.includes('games') || lowerQuery.includes('need');

    let response = "I understand you're looking for event tickets.";
    let suggestedPackages: TicketPackage[] | undefined;

    if (isLookingForTickets) {
      try {
        // Use vector search for semantic recommendations
        const recommendations = await vectorEngine.findRecommendationsByQuery(query);
        
        if (recommendations.length > 0) {
          suggestedPackages = recommendations.map(r => r.package);
          
          // Extract any explicit preferences mentioned
          const preferences = this.extractBasicPreferences(query);
          
          // Generate contextual response
          response = this.generateContextualResponse(query, recommendations, preferences);
          
          console.log('Vector search results:', recommendations.length, 'packages found');
          
          return {
            response,
            updatedPreferences: Object.keys(preferences).length > 0 ? preferences : undefined,
            suggestedPackages
          };
        } else {
          // Fallback to showing popular packages
          suggestedPackages = packages.slice(0, 5);
          response = "I'd be happy to help you find the perfect ticket package! Here are some popular options to get you started:";
        }
      } catch (error) {
        console.error('Vector search error:', error);
        // Fallback to popular packages
        suggestedPackages = packages.slice(0, 5);
        response = "I'd be happy to help you find the perfect ticket package! Here are some popular options:";
      }
    } else {
      // Non-ticket queries - provide helpful response
      response = "I'm here to help you find event tickets! Try asking me something like 'Show me basketball tickets in New York' or 'Find VIP packages for 4 people'.";
    }

    return {
      response,
      suggestedPackages
    };
  }

  private extractBasicPreferences(query: string): UserPreferences {
    const lowerQuery = query.toLowerCase();
    const preferences: UserPreferences = {};

    // Extract location
    const cities = ['new york', 'los angeles', 'boston', 'chicago', 'dallas', 'san francisco', 'denver', 'green bay'];
    for (const city of cities) {
      if (lowerQuery.includes(city)) {
        preferences.location = city.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
        break;
      }
    }

    // Extract sport
    const sports = ['basketball', 'football', 'baseball', 'hockey'];
    for (const sport of sports) {
      if (lowerQuery.includes(sport)) {
        preferences.sport = sport;
        break;
      }
    }

    // Extract people count
    const peopleMatch = query.match(/(\d+)\s*(?:people|person|group|friends)/i);
    if (peopleMatch) {
      preferences.peopleCount = parseInt(peopleMatch[1]);
    }

    // Extract hospitality preference
    if (lowerQuery.includes('vip') || lowerQuery.includes('premium')) {
      preferences.hospitalityType = 'VIP';
    } else if (lowerQuery.includes('club')) {
      preferences.hospitalityType = 'Club';
    }

    return preferences;
  }

  private generateContextualResponse(query: string, recommendations: any[], preferences: UserPreferences): string {
    const extractedItems = [];
    
    if (preferences.location) {
      extractedItems.push(`events in ${preferences.location}`);
    }
    if (preferences.sport) {
      extractedItems.push(`${preferences.sport} games`);
    }
    if (preferences.peopleCount) {
      extractedItems.push(`for ${preferences.peopleCount} people`);
    }
    if (preferences.hospitalityType) {
      extractedItems.push(`with ${preferences.hospitalityType} experience`);
    }

    if (extractedItems.length > 0) {
      return `Perfect! I found ${recommendations.length} great options for ${extractedItems.join(', ')}:`;
    } else {
      return `Great! I found ${recommendations.length} ticket packages that match what you're looking for:`;
    }
  }

}
