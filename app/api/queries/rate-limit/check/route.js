import { NextResponse } from 'next/server';
import { checkQueryRateLimit, formatRateLimitMessage } from '@/lib/rateLimit';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const mobile = searchParams.get('mobile');

    if (!mobile) {
      return NextResponse.json(
        { message: 'Mobile number is required.' },
        { status: 400 }
      );
    }

    const rateLimitInfo = await checkQueryRateLimit(mobile);

    return NextResponse.json({
      ...rateLimitInfo,
      message: formatRateLimitMessage(rateLimitInfo)
    }, { status: 200 });
  } catch (error) {
    console.error('Rate Limit Check Error:', error);
    return NextResponse.json(
      { message: 'Failed to check rate limit.' },
      { status: 500 }
    );
  }
}
