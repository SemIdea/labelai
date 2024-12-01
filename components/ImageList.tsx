"use client";

import Image from "next/image";
import { Button } from "@nextui-org/react";

export default function ImageList({
  images,
  setSelectedImage,
}: {
  images: { id: number; url: string }[];
  setSelectedImage: (url: string) => void;
}) {
  return (
    <section className="w-1/6 min-h-screen bg-zinc-500 flex flex-col items-center gap-3 p-3">
      <Button>Images</Button>
      <ul className="flex flex-wrap gap-5 justify-center">
        {images.map((image, index) => (
          <li
            className="w-32 h-32 relative"
            key={index}
            onClick={() => setSelectedImage(image.url)}
          >
            <Image src={image.url} alt={`Uploaded ${index}`} fill />
          </li>
        ))}
      </ul>
    </section>
  );
}
