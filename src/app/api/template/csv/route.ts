import { NextResponse } from "next/server";

export async function GET() {
  const headers = ["sku", "name", "price", "quantityKind"];
  const csv = headers.join(",") + "\n";
  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": "attachment; filename=inventory-template.csv",
    },
  });
}


