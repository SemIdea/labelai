# LabelAi

A browser-based image labeling tool for the first phase of an ML pipeline: draw bounding
boxes, label them, and export **YOLO** annotations. It runs entirely client-side — nothing is
uploaded to a server.

## Built on makesense.ai

This project is a **study built on top of [makesense.ai](https://github.com/SkalskiP/make-sense)**
by **Piotr Skalski** (GPL-3.0). The upstream idea — a free, in-browser labeling tool — is kept,
and the app is reworked as a Next.js 14 + NextUI client. The original copyright and the GPL-3.0
license are retained: the upstream is credited, not claimed.

Upstream: <https://github.com/SkalskiP/make-sense> · Demo: <https://labelai-ivory.vercel.app>

## Features

- Upload and select images, all in the browser
- Draw, resize, move, show/hide and delete bounding boxes
- Create and manage labels
- Export annotations in YOLO format (a `.zip` built with JSZip)

## Stack

- Next.js 14 (App Router) + TypeScript
- NextUI + Tailwind CSS
- HTML Canvas for the annotation surface
- JSZip + CRC-32 for the YOLO export

## Run locally

1. Install dependencies

   ```bash
   yarn install
   # or: npm install
   ```

2. Start the dev server

   ```bash
   yarn dev
   # or: npm run dev
   ```

   Open <http://localhost:3000>.

## License

[GPL-3.0](./LICENSE) — Copyright (c) 2019-present, Piotr Skalski. Modifications by Bruno
(SemIdeia).
