"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import { useFileContext } from "@/app/providers";
import { useDisclosure } from "@nextui-org/react";
import ImageList from "@/components/ImageList";
import LabelEditor from "@/components/LabelEditor";
import BoxList from "@/components/BoxList";
import Canvas from "@/components/Canvas";

export default function Page() {
  const { images, labels, setImages, setLabels } = useFileContext();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  useEffect(() => {
    const preventDefault = (e: Event) => {
      if ((e as WheelEvent).ctrlKey) {
        e.preventDefault();
      }
    };
    window.addEventListener("wheel", preventDefault, { passive: false });
    return () => window.removeEventListener("wheel", preventDefault);
  }, []);

  return (
    <main className="flex flex-row h-full w-full relative">
      <ImageList setSelectedImage={setSelectedImage} />
      <Canvas
        selectedImage={selectedImage}
        // boxes={{}}
        // currentBoxes={[]}
        // setImageCoordinates={setImageCoordinates}
        // imageCoordinates={imageCoordinates}
        // overlayCanvasRef={overlayCanvasRef}
        // backgroundCanvasRef={backgroundCanvasRef}
        // labels={labels}
      />
      <BoxList />
    </main>
  );
}
