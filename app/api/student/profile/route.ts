import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const student = await prisma.student.findFirst({
      where: {
        userId: session.user.id,
      },
      include: {
        academicYear: {
          select: {
            id: true,
            name: true,
            startDate: true,
            endDate: true,
          },
        },
        academicUnit: {
          select: {
            id: true,
            name: true,
            type: true,
            parent: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        course: {
          select: {
            id: true,
            name: true,
          },
        },
        school: {
          select: {
            id: true,
            name: true,
            address: true,
            city: true,
            state: true,
            pincode: true,
            phone: true,
            email: true,
            logo: true,
          },
        },
        guardians: {
          include: {
            guardian: true,
          },
        },
      },
    });

    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    // Populate class and section fields if not already set
    if (student.academicUnit && (!student.classId || !student.sectionId)) {
      const updateData: any = {};
      
      if (student.academicUnit.parent) {
        // Student is in a section
        updateData.classId = student.academicUnit.parent.id;
        updateData.className = student.academicUnit.parent.name;
        updateData.sectionId = student.academicUnit.id;
        updateData.sectionName = student.academicUnit.name;
      } else {
        // Student is directly in a class (no section)
        updateData.classId = student.academicUnit.id;
        updateData.className = student.academicUnit.name;
        updateData.sectionId = null;
        updateData.sectionName = null;
      }

      // Update the student record
      await prisma.student.update({
        where: { id: student.id },
        data: updateData,
      });

      // Update the local object
      Object.assign(student, updateData);
    }

    return NextResponse.json({
      success: true,
      data: student,
    });
  } catch (error) {
    console.error("Error fetching student profile:", error);
    return NextResponse.json(
      { error: "Failed to fetch profile" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const student = await prisma.student.findFirst({
      where: {
        userId: session.user.id,
      },
    });

    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    const body = await req.json();
    const {
      firstName,
      middleName,
      lastName,
      dateOfBirth,
      gender,
      bloodGroup,
      nationality,
      email,
      phone,
      emergencyContact,
      address,
      city,
      state,
      pincode,
    } = body;

    // Prepare update data
    const updateData: any = {
      email: email || student.email,
      phone: phone || student.phone,
      emergencyContact: emergencyContact || student.emergencyContact,
      address: address || student.address,
      city: city || student.city,
      state: state || student.state,
      pincode: pincode || student.pincode,
      nationality: nationality || student.nationality,
    };

    // Allow updating personal information
    if (firstName) {
      updateData.firstName = firstName;
      // Recalculate fullName
      updateData.fullName = `${firstName} ${middleName || ''} ${lastName || student.lastName}`.trim().replace(/\s+/g, ' ');
    }
    if (middleName !== undefined) updateData.middleName = middleName || null;
    if (lastName) {
      updateData.lastName = lastName;
      // Recalculate fullName
      updateData.fullName = `${firstName || student.firstName} ${middleName || ''} ${lastName}`.trim().replace(/\s+/g, ' ');
    }
    if (dateOfBirth) updateData.dateOfBirth = new Date(dateOfBirth);
    if (gender) updateData.gender = gender;
    if (bloodGroup !== undefined) updateData.bloodGroup = bloodGroup || null;

    // Only allow students to update specific fields
    const updatedStudent = await prisma.student.update({
      where: {
        id: student.id,
      },
      data: updateData,
      include: {
        academicYear: {
          select: {
            id: true,
            name: true,
            startDate: true,
            endDate: true,
          },
        },
        academicUnit: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
        course: {
          select: {
            id: true,
            name: true,
          },
        },
        school: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: updatedStudent,
      message: "Profile updated successfully",
    });
  } catch (error) {
    console.error("Error updating student profile:", error);
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    );
  }
}
