export interface SendEmailParams {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

export interface SendEmailResult {
  skipped?: boolean;
  reason?: string;
  error?: string;
  id?: string; // Standard success payload ID returned by Resend
  [key: string]: any;
}

export async function sendEmail({ to, subject, text, html }: SendEmailParams): Promise<SendEmailResult> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;

  if (!apiKey || !from || !to) {
    return { skipped: true, reason: 'Email is not configured' };
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from,
        to,
        subject,
        text,
        html: html || text
      })
    });

    if (!res.ok) {
      const body = await res.text();
      console.error('Resend email failed:', res.status, body);
      return { skipped: false, error: body };
    }

    return await res.json();
  } catch (e: any) {
    console.error('sendEmail() failed:', e);
    return { skipped: false, error: e.message };
  }
}