/**
 * React hooks for backend API integration
 */

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { createClientBackendApi, fetchProfile } from './backend-api';

/**
 * Hook for fetching user profile from backend
 */
export function useBackendProfile() {
  const { data: session, status } = useSession();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProfileData() {
      if (status === 'loading') return;
      
      if (!session) {
        setLoading(false);
        setError('No session found');
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const profileData = await fetchProfile(session);
        setProfile(profileData);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch profile');
        console.error('Profile fetch error:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchProfileData();
  }, [session, status]);

  const refreshProfile = async () => {
    if (!session) {
      setError('No session available');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const profileData = await fetchProfile(session);
      setProfile(profileData);
    } catch (err: any) {
      setError(err.message || 'Failed to refresh profile');
    } finally {
      setLoading(false);
    }
  };

  return {
    profile,
    loading,
    error,
    refreshProfile
  };
}

/**
 * Generic hook for backend API calls
 */
export function useBackendApi<T = any>(
  apiCallFactory: (session: any) => Promise<T>,
  dependencies: any[] = []
) {
  const { data: session } = useSession();
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      if (!session) {
        setLoading(false);
        setError('No session found');
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const result = await apiCallFactory(session);
        setData(result);
      } catch (err: any) {
        setError(err.message || 'API call failed');
        console.error('API call error:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [session, ...dependencies]);

  const refetch = async () => {
    if (!session) {
      setError('No session available');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const result = await apiCallFactory(session);
      setData(result);
    } catch (err: any) {
      setError(err.message || 'API call failed');
    } finally {
      setLoading(false);
    }
  };

  return {
    data,
    loading,
    error,
    refetch
  };
}