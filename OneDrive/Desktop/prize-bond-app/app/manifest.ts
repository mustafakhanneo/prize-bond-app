import type { MetadataRoute } from 'next'
 
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Prize Bond Checker',
    short_name: 'Prize Bond Checker',
    description: 'Check prize bonds online and find the latest prize bond results quickly. Use our prize bond checker to check your bond numbers and see winning results for Pakistani prize bonds.',
    start_url: '/',
    display: 'standalone',
    background_color: '#fff',
    theme_color: '#fff',
    icons: [
      {
        src: '/icon?<generated>',
        sizes: 'any',
        type: 'image/<generated>',
      },
    ],
  }
}