import { redirect } from 'next/navigation';

// Redirect /verify/[code] to /verify?code=[code]
export default async function VerifyCodePage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  redirect(`/verify?code=${code}`);
}
