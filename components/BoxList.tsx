"use client";

import { FaEye, FaEyeSlash, FaTrash } from "react-icons/fa";
import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Button,
  Divider,
  useDisclosure,
} from "@nextui-org/react";
import { useFileContext } from "@/app/providers";
import JSZip from "jszip";
import { useMemo } from "react";
import { BoxI, LabelI } from "@/app/providers/types";
import LabelEditor from "./LabelEditor";

export default function BoxList() {
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const {
    images,
    currentBoxes,
    labels,
    setCurrentBoxes,
    setLabels,
    setCurrentLabel,
  } = useFileContext();

  const handleLabelChange = (boxIndex: number, label: LabelI) => {
    setCurrentLabel(label);
    setCurrentBoxes((prevBoxes) => {
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
    setCurrentBoxes((prevBoxes) => {
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
          return { ...box, isVisible: !box.isVisible };
        }
        return box;
      });
    });
  };

  const handleDelete = (boxIndex: number) => {
    if (!currentBoxes) return;
    const boxToDelete = currentBoxes[boxIndex];
    setCurrentBoxes((prevBoxes) =>
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

  return (
    <section className="w-1/6 flex flex-col items-center bg-zinc-900 justify-between">
      <LabelEditor
        labels={labels}
        editLabels={isOpen}
        setLabels={setLabels}
        toggleEditLabels={onOpenChange}
      />
      <div className="w-full p-3 flex flex-col">
        <h2>Boxes</h2>
        {/* <p className="break-words">{JSON.stringify(currentBoxes)}</p> */}
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
        <Button className="w-full">Export Labels</Button>
      </div>
    </section>
  );
}
