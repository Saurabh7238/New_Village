import dbConnect from "@/lib/dbConnect";
import Chat from "@/models/Chat";
import User from "@/models/User";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

function normalizeUserDetail(user) {
  if (!user) return null;

  const aadhaar = user.aadhaarLast4
    ? `XXXX-XXXX-${user.aadhaarLast4}`
    : "Aadhaar not available";

  return {
    name: user.name || "Unknown User",
    email: user.email || "",
    phone: user.phone || "N/A",
    aadhaar,
  };
}

export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== "admin") {
      return Response.json(
        { error: "Unauthorized. Admin access only." },
        { status: 403 }
      );
    }

    await dbConnect();

    const { searchParams } = new URL(req.url);
    const search = (searchParams.get("search") || "").trim().toLowerCase();

    const chats = await Chat.aggregate([
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: "$userId",
          lastMessage: { $first: "$message" },
          service: { $first: "$service" },
          ward: { $first: "$ward" },
          ticket: { $first: "$ticket" },
          language: { $first: "$language" },
          time: { $first: "$createdAt" },
          totalMessages: { $sum: 1 },
        },
      },
      { $sort: { time: -1 } },
    ]);

    const emails = chats.map((chat) => chat._id).filter(Boolean);
    const users = await User.find(
      { email: { $in: emails } },
      { name: 1, email: 1, phone: 1, aadhaarLast4: 1 }
    ).lean();

    const userMap = new Map(
      users.map((user) => [String(user.email).toLowerCase(), normalizeUserDetail(user)])
    );

    const enrichedChats = chats.map((chat) => {
      const chatUser = userMap.get(String(chat._id).toLowerCase());
      return {
        ...chat,
        userName: chatUser?.name || "Unknown User",
        userPhone: chatUser?.phone || "N/A",
        userAadhaar: chatUser?.aadhaar || "Aadhaar not available",
      };
    });

    const filteredChats = !search
      ? enrichedChats
      : enrichedChats.filter((chat) => {
          const userName = (chat.userName || "").toLowerCase();
          const userPhone = (chat.userPhone || "").toLowerCase();
          const userEmail = String(chat._id || "").toLowerCase();
          return (
            userName.includes(search) ||
            userPhone.includes(search) ||
            userEmail.includes(search)
          );
        });

    return Response.json(filteredChats);
  } catch (error) {
    console.error("Failed to fetch chats:", error);
    return Response.json({ error: "Failed to fetch chats" }, { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== "admin") {
      return Response.json(
        { error: "Unauthorized. Admin access only." },
        { status: 403 }
      );
    }

    await dbConnect();
    const { userId } = await req.json();

    if (!userId) {
      return Response.json(
        { error: "Missing userId" },
        { status: 400 }
      );
    }

    const result = await Chat.deleteMany({ userId });

    return Response.json({
      success: true,
      deletedCount: result.deletedCount || 0,
    });
  } catch (error) {
    console.error("Failed to delete chat:", error);
    return Response.json(
      { error: "Failed to delete chat" },
      { status: 500 }
    );
  }
}

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== "admin") {
      return Response.json(
        { error: "Unauthorized. Admin access only." },
        { status: 403 }
      );
    }

    await dbConnect();
    const { userId } = await req.json();

    if (!userId) {
      return Response.json(
        { error: "Missing userId" },
        { status: 400 }
      );
    }

    const messages = await Chat.find({ userId }).sort({ createdAt: 1 });
    const userProfile = await User.findOne(
      { email: userId },
      { name: 1, email: 1, phone: 1, aadhaarLast4: 1 }
    ).lean();

    return Response.json({
      messages,
      user: normalizeUserDetail(userProfile),
    });
  } catch (error) {
    console.error("Failed to fetch conversation:", error);
    return Response.json(
      { error: "Failed to fetch conversation" },
      { status: 500 }
    );
  }
}
