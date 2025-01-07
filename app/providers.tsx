"use client";

import crc32 from "crc-32";
import * as React from "react";
import { NextUIProvider } from "@nextui-org/system";
import { useRouter } from "next/navigation";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { createContext } from "react";
import { sort } from "fast-sort";
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

const alphanumericSort = (a: string, b: string) => {
  const regex = /(\d+)|(\D+)/g;
  const aParts = a.match(regex);
  const bParts = b.match(regex);

  if (!aParts || !bParts) return a.localeCompare(b);

  while (aParts.length && bParts.length) {
    const aPart = aParts.shift();
    const bPart = bParts.shift();

    if (aPart !== bPart) {
      const aNum = parseInt(aPart ?? "", 10);
      const bNum = parseInt(bPart ?? "", 10);

      if (!isNaN(aNum) && !isNaN(bNum)) {
        return aNum - bNum;
      } else {
        return (aPart ?? "").localeCompare(bPart ?? "");
      }
    }
  }

  return aParts.length - bParts.length;
};

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

    setImages((prevImages) => {
      const existingImageNames = new Set(prevImages.map((img) => img.name));
      const filteredNewImages = newImages.filter(
        (img) => !existingImageNames.has(img.name)
      );
      const sortedImages = sort([...prevImages, ...filteredNewImages]).by([
        {
          asc: (image) => image.name.toLowerCase(),
          comparer: alphanumericSort,
        },
      ]);
      return sortedImages;
    });
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
