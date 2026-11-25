"use client";

import { useEffect, useRef } from "react";
import { trackEvent } from "@/lib/meta-pixel";
import { trackTikTokEvent } from "@/lib/tiktok-pixel";

interface OrderPurchaseTrackerProps {
  orderId: string;
  total: number;
  contentIds: string[];
  numItems?: number;
}

export default function OrderPurchaseTracker({
  orderId,
  total,
  contentIds,
  numItems,
}: OrderPurchaseTrackerProps) {
  const hasTracked = useRef(false);

  useEffect(() => {
    if (hasTracked.current || !orderId) return;
    hasTracked.current = true;

    // Meta Pixel Purchase
    trackEvent(
      "Purchase",
      {
        content_ids: contentIds,
        content_type: "product",
        value: total,
        currency: "KES",
        num_items: numItems || contentIds.length,
        order_id: orderId,
      },
      orderId
    );

    // TikTok Pixel PlaceAnOrder & CompletePayment
    const tiktokPayload = {
      contents: contentIds.map((id) => ({
        content_id: id,
        content_type: "product",
      })),
      value: total,
      currency: "KES",
      order_id: orderId,
      num_items: numItems || contentIds.length,
    };

    trackTikTokEvent("PlaceAnOrder", tiktokPayload, orderId);
    trackTikTokEvent("CompletePayment", tiktokPayload, orderId);
  }, [orderId, total, contentIds, numItems]);

  return null;
}
