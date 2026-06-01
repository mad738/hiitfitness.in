"use client";

import { createContext, useContext, useState, ReactNode } from "react";

export type BranchId = "kanuru" | "bhavanipuram";

type BranchContextType = {
  selectedBranch: BranchId;
  setSelectedBranch: (branch: BranchId) => void;
};

const BranchContext = createContext<BranchContextType>({
  selectedBranch: "kanuru",
  setSelectedBranch: () => {},
});

export function useBranch() {
  return useContext(BranchContext);
}

export function BranchProvider({ children }: { children: ReactNode }) {
  const [selectedBranch, setSelectedBranch] = useState<BranchId>("kanuru");

  return (
    <BranchContext.Provider value={{ selectedBranch, setSelectedBranch }}>
      {children}
    </BranchContext.Provider>
  );
}
