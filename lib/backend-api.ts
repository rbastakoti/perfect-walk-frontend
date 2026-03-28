/**
 * Backend API integration utilities for NextAuth.js authentication
 */

import { auth } from "@/auth";

// Backend API base URL
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

/**
 * Make authenticated API call to backend with session validation
 */
export async function makeBackendCall<T = any>(
  endpoint: string, 
  options: RequestInit = {}
): Promise<T> {
  try {
    // Get current session
    const session = await auth();
    
    if (!session?.user) {
      throw new Error('Authentication required');
    }

    const url = `${BACKEND_URL}${endpoint}`;
    
    const response = await fetch(url, {
      ...options,
      credentials: 'include', // Include NextAuth session cookies
      headers: {
        'Content-Type': 'application/json',
        // Include user info headers for backend validation
        'X-User-Email': session.user.email || '',
        'X-User-ID': session.user.id || '',
        ...options.headers,
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Authentication failed. Please sign in again.');
      }
      throw new Error(`Backend API error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Backend API call failed:', error);
    throw error;
  }
}

/**
 * Client-side API call (for use in React components)
 * Takes session as parameter to avoid client-side auth() calls
 */
export async function makeClientBackendCall<T = any>(
  endpoint: string,
  session: any,
  options: RequestInit = {}
): Promise<T> {
  try {
    if (!session?.user) {
      throw new Error('Authentication failed. Please sign in again.');
    }
    
    // Include user data in headers
    const headers = {
      'Content-Type': 'application/json',
      'X-User-Email': session.user.email || '',
      'X-User-Name': session.user.name || '',
      'X-User-ID': session.user.id || '',
      'X-User-Picture': session.user.image || '',
      ...options.headers,
    };
    
    const response = await fetch(`${BACKEND_URL}${endpoint}`, {
      ...options,
      headers,
    });
    
    if (!response.ok) {
      throw new Error(`Backend error: ${response.status}`);
    }
    
    return await response.json();
    
  } catch (error) {
    console.error('Backend API call failed:', error);
    throw error;
  }
}

/**
 * Backend API endpoints
 */
export const backendApi = {
  // User profile management
  getProfile: (): Promise<any> => 
    makeBackendCall('/api/auth/profile'),
  
  logout: (): Promise<any> => 
    makeBackendCall('/api/auth/logout', { method: 'POST' }),
  
  // Future endpoints (based on backend integration plan)
  getRecommendations: (): Promise<any> => 
    makeBackendCall('/api/recommendations'),
  
  updateLocation: (lat: number, lng: number): Promise<any> => 
    makeBackendCall('/api/location', {
      method: 'POST',
      body: JSON.stringify({ latitude: lat, longitude: lng })
    }),
  
  getWeatherData: (lat: number, lng: number): Promise<any> => 
    makeBackendCall('/api/weather', {
      method: 'POST', 
      body: JSON.stringify({ latitude: lat, longitude: lng })
    }),
};

/**
 * Client-side API helper functions
 * These require session to be passed from useSession() hook
 */
export const createClientBackendApi = (session: any) => ({
  getProfile: (): Promise<any> => 
    makeClientBackendCall('/api/auth/profile', session),
  
  logout: (): Promise<any> => 
    makeClientBackendCall('/api/auth/logout', session, { method: 'POST' }),
});

/**
 * Usage example for fetching profile (recommended by backend team)
 * Requires session from useSession() hook
 */
export async function fetchProfile(session: any) {
  return makeClientBackendCall('/api/auth/profile', session);
}

/**
 * Legacy API object - kept for backward compatibility
 * Note: These will throw errors if used directly in client components
 */
export const clientBackendApi = {
  getProfile: (): Promise<any> => {
    throw new Error('Use createClientBackendApi(session).getProfile() instead');
  },
  
  logout: (): Promise<any> => {
    throw new Error('Use createClientBackendApi(session).logout() instead');
  },
};