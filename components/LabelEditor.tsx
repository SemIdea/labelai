"use client";

import { useFileContext } from "@/app/providers";
import { ImageI, LabelI } from "@/app/providers/types";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Input,
  Button,
} from "@nextui-org/react";
import { useEffect, useState, useMemo } from "react";
import { HexColorPicker } from "react-colorful";

function generateDistinctColor(existingColors: string[]): string {
  const getRandomColor = () =>
    Math.floor(Math.random() * 16777215)
      .toString(16)
      .padStart(6, "0");
  let newColor = getRandomColor();
  while (existingColors.includes(newColor)) {
    newColor = getRandomColor();
  }
  return newColor;
}

export default function LabelEditor({
  editLabels,
  labels,
  setLabels,
  toggleEditLabels,
}: {
  editLabels: boolean;
  labels: LabelI[];
  setLabels: React.Dispatch<React.SetStateAction<LabelI[]>>;
  toggleEditLabels: () => void;
}) {
  const {
    currentBoxes,
    currentLabel,
    images,
    setCurrentLabel,
    setCurrentBoxes,
    setImages,
  } = useFileContext();
  const [colorPickerIndex, setColorPickerIndex] = useState<number | null>(null);
  const memoizedLabels = useMemo(() => labels, [labels]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        colorPickerIndex !== null &&
        !(event.target as HTMLElement).closest(".color-picker")
      ) {
        setColorPickerIndex(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [colorPickerIndex]);
  return (
    <Modal
      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-zinc-900 overflow-visible"
      isOpen={editLabels}
      onOpenChange={toggleEditLabels}
    >
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader>Edit Labels</ModalHeader>
            <ModalBody>
              {!labels.length ? (
                <p>No labels available</p>
              ) : (
                <ul className="flex flex-col gap-3">
                  {memoizedLabels.map((label, index) => (
                    <li
                      key={index}
                      className="flex justify-between gap-3 items-center relative"
                    >
                      <div
                        className="size-5 rounded-full cursor-pointer"
                        style={{ backgroundColor: `#${label.color}` }}
                        onClick={() => setColorPickerIndex(index)}
                      ></div>
                      {colorPickerIndex === index && (
                        <div
                          className="absolute z-10 color-picker"
                          style={{ top: "100%", left: 0 }}
                        >
                          <HexColorPicker
                            color={`#${label.color}`}
                            onChange={(color) => {
                              const updatedLabels = [...labels];
                              updatedLabels[index].color = color.slice(1);
                              setLabels(updatedLabels);
                            }}
                          />
                        </div>
                      )}
                      <Input
                        value={label.name}
                        onChange={(e) => {
                          const value = e.target.value;
                          setLabels((prevLabels) => {
                            const updatedLabels = [...prevLabels];
                            updatedLabels[index].name = value;
                            return updatedLabels;
                          });
                        }}
                      />
                      <Button
                        onClick={() => {
                          var image: ImageI | null = null;
                          const updatedBoxes = currentBoxes.map((box) => {
                            if (box.labelId === labels.indexOf(label)) {
                              const currentImage = images.find(
                                (image) => image.id === box.imageId
                              );
                              if (currentImage) image = currentImage;
                              return { ...box, labelId: null };
                            }

                            return box;
                          });
                          if (image) {
                            const updatedImages = [...images];
                            updatedImages[images.indexOf(image)].boxes =
                              updatedBoxes;
                            setImages(updatedImages);
                          }
                          setCurrentBoxes(updatedBoxes);
                          if (currentLabel === label) setCurrentLabel(null);
                          setLabels((prevLabels) =>
                            prevLabels.filter((_, i) => i !== index)
                          );
                        }}
                      >
                        Delete
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </ModalBody>
            <ModalFooter>
              <Button
                onClick={() =>
                  setLabels((prevLabels) => {
                    const existingColors = prevLabels.map(
                      (label) => label.color
                    );
                    const newColor = generateDistinctColor(existingColors);
                    return [
                      ...prevLabels,
                      {
                        name: "New Label",
                        color: newColor,
                      },
                    ];
                  })
                }
              >
                Add Label
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
