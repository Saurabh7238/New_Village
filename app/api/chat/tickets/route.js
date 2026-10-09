import ChatTicket from "@/models/ChatTicket";
import dbConnect from "@/lib/dbConnect";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return Response.json({ error: "Please sign in to track your ticket." }, { status: 401 });
    }

    const ticketId = new URL(request.url).searchParams.get("ticketId")?.trim().toUpperCase();
    if (!ticketId || ticketId.length > 40) {
      return Response.json({ error: "Enter a valid ticket number." }, { status: 400 });
    }

    await dbConnect();
    const ticket = await ChatTicket.findOne({ ticketId, userId: session.user.email })
      .select("ticketId service ward status createdAt updatedAt")
      .lean();
    if (!ticket) {
      return Response.json({ error: "Ticket not found for your account." }, { status: 404 });
    }

    return Response.json({ ticket });
  } catch (error) {
    console.error("Failed to track chatbot ticket:", error);
    return Response.json({ error: "Unable to check ticket status right now." }, { status: 500 });
  }
}
