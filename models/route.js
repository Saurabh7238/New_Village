import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import AuditLog from '@/models/AuditLog';
import User from '@/models/User';

export async function POST(req) {
  await dbConnect();
  const { uniqueId, serviceType, details } = await req.json();

  // 1. Verify the Unique ID exists
  const user = await User.findOne({ uniqueId: uniqueId?.toUpperCase() });
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized: Invalid Unique ID' }, { status: 401 });
  }

  // 2. Perform service logic (e.g., save application to a 'Requests' collection)
  const allowedServices = ['AADHAAR_UPDATE', 'AADHAAR_CREATE', 'BIRTH_CERT', 'DEATH_CERT', 'APPOINTMENT'];
  
  if (!allowedServices.includes(serviceType.toUpperCase())) {
    return NextResponse.json({ error: 'Invalid service request' }, { status: 400 });
  }

  // 3. Create Audit Trail
  await AuditLog.create({
    uniqueId: user.uniqueId,
    action: `SERVICE_REQUEST_${serviceType.toUpperCase()}`,
    details: { ...details, ip: req.headers.get('x-forwarded-for') }
  });

  return NextResponse.json({ 
    success: true, 
    message: `${serviceType} request submitted successfully.`,
    referenceId: `REF-${Math.random().toString(36).substr(2, 9).toUpperCase()}`
  });
}