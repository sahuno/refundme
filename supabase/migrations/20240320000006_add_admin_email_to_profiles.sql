-- Add admin_email field to profiles table
ALTER TABLE profiles ADD COLUMN admin_email TEXT;

-- Add a comment to explain the field
COMMENT ON COLUMN profiles.admin_email IS 'Email address of the school/department admin who should receive reimbursement requests for this student';