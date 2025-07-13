-- Add is_active column to profiles table
ALTER TABLE profiles 
ADD COLUMN is_active BOOLEAN DEFAULT true;

-- Update existing profiles to be active
UPDATE profiles SET is_active = true WHERE is_active IS NULL;

-- Add index for performance
CREATE INDEX idx_profiles_is_active ON profiles(is_active);