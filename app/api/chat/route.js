import { randomBytes } from "node:crypto";
import Chat from "@/models/Chat";
import ChatTicket from "@/models/ChatTicket";
import dbConnect from "@/lib/dbConnect";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

const ALL_SERVICES = [
  "Birth Certificate",
  "Death Certificate",
  "Aadhaar / Voter List",
  "Raise Query",
  "Track Query",
  "Road / Nali / Light",
  "Water / Handpump / Tank",
  "School / Hospital",
  "Budget / Funds",
];

const SERVICE_MAP = {
  "Birth Certificate": ["birth", "janm"],
  "Death Certificate": ["death", "mrityu"],
  "Aadhaar / Voter List": ["aadhaar", "voter"],
  "Raise Query": ["query", "shikayat", "complaint", "raise"],
  "Track Query": ["track", "status"],
  "Road / Nali / Light": ["road", "sadak", "light", "nali", "bijli"],
  "Water / Handpump / Tank": ["pani", "nal", "handpump", "well", "tank", "water"],
  "School / Hospital": ["school", "health", "hospital"],
  "Budget / Funds": ["budget", "fund", "nidhi"],
};

const WARD_REPLIES = {
  hi: (service) => `${service} चुनी गई। कृपया अपना वार्ड नंबर 1 से 20 के बीच दर्ज करें।`,
  en: (service) => `${service} selected. Please enter your ward number (1–20).`,
  hinglish: (service) => `${service} select ho gaya. Apna ward number 1 se 20 ke beech batayein.`,
};

const FINAL_REPLIES = {
  hi: (ticketId) =>
    `✅ आपका अनुरोध दर्ज हो गया है। टिकट: #${ticketId}\nआपके अनुरोध की स्थिति देखने के लिए नीचे “Track this ticket” चुनें।`,
  en: (ticketId) =>
    `✅ Your request has been registered. Ticket: #${ticketId}\nUse “Track this ticket” below to check its status.`,
  hinglish: (ticketId) =>
    `✅ Aapka request register ho gaya. Ticket: #${ticketId}\nStatus dekhne ke liye neeche “Track this ticket” chunein.`,
};

const START_REPLIES = {
  hi: "नमस्ते! 🙏 कृपया नीचे से सेवा चुनें।",
  en: "Hello! Please choose a service below, or type what you need help with.",
  hinglish: "Namaste! 🙏 Neeche se seva chunein ya apni zaroorat likhein.",
};

const BACK_REPLIES = {
  hi: "ठीक है, कृपया सही सेवा चुनें।",
  en: "No problem. Please choose the correct service.",
  hinglish: "Koi baat nahi. Sahi seva chunein.",
};

const INVALID_WARD_REPLIES = {
  hi: "कृपया 1 से 20 के बीच केवल वार्ड नंबर दर्ज करें। अनुरोध अभी दर्ज नहीं हुआ है।",
  en: "Please enter a ward number from 1 to 20. Your request has not been submitted yet.",
  hinglish: "Kripya 1 se 20 ke beech ward number likhein. Request abhi submit nahi hua hai.",
};

function detectLang(text) {
  if (/[\u0900-\u097F]/.test(text)) return "hi";
  const lowerText = text.toLowerCase();
  if (["hai", "kya", "nahi", "chahiye", "pani", "sadak", "ward"].some((word) => lowerText.includes(word))) {
    return "hinglish";
  }
  return "en";
}

function detectService(text) {
  const normalizedText = text.trim().toLowerCase();
  const exactMatch = Object.keys(SERVICE_MAP).find(
    (service) => normalizedText === service.toLowerCase()
  );
  if (exactMatch) return exactMatch;

  for (const [service, keywords] of Object.entries(SERVICE_MAP)) {
    if (keywords.some((keyword) => normalizedText.includes(keyword))) {
      return service;
    }
  }
  return null;
}

function getWardOptions() {
  return [...Array(20)].map((_, index) => `Ward ${index + 1}`).concat("Back");
}

function newTicketId() {
  const date = new Date().toISOString().slice(0, 10).replaceAll("-", "");
  return `CHT-${date}-${randomBytes(3).toString("hex").toUpperCase()}`;
}

function getQuickReplies(flowStep) {
  if (flowStep === "ward") return getWardOptions();
  if (flowStep === "complete") return [];
  return ALL_SERVICES;
}

export async function POST(request) {
  let createdTicketId = null;
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return Response.json({ error: "Unauthorized. Please login to chat." }, { status: 401 });
    }

    const { message } = await request.json();
    if (typeof message !== "string" || !message.trim() || message.length > 500) {
      return Response.json({ error: "Enter a message of up to 500 characters." }, { status: 400 });
    }

    await dbConnect();
    const userId = session.user.email;
    const text = message.trim();
    const lang = detectLang(text);
    const isStartingNewRequest = /^start new request$/i.test(text);

    if (isStartingNewRequest) {
      const reply = START_REPLIES[lang];
      await Chat.create([
        { userId, sender: "user", message: text, language: lang, flowStep: "service" },
        { userId, sender: "bot", message: reply, language: lang, flowStep: "service" },
      ]);
      return Response.json({ reply, lang, quickReplies: ALL_SERVICES });
    }

    const lastBotMessage = await Chat.findOne({ userId, sender: "bot" })
      .sort({ createdAt: -1 })
      .lean();
    const flowStep = lastBotMessage?.flowStep || "service";
    const selectedService = detectService(text);

    let reply;
    let quickReplies = [];
    let botData = { language: lang, flowStep: "service" };
    let confirmation = null;

    if (flowStep === "ward") {
      if (/^(back|go back|change service)$/i.test(text)) {
        reply = BACK_REPLIES[lang];
        quickReplies = ALL_SERVICES;
        botData = { ...botData, flowStep: "service" };
      } else if (selectedService) {
        reply = WARD_REPLIES[lang](selectedService);
        quickReplies = getWardOptions();
        botData = { ...botData, service: selectedService, flowStep: "ward" };
      } else {
        const wardMatch = text.match(/^(?:ward\s*)?(\d{1,2})$/i);
        const ward = wardMatch ? Number(wardMatch[1]) : NaN;
        if (!Number.isInteger(ward) || ward < 1 || ward > 20) {
          reply = INVALID_WARD_REPLIES[lang];
          quickReplies = getWardOptions();
          botData = { ...botData, service: lastBotMessage.service, flowStep: "ward" };
        } else {
          const service = lastBotMessage.service;
          if (!service) {
            reply = START_REPLIES[lang];
            quickReplies = ALL_SERVICES;
            botData = { ...botData, flowStep: "service" };
          } else {
            let ticket;
            for (let attempt = 0; attempt < 3; attempt += 1) {
              try {
                ticket = await ChatTicket.create({ ticketId: newTicketId(), userId, service, ward });
                createdTicketId = ticket.ticketId;
                break;
              } catch (error) {
                if (error?.code !== 11000 || attempt === 2) throw error;
              }
            }
            reply = FINAL_REPLIES[lang](ticket.ticketId);
            botData = {
              ...botData,
              service,
              ward,
              ticket: ticket.ticketId,
              flowStep: "complete",
            };
            confirmation = {
              ticketId: ticket.ticketId,
              service,
              ward,
              status: ticket.status,
            };
          }
        }
      }
    } else if (selectedService) {
      reply = WARD_REPLIES[lang](selectedService);
      quickReplies = getWardOptions();
      botData = { ...botData, service: selectedService, flowStep: "ward" };
    } else {
      reply = START_REPLIES[lang];
      quickReplies = ALL_SERVICES;
      botData = { ...botData, flowStep: "service" };
    }

    await Chat.create([
      { userId, sender: "user", message: text, language: lang },
      { userId, sender: "bot", message: reply, ...botData },
    ]);

    return Response.json({ reply, lang, quickReplies, confirmation });
  } catch (error) {
    if (createdTicketId) {
      try {
        await ChatTicket.deleteOne({ ticketId: createdTicketId });
      } catch (rollbackError) {
        console.error("Failed to roll back incomplete chatbot ticket:", rollbackError);
      }
    }
    console.error("Chat API error:", error);
    return Response.json({ error: "Failed to process chat" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return Response.json({ error: "Unauthorized. Please login to view chat." }, { status: 401 });
    }

    await dbConnect();
    const userId = session.user.email;
    const messages = await Chat.find({ userId }).sort({ createdAt: -1 }).limit(100).lean();
    messages.reverse();
    const lastBotMessage = [...messages].reverse().find((message) => message.sender === "bot");
    const lastTicketMessage = [...messages].reverse().find((message) => message.ticket);
    const ticket = lastBotMessage?.flowStep === "complete" && lastTicketMessage
      ? await ChatTicket.findOne({ ticketId: lastTicketMessage.ticket, userId })
          .select("ticketId service ward status createdAt")
          .lean()
      : null;

    return Response.json({
      messages,
      quickReplies: getQuickReplies(lastBotMessage?.flowStep || "service"),
      confirmation: ticket,
    });
  } catch (error) {
    console.error("Chat GET error:", error);
    return Response.json({ error: "Failed to fetch messages" }, { status: 500 });
  }
}
