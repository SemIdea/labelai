"use client";

import crc32 from "crc-32";
import * as React from "react";
import { NextUIProvider } from "@nextui-org/system";
import { useRouter } from "next/navigation";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { createContext } from "react";
import {
  BoxI,
  FileContextI,
  ImageI,
  LabelI,
  ProvidersProps,
} from "./providers/types";

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
  const [labels, setLabels] = React.useState<LabelI[]>([]);
  const [images, setImages] = React.useState<ImageI[]>([]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files as FileList);
    const newImages = files.map((file) => ({
      url: URL.createObjectURL(file),
      id: crc32.str(file.name),
      name: file.name,
      boxes: [],
      cords: null,
      width: 0,
      height: 0,
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
