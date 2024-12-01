"use client";

import Image from "next/image";
import { Button } from "@nextui-org/react";
import { useState, useCallback, useEffect } from "react";
import crc32 from "crc-32";

type ImageType = {
  id: number;
  url: string;
  name: string;
};

export default function ImageList({
  images,
  setSelectedImage,
  setImages,
}: {
  images: ImageType[];
  setSelectedImage: (url: string) => void;
  setImages: (images: ImageType[]) => void;
}) {
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  const handleAddImage = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const newImages: ImageType[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (!file.type.startsWith("image/")) {
          alert("Only images are allowed!");
          continue;
        }
        const reader = new FileReader();
        reader.onload = (e) => {
          const url = e.target?.result as string;
          const name = file.name;
          newImages.push({
            id: crc32.str(name),
            url,
            name,
          });
          if (newImages.length === files.length) {
            setImages([...images, ...newImages]);
          }
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const handleSortImages = () => {
    const sortedImages = [...images].sort((a, b) => {
      if (sortOrder === "asc") {
        return a.name.localeCompare(b.name);
      } else {
        return b.name.localeCompare(a.name);
      }
    });
    setImages(sortedImages);
    setSortOrder(sortOrder === "asc" ? "desc" : "asc");
  };

  const handleDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      const files = event.dataTransfer.files;
      if (files.length) {
        const newImages: ImageType[] = [];
        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          if (!file.type.startsWith("image/")) {
            alert("Only images are allowed!");
            continue;
          }
          const reader = new FileReader();
          reader.onload = (e) => {
            const url = e.target?.result as string;
            const name = file.name;
            newImages.push({
              id: images.length + newImages.length + 1,
              url,
              name,
            });
            if (newImages.length === files.length) {
              setImages([...images, ...newImages]);
            }
          };
          reader.readAsDataURL(file);
        }
      }
    },
    [images, setImages]
  );

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
  };

  return (
    <section
      className="w-1/6 min-h-screen bg-zinc-500 flex flex-col items-center gap-3 p-3"
      onDrop={handleDrop}
      onDragOver={handleDragOver}
    >
      <input
        type="file"
        multiple
        accept="image/*"
        onChange={handleAddImage}
        style={{ display: "none" }}
        id="fileInput"
      />
      <label
        htmlFor="fileInput"
        className="w-full h-32 flex flex-col justify-center items-center border-2 border-dashed border-gray-400 cursor-pointer"
      >
        {(images.length === 0 && (
          <>
            <h2 className="font-bold">Drop Images</h2>
            <p>or</p>
            <h2 className="font-bold">Click here to select them</h2>
          </>
        )) || <h2 className="font-bold">{images.length} Images loaded!</h2>}
      </label>
      <Button onClick={handleSortImages}>Sort Images</Button>
      <ul className="flex flex-wrap gap-5 justify-center">
        {images.map((image, index) => (
          <li
            className="w-32 h-32 relative"
            key={index}
            onClick={() => setSelectedImage(image.url)}
          >
            <Image src={image.url} alt={image.name} fill />
          </li>
        ))}
      </ul>
    </section>
  );
}
