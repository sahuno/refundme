CREATE TABLE bank_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  plaid_access_token TEXT NOT NULL,
  plaid_item_id TEXT NOT NULL UNIQUE,
  institution_name TEXT,
  last_synced TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE bank_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own bank connections" ON bank_connections
  FOR ALL USING (auth.uid() = user_id); 