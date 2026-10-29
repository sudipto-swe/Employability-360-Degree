import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // Fetch all messages involving the current user
    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: userId },
          { receiverId: userId },
        ],
      },
      orderBy: {
        createdAt: "asc",
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            jobSeekerProfile: {
              select: { headline: true }
            },
            recruiterProfile: {
              select: { companyName: true }
            }
          }
        },
        receiver: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            jobSeekerProfile: {
              select: { headline: true }
            },
            recruiterProfile: {
              select: { companyName: true }
            }
          }
        }
      }
    });

    // Group messages by conversation (the other user's ID)
    const conversationsMap = new Map<string, any>();

    for (const msg of messages) {
      const isSender = msg.senderId === userId;
      const otherUser = isSender ? msg.receiver : msg.sender;
      if (!otherUser) continue;
      const otherUserId = otherUser.id;

      if (!conversationsMap.has(otherUserId)) {
        let label = otherUser.name || otherUser.email;
        let sublabel = "";
        if (otherUser.role === "RECRUITER") {
          sublabel = otherUser.recruiterProfile?.companyName || "Recruiter";
        } else {
          sublabel = otherUser.jobSeekerProfile?.headline || "Job Seeker";
        }

        conversationsMap.set(otherUserId, {
          id: otherUserId,
          name: label,
          sublabel: sublabel,
          role: otherUser.role,
          unread: 0,
          lastMessage: "",
          time: "",
          messages: [],
        });
      }

      const convo = conversationsMap.get(otherUserId);
      convo.messages.push({
        id: msg.id,
        senderId: msg.senderId,
        receiverId: msg.receiverId,
        content: msg.content,
        attachmentUrl: msg.attachmentUrl,
        attachmentName: msg.attachmentName,
        createdAt: msg.createdAt,
        isRead: msg.isRead,
      });

      convo.lastMessage = msg.content || (msg.attachmentName ? `📎 Attached: ${msg.attachmentName}` : "");
      convo.time = msg.createdAt.toISOString();
      if (msg.receiverId === userId && !msg.isRead) {
        convo.unread += 1;
      }
    }

    // Convert map to array and sort by latest message time
    const conversations = Array.from(conversationsMap.values()).sort(
      (a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()
    );

    return NextResponse.json({ success: true, conversations });
  } catch (error) {
    console.error("Failed to fetch messages:", error);
    return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { receiverId, content, applicationId, attachmentUrl, attachmentName } = await request.json();
    if (!receiverId || (!content?.trim() && !attachmentUrl)) {
      return NextResponse.json({ error: "Receiver and content/attachment are required" }, { status: 400 });
    }

    const message = await prisma.message.create({
      data: {
        senderId: session.user.id,
        receiverId,
        content: content?.trim() || "",
        applicationId: applicationId || null,
        attachmentUrl: attachmentUrl || null,
        attachmentName: attachmentName || null,
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          }
        },
        receiver: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          }
        }
      }
    });

    // Try to notify the receiver
    try {
      await prisma.notification.create({
        data: {
          userId: receiverId,
          type: "message",
          title: `New message from ${session.user.name || "User"}`,
          body: content.trim().length > 60 ? `${content.trim().slice(0, 60)}...` : content.trim(),
          link: session.user.role === "RECRUITER" ? "/dashboard/jobseeker/messages" : "/dashboard/recruiter/messages",
        }
      });
    } catch (notifErr) {
      console.error("Notification creation failed:", notifErr);
    }

    return NextResponse.json({ success: true, message }, { status: 201 });
  } catch (error) {
    console.error("Failed to send message:", error);
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { otherUserId } = await request.json();
    if (!otherUserId) {
      return NextResponse.json({ error: "Other user ID is required" }, { status: 400 });
    }

    await prisma.message.updateMany({
      where: {
        senderId: otherUserId,
        receiverId: session.user.id,
        isRead: false,
      },
      data: {
        isRead: true,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to mark messages as read:", error);
    return NextResponse.json({ error: "Failed to mark messages as read" }, { status: 500 });
  }
}
