"use client";

import React, { useEffect, useState } from "react";
import { AffiliateLandingMobile } from "./AffiliateLandingMobile";
import { AffiliateLandingWeb } from "@/components/web/landing/AffiliateLandingWeb";

export function AffiliateLandingContainer() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 768px)");
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  if (isMobile) {
    return <AffiliateLandingMobile />;
  }

  return <AffiliateLandingWeb />;
}
