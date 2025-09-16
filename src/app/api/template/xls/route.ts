import { NextResponse } from "next/server";

// For simplicity, serve CSV but with .xls filename so Excel opens it.
export async function GET() {
  const headers = ["sku", "name", "cost", "price", "quantityKind"];
  const csv = headers.join(",") + "\n";
  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "application/vnd.ms-excel; charset=utf-8",
      "Content-Disposition": "attachment; filename=inventory-template.xls",
    },
  });
}


