import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const { email, password } = await request.json();
  
  console.log('Debug auth attempt:', { email, passwordLength: password?.length });
  
  // Return mock successful response for testing
  const mockResponse = {
    user: {
      id: "93665f74-f4f8-4989-875e-b12e6f071e57",
      email: email,
      role: "authenticated"
    },
    session: {
      access_token: "mock-access-token",
      refresh_token: "mock-refresh-token",
      expires_in: 3600,
      token_type: "bearer"
    },
    profile: {
      id: "93665f74-f4f8-4989-875e-b12e6f071e57",
      email: email,
      fullName: "Test User",
      department: "Computer Science",
      adminEmail: "admin@university.edu",
      role: "student",
      isAdmin: false,
      isSuperAdmin: false,
      adminDepartment: null,
      createdAt: new Date().toISOString()
    }
  };
  
  return NextResponse.json(mockResponse);
}