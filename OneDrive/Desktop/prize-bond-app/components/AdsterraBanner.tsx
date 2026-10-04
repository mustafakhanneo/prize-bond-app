'use client';

import { useEffect, useRef } from 'react';

interface AdsterraBannerProps {
  idKey: string;
  width: number;
  height: number;
}

export default function AdsterraBanner({ idKey, width, height }: AdsterraBannerProps) {
  const bannerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Ensure this runs only on the client and hasn't been appended yet
    if (bannerRef.current && !bannerRef.current.firstChild) {
      const atOptions = {
        key: idKey,
        format: 'iframe',
        height: height,
        width: width,
        params: {},
      };

      // 1. Create the configuration script
      const configScript = document.createElement('script');
      configScript.type = 'text/javascript';
      configScript.innerHTML = `atOptions = ${JSON.stringify(atOptions)}`;

      // 2. Create the script that invokes the ad
      const invokeScript = document.createElement('script');
      invokeScript.type = 'text/javascript';
      invokeScript.src = `https://www.highrevenueformat.com/{idKey}/invoke.js`;

      // 3. Append scripts to the reference container
      bannerRef.current.appendChild(configScript);
      bannerRef.current.appendChild(invokeScript);
    }
  }, [idKey, height, width]);

  return (
    <div 
      ref={bannerRef}
      style={{
        width: `${width}px`,
        height: `${height}px`,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        margin: '1rem auto',
        backgroundColor: 'transparent' // Prevents flashes of white background
      }}
    />
  );
}
