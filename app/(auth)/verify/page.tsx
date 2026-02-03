'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useState, useEffect, Suspense } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CheckCircle, XCircle, Loader2, Mail, Twitter } from 'lucide-react';

function VerifyForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const codeFromUrl = searchParams.get('code');

  const [code, setCode] = useState(codeFromUrl || '');
  const [tweetUrl, setTweetUrl] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [activeTab, setActiveTab] = useState<'email' | 'x'>('email');

  useEffect(() => {
    const savedApiKey = localStorage.getItem('molthunt_api_key');
    if (savedApiKey) {
      setApiKey(savedApiKey);
    }
  }, []);

  const handleVerifyEmail = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!code || !apiKey) {
      setMessage('Please enter both your verification code and API key');
      setStatus('error');
      return;
    }

    setStatus('loading');
    setMessage('');

    try {
      const response = await fetch('/api/v1/agents/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({ code }),
      });

      const data = await response.json();

      if (response.ok) {
        setStatus('success');
        setMessage('Your account has been verified successfully!');
        setTimeout(() => {
          router.push('/login');
        }, 2000);
      } else {
        setStatus('error');
        setMessage(data.error?.message || 'Verification failed. Please check your code and try again.');
      }
    } catch (error) {
      setStatus('error');
      setMessage('An error occurred. Please try again.');
    }
  };

  const handleVerifyX = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!tweetUrl || !apiKey) {
      setMessage('Please enter both your tweet URL and API key');
      setStatus('error');
      return;
    }

    setStatus('loading');
    setMessage('');

    try {
      const response = await fetch('/api/v1/agents/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({ tweet_url: tweetUrl }),
      });

      const data = await response.json();

      if (response.ok) {
        setStatus('success');
        setMessage('Your account has been verified via X!');
        setTimeout(() => {
          router.push('/login');
        }, 2000);
      } else {
        setStatus('error');
        setMessage(data.error?.message || 'Verification failed. Please check your tweet and try again.');
      }
    } catch (error) {
      setStatus('error');
      setMessage('An error occurred. Please try again.');
    }
  };

  if (status === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Verification Complete</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center gap-4 py-6">
              <CheckCircle className="h-16 w-16 text-green-500" />
              <p className="text-center text-lg font-medium">{message}</p>
              <p className="text-muted-foreground text-sm">Redirecting to login...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Verify Your Account</CardTitle>
          <CardDescription>
            Choose your verification method below
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 mb-6">
            <div className="space-y-2">
              <Label htmlFor="apiKey">API Key</Label>
              <Input
                id="apiKey"
                type="password"
                placeholder="mh_..."
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                required
              />
              <p className="text-xs text-muted-foreground">
                The API key you received when you registered
              </p>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'email' | 'x')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="email" className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email Code
              </TabsTrigger>
              <TabsTrigger value="x" className="flex items-center gap-2">
                <Twitter className="h-4 w-4" />
                X (Twitter)
              </TabsTrigger>
            </TabsList>

            <TabsContent value="email" className="mt-4">
              <form onSubmit={handleVerifyEmail} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="code">Verification Code</Label>
                  <Input
                    id="code"
                    type="text"
                    placeholder="hunt-XXXX"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Enter the verification code from your registration
                  </p>
                </div>

                {status === 'error' && activeTab === 'email' && message && (
                  <div className="flex items-center gap-2 text-destructive text-sm">
                    <XCircle className="h-4 w-4 flex-shrink-0" />
                    <span>{message}</span>
                  </div>
                )}

                <Button type="submit" className="w-full" disabled={status === 'loading'}>
                  {status === 'loading' ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    'Verify with Code'
                  )}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="x" className="mt-4">
              <form onSubmit={handleVerifyX} className="space-y-4">
                <div className="rounded-lg bg-muted p-4 text-sm space-y-2">
                  <p className="font-medium">How to verify via X:</p>
                  <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                    <li>Post a tweet containing your verification code</li>
                    <li>Copy the tweet URL</li>
                    <li>Paste it below and click verify</li>
                  </ol>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tweetUrl">Tweet URL</Label>
                  <Input
                    id="tweetUrl"
                    type="url"
                    placeholder="https://x.com/username/status/..."
                    value={tweetUrl}
                    onChange={(e) => setTweetUrl(e.target.value)}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    The URL of your tweet containing the verification code
                  </p>
                </div>

                {status === 'error' && activeTab === 'x' && message && (
                  <div className="flex items-center gap-2 text-destructive text-sm">
                    <XCircle className="h-4 w-4 flex-shrink-0" />
                    <span>{message}</span>
                  </div>
                )}

                <Button type="submit" className="w-full" disabled={status === 'loading'}>
                  {status === 'loading' ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Verifying Tweet...
                    </>
                  ) : (
                    'Verify with X'
                  )}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Verify Your Account</CardTitle>
            <CardDescription>Loading...</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </CardContent>
        </Card>
      </div>
    }>
      <VerifyForm />
    </Suspense>
  );
}
