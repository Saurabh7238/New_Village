import mongoose from "mongoose";

const ChatTicketSchema = new mongoose.Schema(
  {
    ticketId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    userId: {
      type: String,
      required: true,
      index: true,
    },
    service: {
      type: String,
      required: true,
    },
    ward: {
      type: Number,
      required: true,
      min: 1,
      max: 20,
    },
    status: {
      type: String,
      enum: ["Open", "In Progress", "Resolved", "Closed"],
      default: "Open",
      index: true,
    },
  },
  { timestamps: true }
);

ChatTicketSchema.index({ userId: 1, createdAt: -1 });

const ChatTicket =
  mongoose.models.ChatTicket || mongoose.model("ChatTicket", ChatTicketSchema);

export default ChatTicket;
