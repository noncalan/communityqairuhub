"use client";

import { createContext, useContext, useMemo, useState } from "react";
import type { LiveProfile } from "@/lib/data/profiles";

type CurrentUserValue = {
  profile: LiveProfile;
  setProfile: (profile: LiveProfile) => void;
};

const CurrentUserContext = createContext<CurrentUserValue | null>(null);

export function CurrentUserProvider({
  initialProfile,
  children,
}: {
  initialProfile: LiveProfile;
  children: React.ReactNode;
}) {
  const [profile, setProfile] = useState(initialProfile);
  const value = useMemo(() => ({ profile, setProfile }), [profile]);
  return (
    <CurrentUserContext.Provider value={value}>
      {children}
    </CurrentUserContext.Provider>
  );
}

export function useCurrentUser() {
  const context = useContext(CurrentUserContext);
  if (!context) {
    throw new Error("useCurrentUser must be used inside CurrentUserProvider");
  }
  return context;
}
