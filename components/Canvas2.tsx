import { Box, Label } from "@/app/providers";
import { useEffect, useRef, useState } from "react";

export default function Canvas2({
  selectedImage,
  boxes,
  currentBoxes,
  setImageCoordinates,
  // onMouseDown,
  // onMouseMove,
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
  const [info, setInfo] = useState<any[]>([]);
  const canvasParentRef = useRef<HTMLDivElement>(null);

  // cordinates
  const [imageCords, setImageCords] = useState({
    x1: 0,
    y1: 0,
    x2: 0,
    y2: 0,
  });

  useEffect(() => {
    const backgroundCanvas = backgroundCanvasRef.current;
    const overlayCanvas = overlayCanvasRef.current;
    if (!backgroundCanvas || !overlayCanvas) return;
    const ctx = backgroundCanvas.getContext("2d");
    const ctx2 = overlayCanvas.getContext("2d");
    if (!ctx || !ctx2) return;

    const canvasWidth = canvasParentRef.current?.clientWidth || 600;
    const canvasHeight = canvasParentRef.current?.clientHeight || 600;

    backgroundCanvas.width = canvasWidth;
    backgroundCanvas.height = canvasHeight;
    overlayCanvas.width = canvasWidth;
    overlayCanvas.height = canvasHeight;

    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    ctx2.clearRect(0, 0, canvasWidth, canvasHeight);
  }, []);

  useEffect(() => {
    const backgroundCanvas = backgroundCanvasRef.current;
    if (!backgroundCanvas) return;
    const ctx = backgroundCanvas.getContext("2d");
    if (!ctx) return;

    const canvasWidth = backgroundCanvas.width;
    const canvasHeight = backgroundCanvas.height;

    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    if (selectedImage) {
      const image = new window.Image();
      image.src = selectedImage;

      image.onload = () => {
        const imageHeight = image.height;
        const imageWidth = image.width;

        setInfo([imageHeight, imageWidth]);

        // center image
        let drawWidth, drawHeight, offsetX, offsetY;
        const imageAspectRatio = imageWidth / imageHeight;
        const canvasAspectRatio = canvasWidth / canvasHeight;

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

        setImageCords({
          x1: offsetX,
          y1: offsetY,
          x2: offsetX + drawWidth,
          y2: offsetY + drawHeight,
        });
        ctx.drawImage(image, offsetX, offsetY, drawWidth, drawHeight);
      };
    }
  }, [selectedImage]);

  const onMouseDown = (e: React.MouseEvent) => {
    const rect = overlayCanvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;


  };

  const onMouseMove = (e: React.MouseEvent) => {};

  return (
    <section
      className="w-4/6 flex justify-center items-center relative"
      ref={canvasParentRef}
    >
      <p className="absolute top-0 left-0">{JSON.stringify(info)}</p>
      <canvas className="absolute" ref={backgroundCanvasRef} />
      <canvas
        className="absolute"
        ref={overlayCanvasRef}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
      />
    </section>
  );
}
