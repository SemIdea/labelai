"use client";

import { useEffect, useState } from "react";
import ImageList from "@/components/imageList";
import BoxList from "@/components/boxList";
import Canvas from "@/components/canvas";

export default function Page() {
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
      />
      <BoxList />
    </main>
  );
}
