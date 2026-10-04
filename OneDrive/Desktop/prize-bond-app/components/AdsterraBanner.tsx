'use client';

import { useEffect, useRef, useState } from 'react';

interface AdsterraBannerProps {
  idKey: string;
  width: number;
  height: number;
}

const SMARTLINK = "https://www.profitableratecpmnetwork.com/y2imxpuxg5?key=00c31a9133eb843406c767846e4d1d94"

export default function AdsterraBanner({
  idKey,
  width,
  height,
}: AdsterraBannerProps) {
  const bannerRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(true);
  const [closeClicked, setCloseClicked] = useState(false);

  useEffect(() => {
    if (bannerRef.current && !bannerRef.current.firstChild) {
      const atOptions = {
        key: idKey,
        format: 'iframe',
        height,
        width,
        params: {},
      };

      const configScript = document.createElement('script');
      configScript.type = 'text/javascript';
      configScript.innerHTML = `atOptions = ${JSON.stringify(atOptions)}`;

      const invokeScript = document.createElement('script');
      invokeScript.type = 'text/javascript';
      invokeScript.src = `https://www.highrevenueformat.com/${idKey}/invoke.js`;

      bannerRef.current.appendChild(configScript);
      bannerRef.current.appendChild(invokeScript);
    }
  }, [idKey, height, width]);

    const handleClose = () => {
    // First X click: open Smartlink
    if (!closeClicked) {
      setCloseClicked(true);

      window.open(
        SMARTLINK,
        '_blank',
        'noopener,noreferrer'
      );

      return;
    }

    // Second X click: hide banner
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="relative mx-auto my-4 w-full max-w-[728px] px-2">
      {/* Close button */}
      <button
        type="button"
        onClick={handleClose}
        aria-label="Close advertisement"
        className="absolute right-1 top-[-10px] z-20 flex h-7 w-7 items-center justify-center rounded-full bg-slate-700 text-lg leading-none text-white shadow-md transition hover:bg-slate-900"
      >
        ×
      </button>

      {/* Ad container */}
      <div
        className="flex w-full justify-center overflow-hidden rounded-lg bg-transparent"
        aria-label="Advertisement"
      >
        <div
          ref={bannerRef}
          className="flex max-w-full items-center justify-center overflow-hidden"
          style={{
            width: `${width}px`,
            height: `${height}px`,
            maxWidth: '100%',
          }}
        />
      </div>
    </div>
  );
}
