# RefundMe - Graduate Student Expense Reimbursement System (Monorepo)

A modern monorepo containing both web and iOS applications for graduate students to manage and request reimbursements for eligible expenses, featuring AI-powered transaction analysis.

## 📱 Platforms

- **Web App** (`/src`): Next.js 15 web application
- **iOS App** (`/ios`): Native SwiftUI iOS application

Both apps share the same backend infrastructure and Supabase database.

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

## System Architecture

### Data Flow and Storage Model

```
┌─────────────────┐         ┌─────────────────┐         ┌─────────────────┐
│   iOS App       │   API   │   Next.js/      │   SQL   │   Supabase      │
│   (Swift)       │ <-----> │   Vercel        │ <-----> │   (PostgreSQL)  │
│                 │  HTTPS  │   API Routes    │         │   Database      │
└─────────────────┘         └─────────────────┘         └─────────────────┘
     CLIENT                      MIDDLEWARE                   DATABASE
```

#### Key Architecture Points:

1. **Database (Supabase PostgreSQL)**
   - Single source of truth for all data
   - Stores users, transactions, reimbursement requests, etc.
   - Hosted on Supabase cloud infrastructure
   - Accessed via SQL queries through Supabase client

2. **API Layer (Next.js on Vercel)**
   - Middleware between clients and database
   - Handles authentication and authorization
   - Processes business logic
   - Provides RESTful endpoints for both web and mobile
   - Routes: `/api/*` for web, `/api/mobile/*` for iOS

3. **Client Applications**
   - **Web App**: Next.js with server and client components
   - **iOS App**: Native Swift/SwiftUI (does NOT store data)
   - Both apps fetch data from API on-demand
   - Only temporary in-memory storage while app is active

#### Data Flow Example - Viewing Transactions:

1. **iOS/Web Client** → Makes HTTPS request to API
   ```swift
   // iOS Example
   APIService.fetchTransactions()
   ```

2. **API (Vercel)** → Queries Supabase database
   ```typescript
   // API Route Example
   const { data } = await supabase
     .from('transactions')
     .select('*')
     .eq('user_id', userId)
   ```

3. **Supabase** → Returns data from PostgreSQL

4. **API** → Sends JSON response to client

5. **Client** → Displays data in UI (temporary storage only)

#### Important Notes:

- **No Offline Storage**: Neither web nor iOS apps store data locally
- **Real-time Updates**: All data fetched fresh from API
- **Stateless Clients**: Apps don't maintain persistent state
- **Centralized Logic**: Business rules enforced at API level
- **Type Safety**: TypeScript (web) and Swift (iOS) models match database schema

## Getting Started

### Prerequisites

**For Web App:**
- Node.js 18+ 
- npm or yarn
- Supabase account
- Plaid developer account
- Anthropic API key (optional, for AI features)

**For iOS App:**
- Xcode 15.0+
- iOS 16.0+ target
- macOS 13.0+ (for development)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd refundme
```

2. Install web dependencies:
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
npm run dev:web
```

6. Open [http://localhost:3000](http://localhost:3000)

### iOS App Setup

See the detailed setup instructions in [`ios/README.md`](ios/README.md).

Quick setup:
1. Open `ios/RefundMe.xcodeproj` in Xcode (you'll need to create this project first)
2. Add Swift Package dependencies (Supabase, Plaid)
3. Copy all Swift files from `ios/RefundMe/` into your Xcode project
4. Update `ios/RefundMe/Config/Environment.swift` with your API URLs
5. Build and run

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

## Latest Updates (July 10, 2025)

### 🎓 Financial Education Hub
- **Educational Content System**: Articles on financial literacy, savings tips, tax guidance, and budgeting for graduate students
- **Content Categories**: Tips, Tax, Budgeting, Savings, and Investing
- **Interactive Features**: View tracking, bookmarking, and content search
- **Weekly Tips**: Automated weekly financial tips based on spending patterns
- **Budget Templates**: Department-specific budget planning tools

### 👥 Enhanced Admin Structure
- **Super Admin**: Single administrator with full app management capabilities
  - Content management (create, edit, delete educational articles)
  - User management across all departments
  - System settings and configuration
- **Department Admins**: Multiple administrators for department-specific approvals
  - Can only view/approve reimbursements from their assigned department
  - Restricted access based on student department affiliation
  - Streamlined approval workflow

### 🔐 Security Enhancements
- **Row Level Security (RLS)**: Department-based access control for administrators
- **Hierarchical Permissions**: Clear separation between super admin and department admin capabilities
- **Audit Trail**: Comprehensive tracking of all admin actions

### 📊 New Database Features
- **Educational Content Tables**: `educational_content`, `content_interactions`, `weekly_tips`, `budget_templates`
- **Admin Structure**: `is_super_admin` and `admin_department` fields in profiles
- **Department Statistics View**: Real-time analytics per department

## Database Schema

The app uses these main tables:
- `profiles`: User profile information with admin roles
- `bank_connections`: Plaid bank account connections
- `transactions`: Synced financial transactions
- `reimbursement_requests`: Submitted reimbursement requests
- `reimbursement_items`: Individual items in requests
- `allowances`: User allowance tracking
- `educational_content`: Financial literacy articles and guides
- `content_interactions`: User engagement with educational content
- `weekly_tips`: Automated financial tips system
- `budget_templates`: Department-specific budget planning tools

## Development

### Web App Development

**Build:**
```bash
npm run build:web
```

**Lint:**
```bash
npm run lint
```

**Type Check:**
```bash
npx tsc --noEmit
```

**Development:**
```bash
npm run dev:web
```

### iOS App Development

**Open in Xcode:**
```bash
npm run dev:ios
# Or manually: open ios/RefundMe.xcodeproj
```

**Build and Test:**
- Use Xcode's build system (⌘+B)
- Run tests with ⌘+U
- Run on simulator or device with ⌘+R

### Full Stack Development

To develop both apps simultaneously:

1. **Terminal 1 - Web App:**
```bash
npm run dev:web
```

2. **Terminal 2 - iOS App:**
```bash
npm run dev:ios
```

3. Update `ios/RefundMe/Config/Environment.swift` for local development:
```swift
static let apiBaseURL = "http://localhost:3000/api"
static let mobileAPIBaseURL = "http://localhost:3000/api/mobile"
```

## Deployment

### Web App Deployment

Deploy on Vercel:

1. Connect your GitHub repository to Vercel
2. Add environment variables in Vercel dashboard
3. Deploy using:
```bash
npm run deploy:web
```

For other platforms, ensure:
- Node.js 18+ runtime
- Environment variables are configured
- Build command: `npm run build:web`
- Start command: `npm start`

### iOS App Deployment

For App Store deployment:

1. Update `ios/RefundMe/Config/Environment.swift` with production URLs
2. Archive the app in Xcode (Product → Archive)
3. Upload to App Store Connect
4. Submit for App Store review

### Production Configuration

**Web App (Vercel):**
- Set all environment variables in Vercel dashboard
- Ensure mobile API endpoints are accessible
- Test CORS configuration

**iOS App:**
```swift
// Production Environment.swift
static let supabaseURL = "YOUR_PRODUCTION_SUPABASE_URL"
static let supabaseAnonKey = "YOUR_PRODUCTION_SUPABASE_ANON_KEY"
static let apiBaseURL = "https://your-refundme-app.vercel.app/api"
static let mobileAPIBaseURL = "https://your-refundme-app.vercel.app/api/mobile"
static let plaidEnvironment = "production"
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

Features:
* automatically finds eligible transactions
* email request to designated payee
* generate pdf's of request

Upcoming
* ios app
* attach tax forms & supporting documents


upcoming
1. ios app
2. file by:  receipts , receipts + bank staements 
(option to pull receipts from retailers), pull from photos
1. periodically alerts you to file for reimbuerment
2. customn email to admins
   
major features
fill tax/vendors forms

## License

This project is licensed under the MIT License.