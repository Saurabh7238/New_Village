const FAST2SMS_URL = "https://www.fast2sms.com/dev/bulkV2";

function buildOtpMessage(otp) {
  return `Your Gram Panchayat Portal OTP is ${otp}. Valid for 5 minutes. Do not share with anyone.`;
}

function parseFast2SmsError(data) {
  return (
    data.message ||
    data.msg ||
    (Array.isArray(data.errors) ? data.errors.join(", ") : null) ||
    "SMS delivery failed"
  );
}

async function callFast2Sms(apiKey, body) {
  const response = await fetch(FAST2SMS_URL, {
    method: "POST",
    headers: {
      authorization: apiKey,
      accept: "*/*",
      "content-type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok || data.return === false) {
    throw new Error(parseFast2SmsError(data));
  }

  return { sent: true, provider: "fast2sms", requestId: data.request_id };
}

export async function sendOtpSms(phone, otp) {
  const apiKey = process.env.FAST2SMS_API_KEY;

  if (!apiKey) {
    return { sent: false, reason: "missing_api_key" };
  }

  const route = process.env.FAST2SMS_ROUTE || "q";

  if (route === "otp") {
    try {
      return await callFast2Sms(apiKey, {
        variables_values: String(otp),
        route: "otp",
        numbers: phone,
      });
    } catch (error) {
      const needsVerification = /website verification|OTP Message menu/i.test(
        error.message
      );

      if (!needsVerification) {
        throw error;
      }

      return callFast2Sms(apiKey, {
        message: buildOtpMessage(otp),
        route: "q",
        numbers: phone,
      });
    }
  }

  return callFast2Sms(apiKey, {
    message: buildOtpMessage(otp),
    route: "q",
    numbers: phone,
  });
}
