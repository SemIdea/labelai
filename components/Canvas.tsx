"use client";

import { Box, Label } from "@/app/providers";
import { useRef, useEffect } from "react";

export default function Canvas({
  selectedImage,
  boxes,
  currentBoxes,
  setImageCoordinates,
  onMouseDown,
  onMouseMove,
  overlayCanvasRef,
  backgroundCanvasRef,
  labels,
}: {
  selectedImage: string | null;
  boxes: Box[];
  currentBoxes: Box[] | null;
  setImageCoordinates: (cords: {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
  }) => void;
  onMouseDown: (e: React.MouseEvent) => void;
  onMouseMove: (e: React.MouseEvent) => void;
  overlayCanvasRef: React.RefObject<HTMLCanvasElement>;
  backgroundCanvasRef: React.RefObject<HTMLCanvasElement>;
  labels: Label[];
}) {
  const canvasParentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (selectedImage) {
      const backgroundCanvas = backgroundCanvasRef.current;
      if (!backgroundCanvas) return;
      const ctx = backgroundCanvas.getContext("2d");
      if (!ctx) return;

      const image = new window.Image();
      image.src = selectedImage;

      image.onload = () => {
        const canvasWidth = canvasParentRef.current?.clientWidth || 600;
        const canvasHeight = canvasParentRef.current?.clientHeight || 600;
        backgroundCanvas.width = canvasWidth;
        backgroundCanvas.height = canvasHeight;

        ctx.clearRect(0, 0, canvasWidth, canvasHeight);

        const imageAspectRatio = image.width / image.height;
        const canvasAspectRatio = canvasWidth / canvasHeight;

        let drawWidth, drawHeight, offsetX, offsetY;

        if (canvasAspectRatio > imageAspectRatio) {
          drawHeight = canvasHeight;
          drawWidth = imageAspectRatio * drawHeight;
          offsetX = (canvasWidth - drawWidth) / 2;
          offsetY = 0;
        } else {
          drawWidth = canvasWidth;
          drawHeight = drawWidth / imageAspectRatio;
          offsetX = 0;
          offsetY = (canvasHeight - drawHeight) / 2;
        }

        ctx.drawImage(image, offsetX, offsetY, drawWidth, drawHeight);
        setImageCoordinates({
          x1: offsetX,
          y1: offsetY,
          x2: offsetX + drawWidth,
          y2: offsetY + drawHeight,
        });
      };
    }
  }, [selectedImage]);

  useEffect(() => {
    updateGlobalState();
  }, [boxes, currentBoxes, labels]);

  const updateGlobalState = () => {
    const overlayCanvas = overlayCanvasRef.current;
    const backgroundCanvas = backgroundCanvasRef.current;
    if (!overlayCanvas) return;
    if (!backgroundCanvas) return;
    const ctx = overlayCanvas.getContext("2d");
    const backgroundCtx = backgroundCanvas.getContext("2d");
    if (!ctx) return;
    if (!backgroundCtx) return;
    if (!currentBoxes) return;

    ctx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);

    currentBoxes.forEach((box) => {
      if (!box.visible) return;

      // Ensure the box is within the image boundaries
      const boundedX1 = Math.max(box.cords.x1, 0);
      const boundedY1 = Math.max(box.cords.y1, 0);
      const boundedX2 = Math.min(box.cords.x2, overlayCanvas.width);
      const boundedY2 = Math.min(box.cords.y2, overlayCanvas.height);

      ctx.beginPath();
      ctx.rect(
        boundedX1,
        boundedY1,
        boundedX2 - boundedX1,
        boundedY2 - boundedY1
      );
      ctx.fillStyle =
        box.labelId !== null
          ? `#${labels[box.labelId - 1].color}3D`
          : "#ffffff3D";
      ctx.fill();
      ctx.strokeStyle =
        box.labelId !== null ? `#${labels[box.labelId - 1].color}` : "#ffffff";
      ctx.lineWidth = 2;
      ctx.stroke();

      if (box.hover) {
        const squares = [
          { x: boundedX1, y: boundedY1 },
          { x: boundedX2, y: boundedY1 },
          { x: boundedX1, y: boundedY2 },
          { x: boundedX2, y: boundedY2 },
          { x: (boundedX1 + boundedX2) / 2, y: boundedY1 },
          { x: (boundedX1 + boundedX2) / 2, y: boundedY2 },
          { x: boundedX1, y: (boundedY1 + boundedY2) / 2 },
          { x: boundedX2, y: (boundedY1 + boundedY2) / 2 },
        ];

        squares.forEach((square) => {
          ctx.beginPath();
          ctx.rect(square.x - 5, square.y - 5, 10, 10);
          ctx.fillStyle =
            box.labelId !== null
              ? `#${labels[box.labelId - 1].color}`
              : "#ffffff";
          ctx.fill();
        });
      }
    });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    const rect = overlayCanvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (x < 0 || y < 0 || x > rect.width || y > rect.height) return;

    onMouseDown(e);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = overlayCanvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (x < 0 || y < 0 || x > rect.width || y > rect.height) return;

    onMouseMove(e);
  };

  return (
    <section
      className="w-4/6 flex justify-center items-center relative"
      ref={canvasParentRef}
    >
      {selectedImage && (
        <>
          <canvas
            ref={backgroundCanvasRef}
            width={canvasParentRef.current?.clientWidth || 600}
            height={canvasParentRef.current?.clientHeight || 600}
            className="absolute"
          ></canvas>
          <canvas
            ref={overlayCanvasRef}
            width={canvasParentRef.current?.clientWidth || 600}
            height={canvasParentRef.current?.clientHeight || 600}
            className="absolute"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
          ></canvas>
        </>
      )}
    </section>
  );
}
