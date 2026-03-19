import { useEffect } from 'react';
import { useGlobalSettingsStore } from '../store';

export function useFavicon(url?: string | null) {
  const globalSettings = useGlobalSettingsStore(state => state.settings);

  useEffect(() => {
    const faviconUrl = url || globalSettings?.systemFavicon || '/vite.svg'; // Usually Liscord default if no local SVG found
    
    let link: HTMLLinkElement | null = document.querySelector("link[rel~='icon']");
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.head.appendChild(link);
    }
    link.href = faviconUrl;
  }, [url, globalSettings?.systemFavicon]);
}
