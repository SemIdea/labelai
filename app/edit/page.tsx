"use client";

import { useEffect, useRef, useState } from "react";
import crc32 from "crc-32";
import { Box, useFileContext } from "@/app/providers";
import { useDisclosure } from "@nextui-org/react";
import ImageList from "@/components/ImageList";
import LabelEditor from "@/components/LabelEditor";
import BoxList from "@/components/BoxList";
import Canvas from "@/components/Canvas";

export default function Page() {
  const { images, boxes, setBoxes, labels, setLabels } = useFileContext();
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

  const [imageCoordinates, setImageCoordinates] = useState({
    x1: 0,
    y1: 0,
    x2: 0,
    y2: 0,
  });

  useEffect(() => {
    // prevent ctrl zoom
    const preventDefault = (e: Event) => e.preventDefault();
    window.addEventListener("wheel", preventDefault, { passive: false });
    return () => window.removeEventListener("wheel", preventDefault);
  }, []);

  useEffect(() => {
    if (!selectedImage) return;
    setCurrentBoxes(
      boxes.filter(
        (box) => box.imageId.toString() === crc32.str(selectedImage).toString()
      ) || []
    );
  }, [selectedImage, boxes]);

  const onMouseDown = (e: React.MouseEvent) => {
    const overlayCanvas = overlayCanvasRef.current;
    const backgroundCanvas = backgroundCanvasRef.current;
    if (!overlayCanvas || !backgroundCanvas) return;
    const ctx = overlayCanvas.getContext("2d");
    if (!ctx) return;
    const bounding = overlayCanvas.getBoundingClientRect();

    const clickX = e.clientX - bounding.left;
    const clickY = e.clientY - bounding.top;

    if (
      clickX < imageCoordinates.x1 ||
      clickX > imageCoordinates.x2 ||
      clickY < imageCoordinates.y1 ||
      clickY > imageCoordinates.y2
    ) {
      return;
    }

    for (const box of boxes) {
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

    let isCreatingBox = false;

    const onMouseMove = (e: MouseEvent) => {
      const moveX = e.clientX - bounding.left;
      const moveY = e.clientY - bounding.top;

      if (hoveringBox) return;

      if (!isCreatingBox) {
        const dx = moveX - clickX;
        const dy = moveY - clickY;
        const threshold = 1;
        if (dx * dx + dy * dy < threshold * threshold) return;
        isCreatingBox = true;
        setCreatingBox(true);

        const newRect: Box = {
          imageId: selectedImage ? crc32.str(selectedImage) : 0,
          labelId: null,
          cords: {
            x1: clickX,
            y1: clickY,
            x2: moveX,
            y2: moveY,
          },
          hover: false,
          selected: false,
          visible: true,
        };

        setBoxes((prevBoxes) => [...prevBoxes, newRect]);
      }

      setBoxes((prevBoxes) => {
        const updatedBoxes = [...prevBoxes];
        const rect = updatedBoxes[updatedBoxes.length - 1];

        rect.cords.x2 = Math.min(
          Math.max(moveX, imageCoordinates.x1),
          backgroundCanvas.width
        );
        rect.cords.y2 = Math.min(
          Math.max(moveY, imageCoordinates.y1),
          backgroundCanvas.height
        );

        const imageX2 = Math.min(rect.cords.x2, imageCoordinates.x2);
        const imageY2 = Math.min(rect.cords.y2, imageCoordinates.y2);

        rect.cords.x2 = imageX2;
        rect.cords.y2 = imageY2;

        return updatedBoxes;
      });
    };

    const onMouseUp = () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);

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
      <ImageList images={images} setSelectedImage={setSelectedImage} />
      <Canvas
        selectedImage={selectedImage}
        boxes={boxes}
        currentBoxes={currentBoxes}
        setImageCoordinates={setImageCoordinates}
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
