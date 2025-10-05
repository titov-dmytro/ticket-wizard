# Event Ticket Finder

A React TypeScript application that helps users find the perfect event ticket package through an AI-powered chat interface. The app uses Amazon Nova Micro for natural language processing and provides intelligent recommendations based on user preferences.

## Features

- 🤖 **AI Chat Interface**: Natural language conversation with Nova Micro AI
- 🎯 **Smart Recommendations**: Fuzzy matching algorithm for personalized suggestions
- 🛒 **Shopping Cart**: Add packages to cart with real-time updates
- 📱 **Responsive Design**: Works seamlessly on desktop and mobile
- ⚡ **Real-time Chat**: Instant responses with loading states
- 🎫 **Rich Package Display**: Detailed ticket package information with hospitality details

## Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS
- **AI**: Amazon Nova Micro (Bedrock)
- **Database**: AWS DynamoDB
- **Backend**: AWS Lambda, API Gateway
- **Deployment**: AWS Amplify
- **Icons**: Lucide React

## Quick Start

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Start Development Server**
   ```bash
   npm start
   ```

3. **Build for Production**
   ```bash
   npm run build
   ```

## Project Structure

```
src/
├── components/
│   ├── ChatInterface.tsx    # Main chat interface
│   └── PackageCard.tsx      # Ticket package display card
├── data/
│   └── samplePackages.ts    # Sample ticket data
├── services/
│   ├── recommendationEngine.ts  # Fuzzy matching algorithm
│   └── novaMicroService.ts      # AI service integration
├── types/
│   └── index.ts             # TypeScript interfaces
├── App.tsx                  # Main application component
├── index.tsx               # Application entry point
└── index.css               # Global styles with Tailwind
```

## Sample Data

The app includes 10 sample ticket packages across different sports and venues:

- **Basketball**: Madison Square Garden, Staples Center, Crypto.com Arena
- **Baseball**: Fenway Park, Wrigley Field, Oracle Park, Coors Field
- **Football**: Lambeau Field, AT&T Stadium
- **Hockey**: TD Garden

Each package includes:
- Price, venue, date, sport type
- Seating category and hospitality details
- Location and available ticket count
- Rich descriptions

## Chat Examples

Users can interact naturally with the AI:

- "I want basketball tickets in New York for 4 people"
- "Show me VIP packages under $500"
- "Find me baseball games in Chicago next month"
- "I need club access for a group of 8"

## AWS Setup

For production deployment, follow the detailed instructions in `AWS_SETUP_INSTRUCTIONS.md`:

1. Set up DynamoDB table
2. Configure Amazon Nova Micro (Bedrock)
3. Deploy Lambda functions
4. Set up API Gateway
5. Deploy with AWS Amplify

## Environment Variables

Copy `env.example` to `.env` and configure:

```env
REACT_APP_AWS_REGION=us-east-1
REACT_APP_DYNAMODB_TABLE_NAME=TicketPackages
REACT_APP_API_GATEWAY_URL=your-api-gateway-url
REACT_APP_NOVA_MICRO_API_KEY=your-nova-micro-key
REACT_APP_NOVA_MICRO_BASE_URL=your-bedrock-endpoint
```

## Development

The app is built with modern React patterns:

- **Functional Components** with hooks
- **TypeScript** for type safety
- **Tailwind CSS** for styling
- **Modular Architecture** for maintainability

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.
