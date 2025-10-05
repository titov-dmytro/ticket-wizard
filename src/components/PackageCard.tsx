import React from 'react';
import { MapPin, Calendar, Users, Star, ShoppingCart, Check } from 'lucide-react';
import { TicketPackage } from '../types';

interface PackageCardProps {
  package: TicketPackage;
  onAddToCart: () => void;
  isInCart: boolean;
}

export const PackageCard: React.FC<PackageCardProps> = ({ package: pkg, onAddToCart, isInCart }) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getHospitalityLevelColor = (level: string) => {
    switch (level.toLowerCase()) {
      case 'platinum': return 'bg-purple-100 text-purple-800';
      case 'gold': return 'bg-yellow-100 text-yellow-800';
      case 'silver': return 'bg-gray-100 text-gray-800';
      case 'bronze': return 'bg-orange-100 text-orange-800';
      default: return 'bg-blue-100 text-blue-800';
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{pkg.venue}</h3>
          <p className="text-sm text-gray-600">{pkg.sportType} • {pkg.seatingCategory}</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-green-600">${pkg.price}</p>
          <p className="text-xs text-gray-500">per ticket</p>
        </div>
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex items-center text-sm text-gray-600">
          <MapPin className="h-4 w-4 mr-2" />
          <span>{pkg.location}</span>
        </div>
        <div className="flex items-center text-sm text-gray-600">
          <Calendar className="h-4 w-4 mr-2" />
          <span>{formatDate(pkg.date)}</span>
        </div>
        <div className="flex items-center text-sm text-gray-600">
          <Users className="h-4 w-4 mr-2" />
          <span>{pkg.availableTickets} tickets available</span>
        </div>
      </div>

      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Hospitality</span>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getHospitalityLevelColor(pkg.hospitalityLevel)}`}>
            {pkg.hospitalityLevel}
          </span>
        </div>
        <p className="text-sm text-gray-600">{pkg.hospitalityType} - {pkg.hospitalityVenue}</p>
      </div>

      <p className="text-sm text-gray-600 mb-4">{pkg.description}</p>

      <button
        onClick={onAddToCart}
        disabled={isInCart}
        className={`w-full py-2 px-4 rounded-lg font-medium flex items-center justify-center space-x-2 ${
          isInCart
            ? 'bg-green-100 text-green-800 cursor-not-allowed'
            : 'bg-blue-600 text-white hover:bg-blue-700'
        }`}
      >
        {isInCart ? (
          <>
            <Check className="h-4 w-4" />
            <span>Added to Cart</span>
          </>
        ) : (
          <>
            <ShoppingCart className="h-4 w-4" />
            <span>Add to Cart</span>
          </>
        )}
      </button>
    </div>
  );
};
