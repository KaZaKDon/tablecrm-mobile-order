import { NextRequest, NextResponse } from "next/server";
import { mapOptionsFromResponse, tablecrmRequest } from "@/lib/tablecrm";

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json();

    if (!token) {
      return NextResponse.json({ message: "Token is required" }, { status: 400 });
    }

    const [
      organizationsResult,
      payboxesResult,
      warehousesResult,
      priceTypesResult,
    ] = await Promise.allSettled([
      tablecrmRequest<any>({ token, path: "/organizations/" }),
      tablecrmRequest<any>({ token, path: "/payboxes/" }),
      tablecrmRequest<any>({ token, path: "/warehouses/" }),
      tablecrmRequest<any>({ token, path: "/price_types/" }),
    ]);

    const organizations =
      organizationsResult.status === "fulfilled"
        ? mapOptionsFromResponse(organizationsResult.value)
        : [];

    const payboxes =
      payboxesResult.status === "fulfilled"
        ? mapOptionsFromResponse(payboxesResult.value)
        : [];

    const warehouses =
      warehousesResult.status === "fulfilled"
        ? mapOptionsFromResponse(warehousesResult.value)
        : [];

    const priceTypes =
      priceTypesResult.status === "fulfilled"
        ? mapOptionsFromResponse(priceTypesResult.value)
        : [];

    const errors = {
      organizations:
        organizationsResult.status === "rejected"
          ? String(organizationsResult.reason)
          : null,
      payboxes:
        payboxesResult.status === "rejected"
          ? String(payboxesResult.reason)
          : null,
      warehouses:
        warehousesResult.status === "rejected"
          ? String(warehousesResult.reason)
          : null,
      priceTypes:
        priceTypesResult.status === "rejected"
          ? String(priceTypesResult.reason)
          : null,
    };

    if (!organizations.length && !payboxes.length && !warehouses.length && !priceTypes.length) {
      return NextResponse.json(
        {
          message: "Не удалось загрузить справочники TableCRM",
          errors,
        },
        { status: 500 },
      );
    }

    return NextResponse.json({
      organizations,
      payboxes,
      warehouses,
      priceTypes,
      errors,
    });
  } catch (error) {
    console.error("META ROUTE ERROR:", error);

    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Failed to load meta" },
      { status: 500 },
    );
  }
}