import mongoose from "mongoose";
import ChatTicket from "@/models/ChatTicket";
import User from "@/models/User";
import CitizenNotification from "@/models/CitizenNotification";
import dbConnect from "@/lib/dbConnect";
import { requireAdminSession } from "@/lib/adminAuth";
import { sendTrackedEmail } from "@/lib/trackedEmail";
import { writeAuditLog } from "@/lib/writeAuditLog";

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

    const { id, status, sendEmail = true } = await request.json();
    if (!mongoose.Types.ObjectId.isValid(id) || !TICKET_STATUSES.includes(status)) {
      return Response.json({ error: "A valid ticket record and status are required." }, { status: 400 });
    }

    await dbConnect();
    const previousTicket = await ChatTicket.findById(id).select("status").lean();
    const ticket = await ChatTicket.findByIdAndUpdate(
      id,
      { status },
      { new: true, runValidators: true }
    ).lean();
    if (!ticket) return Response.json({ error: "Ticket not found." }, { status: 404 });

    if (previousTicket?.status !== ticket.status) {
      await writeAuditLog({
        session,
        action: 'Chat support ticket updated',
        entityType: 'chat-ticket',
        entityId: ticket._id.toString(),
        details: { ticketId: ticket.ticketId, status: ticket.status },
      });
      const user = await User.findOne({ email: ticket.userId }).select("_id").lean();
      if (user) {
        await CitizenNotification.create({
          userId: user._id,
          title: `Chat support ticket ${ticket.ticketId} ${ticket.status}`,
          message: `Your support ticket ${ticket.ticketId} is now ${ticket.status}.`,
          type: "message",
          relatedType: "chat-ticket",
          relatedId: ticket._id,
        });
        const emailDelivery = sendEmail ? await sendTrackedEmail({
          userId: user._id,
          category: "grievance",
          eventKey: `chat-ticket:${ticket._id}:${ticket.status}:${ticket.updatedAt.toISOString()}`,
          relatedType: "chat-ticket",
          relatedId: ticket._id,
          subject: `Support ticket ${ticket.ticketId}: ${ticket.status}`,
          text: `Your support ticket ${ticket.ticketId} for ${ticket.service} is now ${ticket.status}. Sign in to the Chiutahara Portal to view the latest details.`,
          allowWithoutPreference: true,
        }) : { status: 'disabled' };
        return Response.json({ ticket, emailDelivery });
      }
    }

    return Response.json({ ticket, emailDelivery: { status: 'not-needed' } });
  } catch (error) {
    console.error("Failed to update chatbot ticket:", error);
    return Response.json({ error: "Failed to update ticket status." }, { status: 500 });
  }
}
