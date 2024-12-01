"use client";

import { useEffect, useRef, useState } from "react";
import crc32 from "crc-32";
import { Box, useFileContext } from "@/app/providers";
import { useDisclosure } from "@nextui-org/react";
import ImageList from "@/components/ImageList";
import LabelEditor from "@/components/LabelEditor";
import BoxList from "@/components/BoxList";
import Canvas from "@/components/Canvas";

type ImageType = {
  id: number;
  url: string;
  name: string;
};

export default function Page() {
  const { images, setImages, boxes, setBoxes, labels, setLabels } =
    useFileContext();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [currentBoxes, setCurrentBoxes] = useState<Box[] | null>(null);
  const [creatingBox, setCreatingBox] = useState(false);
  const [movingBox, setMovingBox] = useState(false);
  const [hoveringBox, setHoveringBox] = useState(false);

  const overlayCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const backgroundCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const {
    isOpen: editLabels,
    onOpen: setEditLabels,
    onOpenChange: toggleEditLabels,
  } = useDisclosure();

  const [imageCoordinates, setImageCoordinates] = useState<{
    x1: number;
    y1: number;
    x2: number;
    y2: number;
  } | null>(null); // Allow null

  useEffect(() => {
    // prevent ctrl zoom
    const preventDefault = (e: Event) => e.preventDefault();
    window.addEventListener("wheel", preventDefault, { passive: false });
    return () => window.removeEventListener("wheel", preventDefault);
  }, []);

  useEffect(() => {
    if (!selectedImage) return;
    const imageName = images.find((image) => image.url === selectedImage)?.name;
    if (!imageName) return;
    setCurrentBoxes(
      boxes.filter(
        (box) => box.imageId.toString() === crc32.str(imageName).toString()
      ) || []
    );
  }, [selectedImage, boxes]);

  const onMouseDown = (e: React.MouseEvent) => {
    // Prevent text selection during box creation
    document.body.style.userSelect = "none";

    const overlayCanvas = overlayCanvasRef.current;
    const backgroundCanvas = backgroundCanvasRef.current;
    if (!overlayCanvas || !backgroundCanvas) return;
    const ctx = overlayCanvas.getContext("2d");
    if (!ctx) return;
    const bounding = overlayCanvas.getBoundingClientRect();

    const clickX = e.clientX - bounding.left;
    const clickY = e.clientY - bounding.top;

    // Ensure click is within image bounds
    if (
      !imageCoordinates ||
      clickX < imageCoordinates.x1 ||
      clickX > imageCoordinates.x2 ||
      clickY < imageCoordinates.y1 ||
      clickY > imageCoordinates.y2
    ) {
      return;
    }

    // Handle box resizing
    if (currentBoxes) {
      for (const box of currentBoxes) {
        const { x1, y1, x2, y2 } = box.cords;
        const minX = Math.min(x1, x2);
        const maxX = Math.max(x1, x2);
        const minY = Math.min(y1, y2);
        const maxY = Math.max(y1, y2);
        const radius = 5;

        const corners = [
          { x: minX, y: minY, name: "top-left" },
          { x: maxX, y: minY, name: "top-right" },
          { x: minX, y: maxY, name: "bottom-left" },
          { x: maxX, y: maxY, name: "bottom-right" },
          { x: (minX + maxX) / 2, y: minY, name: "top-middle" },
          { x: (minX + maxX) / 2, y: maxY, name: "bottom-middle" },
          { x: minX, y: (minY + maxY) / 2, name: "left-middle" },
          { x: maxX, y: (minY + maxY) / 2, name: "right-middle" },
        ];

        for (const corner of corners) {
          const dx = clickX - corner.x;
          const dy = clickY - corner.y;
          if (dx * dx + dy * dy <= radius * radius && box.hover) {
            const boxId = boxes.indexOf(box);
            setMovingBox(true);

            const onMouseMove = (e: MouseEvent) => {
              const bounding = overlayCanvas.getBoundingClientRect();
              if (!bounding) return;

              setBoxes((prevBoxes) => {
                const updatedBoxes = [...prevBoxes];
                const rect = updatedBoxes[boxId];

                switch (corner.name) {
                  case "top-left":
                    rect.cords.x1 = e.clientX - bounding.left;
                    rect.cords.y1 = e.clientY - bounding.top;
                    break;
                  case "top-right":
                    rect.cords.x2 = e.clientX - bounding.left;
                    rect.cords.y1 = e.clientY - bounding.top;
                    break;
                  case "bottom-left":
                    rect.cords.x1 = e.clientX - bounding.left;
                    rect.cords.y2 = e.clientY - bounding.top;
                    break;
                  case "bottom-right":
                    rect.cords.x2 = e.clientX - bounding.left;
                    rect.cords.y2 = e.clientY - bounding.top;
                    break;
                  case "top-middle":
                    rect.cords.y1 = e.clientY - bounding.top;
                    break;
                  case "bottom-middle":
                    rect.cords.y2 = e.clientY - bounding.top;
                    break;
                  case "left-middle":
                    rect.cords.x1 = e.clientX - bounding.left;
                    break;
                  case "right-middle":
                    rect.cords.x2 = e.clientX - bounding.left;
                    break;
                  default:
                    break;
                }

                // Ensure the box stays within the canvas boundaries
                rect.cords.x1 = Math.max(
                  0,
                  Math.min(rect.cords.x1, overlayCanvas.width)
                );
                rect.cords.x2 = Math.max(
                  0,
                  Math.min(rect.cords.x2, overlayCanvas.width)
                );
                rect.cords.y1 = Math.max(
                  0,
                  Math.min(rect.cords.y1, overlayCanvas.height)
                );
                rect.cords.y2 = Math.max(
                  0,
                  Math.min(rect.cords.y2, overlayCanvas.height)
                );

                return updatedBoxes;
              });
            };

            const onMouseUp = () => {
              window.removeEventListener("mousemove", onMouseMove);
              window.removeEventListener("mouseup", onMouseUp);

              setBoxes((prevBoxes) => {
                const updatedBoxes = [...prevBoxes];
                const rect = updatedBoxes[boxId];

                const normalizedX1 = Math.min(rect.cords.x1, rect.cords.x2);
                const normalizedX2 = Math.max(rect.cords.x1, rect.cords.x2);
                const normalizedY1 = Math.min(rect.cords.y1, rect.cords.y2);
                const normalizedY2 = Math.max(rect.cords.y1, rect.cords.y2);

                rect.cords.x1 = normalizedX1;
                rect.cords.x2 = normalizedX2;
                rect.cords.y1 = normalizedY1;
                rect.cords.y2 = normalizedY2;

                return updatedBoxes;
              });
              setMovingBox(false);
            };

            window.addEventListener("mousemove", onMouseMove);
            window.addEventListener("mouseup", onMouseUp);

            return;
          }
        }
      }
    }

    // Handle new box creation
    let isCreatingBox = false;
    let startPoint = { x: clickX, y: clickY };

    const onMouseMove = (e: MouseEvent) => {
      if (hoveringBox) return;

      const moveX = e.clientX - bounding.left;
      const moveY = e.clientY - bounding.top;

      // Snap end point to image boundaries
      const endPoint = {
        x: Math.max(imageCoordinates.x1, Math.min(moveX, imageCoordinates.x2)),
        y: Math.max(imageCoordinates.y1, Math.min(moveY, imageCoordinates.y2)),
      };

      if (!isCreatingBox) {
        const dx = endPoint.x - startPoint.x;
        const dy = endPoint.y - startPoint.y;
        const threshold = 5;
        if (Math.abs(dx) < threshold && Math.abs(dy) < threshold) return;

        isCreatingBox = true;
        setCreatingBox(true);

        const imageName = images.find(
          (image) => image.url === selectedImage
        )?.name;
        if (!imageName) return;

        const newRect: Box = {
          imageId: selectedImage ? crc32.str(imageName) : 0,
          labelId: null,
          cords: {
            x1: startPoint.x,
            y1: startPoint.y,
            x2: endPoint.x,
            y2: endPoint.y,
          },
          hover: false,
          selected: false,
          visible: true,
        };

        setBoxes((prevBoxes) => [...prevBoxes, newRect]);
      }

      // Update box dimensions
      setBoxes((prevBoxes) => {
        const updatedBoxes = [...prevBoxes];
        const rect = updatedBoxes[updatedBoxes.length - 1];
        rect.cords.x2 = endPoint.x;
        rect.cords.y2 = endPoint.y;
        return updatedBoxes;
      });
    };

    const onMouseUp = () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      document.body.style.userSelect = "auto";

      if (isCreatingBox) {
        setBoxes((prevBoxes) => {
          const updatedBoxes = [...prevBoxes];
          const rect = updatedBoxes[updatedBoxes.length - 1];

          const normalizedX1 = Math.min(rect.cords.x1, rect.cords.x2);
          const normalizedX2 = Math.max(rect.cords.x1, rect.cords.x2);
          const normalizedY1 = Math.min(rect.cords.y1, rect.cords.y2);
          const normalizedY2 = Math.max(rect.cords.y1, rect.cords.y2);

          rect.cords.x1 = normalizedX1;
          rect.cords.x2 = normalizedX2;
          rect.cords.y1 = normalizedY1;
          rect.cords.y2 = normalizedY2;

          return updatedBoxes;
        });
        setCreatingBox(false);
      }
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  };

  const onMouseMove = (e: React.MouseEvent) => {
    if (creatingBox) return;
    if (movingBox) return;
    const bounding = overlayCanvasRef.current?.getBoundingClientRect();
    if (!bounding) return;

    const mouseX = e.clientX - bounding.left;
    const mouseY = e.clientY - bounding.top;

    let hoverIndex: number | null = null;
    const padding = 3;

    boxes.forEach((box, index) => {
      const { x1, y1, x2, y2 } = box.cords;
      if (
        mouseX >= Math.min(x1, x2) - padding &&
        mouseX <= Math.max(x1, x2) + padding &&
        mouseY >= Math.min(y1, y2) - padding &&
        mouseY <= Math.max(y1, y2) + padding &&
        ((mouseX >= x1 - padding && mouseX <= x1 + padding) || // Left border
          (mouseX >= x2 - padding && mouseX <= x2 + padding) || // Right border
          (mouseY >= y1 - padding && mouseY <= y1 + padding) || // Top border
          (mouseY >= y2 - padding && mouseY <= y2 + padding)) // Bottom border
      ) {
        hoverIndex = index;
      }
    });

    setBoxes((prevBoxes) => {
      return prevBoxes.map((box, index) => ({
        ...box,
        hover: index === hoverIndex,
      }));
    });

    if (hoverIndex !== null) {
      setHoveringBox(true);
      document.body.style.cursor = "move";
    } else {
      setHoveringBox(false);
      document.body.style.cursor = "default";
    }
  };

  return (
    <main className="flex flex-row h-full w-full relative">
      <ImageList
        images={images}
        setSelectedImage={setSelectedImage}
        setImages={setImages}
      />
      <Canvas
        selectedImage={selectedImage}
        boxes={boxes}
        currentBoxes={currentBoxes}
        setImageCoordinates={setImageCoordinates}
        imageCoordinates={imageCoordinates} // Add this prop
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        overlayCanvasRef={overlayCanvasRef}
        backgroundCanvasRef={backgroundCanvasRef}
        labels={labels}
      />
      <BoxList
        currentBoxes={currentBoxes}
        boxes={boxes}
        setBoxes={setBoxes}
        labels={labels}
        setEditLabels={setEditLabels}
        imageCoordinates={imageCoordinates} // Add this prop
      />
      <LabelEditor
        editLabels={editLabels}
        toggleEditLabels={toggleEditLabels}
        labels={labels}
        setLabels={setLabels}
        boxes={boxes}
        setBoxes={setBoxes}
      />
    </main>
  );
}
