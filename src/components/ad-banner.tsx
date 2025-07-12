'use client';

import { useEffect } from 'react';

declare global {
  interface Window {
    adsbygoogle: any;
  }
}

export const AdBanner = () => {
  useEffect(() => {
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (err) {
      console.error(err);
    }
  }, []);

  return (
    <div className="w-full flex justify-center py-2 bg-background">
        <ins
          className="adsbygoogle"
          style={{ display: 'block' }}
          data-ad-client="ca-pub-0825549313210028"
          data-ad-slot="4207227293"
          data-ad-format="auto"
          data-full-width-responsive="true"
        ></ins>
    </div>
  );
};
