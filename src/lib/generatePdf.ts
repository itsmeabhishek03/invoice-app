export async function generatePdf(html: string): Promise<Blob> {
  // Use absolute URL in server-side fetch
  const url = new URL('/api/generate-pdf', process.env.NEXTAUTH_URL || 'http://localhost:3000');
  
  const response = await fetch(url.toString(), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ html }),
  });

  if (!response.ok) {
    throw new Error('Failed to generate PDF');
  }

  return await response.blob();
}