import { prisma } from "@/lib/prisma";
import { PostJobForm } from "./post-job-form";

export default async function PostJobPage() {
  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" }
  });

  return <PostJobForm categories={categories} />;
}
