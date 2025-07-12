'use client';

import { useEffect, useState } from 'react';
import Adsense from 'react-adsense';

const AdBanner = () => {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 w-full flex justify-center items-center bg-background/80 backdrop-blur-sm p-2 z-50">
      <div className="w-full max-w-screen-lg">
        <Adsense.Ad
          client="ca-pub-0825549313210028"
          slot="4207227293"
          style={{ display: 'block' }}
          layout="in-article"
          format="fluid"
        />
      </div>
    </div>
  );
};

export default AdBanner;