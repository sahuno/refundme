-- Create comments table for request discussions
CREATE TABLE request_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID REFERENCES reimbursement_requests(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) NOT NULL,
  comment TEXT NOT NULL,
  is_internal BOOLEAN DEFAULT false, -- Internal notes only visible to admins
  parent_id UUID REFERENCES request_comments(id) ON DELETE CASCADE, -- For threaded comments
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE request_comments ENABLE ROW LEVEL SECURITY;

-- Create indexes
CREATE INDEX idx_request_comments_request_id ON request_comments(request_id);
CREATE INDEX idx_request_comments_created_at ON request_comments(created_at);

-- RLS Policies
-- Users can view comments on their own requests (excluding internal comments)
CREATE POLICY "Users can view comments on their requests" ON request_comments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM reimbursement_requests 
      WHERE reimbursement_requests.id = request_comments.request_id 
      AND reimbursement_requests.user_id = auth.uid()
    ) AND NOT is_internal
  );

-- Admins can view all comments
CREATE POLICY "Admins can view all comments" ON request_comments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('administrator', 'accountant')
    )
  );

-- Users can create comments on their own requests
CREATE POLICY "Users can comment on their requests" ON request_comments
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM reimbursement_requests 
      WHERE reimbursement_requests.id = request_comments.request_id 
      AND reimbursement_requests.user_id = auth.uid()
    ) AND NOT is_internal
  );

-- Admins can create any comments
CREATE POLICY "Admins can create comments" ON request_comments
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('administrator', 'accountant')
    )
  );

-- Function to notify about new comments
CREATE OR REPLACE FUNCTION notify_new_comment()
RETURNS TRIGGER AS $$
DECLARE
  request_user_id UUID;
  commenter_name TEXT;
BEGIN
  -- Get the request owner
  SELECT user_id INTO request_user_id
  FROM reimbursement_requests
  WHERE id = NEW.request_id;

  -- Get commenter name
  SELECT full_name INTO commenter_name
  FROM profiles
  WHERE id = NEW.user_id;

  -- Don't notify if the comment is internal or if the user is commenting on their own request
  IF NOT NEW.is_internal AND NEW.user_id != request_user_id THEN
    -- Create notification for the request owner
    INSERT INTO notifications (
      user_id,
      type,
      title,
      message,
      related_request_id
    ) VALUES (
      request_user_id,
      'info_requested',
      'New comment on your request',
      COALESCE(commenter_name, 'An administrator') || ' commented on your reimbursement request',
      NEW.request_id
    );
  END IF;

  -- If it's a user comment, notify admins
  IF NOT EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = NEW.user_id 
    AND profiles.role IN ('administrator', 'accountant')
  ) THEN
    -- Create notifications for all admins
    INSERT INTO notifications (user_id, type, title, message, related_request_id)
    SELECT 
      id,
      'info_requested',
      'New student comment',
      COALESCE(commenter_name, 'A student') || ' commented on a reimbursement request',
      NEW.request_id
    FROM profiles
    WHERE role IN ('administrator', 'accountant');
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for comment notifications
CREATE TRIGGER notify_on_new_comment
  AFTER INSERT ON request_comments
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_comment();