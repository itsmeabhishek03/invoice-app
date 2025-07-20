'use client';

import { useSession, signIn } from 'next-auth/react';
import { useEffect, useState, ChangeEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/Input';

type Profile = {
  companyName?: string;
  address?: string;
  currency?: string;
  logoBase64?: string;
};

export default function SettingsPage() {
  const { data: session } = useSession();
  const [profile, setProfile] = useState<Profile>({});
  const [companyName, setCompanyName] = useState('');
  const [address, setAddress] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Fetch existing profile
  useEffect(() => {
    if (!session) return;
    fetch('/api/profile')
      .then((res) => res.json())
      .then((data: Profile) => {
        setProfile(data);
        setCompanyName(data.companyName || '');
        setAddress(data.address || '');
        setCurrency(data.currency || 'USD');
        if (data.logoBase64) setLogoPreview(data.logoBase64);
      });
  }, [session]);

  if (!session) {
    return (
      <div className="p-8">
        <p className="mb-4">You need to sign in to access Settings.</p>
        <Button onClick={() => signIn()}>Sign In</Button>
      </div>
    );
  }

  // Handle file selection
  function onLogoChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    setLogoFile(file);
    if (file) {
      const url = URL.createObjectURL(file);
      setLogoPreview(url);
    }
  }

  // Convert file to Base64
  function toBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  // Save profile
  async function onSave() {
    setSaving(true);
    let logoBase64 = profile.logoBase64 || null;
    if (logoFile) {
      logoBase64 = await toBase64(logoFile);
    }
    await fetch('/api/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ companyName, address, currency, logoBase64 }),
    });
    setSaving(false);
    alert('Profile saved!');
  }

  return (
    <div className="max-w-2xl mx-auto p-8 space-y-6">
      <h1 className="text-2xl font-semibold">Company Profile</h1>

      <div className="space-y-4">
        <Input
          label="Company Name"
          value={companyName}
          onChange={(e) => setCompanyName(e.target.value)}
        />
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium">Address</label>
          <textarea
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            rows={3}
            value={address}
            onChange={(e) => setAddress(e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium">Default Currency</label>
          <select
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
          >
            {['USD','EUR','INR','GBP','AUD','CAD'].map((cur) => (
              <option key={cur} value={cur}>{cur}</option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium">Logo</label>
          <input type="file" accept="image/*" onChange={onLogoChange} />
          {logoPreview && (
            <img
              src={logoPreview}
              alt="Logo preview"
              className="mt-2 h-24 object-contain border border-gray-300 p-1 rounded"
            />
          )}
        </div>
      </div>

      <Button onClick={onSave} disabled={saving}>
        {saving ? 'Saving…' : 'Save Changes'}
      </Button>
    </div>
  );
}
