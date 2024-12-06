"use client";

import crc32 from "crc-32";
import { useEffect, useRef } from "react";
import { BoxI, ImageCordinatesI, Point } from "@/app/providers/types";
import { useFileContext } from "@/app/providers";

export default function Canvas({
  selectedImage,
}: {
  selectedImage: string | null;
}) {
  const {
    currentBoxes,
    labels,
    images,
    currentLabel,
    setCurrentBoxes,
    setImages,
  } = useFileContext();

  const mouseStartPosition = useRef<Point | null>(null);
  const canvasParentRef = useRef<HTMLDivElement>(null);
  const backgroundCanvasRef = useRef<HTMLCanvasElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);

  const isCreatingBox = useRef<boolean>(false);
  const imageName = useRef<string | null>(null);
  const imageCoordinates = useRef<ImageCordinatesI | null>(null);

  useEffect(() => {
    const { current: overlayCanvas } = overlayCanvasRef;
    const { current: backgroundCanvas } = backgroundCanvasRef;
    const { current: canvasParent } = canvasParentRef;
    if (!overlayCanvas || !backgroundCanvas || !canvasParent) return;

    overlayCanvas.width = canvasParent.clientWidth || 600;
    overlayCanvas.height = canvasParent.clientHeight || 600;
    backgroundCanvas.width = canvasParent.clientWidth || 600;
    backgroundCanvas.height = canvasParent.clientHeight || 600;
  }, []);

  useEffect(() => {
    const handleResize = () => {
      const { current: overlayCanvas } = overlayCanvasRef;
      const { current: backgroundCanvas } = backgroundCanvasRef;
      const { current: canvasParent } = canvasParentRef;
      if (!overlayCanvas || !backgroundCanvas || !canvasParent) return;

      overlayCanvas.width = canvasParent.clientWidth || 600;
      overlayCanvas.height = canvasParent.clientHeight || 600;
      backgroundCanvas.width = canvasParent.clientWidth || 600;
      backgroundCanvas.height = canvasParent.clientHeight || 600;
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (!selectedImage) return;
    setCurrentBoxes(
      images.find((image) => image.url === selectedImage)?.boxes || []
    );
    const { current: backgroundCanvas } = backgroundCanvasRef;
    if (!backgroundCanvas) return;
    const ctx = backgroundCanvas.getContext("2d");
    if (!ctx) return;

    const image = new Image();

    image.onload = () => {
      setupImage(image, ctx, backgroundCanvas);
    };

    image.src = selectedImage;

    imageName.current =
      images.find((image) => image.url === selectedImage)?.name || null;
  }, [selectedImage]);

  useEffect(() => {
    updateCanvas();
  }, [currentBoxes, labels]);

  const setupImage = (
    image: HTMLImageElement,
    ctx: CanvasRenderingContext2D,
    backgroundCanvas: HTMLCanvasElement
  ) => {
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

    imageCoordinates.current = {
      x1: offsetX,
      y1: offsetY,
      x2: offsetX + drawWidth,
      y2: offsetY + drawHeight,
    };

    const updatedImages = [...images];
    const imageIndex = updatedImages.findIndex(
      (image) => image.url === selectedImage
    );
    if (imageIndex === -1) return;
    updatedImages[imageIndex].cords = imageCoordinates.current;
    updatedImages[imageIndex].width = image.width;
    updatedImages[imageIndex].height = image.height;
    setImages(updatedImages);

    ctx.drawImage(image, offsetX, offsetY, drawWidth, drawHeight);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    const { current: overlayCanvas } = overlayCanvasRef;
    if (!overlayCanvas) return;

    const { x, y } = getMousePosition(e);
    const coordinates = imageCoordinates.current;
    if (!coordinates) return;
    if (
      x < coordinates.x1 ||
      x > coordinates.x2 ||
      y < coordinates.y1 ||
      y > coordinates.y2
    )
      return;

    for (const box of currentBoxes) {
      const { boundedBox } = getBoxDrawingInfo(box);
      const controlPoints = getControlPoints(boundedBox);

      for (const point of controlPoints) {
        if (Math.abs(point.x - x) < 5 && Math.abs(point.y - y) < 5) {
          const boxIndex = currentBoxes.indexOf(box);
          const onMouseMove = (e: MouseEvent) => {
            const { x: moveX, y: moveY } = getMousePosition(e);
            setCurrentBoxes((prevBoxes) => {
              const updatedBoxes = [...prevBoxes];
              const rect = updatedBoxes[boxIndex];
              switch (point) {
                case controlPoints[0]: // top-left
                  rect.cords.x1 = moveX;
                  rect.cords.y1 = moveY;
                  break;
                case controlPoints[1]: // top-right
                  rect.cords.x2 = moveX;
                  rect.cords.y1 = moveY;
                  break;
                case controlPoints[2]: // bottom-left
                  rect.cords.x1 = moveX;
                  rect.cords.y2 = moveY;
                  break;
                case controlPoints[3]: // bottom-right
                  rect.cords.x2 = moveX;
                  rect.cords.y2 = moveY;
                  break;
                case controlPoints[4]: // top-middle
                  rect.cords.y1 = moveY;
                  break;
                case controlPoints[5]: // bottom-middle
                  rect.cords.y2 = moveY;
                  break;
                case controlPoints[6]: // left-middle
                  rect.cords.x1 = moveX;
                  break;
                case controlPoints[7]: // right-middle
                  rect.cords.x2 = moveX;
                  break;
                default:
                  break;
              }

              rect.cords.x1 = Math.min(
                Math.max(rect.cords.x1, coordinates.x1),
                coordinates.x2
              );
              rect.cords.y1 = Math.min(
                Math.max(rect.cords.y1, coordinates.y1),
                coordinates.y2
              );
              rect.cords.x2 = Math.min(
                Math.max(rect.cords.x2, coordinates.x1),
                coordinates.x2
              );
              rect.cords.y2 = Math.min(
                Math.max(rect.cords.y2, coordinates.y1),
                coordinates.y2
              );

              return updatedBoxes;
            });
          };

          const onMouseUp = () => {
            window.removeEventListener("mousemove", onMouseMove);
            window.removeEventListener("mouseup", onMouseUp);
          };

          window.addEventListener("mousemove", onMouseMove);
          window.addEventListener("mouseup", onMouseUp);
          return;
        }
      }
    }

    if (currentBoxes.some((box) => box.isHovered)) return;

    mouseStartPosition.current = getMousePosition(e);
    overlayCanvas.addEventListener("mousemove", handleMouseMove);
  };

  const handleMouseMove = (e: MouseEvent) => {
    const { x, y } = getMousePosition(e);
    const coordinates = imageCoordinates.current;
    if (!coordinates) return;
    if (!mouseStartPosition.current) return;

    const { current: overlayCanvas } = overlayCanvasRef;
    if (!overlayCanvas) return;

    if (
      !(
        Math.abs(x - mouseStartPosition.current.x) > 3 ||
        Math.abs(y - mouseStartPosition.current.y) > 3
      )
    )
      return;

    if (!isCreatingBox.current) {
      isCreatingBox.current = true;

      const newBox: BoxI = {
        cords: {
          x1: mouseStartPosition.current.x,
          y1: mouseStartPosition.current.y,
          x2: x,
          y2: y,
        },
        imageId: crc32.str(imageName.current || ""),
        labelId: null,
        isHovered: true,
        isSelected: false,
        isVisible: true,
      };
      setCurrentBoxes((prevBoxes) => [...prevBoxes, newBox]);
    }

    if (isCreatingBox.current) {
      setCurrentBoxes((prevBoxes) => {
        const updatedBoxes = [...prevBoxes];
        const rect = updatedBoxes[updatedBoxes.length - 1];
        rect.cords.x2 = Math.min(Math.max(x, coordinates.x1), coordinates.x2);
        rect.cords.y2 = Math.min(Math.max(y, coordinates.y1), coordinates.y2);
        rect.isHovered = true;
        rect.labelId = currentLabel ? labels.indexOf(currentLabel) : null;
        return updatedBoxes;
      });
    }
  };

  const handleMouseUp = () => {
    const { current: overlayCanvas } = overlayCanvasRef;
    if (!overlayCanvas) return;
    overlayCanvas.removeEventListener("mousemove", handleMouseMove);
    isCreatingBox.current = false;
    mouseStartPosition.current = null;
    setImages((prevImages) => {
      return prevImages.map((image) => {
        if (image.url === selectedImage) {
          return { ...image, boxes: currentBoxes };
        }
        return image;
      });
    });
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const { x, y } = getMousePosition(e);
    const coordinates = imageCoordinates.current;
    if (!coordinates) return;

    if (
      x < coordinates.x1 ||
      x > coordinates.x2 ||
      y < coordinates.y1 ||
      y > coordinates.y2
    ) {
      setCurrentBoxes((prevBoxes) => {
        return prevBoxes.map((box) => ({ ...box, isHovered: false }));
      });
      return;
    }

    setCurrentBoxes((prevBoxes) => {
      return prevBoxes.map((box) => {
        const { boundedBox } = getBoxDrawingInfo(box);
        const isHovered =
          (x > boundedBox.x1 - 5 &&
            x < boundedBox.x2 + 5 &&
            (Math.abs(y - boundedBox.y1) < 5 ||
              Math.abs(y - boundedBox.y2) < 5)) ||
          (y > boundedBox.y1 - 5 &&
            y < boundedBox.y2 + 5 &&
            (Math.abs(x - boundedBox.x1) < 5 ||
              Math.abs(x - boundedBox.x2) < 5)) ||
          (x > boundedBox.x1 - 5 && x < boundedBox.x1 + 5) ||
          (x > boundedBox.x2 - 5 && x < boundedBox.x2 + 5);

        return { ...box, isHovered };
      });
    });
  };

  function updateCanvas() {
    const { current: overlayCanvas } = overlayCanvasRef;
    const { current: backgroundCanvas } = backgroundCanvasRef;
    if (!overlayCanvas || !backgroundCanvas || !currentBoxes) return;

    const ctx = overlayCanvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);

    currentBoxes.forEach((box) => drawBox(ctx, box));
  }

  function drawBox(ctx: CanvasRenderingContext2D, box: BoxI) {
    if (!box.isVisible) return;

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
    if (box.isHovered) {
      drawControlPoints(ctx, boundedBox, color);
    }
  }

  function getBoxDrawingInfo(box: BoxI) {
    const boundedBox = {
      x1: Math.max(box.cords.x1, 0),
      y1: Math.max(box.cords.y1, 0),
      x2: Math.min(box.cords.x2, overlayCanvasRef.current?.width || 0),
      y2: Math.min(box.cords.y2, overlayCanvasRef.current?.height || 0),
    };

    const color =
      box.labelId !== null ? `#${labels[box.labelId].color}` : "#ffffff";

    return { boundedBox, color };
  }

  const getControlPoints = (box: ImageCordinatesI) => {
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

  const getMousePosition = (e: React.MouseEvent | MouseEvent) => {
    const canvas = overlayCanvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    return { x, y };
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
            onMouseUp={handleMouseUp}
            onMouseMove={handleCanvasMouseMove}
          ></canvas>
        </>
      )}
    </section>
  );
}
