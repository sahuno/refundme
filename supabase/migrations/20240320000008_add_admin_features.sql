-- Add admin-related fields to reimbursement_requests
ALTER TABLE reimbursement_requests 
ADD COLUMN reviewed_by UUID REFERENCES profiles(id),
ADD COLUMN reviewed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN admin_notes TEXT,
ADD COLUMN rejection_reason TEXT;

-- Update status enum to include more states
ALTER TABLE reimbursement_requests 
DROP CONSTRAINT IF EXISTS reimbursement_requests_status_check;

ALTER TABLE reimbursement_requests 
ADD CONSTRAINT reimbursement_requests_status_check 
CHECK (status IN ('draft', 'submitted', 'under_review', 'approved', 'rejected', 'pending_info', 'paid'));

-- Create approval history table for audit trail
CREATE TABLE approval_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID REFERENCES reimbursement_requests(id) ON DELETE CASCADE NOT NULL,
  action TEXT CHECK (action IN ('submitted', 'approved', 'rejected', 'info_requested', 'reviewed', 'paid')) NOT NULL,
  performed_by UUID REFERENCES profiles(id) NOT NULL,
  notes TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create notifications table
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  type TEXT CHECK (type IN ('request_approved', 'request_rejected', 'info_requested', 'request_submitted', 'payment_processed')) NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  related_request_id UUID REFERENCES reimbursement_requests(id) ON DELETE CASCADE,
  read BOOLEAN DEFAULT false,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create admin_settings table for configurable options
CREATE TABLE admin_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  value JSONB NOT NULL,
  description TEXT,
  updated_by UUID REFERENCES profiles(id),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default admin settings
INSERT INTO admin_settings (key, value, description) VALUES
  ('auto_approval_limit', '{"enabled": false, "amount": 50.00}', 'Automatically approve requests under this amount'),
  ('notification_emails', '{"enabled": true, "recipients": []}', 'Email addresses to notify for new submissions'),
  ('require_receipts', '{"enabled": true, "minimum_amount": 25.00}', 'Require receipts for expenses over this amount');

-- Enable RLS on new tables
ALTER TABLE approval_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for approval_history
-- Admins can view all history
CREATE POLICY "Admins can view all approval history" ON approval_history
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('administrator', 'accountant')
    )
  );

-- Users can view history for their own requests
CREATE POLICY "Users can view history for their requests" ON approval_history
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM reimbursement_requests 
      WHERE reimbursement_requests.id = approval_history.request_id 
      AND reimbursement_requests.user_id = auth.uid()
    )
  );

-- Only admins can insert history
CREATE POLICY "Only admins can create approval history" ON approval_history
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('administrator', 'accountant')
    )
  );

-- RLS Policies for notifications
-- Users can view their own notifications
CREATE POLICY "Users can view own notifications" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update own notifications" ON notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- System can create notifications (using service role)
CREATE POLICY "Service role can manage notifications" ON notifications
  FOR ALL USING (auth.role() = 'service_role');

-- RLS Policies for admin_settings
-- Only admins can view settings
CREATE POLICY "Only admins can view settings" ON admin_settings
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'administrator'
    )
  );

-- Only admins can update settings
CREATE POLICY "Only admins can update settings" ON admin_settings
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'administrator'
    )
  );

-- Update existing RLS policies for reimbursement_requests to allow admin access
-- Drop existing policy
DROP POLICY IF EXISTS "Users can manage their own reimbursement requests" ON reimbursement_requests;

-- Create new policies with admin access
CREATE POLICY "Users can view their own requests" ON reimbursement_requests
  FOR SELECT USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('administrator', 'accountant')
    )
  );

CREATE POLICY "Users can create their own requests" ON reimbursement_requests
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own draft requests" ON reimbursement_requests
  FOR UPDATE USING (
    (auth.uid() = user_id AND status = 'draft') OR
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('administrator', 'accountant')
    )
  );

CREATE POLICY "Users can delete their own draft requests" ON reimbursement_requests
  FOR DELETE USING (auth.uid() = user_id AND status = 'draft');

-- Create indexes for better performance
CREATE INDEX idx_reimbursement_requests_status ON reimbursement_requests(status);
CREATE INDEX idx_reimbursement_requests_created_at ON reimbursement_requests(created_at);
CREATE INDEX idx_approval_history_request_id ON approval_history(request_id);
CREATE INDEX idx_notifications_user_id_read ON notifications(user_id, read);

-- Create a function to automatically create approval history entries
CREATE OR REPLACE FUNCTION create_approval_history_entry()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create history if status actually changed
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO approval_history (
      request_id,
      action,
      performed_by,
      notes,
      metadata
    ) VALUES (
      NEW.id,
      CASE 
        WHEN NEW.status = 'submitted' THEN 'submitted'
        WHEN NEW.status = 'approved' THEN 'approved'
        WHEN NEW.status = 'rejected' THEN 'rejected'
        WHEN NEW.status = 'under_review' THEN 'reviewed'
        WHEN NEW.status = 'paid' THEN 'paid'
        ELSE 'reviewed'
      END,
      COALESCE(NEW.reviewed_by, NEW.user_id),
      CASE 
        WHEN NEW.status = 'rejected' THEN NEW.rejection_reason
        ELSE NEW.admin_notes
      END,
      jsonb_build_object(
        'old_status', OLD.status,
        'new_status', NEW.status,
        'total_amount', NEW.total_amount
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for automatic history tracking
CREATE TRIGGER track_approval_history
  AFTER UPDATE ON reimbursement_requests
  FOR EACH ROW
  EXECUTE FUNCTION create_approval_history_entry();

-- Create a view for admin dashboard stats
CREATE OR REPLACE VIEW admin_dashboard_stats AS
SELECT 
  COUNT(*) FILTER (WHERE status = 'submitted') as pending_requests,
  COUNT(*) FILTER (WHERE status IN ('submitted', 'under_review') AND created_at >= CURRENT_DATE - INTERVAL '30 days') as requests_this_month,
  COUNT(*) FILTER (WHERE status = 'approved' AND created_at >= CURRENT_DATE - INTERVAL '30 days') as approved_this_month,
  COALESCE(SUM(total_amount) FILTER (WHERE status = 'approved' AND created_at >= CURRENT_DATE - INTERVAL '30 days'), 0) as total_approved_amount,
  COALESCE(AVG(EXTRACT(EPOCH FROM (reviewed_at - created_at))/3600) FILTER (WHERE status IN ('approved', 'rejected') AND reviewed_at IS NOT NULL), 0) as avg_processing_hours
FROM reimbursement_requests;

-- Grant access to the view
GRANT SELECT ON admin_dashboard_stats TO authenticated;