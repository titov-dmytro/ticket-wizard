import { UserPreferences, TicketPackage, RecommendationScore } from '../types';

// Vector search implementation for better semantic matching
export class VectorRecommendationEngine {
  private packages: TicketPackage[];
  private packageEmbeddings: Map<string, number[]> = new Map();

  constructor(packages: TicketPackage[]) {
    this.packages = packages;
    this.initializeEmbeddings();
  }

  private async initializeEmbeddings() {
    // In production, this would use a proper embedding service like OpenAI, Cohere, or AWS Bedrock
    // For now, we'll create simple semantic vectors based on package features
    for (const pkg of this.packages) {
      const embedding = await this.createPackageEmbedding(pkg);
      this.packageEmbeddings.set(pkg.id, embedding);
    }
  }

  private async createPackageEmbedding(pkg: TicketPackage): Promise<number[]> {
    // Create a feature vector representing the package
    // In production, this would use a proper embedding model
    const features = [
      // Location features (simplified encoding)
      this.encodeLocation(pkg.location),
      // Sport features
      this.encodeSport(pkg.sportType),
      // Price tier (normalized 0-1)
      Math.min(pkg.price / 1000, 1),
      // Hospitality level (0-1 scale)
      this.encodeHospitalityLevel(pkg.hospitalityLevel),
      // Venue size/prestige (simplified)
      this.encodeVenuePrestige(pkg.venue),
      // Date proximity (future enhancement)
      0.5, // placeholder
      // Availability factor
      Math.min(pkg.availableTickets / 50, 1)
    ].flat();

    return features;
  }

  private encodeLocation(location: string): number[] {
    // Simple one-hot encoding for major cities
    const cities = ['New York', 'Los Angeles', 'Boston', 'Chicago', 'Dallas', 'San Francisco', 'Denver', 'Green Bay'];
    return cities.map(city => location.toLowerCase().includes(city.toLowerCase()) ? 1 : 0);
  }

  private encodeSport(sport: string): number[] {
    // One-hot encoding for sports
    const sports = ['Basketball', 'Baseball', 'Football', 'Hockey'];
    return sports.map(s => sport.toLowerCase() === s.toLowerCase() ? 1 : 0);
  }

  private encodeHospitalityLevel(level: string): number {
    const levels = { 'Bronze': 0.25, 'Silver': 0.5, 'Gold': 0.75, 'Platinum': 1.0 };
    return levels[level as keyof typeof levels] || 0.5;
  }

  private encodeVenuePrestige(venue: string): number {
    // Simplified venue prestige scoring
    const prestigious = ['Madison Square Garden', 'Staples Center', 'Fenway Park', 'Lambeau Field'];
    return prestigious.some(v => venue.includes(v)) ? 1.0 : 0.5;
  }

  public async findRecommendationsByQuery(query: string): Promise<RecommendationScore[]> {
    // Create embedding for user query
    const queryEmbedding = await this.createQueryEmbedding(query);
    
    // Calculate similarity scores
    const scores: RecommendationScore[] = [];
    
    for (const pkg of this.packages) {
      const packageEmbedding = this.packageEmbeddings.get(pkg.id);
      if (packageEmbedding) {
        const similarity = this.cosineSimilarity(queryEmbedding, packageEmbedding);
        const reasons = this.generateReasons(query, pkg, similarity);
        
        scores.push({
          package: pkg,
          score: Math.round(similarity * 100),
          reasons
        });
      }
    }

    return scores
      .filter(item => item.score > 30) // Minimum similarity threshold
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);
  }

  private async createQueryEmbedding(query: string): Promise<number[]> {
    const lowerQuery = query.toLowerCase();
    
    // Extract features from query text
    const features = [
      // Location features
      this.extractLocationFromQuery(lowerQuery),
      // Sport features  
      this.extractSportFromQuery(lowerQuery),
      // Price preference (0-1, higher means more expensive preference)
      this.extractPricePreferenceFromQuery(lowerQuery),
      // Hospitality preference
      this.extractHospitalityFromQuery(lowerQuery),
      // Venue preference (simplified)
      0.5, // placeholder
      // Date preference (placeholder)
      0.5,
      // Group size influence
      this.extractGroupSizeInfluence(lowerQuery)
    ].flat();

    return features;
  }

  private extractLocationFromQuery(query: string): number[] {
    const cities = ['new york', 'los angeles', 'boston', 'chicago', 'dallas', 'san francisco', 'denver', 'green bay'];
    return cities.map(city => query.includes(city) ? 1 : 0);
  }

  private extractSportFromQuery(query: string): number[] {
    const sports = ['basketball', 'baseball', 'football', 'hockey'];
    const teams = {
      'knicks': 'basketball', 'lakers': 'basketball', 'celtics': 'basketball', 'bulls': 'basketball',
      'yankees': 'baseball', 'red sox': 'baseball',
      'cowboys': 'football', 'patriots': 'football'
    };

    const sportVector = sports.map(sport => query.includes(sport) ? 1 : 0);
    
    // Check for team names
    for (const [team, sport] of Object.entries(teams)) {
      if (query.includes(team)) {
        const sportIndex = sports.indexOf(sport);
        if (sportIndex >= 0) sportVector[sportIndex] = 1;
      }
    }

    return sportVector;
  }

  private extractPricePreferenceFromQuery(query: string): number {
    if (query.includes('cheap') || query.includes('budget') || query.includes('under')) return 0.2;
    if (query.includes('premium') || query.includes('expensive') || query.includes('luxury')) return 0.9;
    if (query.includes('vip')) return 1.0;
    return 0.5; // neutral
  }

  private extractHospitalityFromQuery(query: string): number {
    if (query.includes('vip') || query.includes('premium') || query.includes('luxury')) return 1.0;
    if (query.includes('club') || query.includes('lounge')) return 0.75;
    if (query.includes('basic') || query.includes('standard')) return 0.25;
    return 0.5;
  }

  private extractGroupSizeInfluence(query: string): number {
    const groupMatch = query.match(/(\d+)\s*(?:people|person|group|friends)/);
    if (groupMatch) {
      const size = parseInt(groupMatch[1]);
      return Math.min(size / 10, 1); // Normalize group size
    }
    return 0.5;
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) return 0;

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }

    if (normA === 0 || normB === 0) return 0;
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  private generateReasons(query: string, pkg: TicketPackage, similarity: number): string[] {
    const reasons: string[] = [];
    const lowerQuery = query.toLowerCase();

    // Location match
    if (lowerQuery.includes(pkg.location.toLowerCase())) {
      reasons.push(`Located in ${pkg.location} as requested`);
    }

    // Sport match
    if (lowerQuery.includes(pkg.sportType.toLowerCase())) {
      reasons.push(`Perfect for ${pkg.sportType} fans`);
    }

    // Price consideration
    if (lowerQuery.includes('budget') || lowerQuery.includes('cheap')) {
      if (pkg.price < 200) reasons.push(`Budget-friendly at $${pkg.price}`);
    }
    if (lowerQuery.includes('premium') || lowerQuery.includes('vip')) {
      if (pkg.hospitalityLevel === 'Platinum' || pkg.hospitalityLevel === 'Gold') {
        reasons.push(`Premium ${pkg.hospitalityLevel} experience`);
      }
    }

    // Hospitality match
    if (lowerQuery.includes('vip') && pkg.hospitalityType.includes('VIP')) {
      reasons.push(`Includes VIP access and amenities`);
    }

    // High similarity boost
    if (similarity > 0.8) {
      reasons.push(`Excellent match for your preferences`);
    }

    return reasons.length > 0 ? reasons : [`Good option with ${Math.round(similarity * 100)}% match`];
  }

  // Fallback method for compatibility with existing code
  public findRecommendations(preferences: UserPreferences): RecommendationScore[] {
    // Convert preferences to a query string for vector search
    const queryParts: string[] = [];
    
    if (preferences.location) queryParts.push(`in ${preferences.location}`);
    if (preferences.sport) queryParts.push(`${preferences.sport} games`);
    if (preferences.hospitalityType) queryParts.push(`${preferences.hospitalityType} experience`);
    if (preferences.peopleCount) queryParts.push(`for ${preferences.peopleCount} people`);
    if (preferences.budget) queryParts.push(`under $${preferences.budget.max}`);

    const query = queryParts.join(' ') || 'tickets';
    
    // This would be async in real implementation
    // For now, return synchronous fallback
    return this.packages.map(pkg => ({
      package: pkg,
      score: 50, // placeholder score
      reasons: ['Vector search fallback']
    })).slice(0, 5);
  }
}
