-- Add super_admin role and department assignment for administrators
ALTER TABLE profiles 
ADD COLUMN is_super_admin BOOLEAN DEFAULT false,
ADD COLUMN admin_department TEXT;

-- Update the existing admin to be super admin (you'll need to set this manually)
-- UPDATE profiles SET is_super_admin = true WHERE email = 'your-super-admin@example.com';

-- Create an index for department lookups
CREATE INDEX idx_profiles_admin_department ON profiles(admin_department);

-- Update RLS policies for department-based access

-- Drop existing policy and recreate with department restrictions
DROP POLICY IF EXISTS "Users can view their own requests" ON reimbursement_requests;
DROP POLICY IF EXISTS "Admins can view all approval history" ON approval_history;

-- Students can view their own requests
CREATE POLICY "Students can view own requests" ON reimbursement_requests
  FOR SELECT USING (auth.uid() = user_id);

-- Department admins can only view requests from their department
CREATE POLICY "Department admins can view department requests" ON reimbursement_requests
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles admin
      WHERE admin.id = auth.uid() 
      AND admin.role = 'administrator'
      AND admin.admin_department IS NOT NULL
      AND EXISTS (
        SELECT 1 FROM profiles student
        WHERE student.id = reimbursement_requests.user_id
        AND student.department = admin.admin_department
      )
    )
  );

-- Super admin can view all requests
CREATE POLICY "Super admin can view all requests" ON reimbursement_requests
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.is_super_admin = true
    )
  );

-- Update policies for request updates (approve/reject)
DROP POLICY IF EXISTS "Users can update their own draft requests" ON reimbursement_requests;

-- Students can update their own draft requests
CREATE POLICY "Students can update own draft requests" ON reimbursement_requests
  FOR UPDATE USING (
    auth.uid() = user_id AND status = 'draft'
  );

-- Department admins can update requests in their department
CREATE POLICY "Department admins can update department requests" ON reimbursement_requests
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles admin
      WHERE admin.id = auth.uid() 
      AND admin.role = 'administrator'
      AND admin.admin_department IS NOT NULL
      AND EXISTS (
        SELECT 1 FROM profiles student
        WHERE student.id = reimbursement_requests.user_id
        AND student.department = admin.admin_department
      )
    )
  );

-- Super admin can update all requests
CREATE POLICY "Super admin can update all requests" ON reimbursement_requests
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.is_super_admin = true
    )
  );

-- Update approval history policies
CREATE POLICY "Department admins view department history" ON approval_history
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles admin
      WHERE admin.id = auth.uid() 
      AND admin.role = 'administrator'
      AND admin.admin_department IS NOT NULL
      AND EXISTS (
        SELECT 1 FROM reimbursement_requests req
        JOIN profiles student ON student.id = req.user_id
        WHERE req.id = approval_history.request_id
        AND student.department = admin.admin_department
      )
    )
  );

CREATE POLICY "Super admin views all history" ON approval_history
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.is_super_admin = true
    )
  );

-- Create policy for educational content management (super admin only)
DROP POLICY IF EXISTS "Admins can manage content" ON educational_content;

CREATE POLICY "Super admin can manage content" ON educational_content
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.is_super_admin = true
    )
  );

-- Create policy for admin settings (super admin only)
DROP POLICY IF EXISTS "Only admins can view settings" ON admin_settings;
DROP POLICY IF EXISTS "Only admins can update settings" ON admin_settings;

CREATE POLICY "Only super admin can view settings" ON admin_settings
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.is_super_admin = true
    )
  );

CREATE POLICY "Only super admin can update settings" ON admin_settings
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.is_super_admin = true
    )
  );

-- Update user management policies
DROP POLICY IF EXISTS "Admins can view all comments" ON request_comments;
DROP POLICY IF EXISTS "Admins can create comments" ON request_comments;

-- Department admins can view/create comments for their department
CREATE POLICY "Department admins can view department comments" ON request_comments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles admin
      WHERE admin.id = auth.uid() 
      AND admin.role = 'administrator'
      AND admin.admin_department IS NOT NULL
      AND EXISTS (
        SELECT 1 FROM reimbursement_requests req
        JOIN profiles student ON student.id = req.user_id
        WHERE req.id = request_comments.request_id
        AND student.department = admin.admin_department
      )
    ) OR EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.is_super_admin = true
    )
  );

CREATE POLICY "Department admins can create comments" ON request_comments
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND (
      EXISTS (
        SELECT 1 FROM profiles admin
        WHERE admin.id = auth.uid() 
        AND admin.role = 'administrator'
        AND admin.admin_department IS NOT NULL
      ) OR EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.is_super_admin = true
      )
    )
  );

-- Create a view for department statistics
CREATE OR REPLACE VIEW department_stats AS
SELECT 
  p.department,
  COUNT(DISTINCT rr.id) as total_requests,
  COUNT(DISTINCT CASE WHEN rr.status = 'submitted' THEN rr.id END) as pending_requests,
  COUNT(DISTINCT CASE WHEN rr.status = 'approved' THEN rr.id END) as approved_requests,
  COUNT(DISTINCT CASE WHEN rr.status = 'rejected' THEN rr.id END) as rejected_requests,
  COALESCE(SUM(CASE WHEN rr.status = 'approved' THEN rr.total_amount END), 0) as total_approved_amount,
  COUNT(DISTINCT p.id) as student_count
FROM profiles p
LEFT JOIN reimbursement_requests rr ON rr.user_id = p.id
WHERE p.role = 'student'
GROUP BY p.department;

-- Grant access to the view
GRANT SELECT ON department_stats TO authenticated;

-- Add some helpful comments
COMMENT ON COLUMN profiles.is_super_admin IS 'True for the main app administrator who can manage content and settings';
COMMENT ON COLUMN profiles.admin_department IS 'For role=administrator, specifies which department they can manage';