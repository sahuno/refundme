import { Configuration, PlaidApi, PlaidEnvironments } from 'plaid'

// Log environment variables (without secrets)
console.log('Plaid Environment Check:', {
  env: process.env.PLAID_ENV || 'sandbox',
  clientIdSet: !!process.env.PLAID_CLIENT_ID,
  secretSet: !!process.env.PLAID_SECRET,
  clientIdLength: process.env.PLAID_CLIENT_ID?.length || 0,
  secretLength: process.env.PLAID_SECRET?.length || 0
})

if (!process.env.PLAID_CLIENT_ID || !process.env.PLAID_SECRET) {
  console.error('Missing Plaid credentials!')
  console.error('PLAID_CLIENT_ID:', process.env.PLAID_CLIENT_ID ? 'Set' : 'Missing')
  console.error('PLAID_SECRET:', process.env.PLAID_SECRET ? 'Set' : 'Missing')
}

const configuration = new Configuration({
  basePath: PlaidEnvironments[process.env.PLAID_ENV || 'sandbox'],
  baseOptions: {
    headers: {
      'PLAID-CLIENT-ID': process.env.PLAID_CLIENT_ID || '',
      'PLAID-SECRET': process.env.PLAID_SECRET || '',
    },
  },
})

export const plaidClient = new PlaidApi(configuration) 