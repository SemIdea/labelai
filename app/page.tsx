"use client";

import { Button } from "@nextui-org/react";
import { useEffect, useState } from "react";
import { useFileContext } from "./providers";
import { Card, CardBody } from "@nextui-org/react";
import { useRouter } from "next/navigation";

export default function Page() {
  const [dropImagesUi, setDropImagesUi] = useState(false);
  const [ignoreReload, setIgnoreReload] = useState(false);
  const { handleImageUpload, images } = useFileContext();
  const router = useRouter();

  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (ignoreReload || images.length > 0) {
        event.preventDefault();
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [images, ignoreReload]);

  const goToEdit = () => {
    setIgnoreReload(true);
    router.push("/edit");
  };

  return (
    <main className="bg-zinc-900 w-screen h-screen flex justify-center items-center">
      {!dropImagesUi ? (
        <Button
          size="lg"
          onClick={() => {
            setDropImagesUi(true);
          }}
        >
          Get Started!
        </Button>
      ) : (
        <div className="flex flex-col gap-3">
          <Card radius="md" className="w-96 h-64 bg-zinc-700">
            <CardBody
              className="flex justify-center items-center cursor-pointer"
              onClick={() => document.getElementById("fileInput")?.click()}
            >
              <input
                type="file"
                multiple
                onChange={handleImageUpload}
                style={{ display: "none" }}
                id="fileInput"
              />
              {(images.length == 0 && (
                <>
                  <h2 className="font-bold">Drop Images</h2>
                  <p>or</p>
                  <h2 className="font-bold">Click here to select them</h2>
                </>
              )) || (
                <h2 className="font-bold">{images.length} Images loaded!</h2>
              )}
            </CardBody>
          </Card>

          <Button
            size="lg"
            radius="md"
            fullWidth
            isDisabled={images.length == 0}
            onClick={goToEdit}
          >
            Object Detection
          </Button>
        </div>
      )}
    </main>
  );
}
