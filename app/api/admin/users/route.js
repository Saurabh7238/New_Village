import { NextResponse } from 'next/server';
import connectDB from '@/lib/dbConnect';
import User from '@/models/User';
import Application from '@/models/Application';
import Appointment from '@/models/Appointment';
import Query from '@/models/Query';
import CitizenDocument from '@/models/CitizenDocument';
import { requireAdminSession } from '@/lib/adminAuth';

export async function GET(request) {
  const session = await requireAdminSession();
  if (!session) return NextResponse.json({ message: 'Admin access required.' }, { status: 403 });

  await connectDB();
  const { searchParams } = new URL(request.url);
  const search = String(searchParams.get('search') || '').trim();
  const filter = search ? { $or: [
    { uniqueId: new RegExp(search, 'i') },
    { name: new RegExp(search, 'i') },
    { fatherName: new RegExp(search, 'i') },
    { email: new RegExp(search, 'i') },
    { phone: search },
    { aadhaarLast4: search.replace(/\D/g, '').slice(-4) },
  ] } : {};

  const users = await User.find(filter)
    .sort({ createdAt: -1 })
    .select('name fatherName email phone aadhaarLast4 uniqueId village ward address role status createdAt')
    .limit(100)
    .lean();
  const userIds = users.map((user) => user._id);
  const [applicationCounts, appointmentCounts, queryCounts, documentCounts] = await Promise.all([
    Application.aggregate([{ $match: { userId: { $in: userIds } } }, { $group: { _id: '$userId', count: { $sum: 1 } } }]),
    Appointment.aggregate([{ $match: { userId: { $in: userIds } } }, { $group: { _id: '$userId', count: { $sum: 1 } } }]),
    Query.aggregate([{ $match: { userId: { $in: userIds } } }, { $group: { _id: '$userId', count: { $sum: 1 } } }]),
    CitizenDocument.aggregate([{ $match: { userId: { $in: userIds } } }, { $group: { _id: '$userId', count: { $sum: 1 } } }]),
  ]);
  const countMap = (rows) => new Map(rows.map((row) => [String(row._id), row.count]));
  const counts = { applications: countMap(applicationCounts), appointments: countMap(appointmentCounts), queries: countMap(queryCounts), documents: countMap(documentCounts) };

  return NextResponse.json({ users: users.map((user) => ({
    ...user,
    id: user._id.toString(),
    aadhaar: user.aadhaarLast4 ? `XXXX-XXXX-${user.aadhaarLast4}` : 'Not available',
    counts: Object.fromEntries(Object.entries(counts).map(([key, map]) => [key, map.get(user._id.toString()) || 0])),
  })) });
}
