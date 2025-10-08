import { TicketPackage, RecommendationScore } from '../types';

// FAISS-based vector search service for efficient similarity search
export class FAISSSearchService {
  private faissIndex: any = null;
  private packages: TicketPackage[] = [];
  private packageEmbeddings: Map<string, number[]> = new Map();
  private embeddingDimension: number = 384; // Standard embedding dimension
  private isInitialized: boolean = false;

  constructor(packages: TicketPackage[]) {
    this.packages = packages;
    this.initializeIndex();
  }

  private async initializeIndex(): Promise<void> {
    try {
      // Dynamic import of faiss-node (may not be available in all environments)
      const faiss = await import('faiss-node');
      
      // Create FAISS index - using IndexFlatIP (Inner Product) for semantic search
      // For larger datasets, consider IndexIVFFlat or IndexHNSWFlat
      this.faissIndex = new faiss.IndexFlatIP(this.embeddingDimension);
      
      // Generate embeddings for all packages
      await this.generatePackageEmbeddings();
      
      // Build the FAISS index
      await this.buildIndex();
      
      this.isInitialized = true;
      console.log(`FAISS index initialized with ${this.packages.length} packages`);
    } catch (error) {
      console.error('Failed to initialize FAISS:', error);
      console.log('Falling back to simple vector search');
      // Fallback to basic implementation
      this.isInitialized = false;
    }
  }

  private async generatePackageEmbeddings(): Promise<void> {
    for (const pkg of this.packages) {
      try {
        const embedding = await this.createPackageEmbedding(pkg);
        this.packageEmbeddings.set(pkg.id, embedding);
      } catch (error) {
        console.error(`Failed to generate embedding for package ${pkg.id}:`, error);
        // Use fallback embedding
        const fallbackEmbedding = this.createFallbackEmbedding(pkg);
        this.packageEmbeddings.set(pkg.id, fallbackEmbedding);
      }
    }
  }

  private async buildIndex(): Promise<void> {
    if (!this.faissIndex) return;

    // Convert embeddings to the format FAISS expects
    const embeddings: number[][] = [];
    const packageIds: string[] = [];

    for (const pkg of this.packages) {
      const embedding = this.packageEmbeddings.get(pkg.id);
      if (embedding) {
        embeddings.push(embedding);
        packageIds.push(pkg.id);
      }
    }

    if (embeddings.length === 0) {
      throw new Error('No valid embeddings found');
    }

    // Add vectors to FAISS index
    const vectors = new Float32Array(embeddings.flat());
    await this.faissIndex.add(vectors);

    console.log(`Built FAISS index with ${embeddings.length} vectors`);
  }

  private async createPackageEmbedding(pkg: TicketPackage): Promise<number[]> {
    // In production, this would use a real embedding service like:
    // - OpenAI text-embedding-ada-002
    // - Cohere embed models
    // - Sentence Transformers
    // - AWS Bedrock Titan embeddings

    // For now, create enhanced feature vectors that are more sophisticated
    // than the current implementation
    const features = [
      // Enhanced location encoding with geographic proximity
      ...this.encodeLocationWithProximity(pkg.location),
      // Sport encoding with team relationships
      ...this.encodeSportWithTeams(pkg.sportType),
      // Multi-dimensional price encoding
      ...this.encodePriceFeatures(pkg.price),
      // Enhanced hospitality encoding
      ...this.encodeHospitalityFeatures(pkg.hospitalityLevel, pkg.hospitalityType),
      // Venue features with capacity and prestige
      ...this.encodeVenueFeatures(pkg.venue),
      // Temporal features
      ...this.encodeDateFeatures(pkg.date),
      // Availability and demand features
      ...this.encodeAvailabilityFeatures(pkg.availableTickets),
      // Semantic text features from description
      ...this.encodeTextFeatures(pkg.description || ''),
      // Seating category features
      ...this.encodeSeatingFeatures(pkg.seatingCategory)
    ];

    // Ensure consistent dimensionality
    while (features.length < this.embeddingDimension) {
      features.push(0);
    }

    return features.slice(0, this.embeddingDimension);
  }

  private createFallbackEmbedding(pkg: TicketPackage): number[] {
    // Simple fallback when advanced embedding fails
    const basic = [
      // Basic location (8 dims)
      ...this.encodeBasicLocation(pkg.location),
      // Basic sport (4 dims)
      ...this.encodeBasicSport(pkg.sportType),
      // Price tier
      Math.min(pkg.price / 1000, 1),
      // Hospitality level
      this.encodeBasicHospitality(pkg.hospitalityLevel)
    ];

    // Pad to required dimension
    while (basic.length < this.embeddingDimension) {
      basic.push(Math.random() * 0.1); // Small random values
    }

    return basic.slice(0, this.embeddingDimension);
  }

  // Enhanced encoding methods
  private encodeLocationWithProximity(location: string): number[] {
    const cities = {
      'new york': [1, 0, 0, 0, 0, 0, 0, 0, 0.8, 0.3], // NYC + regional influence
      'los angeles': [0, 1, 0, 0, 0, 0, 0, 0, 0.2, 0.9],
      'boston': [0, 0, 1, 0, 0, 0, 0, 0, 0.9, 0.1], // Close to NYC
      'chicago': [0, 0, 0, 1, 0, 0, 0, 0, 0.4, 0.4],
      'dallas': [0, 0, 0, 0, 1, 0, 0, 0, 0.1, 0.6],
      'san francisco': [0, 0, 0, 0, 0, 1, 0, 0, 0.1, 0.8],
      'denver': [0, 0, 0, 0, 0, 0, 1, 0, 0.2, 0.2],
      'green bay': [0, 0, 0, 0, 0, 0, 0, 1, 0.3, 0.1]
    };

    const lowerLocation = location.toLowerCase();
    for (const [city, encoding] of Object.entries(cities)) {
      if (lowerLocation.includes(city)) {
        return encoding;
      }
    }
    
    return [0, 0, 0, 0, 0, 0, 0, 0, 0.5, 0.5]; // Unknown location
  }

  private encodeSportWithTeams(sport: string): number[] {
    const sportFeatures = {
      'basketball': [1, 0, 0, 0, 0.9, 0.8, 0.7], // High indoor, entertainment value
      'baseball': [0, 1, 0, 0, 0.6, 0.9, 0.8], // Seasonal, outdoor
      'football': [0, 0, 1, 0, 0.7, 0.6, 0.9], // High excitement
      'hockey': [0, 0, 0, 1, 0.8, 0.7, 0.8]
    };

    const lowerSport = sport.toLowerCase();
    for (const [sportType, features] of Object.entries(sportFeatures)) {
      if (lowerSport.includes(sportType)) {
        return features;
      }
    }

    return [0, 0, 0, 0, 0.5, 0.5, 0.5]; // Unknown sport
  }

  private encodePriceFeatures(price: number): number[] {
    return [
      Math.min(price / 1000, 1), // Normalized price
      price < 100 ? 1 : 0, // Budget tier
      price >= 100 && price < 500 ? 1 : 0, // Mid tier
      price >= 500 && price < 1000 ? 1 : 0, // Premium tier
      price >= 1000 ? 1 : 0, // Luxury tier
      Math.log(price + 1) / 10 // Log-scaled price for better distribution
    ];
  }

  private encodeHospitalityFeatures(level: string, type: string): number[] {
    const levelScore = {
      'Bronze': 0.25,
      'Silver': 0.5,
      'Gold': 0.75,
      'Platinum': 1.0
    }[level] || 0.5;

    const typeFeatures = [
      type.toLowerCase().includes('vip') ? 1 : 0,
      type.toLowerCase().includes('club') ? 1 : 0,
      type.toLowerCase().includes('premium') ? 1 : 0,
      type.toLowerCase().includes('standard') ? 1 : 0
    ];

    return [levelScore, ...typeFeatures];
  }

  private encodeVenueFeatures(venue: string): number[] {
    const prestigiousVenues = [
      'madison square garden', 'staples center', 'fenway park', 
      'lambeau field', 'yankee stadium', 'td garden'
    ];
    
    const lowerVenue = venue.toLowerCase();
    const isPrestigious = prestigiousVenues.some(v => lowerVenue.includes(v)) ? 1 : 0.5;
    
    return [
      isPrestigious,
      lowerVenue.includes('center') || lowerVenue.includes('arena') ? 1 : 0,
      lowerVenue.includes('stadium') ? 1 : 0,
      lowerVenue.includes('field') || lowerVenue.includes('park') ? 1 : 0
    ];
  }

  private encodeDateFeatures(date: string): number[] {
    const eventDate = new Date(date);
    const now = new Date();
    const daysDiff = Math.abs((eventDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    return [
      Math.min(daysDiff / 365, 1), // Days until event (normalized)
      eventDate.getMonth() / 12, // Season encoding
      eventDate.getDay() / 7, // Day of week
      daysDiff < 7 ? 1 : 0, // This week
      daysDiff < 30 ? 1 : 0 // This month
    ];
  }

  private encodeAvailabilityFeatures(available: number): number[] {
    return [
      Math.min(available / 100, 1), // Normalized availability
      available > 50 ? 1 : 0, // High availability
      available < 10 ? 1 : 0, // Low availability (scarcity)
      available === 0 ? 1 : 0 // Sold out
    ];
  }

  private encodeTextFeatures(description: string): number[] {
    // Simple text feature extraction
    const lowerDesc = description.toLowerCase();
    const keywords = ['luxury', 'premium', 'exclusive', 'family', 'group', 'corporate', 'special'];
    
    return keywords.map(keyword => lowerDesc.includes(keyword) ? 1 : 0);
  }

  private encodeSeatingFeatures(category: string): number[] {
    const lowerCategory = category.toLowerCase();
    return [
      lowerCategory.includes('floor') || lowerCategory.includes('court') ? 1 : 0,
      lowerCategory.includes('lower') ? 1 : 0,
      lowerCategory.includes('upper') ? 1 : 0,
      lowerCategory.includes('suite') || lowerCategory.includes('box') ? 1 : 0,
      lowerCategory.includes('club') ? 1 : 0
    ];
  }

  // Basic encoding methods for fallback
  private encodeBasicLocation(location: string): number[] {
    const cities = ['new york', 'los angeles', 'boston', 'chicago', 'dallas', 'san francisco', 'denver', 'green bay'];
    return cities.map(city => location.toLowerCase().includes(city) ? 1 : 0);
  }

  private encodeBasicSport(sport: string): number[] {
    const sports = ['basketball', 'baseball', 'football', 'hockey'];
    return sports.map(s => sport.toLowerCase() === s ? 1 : 0);
  }

  private encodeBasicHospitality(level: string): number {
    const levels = { 'Bronze': 0.25, 'Silver': 0.5, 'Gold': 0.75, 'Platinum': 1.0 };
    return levels[level as keyof typeof levels] || 0.5;
  }

  public async findRecommendationsByQuery(query: string, k: number = 5): Promise<RecommendationScore[]> {
    if (!this.isInitialized || !this.faissIndex) {
      // Fallback to simple similarity search
      return this.fallbackSearch(query, k);
    }

    try {
      // Create query embedding
      const queryEmbedding = await this.createQueryEmbedding(query);
      
      // Search using FAISS
      const searchVector = new Float32Array(queryEmbedding);
      const results = await this.faissIndex.search(searchVector, k);
      
      // Convert FAISS results to RecommendationScore format
      const recommendations: RecommendationScore[] = [];
      
      for (let i = 0; i < results.labels.length; i++) {
        const packageIndex = results.labels[i];
        const similarity = results.distances[i];
        
        if (packageIndex >= 0 && packageIndex < this.packages.length) {
          const pkg = this.packages[packageIndex];
          const score = Math.round(Math.max(0, similarity * 100));
          const reasons = this.generateReasons(query, pkg, similarity);
          
          recommendations.push({
            package: pkg,
            score,
            reasons
          });
        }
      }

      return recommendations.filter(r => r.score > 30);
    } catch (error) {
      console.error('FAISS search error:', error);
      return this.fallbackSearch(query, k);
    }
  }

  private async createQueryEmbedding(query: string): Promise<number[]> {
    // Enhanced query embedding similar to package embedding
    const lowerQuery = query.toLowerCase();
    
    const features = [
      // Location extraction
      ...this.extractLocationFromQuery(lowerQuery),
      // Sport extraction with team recognition
      ...this.extractSportFromQuery(lowerQuery),
      // Price preferences
      ...this.extractPricePreferences(lowerQuery),
      // Hospitality preferences
      ...this.extractHospitalityPreferences(lowerQuery),
      // Venue preferences
      ...this.extractVenuePreferences(lowerQuery),
      // Date preferences
      ...this.extractDatePreferences(lowerQuery),
      // Group size preferences
      ...this.extractGroupPreferences(lowerQuery),
      // Intent features
      ...this.extractIntentFeatures(lowerQuery),
      // Seating preferences
      ...this.extractSeatingPreferences(lowerQuery)
    ];

    // Ensure consistent dimensionality
    while (features.length < this.embeddingDimension) {
      features.push(0);
    }

    return features.slice(0, this.embeddingDimension);
  }

  private extractLocationFromQuery(query: string): number[] {
    const cities = {
      'new york': [1, 0, 0, 0, 0, 0, 0, 0, 0.8, 0.3],
      'nyc': [1, 0, 0, 0, 0, 0, 0, 0, 0.8, 0.3],
      'los angeles': [0, 1, 0, 0, 0, 0, 0, 0, 0.2, 0.9],
      'la': [0, 1, 0, 0, 0, 0, 0, 0, 0.2, 0.9],
      'boston': [0, 0, 1, 0, 0, 0, 0, 0, 0.9, 0.1],
      'chicago': [0, 0, 0, 1, 0, 0, 0, 0, 0.4, 0.4],
      'dallas': [0, 0, 0, 0, 1, 0, 0, 0, 0.1, 0.6],
      'san francisco': [0, 0, 0, 0, 0, 1, 0, 0, 0.1, 0.8],
      'sf': [0, 0, 0, 0, 0, 1, 0, 0, 0.1, 0.8],
      'denver': [0, 0, 0, 0, 0, 0, 1, 0, 0.2, 0.2],
      'green bay': [0, 0, 0, 0, 0, 0, 0, 1, 0.3, 0.1]
    };

    for (const [city, encoding] of Object.entries(cities)) {
      if (query.includes(city)) {
        return encoding;
      }
    }

    return [0, 0, 0, 0, 0, 0, 0, 0, 0.5, 0.5]; // No specific location
  }

  private extractSportFromQuery(query: string): number[] {
    const sports = {
      'basketball': [1, 0, 0, 0, 0.9, 0.8, 0.7],
      'baseball': [0, 1, 0, 0, 0.6, 0.9, 0.8],
      'football': [0, 0, 1, 0, 0.7, 0.6, 0.9],
      'hockey': [0, 0, 0, 1, 0.8, 0.7, 0.8]
    };

    const teams = {
      'knicks': 'basketball', 'lakers': 'basketball', 'celtics': 'basketball', 'bulls': 'basketball',
      'yankees': 'baseball', 'red sox': 'baseball', 'dodgers': 'baseball',
      'cowboys': 'football', 'patriots': 'football', 'packers': 'football'
    };

    // Check direct sport mentions
    for (const [sport, features] of Object.entries(sports)) {
      if (query.includes(sport)) {
        return features;
      }
    }

    // Check team mentions
    for (const [team, sport] of Object.entries(teams)) {
      if (query.includes(team)) {
        return sports[sport as keyof typeof sports] || [0, 0, 0, 0, 0.5, 0.5, 0.5];
      }
    }

    return [0, 0, 0, 0, 0.5, 0.5, 0.5]; // No specific sport
  }

  private extractPricePreferences(query: string): number[] {
    let priceLevel = 0.5; // Default neutral
    let budget = 0, mid = 0, premium = 0, luxury = 0;

    if (query.includes('cheap') || query.includes('budget') || query.includes('affordable')) {
      priceLevel = 0.2;
      budget = 1;
    } else if (query.includes('premium') || query.includes('expensive')) {
      priceLevel = 0.8;
      premium = 1;
    } else if (query.includes('vip') || query.includes('luxury')) {
      priceLevel = 1.0;
      luxury = 1;
    } else if (query.includes('mid') || query.includes('moderate')) {
      priceLevel = 0.5;
      mid = 1;
    }

    return [priceLevel, budget, mid, premium, luxury, Math.log(priceLevel * 1000 + 1) / 10];
  }

  private extractHospitalityPreferences(query: string): number[] {
    let level = 0.5;
    const features = [0, 0, 0, 0]; // [vip, club, premium, standard]

    if (query.includes('vip')) {
      level = 1.0;
      features[0] = 1;
    } else if (query.includes('club')) {
      level = 0.75;
      features[1] = 1;
    } else if (query.includes('premium')) {
      level = 0.75;
      features[2] = 1;
    } else if (query.includes('standard') || query.includes('basic')) {
      level = 0.25;
      features[3] = 1;
    }

    return [level, ...features];
  }

  private extractVenuePreferences(query: string): number[] {
    return [
      0.5, // Default prestige
      query.includes('center') || query.includes('arena') ? 1 : 0,
      query.includes('stadium') ? 1 : 0,
      query.includes('field') || query.includes('park') ? 1 : 0
    ];
  }

  private extractDatePreferences(query: string): number[] {
    const now = new Date();
    let timePreference = 0.5;

    if (query.includes('tonight') || query.includes('today')) {
      timePreference = 0.1;
    } else if (query.includes('this week')) {
      timePreference = 0.2;
    } else if (query.includes('this month')) {
      timePreference = 0.3;
    } else if (query.includes('next month')) {
      timePreference = 0.5;
    }

    return [
      timePreference,
      now.getMonth() / 12,
      now.getDay() / 7,
      query.includes('week') ? 1 : 0,
      query.includes('month') ? 1 : 0
    ];
  }

  private extractGroupPreferences(query: string): number[] {
    const groupMatch = query.match(/(\d+)\s*(?:people|person|group|friends|family)/);
    let size = 0.5;
    let availability = 0.5;

    if (groupMatch) {
      const groupSize = parseInt(groupMatch[1]);
      size = Math.min(groupSize / 10, 1);
      availability = groupSize > 4 ? 0.8 : 0.5; // Larger groups need more availability
    }

    return [
      size,
      query.includes('group') ? 1 : 0,
      query.includes('family') ? 1 : 0,
      availability > 0.5 ? 1 : 0
    ];
  }

  private extractIntentFeatures(query: string): number[] {
    return [
      query.includes('luxury') ? 1 : 0,
      query.includes('family') ? 1 : 0,
      query.includes('corporate') ? 1 : 0,
      query.includes('date') || query.includes('romantic') ? 1 : 0,
      query.includes('celebration') || query.includes('special') ? 1 : 0,
      query.includes('business') ? 1 : 0,
      query.includes('entertainment') ? 1 : 0
    ];
  }

  private extractSeatingPreferences(query: string): number[] {
    return [
      query.includes('floor') || query.includes('court') ? 1 : 0,
      query.includes('lower') ? 1 : 0,
      query.includes('upper') ? 1 : 0,
      query.includes('suite') || query.includes('box') ? 1 : 0,
      query.includes('club') ? 1 : 0
    ];
  }

  private fallbackSearch(query: string, k: number): RecommendationScore[] {
    // Simple cosine similarity fallback
    const queryEmbedding = this.createQueryEmbedding(query);
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
      .filter(item => item.score > 30)
      .sort((a, b) => b.score - a.score)
      .slice(0, k);
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
    } else if (similarity > 0.6) {
      reasons.push(`Good match for your requirements`);
    }

    return reasons.length > 0 ? reasons : [`${Math.round(similarity * 100)}% match for your search`];
  }

  // Performance monitoring
  public getPerformanceStats(): {
    isInitialized: boolean;
    packageCount: number;
    embeddingDimension: number;
    indexType: string;
  } {
    return {
      isInitialized: this.isInitialized,
      packageCount: this.packages.length,
      embeddingDimension: this.embeddingDimension,
      indexType: this.faissIndex ? 'FAISS IndexFlatIP' : 'Fallback Cosine Similarity'
    };
  }
}
