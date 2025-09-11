"use client";

import dynamic from "next/dynamic";

export const DynamicEditor = dynamic(() => import("./editor"), { ssr: false });
