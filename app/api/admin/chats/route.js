import dbConnect from "@/lib/dbConnect";
import Chat from "@/models/Chat";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== "admin") {
      return Response.json(
        { error: "Unauthorized. Admin access only." },
        { status: 403 }
      );
    }

    await dbConnect();

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

    return Response.json(chats);
  } catch (error) {
    console.error("Failed to fetch chats:", error);
    return Response.json({ error: "Failed to fetch chats" }, { status: 500 });
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
    return Response.json(messages);
  } catch (error) {
    console.error("Failed to fetch conversation:", error);
    return Response.json(
      { error: "Failed to fetch conversation" },
      { status: 500 }
    );
  }
}
