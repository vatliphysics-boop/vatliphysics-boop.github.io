import authored from "@/data/unified-question-bank.json";

export const dynamic = "force-static";

export async function GET() {
  return Response.json({ questions: authored });
}
