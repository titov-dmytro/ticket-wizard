import React, { useState, useRef, useEffect } from 'react';
import { Send, MessageCircle } from 'lucide-react';
import { ChatMessage, TicketPackage, UserPreferences } from '../types';
import { NovaMicroService } from '../services/novaMicroService';
import { RecommendationEngine } from '../services/recommendationEngine';
import { PackageCard } from './PackageCard';

interface ChatInterfaceProps {
  packages: TicketPackage[];
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ packages }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      type: 'ai',
      content: "Hello! I'm your personal ticket package assistant. I can help you find the perfect event tickets based on your preferences. Just tell me what you're looking for - location, sport, number of people, hospitality type, or anything else!",
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [userPreferences, setUserPreferences] = useState<UserPreferences>({});
  const [cart, setCart] = useState<TicketPackage[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const novaMicroService = new NovaMicroService();
  const recommendationEngine = new RecommendationEngine(packages);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const result = await novaMicroService.processUserQuery(
        inputValue,
        packages,
        userPreferences
      );

      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: result.response,
        timestamp: new Date(),
        suggestions: result.suggestedPackages
      };

      setMessages(prev => [...prev, aiMessage]);

      if (result.updatedPreferences) {
        setUserPreferences(prev => ({ ...prev, ...result.updatedPreferences }));
      }
    } catch (error) {
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: "I'm sorry, I encountered an error processing your request. Please try again.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddToCart = (pkg: TicketPackage) => {
    setCart(prev => [...prev, pkg]);
    
    const confirmationMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'ai',
      content: `Great choice! I've added "${pkg.venue} - ${pkg.sportType}" to your cart. The total is now $${cart.reduce((sum, item) => sum + item.price, 0) + pkg.price}. Would you like to see more options or are you ready to proceed with your selection?`,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, confirmationMessage]);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <MessageCircle className="h-8 w-8 text-blue-600" />
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Ticket Package Assistant</h1>
              <p className="text-sm text-gray-500">Find your perfect event experience</p>
            </div>
          </div>
          {cart.length > 0 && (
            <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
              {cart.length} item{cart.length !== 1 ? 's' : ''} in cart - ${cart.reduce((sum, item) => sum + item.price, 0)}
            </div>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div key={message.id} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-3xl ${message.type === 'user' ? 'order-2' : 'order-1'}`}>
              <div className={`rounded-lg p-4 ${
                message.type === 'user' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-white border border-gray-200'
              }`}>
                <p className="whitespace-pre-wrap">{message.content}</p>
                
                {message.suggestions && message.suggestions.length > 0 && (
                  <div className="mt-4 space-y-3">
                    {message.suggestions.map((pkg) => (
                      <PackageCard
                        key={pkg.id}
                        package={pkg}
                        onAddToCart={() => handleAddToCart(pkg)}
                        isInCart={cart.some(item => item.id === pkg.id)}
                      />
                    ))}
                  </div>
                )}
              </div>
              <p className={`text-xs text-gray-500 mt-1 ${message.type === 'user' ? 'text-right' : 'text-left'}`}>
                {message.timestamp.toLocaleTimeString()}
              </p>
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex space-x-2">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="bg-white border-t p-4">
        <div className="flex space-x-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Tell me what you're looking for..."
            className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={isLoading}
          />
          <button
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isLoading}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            <Send className="h-4 w-4" />
            <span>Send</span>
          </button>
        </div>
      </div>
    </div>
  );
};
