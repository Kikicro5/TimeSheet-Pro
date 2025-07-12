'use client';

import { useEffect, useState } from 'react';

const AdBanner = () => {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (isClient) {
      try {
        ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
      } catch (err) {
        console.error("AdSense error:", err);
      }
    }
  }, [isClient]);

  if (!isClient) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 w-full flex justify-center items-center bg-background/95 p-2 z-50 border-t">
      <div className="w-full max-w-screen-lg">
        <ins
          className="adsbygoogle"
          style={{ display: 'block' }}
          data-ad-client="ca-pub-0825549313210028"
          data-ad-slot="4207227293"
          data-ad-format="auto"
          data-full-width-responsive="true"
        ></ins>
      </div>
    </div>
  );
};

export default AdBanner;
