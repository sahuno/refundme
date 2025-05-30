# RefundMe - Graduate Student Expense Reimbursement System

A modern web application for graduate students to manage and request reimbursements for eligible expenses, featuring AI-powered transaction analysis.

## Features

- **🔐 Secure Authentication**: User registration and login with Supabase Auth
- **🏦 Bank Integration**: Connect bank accounts via Plaid for automatic transaction sync
- **🤖 AI Transaction Analysis**: Powered by Claude AI to automatically identify eligible expenses
- **📄 PDF Generation**: Generate professional reimbursement request documents
- **📊 Dashboard**: Track transactions, requests, and reimbursement status
- **💳 Manual Entry**: Add expenses not captured by bank connections
- **⚙️ Custom Admin Settings**: Each user can set their department's admin email for notifications
- **📧 Smart Email Routing**: Requests automatically sent to the appropriate department admin

## AI-Powered Features

The app uses Claude AI to analyze transactions and identify eligible expenses based on:
- Transaction descriptions and merchant names
- Common graduate student expense categories
- Educational institution patterns
- Research and academic supply recognition

### Supported Eligible Categories
- Books & Educational Materials
- Research Supplies & Equipment  
- Academic Software & Technology
- Conference Fees & Academic Travel
- Office Supplies for Academic Work

## Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Supabase
- **Database**: PostgreSQL (via Supabase)
- **Authentication**: Supabase Auth
- **Banking**: Plaid API
- **AI**: Anthropic Claude API
- **PDF**: React-PDF
- **Deployment**: Vercel

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account
- Plaid developer account
- Anthropic API key (optional, for AI features)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd refundme
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

Fill in your environment variables:
- Supabase URL and keys
- Plaid credentials
- Anthropic API key (optional)

4. Set up the database:
```bash
# Run Supabase migrations
npx supabase db push
```

5. Run the development server:
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000)

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | Yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key | Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key | Yes |
| `PLAID_CLIENT_ID` | Plaid client ID | Yes |
| `PLAID_SECRET` | Plaid secret key | Yes |
| `PLAID_ENV` | Plaid environment (sandbox/development/production) | Yes |
| `NEXT_PUBLIC_PLAID_ENV` | Plaid environment for frontend | Yes |
| `ANTHROPIC_API_KEY` | Anthropic API key for AI features | No |

## Usage

### 1. Account Setup
- Register for an account or log in
- Go to Settings to configure your profile and admin email
- Connect your bank account via Plaid

### 2. Transaction Management
- View automatically synced transactions
- Use AI analysis to identify eligible expenses
- Manually select additional transactions

### 3. Create Reimbursement Requests
- Select eligible transactions
- Add manual expense entries
- Generate PDF documentation
- Submit for approval

### 4. Track Status
- Monitor request status
- Download generated PDFs
- View reimbursement history

### 5. Admin Email Configuration
- In Settings, set your department admin's email address
- All reimbursement requests will be sent to this email
- If no admin email is set, requests go to the system default admin

## AI Transaction Analysis

The AI feature analyzes transactions using:

1. **Rule-based fallback**: Keywords and patterns for educational expenses
2. **Claude AI analysis**: Natural language processing for complex categorization
3. **Confidence scoring**: Each suggestion includes a confidence level
4. **Smart pre-selection**: High-confidence transactions are auto-selected

To enable AI features, add your Anthropic API key to the environment variables.

## Database Schema

The app uses these main tables:
- `profiles`: User profile information
- `bank_connections`: Plaid bank account connections
- `transactions`: Synced financial transactions
- `reimbursement_requests`: Submitted reimbursement requests
- `reimbursement_items`: Individual items in requests
- `allowances`: User allowance tracking

## Development

### Build
```bash
npm run build
```

### Lint
```bash
npm run lint
```

### Type Check
```bash
npx tsc --noEmit
```

## Deployment

This app is designed to deploy on Vercel:

1. Connect your GitHub repository to Vercel
2. Add environment variables in Vercel dashboard
3. Deploy

For other platforms, ensure:
- Node.js 18+ runtime
- Environment variables are configured
- Build command: `npm run build`
- Start command: `npm start`

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## License

This project is licensed under the MIT License.