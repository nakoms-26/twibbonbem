"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// Fungsi helper untuk menyimpan file secara lokal
async function saveFile(file: File, folder: string): Promise<string> {
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const timestamp = Date.now();
  const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
  const filename = `${timestamp}-${safeName}`;
  const uploadDir = path.join(process.cwd(), "public", "uploads", folder);
  
  // Pastikan direktori ada
  try {
    await mkdir(uploadDir, { recursive: true });
  } catch (e) {
    // Abaikan jika direktori sudah ada
  }

  const filepath = path.join(uploadDir, filename);
  await writeFile(filepath, buffer);
  
  return `/uploads/${folder}/${filename}`;
}

export async function createTwibbon(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session) {
    throw new Error("Unauthorized");
  }

  const title = formData.get("title") as string;
  const slug = formData.get("slug") as string;
  const description = formData.get("description") as string;
  const type = formData.get("type") as "IMAGE" | "VIDEO";
  const isActive = formData.get("isActive") === "on";

  const layerFile = formData.get("layerFile") as File;
  const thumbnailFile = formData.get("thumbnailFile") as File;

  if (!title || !slug || !layerFile.name || !thumbnailFile.name) {
    throw new Error("Semua field wajib diisi");
  }

  // Simpan file
  const layerUrl = await saveFile(layerFile, type === "VIDEO" ? "videos" : "images");
  const thumbnailUrl = await saveFile(thumbnailFile, "thumbnails");

  // Default config yang simpel
  const defaultConfig = {
    overlayType: type,
    chromaKey: type === "VIDEO" ? {
      color: [0.0, 1.0, 0.0],
      similarity: 0.1,
      smoothness: 0.08
    } : null,
    canvasSize: { width: 1080, height: 1080 }
  };

  await prisma.twibbon.create({
    data: {
      title,
      slug,
      description,
      type,
      overlayFile: layerUrl,
      thumbnail: thumbnailUrl,
      isActive,
      config: JSON.stringify(defaultConfig),
    }
  });

  revalidatePath("/admin/twibbons");
  revalidatePath("/admin/dashboard");
  redirect("/admin/twibbons");
}

export async function updateTwibbon(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session) {
    throw new Error("Unauthorized");
  }

  const id = formData.get("id") as string;
  const title = formData.get("title") as string;
  const slug = formData.get("slug") as string;
  const description = formData.get("description") as string;
  const type = formData.get("type") as "IMAGE" | "VIDEO";
  const isActive = formData.get("isActive") === "on";

  const layerFile = formData.get("layerFile") as File;
  const thumbnailFile = formData.get("thumbnailFile") as File;

  if (!id || !title || !slug) {
    throw new Error("Field esensial wajib diisi");
  }

  const existingTwibbon = await prisma.twibbon.findUnique({
    where: { id: parseInt(id) }
  });

  if (!existingTwibbon) {
    throw new Error("Twibbon tidak ditemukan");
  }

  // Update files ONLY if new files are provided
  let layerUrl = existingTwibbon.overlayFile;
  let thumbnailUrl = existingTwibbon.thumbnail;

  if (layerFile && layerFile.name && layerFile.size > 0) {
    layerUrl = await saveFile(layerFile, type === "VIDEO" ? "videos" : "images");
  }
  
  if (thumbnailFile && thumbnailFile.name && thumbnailFile.size > 0) {
    thumbnailUrl = await saveFile(thumbnailFile, "thumbnails");
  }

  await prisma.twibbon.update({
    where: { id: parseInt(id) },
    data: {
      title,
      slug,
      description,
      type,
      overlayFile: layerUrl,
      thumbnail: thumbnailUrl,
      isActive,
    }
  });

  revalidatePath("/admin/twibbons");
  revalidatePath("/admin/dashboard");
  revalidatePath(`/${slug}`);
  redirect("/admin/twibbons");
}

export async function deleteTwibbon(id: string) {
  const session = await getServerSession(authOptions);
  if (!session) {
    throw new Error("Unauthorized");
  }

  await prisma.twibbon.delete({
    where: { id: parseInt(id) }
  });

  revalidatePath("/admin/twibbons");
  revalidatePath("/admin/dashboard");
}
