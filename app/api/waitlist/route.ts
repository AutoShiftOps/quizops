import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import * as Sentry from '@sentry/nextjs';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isValidUrl(value: string): boolean {
  return /^https?:\/\//i.test(value);
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const email = typeof body.email === 'string' ? body.email.trim() : '';
  const websiteUrl = typeof body.websiteUrl === 'string' ? body.websiteUrl.trim() : '';

  if (name.length < 2) {
    return NextResponse.json(
      { error: 'invalid_name', message: 'Please enter your full name.' },
      { status: 400 }
    );
  }
  if (!EMAIL_RE.test(email)) {
    return NextResponse.json(
      { error: 'invalid_email', message: 'Please enter a valid email address.' },
      { status: 400 }
    );
  }
  if (websiteUrl && !isValidUrl(websiteUrl)) {
    return NextResponse.json(
      { error: 'invalid_url', message: 'Website URL must start with http:// or https://' },
      { status: 400 }
    );
  }

  const { error: insertError } = await supabaseAdmin.from('waitlist').insert({
    name,
    email,
    website_url: websiteUrl || null,
    tier: 'pro',
    source: 'pricing',
  });

  if (insertError) {
    if (insertError.code === '23505') {
      return NextResponse.json(
        { error: 'already_on_waitlist', message: 'You are already on the waitlist!' },
        { status: 409 }
      );
    }
    console.error('[waitlist] insert failed:', insertError.message, insertError.code);
    Sentry.captureException(new Error(insertError.message), {
      tags: { operation: 'waitlistInsert', code: insertError.code },
    });
    return NextResponse.json(
      { error: 'server_error', message: 'Something went wrong. Please try again.' },
      { status: 500 }
    );
  }

  const { count } = await supabaseAdmin
    .from('waitlist')
    .select('*', { count: 'exact', head: true });

  // Email failures shouldn't fail the signup itself — the row is already
  // saved, which is the part that matters. Each send is caught
  // independently so an admin-notification failure can't also swallow the
  // user's own auto-reply (or vice versa).
  if (process.env.RESEND_API_KEY) {
    const resend = new Resend(process.env.RESEND_API_KEY);

    try {
      await resend.emails.send({
        from: 'QuizOps <onboarding@resend.dev>',
        to: process.env.ADMIN_EMAIL || 'admin@autoshiftops.com',
        subject: `New Pro waitlist signup: ${name}`,
        html: `
          <h2>New Pro Waitlist Signup</h2>
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Website:</strong> ${websiteUrl || 'Not provided'}</p>
          <p><strong>Total on waitlist:</strong> ${count}</p>
          <p><strong>Time:</strong> ${new Date().toISOString()}</p>
          <hr/>
          <p>Reply directly to this email to reach them.</p>
        `,
        replyTo: email,
      });
    } catch (err) {
      console.error('[waitlist] admin notification email failed:', err);
      Sentry.captureException(err, { tags: { operation: 'waitlistAdminEmail' } });
    }

    try {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://quiz.autoshiftops.com';
      await resend.emails.send({
        from: 'Sudhakar from QuizOps <onboarding@resend.dev>',
        to: email,
        subject: 'You are on the QuizOps Pro waitlist!',
        html: `
          <div style="font-family:system-ui,sans-serif;max-width:480px;margin:0 auto;padding:32px 24px">
            <img src="${appUrl}/favicon.svg" width="40" height="40" style="border-radius:8px;margin-bottom:20px"/>

            <h2 style="font-size:22px;font-weight:700;color:#18181B;margin-bottom:8px">
              You are on the list, ${name}!
            </h2>

            <p style="color:#71717A;font-size:15px;line-height:1.6;margin-bottom:16px">
              Thanks for joining the QuizOps Pro waitlist. You are number
              <strong style="color:#3E7BFA">${count}</strong> on the list.
            </p>

            <p style="color:#71717A;font-size:15px;line-height:1.6;margin-bottom:16px">
              When Pro launches, you will be the first to know — and the first to get early
              access pricing.
            </p>

            <p style="color:#71717A;font-size:15px;line-height:1.6;margin-bottom:24px">
              In the meantime, you can use QuizOps free — up to 3 published quizzes, no credit
              card required.
            </p>

            <a href="${appUrl}/dashboard"
              style="display:inline-block;padding:12px 24px;background:#3E7BFA;color:#fff;
              text-decoration:none;border-radius:8px;font-weight:600;font-size:14px">
              Start for free →
            </a>

            <hr style="border:none;border-top:1px solid #E4E4E7;margin:32px 0"/>

            <p style="color:#A1A1AA;font-size:12px">
              — Sudhakar Sajja, Builder of QuizOps
              <br/>
              <a href="https://autoshiftops.com" style="color:#3E7BFA">autoshiftops.com</a>
            </p>
          </div>
        `,
      });
    } catch (err) {
      console.error('[waitlist] auto-reply email failed:', err);
      Sentry.captureException(err, { tags: { operation: 'waitlistAutoReply' } });
    }
  } else {
    console.error('[waitlist] RESEND_API_KEY not configured — skipping notification emails');
  }

  return NextResponse.json({ success: true, count, message: 'You are on the waitlist!' });
}
