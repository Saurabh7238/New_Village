import mongoose from "mongoose";
import ChatTicket from "@/models/ChatTicket";
import User from "@/models/User";
import dbConnect from "@/lib/dbConnect";
import { requireAdminSession } from "@/lib/adminAuth";

const TICKET_STATUSES = ["Open", "In Progress", "Resolved", "Closed"];

export async function GET() {
  try {
    const session = await requireAdminSession();
    if (!session) return Response.json({ error: "Admin access required." }, { status: 403 });

    await dbConnect();
    const tickets = await ChatTicket.find().sort({ createdAt: -1 }).limit(500).lean();
    const emails = [...new Set(tickets.map((ticket) => ticket.userId).filter(Boolean))];
    const users = await User.find({ email: { $in: emails } }, { email: 1, name: 1 }).lean();
    const userNames = new Map(users.map((user) => [user.email, user.name]));

    return Response.json(tickets.map(({ userId, ...ticket }) => ({
      ...ticket,
      userName: userNames.get(userId) || "Resident",
    })));
  } catch (error) {
    console.error("Failed to fetch chatbot tickets:", error);
    return Response.json({ error: "Failed to fetch chatbot tickets." }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    const session = await requireAdminSession();
    if (!session) return Response.json({ error: "Admin access required." }, { status: 403 });

    const { id, status } = await request.json();
    if (!mongoose.Types.ObjectId.isValid(id) || !TICKET_STATUSES.includes(status)) {
      return Response.json({ error: "A valid ticket record and status are required." }, { status: 400 });
    }

    await dbConnect();
    const ticket = await ChatTicket.findByIdAndUpdate(
      id,
      { status },
      { new: true, runValidators: true }
    ).lean();
    if (!ticket) return Response.json({ error: "Ticket not found." }, { status: 404 });

    return Response.json(ticket);
  } catch (error) {
    console.error("Failed to update chatbot ticket:", error);
    return Response.json({ error: "Failed to update ticket status." }, { status: 500 });
  }
}
