"use client";
import crc32 from "crc-32"; // Import crc-32 library

import * as React from "react";
import { NextUIProvider } from "@nextui-org/system";
import { useRouter } from "next/navigation";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { ThemeProviderProps } from "next-themes/dist/types";
import { createContext } from "react";
import { BoxI, FileContextI, ImageI, LabelI } from "./providers/types";

export interface ProvidersProps {
  children: React.ReactNode;
  themeProps?: ThemeProviderProps;
}

export function Providers({ children, themeProps }: ProvidersProps) {
  const router = useRouter();

  return (
    <NextUIProvider navigate={router.push}>
      <NextThemesProvider {...themeProps}>{children}</NextThemesProvider>
    </NextUIProvider>
  );
}

const FileContext = createContext<FileContextI | undefined>(undefined);

export const FileProvider = ({ children }: { children: React.ReactNode }) => {
  const [currentBoxes, setCurrentBoxes] = React.useState<BoxI[]>([]);
  const [currentLabel, setCurrentLabel] = React.useState<LabelI | null>(null);
  const [labels, setLabels] = React.useState<LabelI[]>([
    {
      id: 1,
      name: "Car",
      color: "ffffff",
    },
    {
      id: 2,
      name: "Person",
      color: "ffffff",
    },
  ]);
  const [images, setImages] = React.useState<ImageI[]>([
    {
      url: "https://images.unsplash.com/photo-1546593064-053d21199be1?q=80&w=1975&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      id: crc32.str(
        "https://images.unsplash.com/photo-1546593064-053d21199be1?q=80&w=1975&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
      ),
      name: "Image1",
      boxes: [],
    },
    {
      url: "https://images.unsplash.com/photo-1547567696-3fb538726ffd?q=80&w=1990&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      id: crc32.str(
        "https://images.unsplash.com/photo-1547567696-3fb538726ffd?q=80&w=1990&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
      ),
      name: "Image2",
      boxes: [],
    },
  ]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files as FileList);
    const newImages = files.map((file) => ({
      url: URL.createObjectURL(file),
      id: crc32.str(file.name),
      name: file.name,
      boxes: [],
    }));
    setImages((prevImages) => [...prevImages, ...newImages]);
  };

  return (
    <FileContext.Provider
      value={{
        images,
        labels,
        currentBoxes,
        currentLabel,
        setCurrentLabel,
        setCurrentBoxes,
        handleImageUpload,
        setImages,
        setLabels,
      }}
    >
      {children}
    </FileContext.Provider>
  );
};

export const useFileContext = () => {
  const context = React.useContext(FileContext);
  if (context === undefined) {
    throw new Error("useFileContext must be used within a FileProvider");
  }
  return context;
};
