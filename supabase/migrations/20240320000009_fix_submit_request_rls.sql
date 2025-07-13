-- Drop the existing update policy
DROP POLICY IF EXISTS "Users can update their own draft requests" ON reimbursement_requests;

-- Create new update policy that allows users to:
-- 1. Update their own draft requests (any field)
-- 2. Change their own draft requests to submitted status
-- 3. Admins can update any request
CREATE POLICY "Users can update their own requests" ON reimbursement_requests
  FOR UPDATE USING (
    (auth.uid() = user_id AND (status = 'draft' OR (status = 'draft' AND NEW.status = 'submitted'))) OR
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('administrator', 'accountant')
    )
  );

-- Alternative approach: Create a more permissive policy
-- This allows users to update their own requests when changing from draft to submitted
DROP POLICY IF EXISTS "Users can update their own requests" ON reimbursement_requests;

CREATE POLICY "Users can update their own requests" ON reimbursement_requests
  FOR UPDATE 
  USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('administrator', 'accountant')
    )
  )
  WITH CHECK (
    (auth.uid() = user_id AND status IN ('draft', 'submitted')) OR
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('administrator', 'accountant')
    )
  );