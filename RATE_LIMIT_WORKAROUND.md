# Rate Limit Workaround

## Why This Happens

Supabase free tier has strict rate limits:
- **5 auth attempts per 10 minutes** per IP address
- Failed attempts count against this limit
- All your devices/apps share the same IP limit

## Immediate Solutions

### Option 1: Wait It Out (Easiest)
- Wait 10-15 minutes
- The limit will reset automatically
- Try logging in with correct password

### Option 2: Use Supabase Dashboard (Fastest)
1. Go to: https://supabase.com/dashboard/project/uipmodsomobzbendohdh/auth/users
2. Create a new test user:
   - Email: test@example.com
   - Password: test123456
   - Uncheck "Auto Confirm Users"
3. Use this user to test immediately

### Option 3: Direct Database Access
If you have database access, you can verify users exist:
```sql
SELECT email, created_at FROM auth.users;
```

### Option 4: Use a Different Network
- Switch to mobile hotspot
- Use a VPN
- This gives you a different IP address

## Preventing This in Future

1. **Store test credentials** in a safe place
2. **Use password manager** to avoid typos
3. **Create multiple test users** for development
4. **Consider upgrading** Supabase plan for higher limits

## Current Status
- Your Supabase project: `uipmodsomobzbendohdh`
- Rate limit will reset at: ~12:15 AM (10-15 min from now)
- Both web and iOS apps are affected equally