-- Run this in Supabase SQL editor to add your name to your profile
UPDATE profiles 
SET full_name = 'Joyce Mary' -- Replace with your actual name
WHERE email = 'ekwame001@gmail.com';

-- Verify the update
SELECT id, email, full_name, role 
FROM profiles 
WHERE email = 'ekwame001@gmail.com';