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
import { Box, Label } from "@/app/providers";
import { HexColorPicker } from "react-colorful";
import { useState, useEffect } from "react";

export default function BoxList({
  currentBoxes,
  boxes,
  setBoxes,
  labels,
  setEditLabels,
}: {
  currentBoxes: Box[] | null;
  boxes: Box[];
  setBoxes: React.Dispatch<React.SetStateAction<Box[]>>;
  labels: Label[];
  setEditLabels: () => void;
}) {
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
                    {labels.map((label, i) => (
                      <DropdownItem
                        key={i}
                        onClick={() => {
                          var prevBoxes = [...boxes];
                          prevBoxes[index].labelId = label.id;
                          setBoxes(prevBoxes);
                        }}
                      >
                        {label.name}
                      </DropdownItem>
                    ))}
                  </DropdownMenu>
                </Dropdown>
                <div className="flex gap-3">
                  <span
                    className="text-lg cursor-pointer active:opacity-50"
                    onClick={() => {
                      const prevBoxes = [...boxes];
                      prevBoxes[index].visible = !box.visible;
                      setBoxes(prevBoxes);
                    }}
                  >
                    {box.visible ? <FaEye /> : <FaEyeSlash />}
                  </span>
                  <span
                    className="text-lg text-danger cursor-pointer active:opacity-50"
                    onClick={() => {
                      setBoxes((prevBoxes) =>
                        prevBoxes.filter((_, i) => i !== index)
                      );
                    }}
                  >
                    <FaTrash />
                  </span>
                </div>
              </li>
            ))}
        </ul>
      </div>
      <p className="w-full break-words">{JSON.stringify(boxes)}</p>
      <Divider />
      <div className="w-full h-1/2 p-4">
        <Button onClick={setEditLabels}>Edit Labels</Button>
      </div>
    </section>
  );
}
