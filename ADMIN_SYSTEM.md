# Admin System Documentation

## Overview
RefundMe implements a three-tier admin system with role-based access control:

1. **Super Admin** - Full system access
2. **Administrator** - Department-level admin
3. **Accountant** - Financial operations only
4. **Student** - Regular users (non-admin)

## Database Schema

### Profiles Table
```sql
profiles {
  id: string (UUID)
  email: string
  full_name: string
  role: 'student' | 'administrator' | 'accountant'
  department: string | null          -- Student's department
  admin_department: string | null    -- Department the admin manages
  is_super_admin: boolean            -- Super admin flag
  is_active: boolean                 -- Account active status
}
```

## Admin Roles

### 1. Super Admin (`is_super_admin = true`)
- **Access**: Everything
- **Capabilities**:
  - View and manage ALL departments
  - Access all reimbursement requests
  - Manage all users (including other admins)
  - Configure system-wide settings
  - View comprehensive reports across departments
  - No department restrictions

### 2. Administrator (`role = 'administrator'`)
- **Access**: Department-specific
- **Capabilities**:
  - Approve/reject reimbursement requests for their department
  - View users in their department
  - Access department-specific reports
  - Configure department settings
  - Limited by `admin_department` field

### 3. Accountant (`role = 'accountant'`)
- **Access**: Financial operations
- **Capabilities**:
  - Process approved reimbursements
  - Mark requests as paid
  - View financial reports
  - Cannot approve/reject requests
  - May be department-specific or system-wide

### 4. Student (`role = 'student'`)
- **Access**: Personal data only
- **Capabilities**:
  - Submit reimbursement requests
  - View own requests
  - Connect bank accounts
  - View own transactions

## Implementation Details

### Authentication Check (`/src/lib/auth/admin.ts`)

```typescript
// Check if user has any admin access
checkAdminAccess(): 
  - Allows: administrator, accountant, or super admin
  - Redirects to dashboard if not admin

// Check if user is super admin
checkSuperAdminAccess():
  - Allows: only super admins
  - Redirects to admin dashboard if not super admin

// Get admin's department
getAdminDepartment(userId):
  - Returns null for super admin (access all)
  - Returns admin_department for regular admins
```

### Admin Routes (`/admin/*`)

All routes under `/admin` are protected by the admin layout that checks for admin access.

**Key Admin Pages**:
- `/admin/dashboard` - Admin overview
- `/admin/requests` - Manage reimbursement requests
- `/admin/users` - User management (super admin only)
- `/admin/settings` - System settings (administrators only)
- `/admin/reports` - Financial reports
- `/admin/audit` - Audit logs (super admin only)

### Department Filtering

When a regular admin (not super admin) accesses data:
```typescript
// Example from requests query
if (!isSuperAdmin && adminDepartment) {
  query = query.eq('profiles.department', adminDepartment)
}
```

## How to Set Up Admins

### 1. Create a Super Admin
```sql
UPDATE profiles 
SET is_super_admin = true, 
    role = 'administrator'
WHERE email = 'superadmin@university.edu';
```

### 2. Create a Department Admin
```sql
UPDATE profiles 
SET role = 'administrator',
    admin_department = 'Computer Science'
WHERE email = 'cs-admin@university.edu';
```

### 3. Create an Accountant
```sql
UPDATE profiles 
SET role = 'accountant',
    admin_department = null  -- or specific department
WHERE email = 'accountant@university.edu';
```

## Access Control Logic

### Request Approval Flow
1. **Student** submits request
2. **Administrator** (in student's department) reviews and approves/rejects
3. **Accountant** processes payment for approved requests
4. **Super Admin** can intervene at any stage

### Department Isolation
- Admins can only see requests from students in their `admin_department`
- Super admins see all requests regardless of department
- Accountants see approved requests based on their department assignment

## Security Features

1. **Row Level Security (RLS)**
   - Database-level security policies
   - Admins can only modify data they have access to

2. **API Protection**
   - All admin API endpoints check admin status
   - Department filtering applied at API level

3. **UI Protection**
   - Admin routes protected by middleware
   - Role-based UI elements

## Admin Capabilities Matrix

| Feature | Student | Accountant | Administrator | Super Admin |
|---------|---------|------------|---------------|-------------|
| Submit requests | ✓ | ✓ | ✓ | ✓ |
| View own requests | ✓ | ✓ | ✓ | ✓ |
| View department requests | ✗ | ✓* | ✓ | ✓ |
| View all requests | ✗ | ✗ | ✗ | ✓ |
| Approve/Reject | ✗ | ✗ | ✓ | ✓ |
| Mark as paid | ✗ | ✓ | ✗ | ✓ |
| Manage users | ✗ | ✗ | ✗ | ✓ |
| System settings | ✗ | ✗ | ✓ | ✓ |
| View audit logs | ✗ | ✗ | ✗ | ✓ |

*Accountants see only approved requests in their department

## Common Admin Tasks

### Viewing Requests by Department
Super admins see a department filter dropdown, while regular admins see only their department's requests automatically.

### User Management
Only super admins can:
- Change user roles
- Activate/deactivate accounts
- Assign admin departments
- View all users across departments

### Settings Management
- **Auto-approval limits**: Set maximum amount for automatic approval
- **Notification emails**: Configure who receives submission notifications
- **Receipt requirements**: Toggle mandatory receipt uploads

## Testing Admin Access

1. **Check current user's admin status**:
   ```
   /api/test-auth
   ```

2. **Verify admin access**:
   - Students → redirected from /admin to /dashboard
   - Admins → can access /admin routes
   - Super admins → can access all features

## Important Notes

- The first super admin must be set directly in the database
- Department names must match exactly between student's `department` and admin's `admin_department`
- Super admin status overrides all department restrictions
- Accountants cannot approve requests, only process payments