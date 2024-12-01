"use client";

import { Box, Label } from "@/app/providers";
import { useRef, useEffect, useState, useCallback } from "react";

// Add type definitions
type Point = { x: number; y: number };
type CanvasOperation = "idle" | "drawing" | "moving" | "resizing";

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
  imageCoordinates, // Add this prop
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
  imageCoordinates: {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
  } | null; // Allow null
}) {
  const canvasParentRef = useRef<HTMLDivElement>(null);
  const [imageInfo, setImageInfo] = useState<{
    width: number;
    height: number;
  } | null>(null);
  const [operation, setOperation] = useState<CanvasOperation>("idle");

  // Group canvas update functions
  const updateCanvas = useCallback(() => {
    const { current: overlayCanvas } = overlayCanvasRef;
    const { current: backgroundCanvas } = backgroundCanvasRef;
    if (!overlayCanvas || !backgroundCanvas || !currentBoxes) return;

    const ctx = overlayCanvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);

    // Draw boxes
    currentBoxes.forEach((box) => drawBox(ctx, box));
  }, [currentBoxes, labels]);

  // Separate box drawing logic
  const drawBox = useCallback(
    (ctx: CanvasRenderingContext2D, box: Box) => {
      if (!box.visible) return;

      const { boundedBox, color } = getBoxDrawingInfo(box);

      // Draw rectangle
      ctx.beginPath();
      ctx.rect(
        boundedBox.x1,
        boundedBox.y1,
        boundedBox.x2 - boundedBox.x1,
        boundedBox.y2 - boundedBox.y1
      );
      ctx.fillStyle = `${color}3D`;
      ctx.fill();
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.stroke();

      // Draw control points if hovered
      if (box.hover) {
        drawControlPoints(ctx, boundedBox, color);
      }
    },
    [labels]
  );

  // Helper functions for drawing
  const getBoxDrawingInfo = useCallback(
    (box: Box) => {
      const boundedBox = {
        x1: Math.max(box.cords.x1, 0),
        y1: Math.max(box.cords.y1, 0),
        x2: Math.min(box.cords.x2, overlayCanvasRef.current?.width || 0),
        y2: Math.min(box.cords.y2, overlayCanvasRef.current?.height || 0),
      };

      const color =
        box.labelId !== null
          ? `#${labels[box.labelId - 1].color}`
          : "#ffffff";

      return { boundedBox, color };
    },
    [labels]
  );

  const getControlPoints = (box: { x1: number; y1: number; x2: number; y2: number }) => {
    const { x1, y1, x2, y2 } = box;
    return [
      { x: x1, y: y1 }, // top-left
      { x: x2, y: y1 }, // top-right
      { x: x1, y: y2 }, // bottom-left
      { x: x2, y: y2 }, // bottom-right
      { x: (x1 + x2) / 2, y: y1 }, // top-middle
      { x: (x1 + x2) / 2, y: y2 }, // bottom-middle
      { x: x1, y: (y1 + y2) / 2 }, // left-middle
      { x: x2, y: (y1 + y2) / 2 }, // right-middle
    ];
  };

  const drawControlPoints = (
    ctx: CanvasRenderingContext2D,
    box: { x1: number; y1: number; x2: number; y2: number },
    color: string
  ) => {
    const points = getControlPoints(box);
    points.forEach((point) => {
      ctx.beginPath();
      ctx.rect(point.x - 5, point.y - 5, 10, 10);
      ctx.fillStyle = color;
      ctx.fill();
    });
  };

  // Image loading and setup
  useEffect(() => {
    if (!selectedImage) return;
    loadAndSetupImage(selectedImage);
  }, [selectedImage]);

  const loadAndSetupImage = (imageSrc: string) => {
    const backgroundCanvas = backgroundCanvasRef.current;
    if (!backgroundCanvas) return;

    const ctx = backgroundCanvas.getContext("2d");
    if (!ctx) return;

    const image = new window.Image();
    image.src = imageSrc;
    image.onload = () => setupImage(image, ctx, backgroundCanvas);
  };

  const setupImage = (
    image: HTMLImageElement,
    ctx: CanvasRenderingContext2D,
    backgroundCanvas: HTMLCanvasElement
  ) => {
    setImageInfo({
      width: image.width,
      height: image.height,
    });

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

  // Mouse event handlers with improved logic
  const handleMouseDown = (e: React.MouseEvent) => {
    const point = getCanvasPoint(e);
    if (!point || !isPointInImage(point)) return;

    if (isOverControlPoint(point)) {
      setOperation("resizing");
    } else if (isOverBox(point)) {
      setOperation("moving");
    } else {
      setOperation("drawing");
    }

    onMouseDown(e);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const point = getCanvasPoint(e);
    if (!point) return;

    updateCursor(point);
    onMouseMove(e);
  };

  const snapToImage = (x: number, y: number) => {
    if (!imageCoordinates) return { x, y };
    return {
      x: Math.max(imageCoordinates.x1, Math.min(x, imageCoordinates.x2)),
      y: Math.max(imageCoordinates.y1, Math.min(y, imageCoordinates.y2)),
    };
  };

  const getCanvasPoint = (e: React.MouseEvent): Point | null => {
    const rect = overlayCanvasRef.current?.getBoundingClientRect();
    if (!rect) return null;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (x < 0 || y < 0 || x > rect.width || y > rect.height) return null;

    return { x, y };
  };

  const isPointInImage = (point: Point): boolean => {
    if (!imageCoordinates) return false;
    return (
      point.x >= imageCoordinates.x1 &&
      point.x <= imageCoordinates.x2 &&
      point.y >= imageCoordinates.y1 &&
      point.y <= imageCoordinates.y2
    );
  };

  const isOverControlPoint = (point: Point): boolean => {
    // Implement logic to check if the point is over a control point
    return false;
  };

  const isOverBox = (point: Point): boolean => {
    // Implement logic to check if the point is over a box
    return false;
  };

  const updateCursor = (point: Point) => {
    if (isPointInImage(point)) {
      overlayCanvasRef.current!.style.cursor = "crosshair";
    } else {
      overlayCanvasRef.current!.style.cursor = "default";
    }
  };

  useEffect(() => {
    updateCanvas();
  }, [updateCanvas]);

  return (
    <section
      className="w-4/6 flex justify-center items-center relative"
      ref={canvasParentRef}
    >
      {imageInfo && (
        <div className="absolute top-2 left-2 bg-black bg-opacity-50 text-white p-2 rounded">
          {imageInfo.width} x {imageInfo.height}px
        </div>
      )}
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
