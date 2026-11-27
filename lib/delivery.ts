import { isRiderZone } from "./kenya-counties";

export type Fulfillment = "PICKUP" | "DELIVERY" | "OWN_TRANSPORT";

export type DeliveryResolution = {
  deliveryMethod: "PICKUP" | "RIDER" | "COURIER";
  fee: number;
  allowCOD: boolean;
};

export function resolveDelivery(
  county: string | null,
  fulfillment: Fulfillment
): DeliveryResolution {
  if (fulfillment === "PICKUP") {
    return { deliveryMethod: "PICKUP", fee: 0, allowCOD: true };
  }

  if (fulfillment === "OWN_TRANSPORT") {
    return { deliveryMethod: "COURIER", fee: 100, allowCOD: false };
  }

  if (!county) {
    return { deliveryMethod: "COURIER", fee: 250, allowCOD: false };
  }

  if (isRiderZone(county)) {
    return { deliveryMethod: "RIDER", fee: 250, allowCOD: false };
  }

  return { deliveryMethod: "COURIER", fee: 250, allowCOD: false };
}
