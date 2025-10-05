import { TicketPackage, UserPreferences, RecommendationScore } from '../types';

export class RecommendationEngine {
  private packages: TicketPackage[];

  constructor(packages: TicketPackage[]) {
    this.packages = packages;
  }

  public findRecommendations(preferences: UserPreferences): RecommendationScore[] {
    const scores = this.packages.map(pkg => ({
      package: pkg,
      score: this.calculateScore(pkg, preferences),
      reasons: this.getReasons(pkg, preferences)
    }));

    return scores
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);
  }

  private calculateScore(pkg: TicketPackage, preferences: UserPreferences): number {
    let score = 0;
    const weights = {
      location: 30,
      sport: 25,
      hospitality: 20,
      date: 15,
      people: 10
    };

    // Location matching
    if (preferences.location && pkg.location.toLowerCase().includes(preferences.location.toLowerCase())) {
      score += weights.location;
    }

    // Sport matching
    if (preferences.sport && pkg.sportType.toLowerCase().includes(preferences.sport.toLowerCase())) {
      score += weights.sport;
    }

    // Hospitality type matching
    if (preferences.hospitalityType && pkg.hospitalityType.toLowerCase().includes(preferences.hospitalityType.toLowerCase())) {
      score += weights.hospitality;
    }

    // Date matching (fuzzy - within 30 days)
    if (preferences.date) {
      const prefDate = new Date(preferences.date);
      const pkgDate = new Date(pkg.date);
      const daysDiff = Math.abs((pkgDate.getTime() - prefDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysDiff <= 30) {
        score += weights.date * (1 - daysDiff / 30);
      }
    }

    // People count matching (available tickets)
    if (preferences.peopleCount && pkg.availableTickets >= preferences.peopleCount) {
      score += weights.people;
    }

    // Budget consideration
    if (preferences.budget) {
      if (pkg.price >= preferences.budget.min && pkg.price <= preferences.budget.max) {
        score += 20;
      } else if (pkg.price < preferences.budget.min) {
        score += 10; // Bonus for under budget
      }
    }

    return Math.round(score);
  }

  private getReasons(pkg: TicketPackage, preferences: UserPreferences): string[] {
    const reasons: string[] = [];

    if (preferences.location && pkg.location.toLowerCase().includes(preferences.location.toLowerCase())) {
      reasons.push(`Matches your location preference: ${pkg.location}`);
    }

    if (preferences.sport && pkg.sportType.toLowerCase().includes(preferences.sport.toLowerCase())) {
      reasons.push(`Perfect for ${pkg.sportType} fans`);
    }

    if (preferences.hospitalityType && pkg.hospitalityType.toLowerCase().includes(preferences.hospitalityType.toLowerCase())) {
      reasons.push(`Includes ${pkg.hospitalityType} experience`);
    }

    if (preferences.peopleCount && pkg.availableTickets >= preferences.peopleCount) {
      reasons.push(`Has ${pkg.availableTickets} tickets available for your group`);
    }

    if (preferences.budget && pkg.price <= preferences.budget.max) {
      reasons.push(`Within your budget at $${pkg.price}`);
    }

    return reasons;
  }

  public searchByKeywords(keywords: string): TicketPackage[] {
    const searchTerms = keywords.toLowerCase().split(' ');
    
    return this.packages.filter(pkg => {
      const searchableText = [
        pkg.venue,
        pkg.sportType,
        pkg.location,
        pkg.hospitalityType,
        pkg.seatingCategory,
        pkg.description
      ].join(' ').toLowerCase();

      return searchTerms.some(term => searchableText.includes(term));
    });
  }
}
