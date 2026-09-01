import Chat from "@/models/Chat";
import dbConnect from "@/lib/dbConnect";

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
  "Birth Certificate": ["birth", "janm", "certificate"],
  "Death Certificate": ["death", "mrityu"],
  "Aadhaar / Voter List": ["aadhaar", "voter"],
  "Raise Query": ["query", "shikayat", "complaint", "raise"],
  "Track Query": ["track", "status"],
  "Road / Nali / Light": ["road", "sadak", "light", "nali", "bijli"],
  "Water / Handpump / Tank": ["pani", "nal", "handpump", "well", "tank", "water"],
  "School / Hospital": ["school", "health", "hospital"],
  "Budget / Funds": ["budget", "fund", "nidhi"],
};

const REPLIES = {
  ask_ward: {
    hi: (s) => `${s} नोट किया। Ward No. क्या है?`,
    en: (s) => `${s} noted. Ward No.?`,
    hinglish: (s) => `${s} note kiya. Ward No. kya hai?`,
  },
  final: {
    hi: (w, s, id) =>
      `✅ दर्ज हो गया। सेवा: ${s}, वार्ड: ${w}, टिकट: #${id}\n\nग्राम प्रधान द्वारा यह मार्क कर लिया गया है, जल्द से जल्द समाधान करने की कोशिश होगी। 🙏`,
    en: (w, s, id) =>
      `✅ Registered. Service: ${s}, Ward: ${w}, Ticket: #${id}\n\nIt has been marked by Gram Pradhan, we will try to resolve it as soon as possible. 🙏`,
    hinglish: (w, s, id) =>
      `✅ Darj ho gaya. Seva: ${s}, Ward: ${w}, Ticket: #${id}\n\nGram Pradhan dwara ye mark kar liya gaya hai, jaldi se jaldi samadhan karne ki koshish hogi. 🙏`,
  },
  start: {
    hi: "नमस्ते! 🙏 कृपया अपनी सेवा चुनें।",
    en: "Hello! 👋 Please select a service.",
    hinglish: "Namaste! 🙏 Kripya apni seva chunein.",
  },
};

function detectLang(text) {
  // Check for Hindi Unicode (Devanagari script)
  const hindiUnicode = /[\u0900-\u097F]/g;
  if (hindiUnicode.test(text)) {
    return "hi";
  }

  // Check for Hinglish keywords
  const hinglishKeywords = ["hai", "kya", "nahi", "chahiye", "pani", "sadak", "ward"];
  const lowerText = text.toLowerCase();
  if (hinglishKeywords.some((kw) => lowerText.includes(kw))) {
    return "hinglish";
  }

  return "en";
}

function detectService(text) {
  const lowerText = text.toLowerCase();
  for (const [service, keywords] of Object.entries(SERVICE_MAP)) {
    if (keywords.some((kw) => lowerText.includes(kw))) {
      return service;
    }
  }
  return null;
}

function generateTicket() {
  const timestamp = Date.now().toString().slice(-6);
  return `CHT-${timestamp}`;
}

export async function POST(req) {
  try {
    await dbConnect();
    const { userId, message } = await req.json();

    if (!userId || !message) {
      return Response.json(
        { error: "Missing userId or message" },
        { status: 400 }
      );
    }

    // Detect language and service
    const lang = detectLang(message);
    const service = detectService(message);

    // Save user message
    await Chat.create({
      userId,
      sender: "user",
      message,
      language: lang,
      service,
    });

    // Get last bot message to check if we're waiting for ward
    const lastBotMessage = await Chat.findOne({
      userId,
      sender: "bot",
    }).sort({ createdAt: -1 });

    let reply = "";
    let quickReplies = [];
    let botData = { language: lang, service };

    if (
      lastBotMessage &&
      lastBotMessage.message.includes("Ward No.")
    ) {
      // Extract ward number
      const wardMatch = message.match(/\d+/);
      if (wardMatch) {
        const ward = parseInt(wardMatch[0]);
        const ticket = generateTicket();
        reply = REPLIES.final[lang](ward, service || lastBotMessage.service, ticket);
        botData = { ...botData, ward, ticket };
        quickReplies = ALL_SERVICES;
      } else {
        reply = REPLIES.ask_ward[lang](service || "Request");
        quickReplies = [
          "Ward 1",
          "Ward 2",
          "Ward 3",
          "Ward 4",
          "Ward 5",
          "Ward 6",
          "Ward 7",
          "Ward 8",
          "Ward 9",
          "Ward 10",
        ];
      }
    } else if (service) {
      reply = REPLIES.ask_ward[lang](service);
      quickReplies = [
        "Ward 1",
        "Ward 2",
        "Ward 3",
        "Ward 4",
        "Ward 5",
        "Ward 6",
        "Ward 7",
        "Ward 8",
        "Ward 9",
        "Ward 10",
      ];
    } else {
      reply =
        lang === "hi"
          ? REPLIES.start.hi
          : lang === "hinglish"
          ? REPLIES.start.hinglish
          : REPLIES.start.en;
      quickReplies = ALL_SERVICES;
    }

    // Save bot reply
    await Chat.create({
      userId,
      sender: "bot",
      message: reply,
      ...botData,
    });

    return Response.json({ reply, lang, quickReplies });
  } catch (error) {
    console.error("Chat API error:", error);
    return Response.json(
      { error: "Failed to process chat" },
      { status: 500 }
    );
  }
}

export async function GET(req) {
  try {
    await dbConnect();
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return Response.json(
        { error: "Missing userId" },
        { status: 400 }
      );
    }

    const messages = await Chat.find({ userId })
      .sort({ createdAt: 1 })
      .limit(100);

    return Response.json(messages);
  } catch (error) {
    console.error("Chat GET error:", error);
    return Response.json(
      { error: "Failed to fetch messages" },
      { status: 500 }
    );
  }
}
