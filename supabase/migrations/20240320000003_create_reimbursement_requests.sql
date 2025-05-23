CREATE TABLE reimbursement_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  status TEXT CHECK (status IN ('draft', 'submitted')) DEFAULT 'draft',
  total_amount DECIMAL(10, 2) DEFAULT 0.00,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  submitted_at TIMESTAMP WITH TIME ZONE
);

ALTER TABLE reimbursement_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own reimbursement requests" ON reimbursement_requests
  FOR ALL USING (auth.uid() = user_id); 