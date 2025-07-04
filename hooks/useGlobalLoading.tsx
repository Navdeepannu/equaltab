"use client";

import { createContext, useContext, useState } from "react";

const GlobalLoadingContext = createContext({
  isLoading: false,
  setLoading: (loading: boolean) => {},
});

export const useGlobalLoading = () => useContext(GlobalLoadingContext);

export const GlobalLoadingProvider = ({ children }: { children: React.ReactNode }) => {
  const [isLoading, setLoading] = useState(false);
  return (
    <GlobalLoadingContext.Provider value={{ isLoading, setLoading }}>
      {children}
    </GlobalLoadingContext.Provider>
  );
};