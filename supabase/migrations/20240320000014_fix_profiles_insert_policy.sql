-- Fix for user registration: Add INSERT policy for profiles table
-- This allows users to insert their own profile during registration

-- Add INSERT policy for profiles table
CREATE POLICY "Users can insert their own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Also update the trigger function to handle cases where profile might already exist
-- (in case of race condition between trigger and manual insert)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  -- Check if profile already exists
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = new.id) THEN
    INSERT INTO public.profiles (id, email, full_name, role)
    VALUES (
      new.id, 
      new.email, 
      COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
      'student'
    )
    ON CONFLICT (id) DO NOTHING;
  END IF;
  RETURN new;
END;
$$;

-- Add a policy to allow users to see all profiles (for admin user lists)
-- but restrict sensitive information
CREATE POLICY "Admins can view all profiles" ON profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('administrator', 'accountant')
    )
  );