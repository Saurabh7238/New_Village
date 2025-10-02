let notifications = [
  { id: 1, title: "Gram Sabha Meeting", description: "Meeting on 25th Sept 2025 at Panchayat Bhawan." },
  { id: 2, title: "Health Camp", description: "Free health camp on 1st Oct 2025 at PHC." }
];

export async function GET() {
  return Response.json(notifications);
}

export async function POST(req) {
  const body = await req.json();
  const newId = notifications.length ? Math.max(...notifications.map(n => n.id)) + 1 : 1;
  const newNotification = { id: newId, ...body };
  notifications.push(newNotification);
  return Response.json(newNotification, { status: 201 });
}

export async function DELETE(req) {
  const { id } = await req.json();
  notifications = notifications.filter(n => n.id !== id);
  return Response.json({ success: true });
}