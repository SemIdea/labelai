"use client";

import * as React from "react";
import { NextUIProvider } from "@nextui-org/system";
import { useRouter } from "next/navigation";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { ThemeProviderProps } from "next-themes/dist/types";
import { createContext } from "react";
import crc32 from "crc-32"; // Import crc-32 library
import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Button,
} from "@nextui-org/react";

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

export type Box = {
  imageId: number;
  labelId: number | null;
  cords: {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
  };
  hover: boolean;
  selected: boolean;
  visible: boolean;
};

export type Label = {
  id: number;
  name: string;
  color: string;
};

interface Images {
  id: number;
  url: string;
}

interface FileContextType {
  images: Images[];
  handleImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  setImages: React.Dispatch<React.SetStateAction<Images[]>>;
  boxes: Box[];
  setBoxes: React.Dispatch<React.SetStateAction<Box[]>>;
  labels: Label[];
  setLabels: React.Dispatch<React.SetStateAction<Label[]>>;
  handleLabelSelect: (boxId: number, labelId: number) => void;
}

const FileContext = createContext<FileContextType | undefined>(undefined);

// export async function crc32(message: string) {
//   const msgBuffer = new TextEncoder().encode(message);
//   const hashBuffer = await crypto.subtle.digest("crc32", msgBuffer);
//   const hashArray = Array.from(new Uint8Array(hashBuffer));
//   const hashHex = hashArray
//     .map((b) => ("00" + b.toString(16)).slice(-2))
//     .join("");
//   return hashHex;
// }

export const FileProvider = ({ children }: { children: React.ReactNode }) => {
  const [boxes, setBoxes] = React.useState<Box[]>([]);
  const [labels, setLabels] = React.useState<Label[]>([
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
  const [images, setImages] = React.useState<Images[]>([
    {
      url: "https://images.unsplash.com/photo-1546593064-053d21199be1?q=80&w=1975&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      id: crc32.str(
        "https://images.unsplash.com/photo-1546593064-053d21199be1?q=80&w=1975&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
      ),
    },
    {
      url: "https://images.unsplash.com/photo-1547567696-3fb538726ffd?q=80&w=1990&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      id: crc32.str(
        "https://images.unsplash.com/photo-1547567696-3fb538726ffd?q=80&w=1990&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
      ),
    },
  ]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files as FileList);
    const newImages = files.map((file) => ({
      url: URL.createObjectURL(file),
      id: crc32.str(file.name),
    }));
    setImages((prevImages) => [...prevImages, ...newImages]);
    const newBoxes = files.map((file) => ({
      imageId: crc32.str(file.name),
      labelId: null,
      color: "",
      cords: { x1: 0, y1: 0, x2: 0, y2: 0 },
      hover: false,
      selected: false,
      visible: true,
    }));
    setBoxes((prevBoxes) => [...prevBoxes, ...newBoxes]);
  };

  const handleLabelSelect = (boxId: number, labelId: number) => {
    setBoxes((prevBoxes) =>
      prevBoxes.map((box) =>
        box.imageId === boxId ? { ...box, labelId } : box
      )
    );
  };

  return (
    <FileContext.Provider
      value={{
        images,
        handleImageUpload,
        setImages,
        boxes,
        setBoxes,
        labels,
        setLabels,
        handleLabelSelect,
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

export const LabelDropdown = ({ boxId }: { boxId: number }) => {
  const { labels, handleLabelSelect } = useFileContext();

  return (
    <Dropdown>
      <DropdownTrigger>
        <Button variant="bordered">Select Label</Button>
      </DropdownTrigger>
      <DropdownMenu aria-label="Label Selection" items={labels}>
        {(label) => (
          <DropdownItem
            key={label.id}
            onClick={() => handleLabelSelect(boxId, label.id)}
          >
            {label.name}
          </DropdownItem>
        )}
      </DropdownMenu>
    </Dropdown>
  );
};
