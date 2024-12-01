"use client";

import { FaEye, FaEyeSlash, FaTrash } from "react-icons/fa";
import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Button,
  Divider,
} from "@nextui-org/react";
import { Box, Label, useFileContext } from "@/app/providers";
import JSZip from "jszip";

export default function BoxList({
  currentBoxes,
  boxes,
  setBoxes,
  labels,
  setEditLabels,
  imageCoordinates,
}: {
  currentBoxes: Box[] | null;
  boxes: Box[];
  setBoxes: React.Dispatch<React.SetStateAction<Box[]>>;
  labels: Label[];
  setEditLabels: () => void;
  imageCoordinates: {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
  } | null; // Allow null
}) {
  const { images } = useFileContext();

  const handleLabelChange = (boxIndex: number, label: Label) => {
    setBoxes((prevBoxes) => {
      return prevBoxes.map((box) => {
        // Find the matching box by comparing all properties
        if (
          currentBoxes &&
          currentBoxes[boxIndex] &&
          box.imageId === currentBoxes[boxIndex].imageId &&
          box.cords.x1 === currentBoxes[boxIndex].cords.x1 &&
          box.cords.y1 === currentBoxes[boxIndex].cords.y1 &&
          box.cords.x2 === currentBoxes[boxIndex].cords.x2 &&
          box.cords.y2 === currentBoxes[boxIndex].cords.y2
        ) {
          return { ...box, labelId: label.id };
        }
        return box;
      });
    });
  };

  const handleVisibilityToggle = (boxIndex: number) => {
    setBoxes((prevBoxes) => {
      return prevBoxes.map((box) => {
        if (
          currentBoxes &&
          currentBoxes[boxIndex] &&
          box.imageId === currentBoxes[boxIndex].imageId &&
          box.cords.x1 === currentBoxes[boxIndex].cords.x1 &&
          box.cords.y1 === currentBoxes[boxIndex].cords.y1 &&
          box.cords.x2 === currentBoxes[boxIndex].cords.x2 &&
          box.cords.y2 === currentBoxes[boxIndex].cords.y2
        ) {
          return { ...box, visible: !box.visible };
        }
        return box;
      });
    });
  };

  const handleDelete = (boxIndex: number) => {
    if (!currentBoxes) return;
    const boxToDelete = currentBoxes[boxIndex];
    setBoxes((prevBoxes) =>
      prevBoxes.filter(
        (box) =>
          box.imageId !== boxToDelete.imageId ||
          box.cords.x1 !== boxToDelete.cords.x1 ||
          box.cords.y1 !== boxToDelete.cords.y1 ||
          box.cords.x2 !== boxToDelete.cords.x2 ||
          box.cords.y2 !== boxToDelete.cords.y2
      )
    );
  };

  const exportLabels = () => {
    if (!currentBoxes || !imageCoordinates) return;

    const zip = new JSZip();
    const boxesByImage: { [key: string]: Box[] } = {};

    boxes.forEach((box) => {
      console.log(box.imageId);

      const imageName = images.find((image) => image.id === box.imageId)?.name || "unknown";
      if (!boxesByImage[imageName]) {
        boxesByImage[imageName] = [];
      }
      boxesByImage[imageName].push(box);
    });

    Object.keys(boxesByImage).forEach((imageName) => {
      const relativeBoxes = boxesByImage[imageName].map((box) => {
        const relativeX1 =
          (box.cords.x1 - imageCoordinates.x1) / (imageCoordinates.x2 - imageCoordinates.x1);
        const relativeY1 =
          (box.cords.y1 - imageCoordinates.y1) / (imageCoordinates.y2 - imageCoordinates.y1);
        const relativeX2 =
          (box.cords.x2 - imageCoordinates.x1) / (imageCoordinates.x2 - imageCoordinates.x1);
        const relativeY2 =
          (box.cords.y2 - imageCoordinates.y1) / (imageCoordinates.y2 - imageCoordinates.y1);

        return {
          ...box,
          cords: {
            x1: relativeX1,
            y1: relativeY1,
            x2: relativeX2,
            y2: relativeY2,
          },
        };
      });

      const yoloFormat = relativeBoxes
        .map((box) => {
          const label = labels.find((label) => label.id === box.labelId);
          if (!label) return null;

          const xCenter = (box.cords.x1 + box.cords.x2) / 2;
          const yCenter = (box.cords.y1 + box.cords.y2) / 2;
          const width = box.cords.x2 - box.cords.x1;
          const height = box.cords.y2 - box.cords.y1;

          return `${label.id - 1} ${xCenter} ${yCenter} ${width} ${height}`;
        })
        .filter(Boolean)
        .join("\n");

      zip.file(`${imageName}.txt`, yoloFormat);
    });

    const labelsContent = labels.map((label) => `${label.name}`).join("\n");
    zip.file("labels.txt", labelsContent);

    zip.generateAsync({ type: "blob" }).then((content: Blob) => {
      const url = URL.createObjectURL(content);
      const a = document.createElement("a");
      a.href = url;
      a.download = "labels.zip";
      a.click();
      URL.revokeObjectURL(url);
    });
  };

  return (
    <section className="w-1/6 flex flex-col items-center bg-zinc-900">
      <div className="w-full h-1/2 p-3 flex flex-col gap-3">
        <h2>Boxes</h2>
        <ul className="flex flex-col gap-3">
          {currentBoxes &&
            currentBoxes.map((box, index) => (
              <li
                key={index}
                className="flex justify-between items-center bg-black bg-opacity-20 p-2 rounded-lg relative"
              >
                <div
                  className="size-5 rounded-full"
                  style={{
                    backgroundColor:
                      box.labelId !== null
                        ? `#${labels[box.labelId - 1].color}`
                        : "#ffffff",
                  }}
                ></div>

                <Dropdown>
                  <DropdownTrigger className="cursor-pointer">
                    {box.labelId !== null
                      ? String(labels[box.labelId - 1].name)
                      : `Select Label`}
                  </DropdownTrigger>
                  <DropdownMenu>
                    {labels.map((label) => (
                      <DropdownItem
                        key={label.id}
                        onClick={() => handleLabelChange(index, label)}
                      >
                        {label.name}
                      </DropdownItem>
                    ))}
                  </DropdownMenu>
                </Dropdown>
                <div className="flex gap-3">
                  <span
                    className="text-lg cursor-pointer active:opacity-50"
                    onClick={() => handleVisibilityToggle(index)}
                  >
                    {box.visible ? <FaEye /> : <FaEyeSlash />}
                  </span>
                  <span
                    className="text-lg text-danger cursor-pointer active:opacity-50"
                    onClick={() => handleDelete(index)}
                  >
                    <FaTrash />
                  </span>
                </div>
              </li>
            ))}
        </ul>
      </div>
      <Divider />
      <div className="w-full h-1/2 p-4">
        <Button onClick={setEditLabels}>Edit Labels</Button>
        <Button onClick={exportLabels} className="mt-2">
          Export Labels
        </Button>
      </div>
    </section>
  );
}
