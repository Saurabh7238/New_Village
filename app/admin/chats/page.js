"use client";

import { useEffect, useState } from "react";
import { MessageCircle, X } from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function AdminChats() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [list, setList] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [msgs, setMsgs] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch list of chats
  useEffect(() => {
    if (status !== "authenticated" || session?.user?.role !== "admin") return;

    const fetchList = async () => {
      try {
        const res = await fetch("/api/admin/chats");
        if (res.ok) {
          const data = await res.json();
          setList(data);
        }
      } catch (error) {
        console.error("Failed to fetch chats:", error);
      }
    };

    fetchList();
    const interval = setInterval(fetchList, 3000);
    return () => clearInterval(interval);
  }, [status, session?.user?.role]);

  // Auth check
  if (status === "loading") {
    return <div className="p-8 text-center">Loading...</div>;
  }

  if (status === "unauthenticated" || session?.user?.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center p-8 bg-gray-50 dark:bg-gray-900 text-red-500">
        Access Denied. You must be an admin to view this page.
      </div>
    );
  }

  // Open chat conversation
  const openChat = async (userId) => {
    setSelectedUser(userId);
    setLoading(true);
    try {
      const res = await fetch("/api/admin/chats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      if (res.ok) {
        const data = await res.json();
        setMsgs(data);
      }
    } catch (error) {
      console.error("Failed to fetch conversation:", error);
    } finally {
      setLoading(false);
    }
  };

  const getWardInfo = () => {
    const wardMsg = msgs.find((m) => m.ward);
    return wardMsg?.ward ? `Ward ${wardMsg.ward}` : "No Ward";
  };

  const getTicketInfo = () => {
    const ticketMsg = msgs.find((m) => m.ticket);
    return ticketMsg?.ticket || "No Ticket";
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-6">
          <MessageCircle className="w-8 h-8 text-green-700" />
          <h1 className="text-3xl font-bold text-green-700 dark:text-white">
            Live Chat Support
          </h1>
          <span className="ml-auto bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-semibold">
            {list.length} Active Chats
          </span>
        </div>

        <div className="flex gap-4 h-[70vh] bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
          {/* LEFT: Chat List */}
          <div className="w-1/3 border-r border-gray-200 dark:border-gray-700 overflow-y-auto">
            <div className="sticky top-0 p-4 bg-green-700 text-white font-bold">
              User Queries ({list.length})
            </div>

            {list.length === 0 ? (
              <div className="flex items-center justify-center h-full text-gray-400">
                No active chats
              </div>
            ) : (
              list.map((chat) => (
                <div
                  key={chat._id}
                  onClick={() => openChat(chat._id)}
                  className={`p-4 border-b border-gray-100 dark:border-gray-700 cursor-pointer transition ${
                    selectedUser === chat._id
                      ? "bg-green-100 dark:bg-green-900"
                      : "hover:bg-gray-50 dark:hover:bg-gray-700"
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-bold text-sm text-gray-900 dark:text-white">
                      {chat.ward ? `Ward ${chat.ward}` : "New User"}
                    </span>
                    <span className="text-xs bg-green-600 text-white px-2 py-0.5 rounded">
                      {chat.ticket || "Pending"}
                    </span>
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                    {chat.service || "Unknown"} • {chat.language || "en"}
                  </div>
                  <div className="text-sm text-gray-800 dark:text-gray-200 truncate mb-1">
                    {chat.lastMessage}
                  </div>
                  <div className="text-[11px] text-gray-400">
                    {new Date(chat.time).toLocaleString()} ({chat.totalMessages} msgs)
                  </div>
                </div>
              ))
            )}
          </div>

          {/* RIGHT: Chat View */}
          <div className="w-2/3 flex flex-col">
            {!selectedUser ? (
              <div className="flex-1 flex flex-col items-center justify-center text-gray-400 dark:text-gray-500">
                <MessageCircle className="w-16 h-16 mb-4 opacity-50" />
                <p>Select a user to view chat</p>
              </div>
            ) : (
              <>
                {/* Chat Header */}
                <div className="p-4 bg-slate-900 text-white font-bold flex justify-between items-center border-b border-slate-700">
                  <div>
                    <div>{selectedUser}</div>
                    <div className="text-xs font-normal text-slate-300">
                      {getWardInfo()} • Ticket: {getTicketInfo()}
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedUser(null)}
                    className="p-1 hover:bg-slate-800 rounded"
                  >
                    <X size={20} />
                  </button>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50 dark:bg-gray-900">
                  {loading ? (
                    <div className="text-center text-gray-400">Loading...</div>
                  ) : msgs.length === 0 ? (
                    <div className="text-center text-gray-400">No messages</div>
                  ) : (
                    msgs.map((msg, idx) => (
                      <div
                        key={idx}
                        className={`max-w-[70%] p-3 rounded-lg text-sm ${
                          msg.sender === "user"
                            ? "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 ml-auto text-gray-900 dark:text-white"
                            : "bg-green-600 text-white mr-auto"
                        }`}
                      >
                        <div className="whitespace-pre-wrap">{msg.message}</div>
                        <div className={`text-[11px] mt-1 ${
                          msg.sender === "user"
                            ? "text-gray-400 dark:text-gray-500"
                            : "text-green-100"
                        }`}>
                          {new Date(msg.createdAt).toLocaleTimeString()}
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Footer */}
                <div className="p-3 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 text-center text-xs text-gray-500 dark:text-gray-400">
                  ✅ Gram Pradhan dwara mark kiya gaya - Auto-generated ticket
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
