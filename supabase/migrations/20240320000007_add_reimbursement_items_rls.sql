-- Enable RLS on reimbursement_items table
ALTER TABLE reimbursement_items ENABLE ROW LEVEL SECURITY;

-- Policy: Users can manage items for their own reimbursement requests
CREATE POLICY "Users can manage items for their own requests" ON reimbursement_items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM reimbursement_requests 
      WHERE reimbursement_requests.id = reimbursement_items.request_id 
      AND reimbursement_requests.user_id = auth.uid()
    )
  );

-- Policy: Allow service role to manage all items (for admin operations)
CREATE POLICY "Service role can manage all items" ON reimbursement_items
  FOR ALL USING (auth.role() = 'service_role');