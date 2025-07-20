// components/ProfileContext.tsx
'use client';

import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from 'react';
import { useSession } from 'next-auth/react';

export type Profile = {
  companyName?: string;
  address?: string;
  currency?: string;
  logoBase64?: string;
};

const ProfileContext = createContext<Profile>({});

export default function ProfileProvider({ children }: { children: ReactNode }) {
  const { data: session } = useSession();
  const [profile, setProfile] = useState<Profile>({});

  useEffect(() => {
    if (session?.user?.email) {
      fetch('/api/profile')
        .then((res) => res.json())
        .then(setProfile);
    }
  }, [session]);

  return (
    <ProfileContext.Provider value={profile}>
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile() {
  return useContext(ProfileContext);
}
