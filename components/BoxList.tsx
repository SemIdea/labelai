"use client";

import { FaEye, FaEyeSlash, FaTrash } from "react-icons/fa";
import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Button,
  useDisclosure,
} from "@nextui-org/react";
import { useFileContext } from "@/app/providers";
import JSZip from "jszip";
import { BoxI, LabelI } from "@/app/providers/types";
import LabelEditor from "./labelEditor";

export default function BoxList() {
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const {
    images,
    setImages,
    currentBoxes,
    labels,
    setCurrentBoxes,
    setLabels,
    setCurrentLabel,
  } = useFileContext();

  const updateBoxes = (boxIndex: number, updateFn: (box: BoxI) => BoxI) => {
    setCurrentBoxes((prevBoxes) => {
      const newBoxes = prevBoxes.map((box, index) =>
        index === boxIndex ? updateFn(box) : box
      );

      const updatedImages = [...images];
      const imageIndex = images.findIndex(
        (image) => image.id === currentBoxes[boxIndex].imageId
      );
      if (imageIndex !== -1) {
        updatedImages[imageIndex].boxes = newBoxes;
        setImages(updatedImages);
      }
      return newBoxes;
    });
  };

  const handleLabelChange = (boxIndex: number, label: LabelI) => {
    setCurrentLabel(label);
    updateBoxes(boxIndex, (box) => ({
      ...box,
      labelId: labels.indexOf(label),
    }));
  };

  const handleVisibilityToggle = (boxIndex: number) => {
    updateBoxes(boxIndex, (box) => ({
      ...box,
      isVisible: !box.isVisible,
    }));
  };

  const handleDelete = (boxIndex: number) => {
    const boxToDelete = currentBoxes[boxIndex];
    const updatedBoxes = currentBoxes.filter((_, index) => index !== boxIndex);
    setCurrentBoxes(updatedBoxes);
    const updatedImages = [...images];
    const imageIndex = images.findIndex(
      (image) => image.id === boxToDelete.imageId
    );
    if (imageIndex !== -1) {
      updatedImages[imageIndex].boxes = updatedBoxes;
      setImages(updatedImages);
    }
  };

  const exportLabels = () => {
    const zip = new JSZip();

    zip.file(
      "labels.txt",
      labels.map((label, index) => `${index} ${label.name}`).join("\n")
    );

    images.forEach((image) => {
      let text = "";
      image.boxes.forEach((box) => {
        if (box.labelId === null) return;
        const label = labels[box.labelId];

        const xCenter = (box.cords.x1 + box.cords.x2) / 2 / image.width;
        const yCenter = (box.cords.y1 + box.cords.y2) / 2 / image.height;
        const width = (box.cords.x2 - box.cords.x1) / image.width;
        const height = (box.cords.y2 - box.cords.y1) / image.height;

        text += `${labels.indexOf(
          label
        )} ${xCenter} ${yCenter} ${width} ${height}\n`;
      });
      if (text === "") return;
      zip.file(`${image.name.split(".")[0]}.txt`, text);
    });

    zip.generateAsync({ type: "blob" }).then((content) => {
      const url = URL.createObjectURL(content);
      const a = document.createElement("a");
      a.href = url;
      a.download = "labels.zip";
      a.click();
    });
  };

  return (
    <section className="w-1/6 flex flex-col items-center bg-zinc-900 justify-between">
      <LabelEditor
        labels={labels}
        editLabels={isOpen}
        setLabels={setLabels}
        toggleEditLabels={onOpenChange}
      />
      <div className="w-full p-3 flex flex-col text-center">
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
                        ? `#${labels[box.labelId].color}`
                        : "#ffffff",
                  }}
                ></div>

                <Dropdown>
                  <DropdownTrigger className="cursor-pointer">
                    {box.labelId !== null
                      ? String(labels[box.labelId].name)
                      : `Select Label`}
                  </DropdownTrigger>
                  <DropdownMenu>
                    {labels.map((label) => (
                      <DropdownItem
                        key={labels.indexOf(label)}
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
                    {box.isVisible ? <FaEye /> : <FaEyeSlash />}
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
      <div className="w-full p-4 flex justify-between gap-3">
        <Button className="w-full" onClick={onOpen}>
          Edit Labels
        </Button>
        <Button className="w-full" onClick={exportLabels}>
          Export Labels
        </Button>
      </div>
    </section>
  );
}
