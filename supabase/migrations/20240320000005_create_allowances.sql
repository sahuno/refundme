CREATE TABLE allowances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  academic_year TEXT NOT NULL,
  total_amount DECIMAL(10, 2) NOT NULL,
  used_amount DECIMAL(10, 2) DEFAULT 0.00,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE allowances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own allowances" ON allowances
  FOR SELECT USING (auth.uid() = user_id); 