import { useEffect } from 'react';
import { useGlobalSettingsStore } from '../store';

export function useFavicon(url?: string | null) {
  const globalSettings = useGlobalSettingsStore(state => state.settings);

  useEffect(() => {
    const faviconUrl = url || globalSettings?.systemFavicon || '/favicon.ico';
    
    let link: HTMLLinkElement | null = document.querySelector("link[rel~='icon']");
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.head.appendChild(link);
    }
    link.href = faviconUrl;
  }, [url, globalSettings?.systemFavicon]);
}
