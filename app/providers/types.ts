import { ThemeProviderProps } from "next-themes/dist/types";

interface BoxI {
  imageId: number;
  labelId: number | null;
  cords: ImageCordinatesI;
  isHovered: boolean;
  isSelected: boolean;
  isVisible: boolean;
}

interface LabelI {
  name: string;
  color: string;
}

interface ImageI {
  id: number;
  url: string;
  name: string;
  cords: ImageCordinatesI | null;
  width: number;
  height: number;
  boxes: BoxI[];
}

interface FileContextI {
  images: ImageI[];
  labels: LabelI[];
  currentBoxes: BoxI[];
  currentLabel: LabelI | null;
  setCurrentLabel: React.Dispatch<React.SetStateAction<LabelI | null>>;
  setCurrentBoxes: React.Dispatch<React.SetStateAction<BoxI[]>>;
  setImages: React.Dispatch<React.SetStateAction<ImageI[]>>;
  setLabels: React.Dispatch<React.SetStateAction<LabelI[]>>;
  handleImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

interface ImageCordinatesI {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

interface Point {
  x: number;
  y: number;
}

interface ProvidersProps {
  children: React.ReactNode;
  themeProps?: ThemeProviderProps;
}

export type {
  BoxI,
  LabelI,
  ImageI,
  FileContextI,
  ImageCordinatesI,
  Point,
  ProvidersProps,
};
