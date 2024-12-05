"use client";

import Image from "next/image";
import { Button } from "@nextui-org/react";
import { useState, useCallback, useEffect } from "react";
import crc32 from "crc-32";
import { ImageI } from "@/app/providers/types";
import { useInView } from "react-intersection-observer";
import { useFileContext } from "@/app/providers";

function resizeImage(url: string, callback: (resizedUrl: string) => void) {
  const img = new window.Image();
  img.crossOrigin = "anonymous"; // Ensure the image is loaded with CORS enabled
  img.src = url;
  img.onload = () => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (ctx) {
      canvas.width = 100;
      canvas.height = 100;
      ctx.drawImage(img, 0, 0, 100, 100);
      callback(canvas.toDataURL("image/jpeg", 0.7)); // Adjust the quality to 0.7
    }
  };
}

function ImageItem({
  image,
  setSelectedImage,
}: {
  image: ImageI;
  setSelectedImage: (url: string) => void;
}) {
  const { ref, inView } = useInView({
    triggerOnce: false,
    threshold: 0.1,
  });

  const [resizedUrl, setResizedUrl] = useState<string | null>(null);

  useEffect(() => {
    if (inView && !resizedUrl) {
      resizeImage(image.url, setResizedUrl);
    }
  }, [inView, image.url, resizedUrl]);

  return (
    <li
      className="w-32 h-32 relative flex justify-center items-center cursor-pointer border-1 border-gray-400 rounded-lg"
      onClick={() => {
        setSelectedImage(image.url);
      }}
      ref={ref}
    >
      {inView && resizedUrl && (
        <Image
          src={resizedUrl}
          alt={image.name}
          width={100}
          height={100}
          loading="lazy"
          sizes="100px" // Set the size to 128x128 for maximum performance
        />
      )}
    </li>
  );
}

export default function ImageList({
  setSelectedImage,
}: {
  setSelectedImage: (url: string) => void;
}) {
  const { images, setImages } = useFileContext();
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  const handleAddImage = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const newImages: ImageI[] = [];
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
            boxes: [],
            cords: null,
            width: 0,
            height: 0,
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
        const newImages: ImageI[] = [];
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
              boxes: [],
              cords: null,
              width: 0,
              height: 0,
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
      className="w-1/6 min-h-screen max-h-screen bg-zinc-900 flex flex-col items-center gap-3 p-3"
      onDrop={handleDrop}
      onDragOver={handleDragOver}
    >
      <div className="w-full flex flex-col gap-3">
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
      </div>

      <div
        className="flex justify-center"
      >
        <ul className="grid grid-cols-2 gap-5 overflow-auto">
          {images.map((image, index) => (
            <ImageItem
              key={index}
              image={image}
              setSelectedImage={setSelectedImage}
            />
          ))}
        </ul>
      </div>
    </section>
  );
}
