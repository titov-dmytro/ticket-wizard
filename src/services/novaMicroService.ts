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

    // Extract preferences from natural language - improved patterns
    
    // Location extraction - more flexible patterns
    if (lowerQuery.includes('location') || lowerQuery.includes('where') || lowerQuery.includes('in ') || 
        lowerQuery.includes('at ') || lowerQuery.includes('near')) {
      const locationPatterns = [
        /(?:in|at|near|location)\s+([a-zA-Z\s]+?)(?:\s|$|,|\.|!|\?)/i,
        /([a-zA-Z\s]+)\s+(?:area|city|stadium|venue)/i,
        /(new york|los angeles|boston|chicago|dallas|san francisco|denver|green bay)/i
      ];
      
      for (const pattern of locationPatterns) {
        const match = query.match(pattern);
        if (match) {
          preferences.location = match[1].trim();
          break;
        }
      }
    }

    // People count extraction - more patterns
    if (lowerQuery.includes('people') || lowerQuery.includes('group') || lowerQuery.includes('tickets') ||
        lowerQuery.includes('person') || lowerQuery.includes('us') || lowerQuery.includes('friends')) {
      const peoplePatterns = [
        /(\d+)\s+(?:people|tickets|group|persons|friends)/i,
        /(?:for|group of|party of)\s+(\d+)/i,
        /(\d+)\s+(?:of us)/i
      ];
      
      for (const pattern of peoplePatterns) {
        const match = query.match(pattern);
        if (match) {
          preferences.peopleCount = parseInt(match[1]);
          break;
        }
      }
    }

    // Sport extraction - include team names and more flexible matching
    const sports = ['basketball', 'football', 'baseball', 'hockey', 'soccer'];
    const teams = ['knicks', 'lakers', 'celtics', 'bulls', 'cowboys', 'patriots', 'yankees', 'red sox'];
    
    for (const sport of sports) {
      if (lowerQuery.includes(sport)) {
        preferences.sport = sport;
        break;
      }
    }
    
    // Check for team names
    if (!preferences.sport) {
      for (const team of teams) {
        if (lowerQuery.includes(team)) {
          // Map teams to sports (simplified)
          if (['knicks', 'lakers', 'celtics', 'bulls'].includes(team)) {
            preferences.sport = 'basketball';
          } else if (['cowboys', 'patriots'].includes(team)) {
            preferences.sport = 'football';
          } else if (['yankees', 'red sox'].includes(team)) {
            preferences.sport = 'baseball';
          }
          break;
        }
      }
    }

    // Hospitality extraction - more flexible
    if (lowerQuery.includes('vip') || lowerQuery.includes('premium') || lowerQuery.includes('luxury')) {
      preferences.hospitalityType = 'VIP';
    } else if (lowerQuery.includes('club') || lowerQuery.includes('lounge')) {
      preferences.hospitalityType = 'Club';
    } else if (lowerQuery.includes('basic') || lowerQuery.includes('standard') || lowerQuery.includes('cheap')) {
      preferences.hospitalityType = 'Basic';
    }

    // Price/budget extraction - more flexible
    if (lowerQuery.includes('budget') || lowerQuery.includes('price') || lowerQuery.includes('cost') ||
        lowerQuery.includes('under') || lowerQuery.includes('below') || lowerQuery.includes('cheap') ||
        lowerQuery.includes('expensive') || lowerQuery.includes('$')) {
      const budgetPatterns = [
        /\$?(\d+)(?:\s*-\s*\$?(\d+))?/,
        /(?:under|below|less than)\s*\$?(\d+)/i,
        /(?:around|about)\s*\$?(\d+)/i
      ];
      
      for (const pattern of budgetPatterns) {
        const match = query.match(pattern);
        if (match) {
          const min = parseInt(match[1]);
          const max = match[2] ? parseInt(match[2]) : (lowerQuery.includes('under') || lowerQuery.includes('below')) ? 1000 : min * 2;
          preferences.budget = { min: 0, max };
          break;
        }
      }
    }

    // Generate response based on query type
    let response = this.generateResponse(query, preferences);
    
    // Debug logging (remove in production)
    console.log('Query:', query);
    console.log('Extracted preferences:', preferences);
    
    // If user is asking for recommendations, find packages
    let suggestedPackages: TicketPackage[] | undefined;
    if (lowerQuery.includes('recommend') || lowerQuery.includes('suggest') || lowerQuery.includes('find') || 
        lowerQuery.includes('show') || lowerQuery.includes('want') || lowerQuery.includes('looking') ||
        lowerQuery.includes('tickets') || lowerQuery.includes('events') || lowerQuery.includes('games')) {
      // Dynamic import to avoid require() in Vite
      const { RecommendationEngine } = await import('./recommendationEngine');
      const engine = new RecommendationEngine(packages);
      
      if (Object.keys(preferences).length > 0) {
        // User has specific preferences
        const recommendations = engine.findRecommendations(preferences);
        suggestedPackages = recommendations.map((r: any) => r.package);
        
        if (suggestedPackages && suggestedPackages.length > 0) {
          response += `\n\nI found ${suggestedPackages.length} packages that match your preferences:`;
        } else {
          response += "\n\nI couldn't find exact matches, but here are some similar options:";
          suggestedPackages = packages.slice(0, 3);
        }
      } else {
        // No specific preferences, show popular options
        suggestedPackages = packages.slice(0, 5);
        response += "\n\nHere are some popular ticket packages to get you started:";
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
    
    // Generate response based on extracted preferences
    let response = "I understand you're looking for event tickets.";
    
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
      extractedItems.push(`with ${preferences.hospitalityType} hospitality`);
    }
    
    if (preferences.budget) {
      extractedItems.push(`under $${preferences.budget.max}`);
    }
    
    if (extractedItems.length > 0) {
      response = `Perfect! I understand you're looking for ${extractedItems.join(', ')}.`;
    }
    
    // If no specific preferences were extracted but user is asking for something
    if (Object.keys(preferences).length === 0 && 
        (lowerQuery.includes('find') || lowerQuery.includes('show') || lowerQuery.includes('recommend') || 
         lowerQuery.includes('suggest') || lowerQuery.includes('want') || lowerQuery.includes('looking'))) {
      response = "I'd be happy to help you find the perfect ticket package! Let me show you some great options:";
    }
    
    return response;
  }
}
