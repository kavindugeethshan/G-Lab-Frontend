import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export default function ScrollToTop() {
  const { pathname, search, hash } = useLocation();

  useEffect(() => {
    // If a hash exists (e.g. #categoriesSection, #whyGlab), smoothly scroll to that target
    if (hash) {
      const scrollToHash = () => {
        const element = document.querySelector(hash);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      };

      // Immediate attempt
      scrollToHash();

      // Subsequent retries to account for asynchronous API data loading and layout reflows
      const t1 = setTimeout(scrollToHash, 100);
      const t2 = setTimeout(scrollToHash, 400);
      const t3 = setTimeout(scrollToHash, 800);

      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
        clearTimeout(t3);
      };
    }

    // Always reset scroll to the top of the page immediately on route changes without hash
    window.scrollTo(0, 0);
    if (document.documentElement) {
      document.documentElement.scrollTop = 0;
    }
    if (document.body) {
      document.body.scrollTop = 0;
    }
  }, [pathname, search, hash]);

  return null;
}
