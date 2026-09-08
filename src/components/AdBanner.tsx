import React, { useEffect } from 'react';

declare global {
  interface Window {
    adsbygoogle?: any[];
  }
}

export default function AdBanner() {
  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      }
    } catch (err) {
      console.warn('AdSense notice:', err);
    }
  }, []);

  return (
    <div style={{ textAlign: 'center', margin: '15px 0' }} className="w-full flex justify-center py-2">
      <ins
        className="adsbygoogle"
        style={{ display: 'block', minHeight: '60px', width: '100%', maxWidth: '728px' }}
        data-ad-client="ca-pub-XXXXXXXXXXXXXXXX"
        data-ad-slot="1234567890"
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  );
}
