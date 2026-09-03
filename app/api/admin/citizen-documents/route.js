import { NextResponse } from 'next/server';
import connectDB from '@/lib/dbConnect';
import User from '@/models/User';
import CitizenDocument from '@/models/CitizenDocument';
import { requireAdminSession } from '@/lib/adminAuth';
import { writeAuditLog } from '@/lib/writeAuditLog';
import { dataUrlByteLength, hasDocumentQuota, MAX_USER_DOCUMENT_BYTES } from '@/lib/documentQuota';

const ALLOWED = new Set(['application/pdf', 'image/jpeg', 'image/png']);
const MAX_LENGTH = 5 * 1024 * 1024 * 1.37;

function validDocument(document) {
  return document && typeof document.fileName === 'string' && typeof document.fileUrl === 'string' && ALLOWED.has(document.mimeType) && document.fileUrl.startsWith(`data:${document.mimeType};base64,`) && document.fileUrl.length <= MAX_LENGTH;
}

export async function GET(request) {
  const session = await requireAdminSession();
  if (!session) return NextResponse.json({ message: 'Admin access required.' }, { status: 403 });
  await connectDB();
  const { searchParams } = new URL(request.url);
  const search = String(searchParams.get('search') || '').trim();
  const users = await User.find(search ? { $or: [
    { uniqueId: new RegExp(search, 'i') },
    { name: new RegExp(search, 'i') },
    { fatherName: new RegExp(search, 'i') },
    { phone: search },
    { aadhaarLast4: search.replace(/\D/g, '').slice(-4) },
  ] } : {}).select('name fatherName phone aadhaarLast4 uniqueId village ward').limit(50).lean();
  const userIds = users.map((user) => user._id);
  const documents = await CitizenDocument.find({ userId: { $in: userIds } }).sort({ createdAt: -1 }).select('userId applicationId documentType fileName mimeType uploadedBy source createdAt').lean();
  const byUser = Object.groupBy ? Object.groupBy(documents, (document) => document.userId.toString()) : documents.reduce((result, document) => { const key = document.userId.toString(); (result[key] ||= []).push(document); return result; }, {});
  return NextResponse.json({ users: users.map((user) => ({ ...user, id: user._id.toString(), documents: (byUser[user._id.toString()] || []).map((document) => ({ ...document, id: document._id.toString(), viewUrl: `/api/admin/citizen-documents/${document._id}` })) })) });
}

export async function POST(request) {
  const session = await requireAdminSession();
  if (!session) return NextResponse.json({ message: 'Admin access required.' }, { status: 403 });
  try {
    const { userId, documentType, documents = [] } = await request.json();
    if (!userId || !Array.isArray(documents) || !documents.length || documents.length > 5 || documents.some((document) => !validDocument(document))) return NextResponse.json({ message: 'Provide up to five valid PDF, JPG, or PNG documents.' }, { status: 400 });
    await connectDB();
    const user = await User.findById(userId).select('_id');
    if (!user) return NextResponse.json({ message: 'Citizen not found.' }, { status: 404 });
    const existing = await CitizenDocument.find({ userId }).select('fileUrl').lean();
    const existingBytes = existing.reduce((total, document) => total + dataUrlByteLength(document.fileUrl), 0);
    if (!hasDocumentQuota(existingBytes, documents)) return NextResponse.json({ message: `This citizen's document vault cannot exceed ${MAX_USER_DOCUMENT_BYTES / (1024 * 1024)} MB.` }, { status: 400 });
    const saved = await CitizenDocument.insertMany(documents.map((document) => ({ userId, documentType: String(documentType || 'Official document').slice(0, 100), fileName: document.fileName.slice(0, 150), fileUrl: document.fileUrl, mimeType: document.mimeType, uploadedBy: 'admin', source: 'admin-vault' })));
    await writeAuditLog({ session, action: 'Admin documents uploaded', details: { userId: userId.toString(), count: saved.length, source: 'admin-vault' } });
    return NextResponse.json({ message: 'Document(s) added to citizen vault.', count: saved.length });
  } catch (error) {
    console.error('Citizen document upload error:', error);
    return NextResponse.json({ message: 'Unable to save documents.' }, { status: 400 });
  }
}
