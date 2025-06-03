"use client";

import { Authenticated } from "convex/react";
import React, { ReactNode } from "react";

interface MainLayoutProps {
  children: ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  return (
    <Authenticated>
      <div className="container mx-auto mt-24 mb-20">{children}</div>
    </Authenticated>
  );
};

export default MainLayout;
