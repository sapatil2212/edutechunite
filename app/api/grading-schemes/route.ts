import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const gradingSchemeSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  boundaries: z.array(
    z.object({
      grade: z.string(),
      minPercentage: z.number().min(0).max(100),
      maxPercentage: z.number().min(0).max(100),
      gradePoint: z.number().optional(),
      description: z.string().optional(),
    })
  ),
  isDefault: z.boolean().optional(),
  applicableExamTypes: z.array(z.string()).optional(),
});

// POST - Create grading scheme
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!["SUPER_ADMIN", "SCHOOL_ADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const validatedData = gradingSchemeSchema.parse(body);

    // If setting as default, unset other defaults
    if (validatedData.isDefault) {
      await prisma.gradingScheme.updateMany({
        where: {
          schoolId: session.user.schoolId!,
          isDefault: true,
        },
        data: {
          isDefault: false,
        },
      });
    }

    const scheme = await prisma.gradingScheme.create({
      data: {
        schoolId: session.user.schoolId!,
        name: validatedData.name,
        description: validatedData.description,
        boundaries: validatedData.boundaries,
        isDefault: validatedData.isDefault || false,
        applicableExamTypes: validatedData.applicableExamTypes || null,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Grading scheme created successfully",
      data: scheme,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Error creating grading scheme:", error);
    return NextResponse.json(
      { error: "Failed to create grading scheme" },
      { status: 500 }
    );
  }
}

// GET - Fetch grading schemes
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const activeOnly = searchParams.get("activeOnly") === "true";

    const where: any = {
      schoolId: session.user.schoolId,
    };

    if (activeOnly) {
      where.isActive = true;
    }

    const schemes = await prisma.gradingScheme.findMany({
      where,
      orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
    });

    return NextResponse.json({
      success: true,
      data: schemes,
    });
  } catch (error) {
    console.error("Error fetching grading schemes:", error);
    return NextResponse.json(
      { error: "Failed to fetch grading schemes" },
      { status: 500 }
    );
  }
}
