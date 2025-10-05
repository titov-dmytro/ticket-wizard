# AWS Setup Instructions for Event Ticket Finder

## Prerequisites
- AWS Account with appropriate permissions
- AWS CLI installed and configured
- Node.js and npm installed

## Step 1: Create DynamoDB Table

```bash
# Create DynamoDB table for ticket packages
aws dynamodb create-table \
    --table-name TicketPackages \
    --attribute-definitions \
        AttributeName=id,AttributeType=S \
    --key-schema \
        AttributeName=id,KeyType=HASH \
    --provisioned-throughput \
        ReadCapacityUnits=5,WriteCapacityUnits=5 \
    --region us-east-1
```

## Step 2: Populate DynamoDB with Sample Data

Create a file called `populate-db.json`:

```json
{
  "TicketPackages": [
    {
      "id": {"S": "1"},
      "price": {"N": "450"},
      "venue": {"S": "Madison Square Garden"},
      "date": {"S": "2024-03-15"},
      "sportType": {"S": "Basketball"},
      "seatingCategory": {"S": "Premium"},
      "hospitalityType": {"S": "VIP Lounge"},
      "hospitalityVenue": {"S": "Chase VIP Club"},
      "hospitalityLevel": {"S": "Platinum"},
      "location": {"S": "New York"},
      "availableTickets": {"N": "8"},
      "description": {"S": "Premium courtside seats with exclusive VIP lounge access"}
    },
    {
      "id": {"S": "2"},
      "price": {"N": "280"},
      "venue": {"S": "Staples Center"},
      "date": {"S": "2024-03-20"},
      "sportType": {"S": "Basketball"},
      "seatingCategory": {"S": "Lower Level"},
      "hospitalityType": {"S": "Club Access"},
      "hospitalityVenue": {"S": "Lexus Club"},
      "hospitalityLevel": {"S": "Gold"},
      "location": {"S": "Los Angeles"},
      "availableTickets": {"N": "12"},
      "description": {"S": "Lower level seats with club access and premium dining"}
    }
  ]
}
```

```bash
# Populate the table (repeat for each package)
aws dynamodb batch-write-item --request-items file://populate-db.json --region us-east-1
```

## Step 3: Set up Amazon Nova Micro (Bedrock)

1. Go to AWS Console → Amazon Bedrock
2. Enable Nova Micro model access
3. Create an IAM role with Bedrock permissions:
   - `bedrock:InvokeModel`
   - `bedrock:InvokeModelWithResponseStream`
4. Note down the model ID and region

## Step 4: Create Lambda Function for API

Create a file called `lambda-function.js`:

```javascript
const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient();

exports.handler = async (event) => {
    try {
        const { query, preferences } = JSON.parse(event.body);
        
        // Get packages from DynamoDB
        const packagesResult = await dynamodb.scan({
            TableName: 'TicketPackages'
        }).promise();
        
        // Process with Nova Micro (simplified for demo)
        const response = {
            message: "I found some great options for you!",
            packages: packagesResult.Items.slice(0, 5)
        };
        
        return {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Allow-Methods': 'POST, OPTIONS'
            },
            body: JSON.stringify(response)
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message })
        };
    }
};
```

## Step 5: Deploy Lambda Function

```bash
# Create deployment package
zip lambda-function.zip lambda-function.js

# Create Lambda function
aws lambda create-function \
    --function-name ticket-finder-api \
    --runtime nodejs18.x \
    --role arn:aws:iam::YOUR_ACCOUNT:role/lambda-execution-role \
    --handler lambda-function.handler \
    --zip-file fileb://lambda-function.zip \
    --region us-east-1
```

## Step 6: Create API Gateway

```bash
# Create REST API
aws apigateway create-rest-api \
    --name ticket-finder-api \
    --description "API for ticket package finder" \
    --region us-east-1

# Note the API ID from the response, then create resource and method
# (This requires multiple steps - see AWS documentation for full process)
```

## Step 7: Deploy to AWS Amplify

```bash
# Install Amplify CLI
npm install -g @aws-amplify/cli

# Initialize Amplify
amplify init

# Add hosting
amplify add hosting

# Deploy
amplify publish
```

## Step 8: Environment Variables

Create a `.env` file in your project root:

```env
REACT_APP_AWS_REGION=us-east-1
REACT_APP_DYNAMODB_TABLE_NAME=TicketPackages
REACT_APP_API_GATEWAY_URL=https://your-api-id.execute-api.us-east-1.amazonaws.com/prod
REACT_APP_NOVA_MICRO_API_KEY=your-nova-micro-key
REACT_APP_NOVA_MICRO_BASE_URL=https://bedrock-runtime.us-east-1.amazonaws.com
```

## Installation and Running

```bash
# Install dependencies
npm install

# Start development server
npm start

# Build for production
npm run build
```

## Key Features Implemented

1. **Chat Interface**: Natural language conversation with AI
2. **Package Recommendations**: Fuzzy matching algorithm based on user preferences
3. **Shopping Cart**: Add packages to cart with confirmation
4. **Responsive Design**: Works on desktop and mobile
5. **Real-time Chat**: Instant responses with loading states
6. **Package Cards**: Rich display of ticket package information

## Next Steps

1. Set up AWS services following the instructions above
2. Replace the local Nova Micro service with actual AWS Bedrock integration
3. Add more sophisticated recommendation algorithms
4. Implement payment processing
5. Add user analytics and feedback collection
