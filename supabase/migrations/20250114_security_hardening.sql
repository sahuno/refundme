-- Security Hardening Migration
-- This migration strengthens security policies and adds audit protections

-- 1. Prevent deletion of transactions that are part of a reimbursement request
CREATE OR REPLACE FUNCTION prevent_transaction_deletion()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if transaction is referenced in any reimbursement item
  IF EXISTS (
    SELECT 1 FROM reimbursement_items 
    WHERE transaction_id = OLD.id
  ) THEN
    RAISE EXCEPTION 'Cannot delete transaction that is part of a reimbursement request';
  END IF;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER prevent_transaction_deletion_trigger
BEFORE DELETE ON transactions
FOR EACH ROW
EXECUTE FUNCTION prevent_transaction_deletion();

-- 2. Add audit log for sensitive operations
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  table_name TEXT NOT NULL,
  record_id UUID,
  old_data JSONB,
  new_data JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on audit logs
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Only super admins can read audit logs
CREATE POLICY "Super admins can read audit logs" ON audit_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.is_super_admin = true
    )
  );

-- No one can modify audit logs
CREATE POLICY "Audit logs are immutable" ON audit_logs
  FOR ALL USING (false);

-- 3. Strengthen transaction policies
DROP POLICY IF EXISTS "Users can manage their own transactions" ON transactions;

-- Users can only view and update their own transactions
CREATE POLICY "Users can view their own transactions" ON transactions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own transactions" ON transactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own transactions" ON transactions
  FOR UPDATE USING (
    auth.uid() = user_id AND
    -- Prevent updates if transaction is in a submitted request
    NOT EXISTS (
      SELECT 1 FROM reimbursement_items ri
      JOIN reimbursement_requests rr ON ri.request_id = rr.id
      WHERE ri.transaction_id = transactions.id
      AND rr.status IN ('submitted', 'under_review', 'approved', 'paid')
    )
  );

-- 4. Add time-based restrictions on reimbursement modifications
DROP POLICY IF EXISTS "Users can update their own requests" ON reimbursement_requests;

CREATE POLICY "Users can update their own requests with restrictions" ON reimbursement_requests
  FOR UPDATE USING (
    auth.uid() = user_id AND
    status IN ('draft', 'pending_info') AND
    -- Can't modify requests older than 30 days
    created_at > NOW() - INTERVAL '30 days'
  );

-- 5. Protect admin settings
ALTER TABLE admin_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only admins can view admin settings" ON admin_settings
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('administrator', 'accountant')
    )
  );

CREATE POLICY "Only administrators can modify admin settings" ON admin_settings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'administrator'
    )
  );

-- 6. Add function to log sensitive operations
CREATE OR REPLACE FUNCTION log_audit_event(
  p_action TEXT,
  p_table_name TEXT,
  p_record_id UUID,
  p_old_data JSONB DEFAULT NULL,
  p_new_data JSONB DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO audit_logs (
    user_id,
    action,
    table_name,
    record_id,
    old_data,
    new_data
  ) VALUES (
    auth.uid(),
    p_action,
    p_table_name,
    p_record_id,
    p_old_data,
    p_new_data
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Add trigger to log admin actions
CREATE OR REPLACE FUNCTION log_admin_changes()
RETURNS TRIGGER AS $$
BEGIN
  -- Log changes to profiles table (role changes, admin assignments)
  IF TG_TABLE_NAME = 'profiles' AND 
     (OLD.role IS DISTINCT FROM NEW.role OR 
      OLD.is_super_admin IS DISTINCT FROM NEW.is_super_admin OR
      OLD.admin_department IS DISTINCT FROM NEW.admin_department) THEN
    PERFORM log_audit_event(
      TG_OP,
      TG_TABLE_NAME,
      NEW.id,
      to_jsonb(OLD),
      to_jsonb(NEW)
    );
  END IF;
  
  -- Log reimbursement approvals/rejections
  IF TG_TABLE_NAME = 'reimbursement_requests' AND 
     OLD.status IS DISTINCT FROM NEW.status AND
     NEW.status IN ('approved', 'rejected', 'paid') THEN
    PERFORM log_audit_event(
      TG_OP || '_' || NEW.status,
      TG_TABLE_NAME,
      NEW.id,
      jsonb_build_object('status', OLD.status, 'reviewed_by', OLD.reviewed_by),
      jsonb_build_object('status', NEW.status, 'reviewed_by', NEW.reviewed_by)
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply audit trigger to sensitive tables
CREATE TRIGGER audit_profiles_changes
AFTER UPDATE ON profiles
FOR EACH ROW
EXECUTE FUNCTION log_admin_changes();

CREATE TRIGGER audit_reimbursement_changes
AFTER UPDATE ON reimbursement_requests
FOR EACH ROW
EXECUTE FUNCTION log_admin_changes();

-- 8. Add session validation function
CREATE OR REPLACE FUNCTION validate_session()
RETURNS BOOLEAN AS $$
BEGIN
  -- Check if user exists and is active
  RETURN EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. Create index for performance on audit logs
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_table_record ON audit_logs(table_name, record_id);