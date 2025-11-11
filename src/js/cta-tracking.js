/**
 * CTA Tracking System
 * Tracks user interactions with tools and subscription to avoid showing redundant CTAs
 */

(function() {
  const STORAGE_KEY = 'withstain_cta_tracking';

  // Get tracking data from localStorage
  function getTracking() {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : {
        subscribedNewsletter: false,
        completedTools: [],
        timestamp: Date.now()
      };
    } catch (e) {
      return { subscribedNewsletter: false, completedTools: [], timestamp: Date.now() };
    }
  }

  // Save tracking data to localStorage
  function saveTracking(data) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.error('Failed to save CTA tracking:', e);
    }
  }

  // Mark newsletter as subscribed
  function markNewsletterSubscribed() {
    const tracking = getTracking();
    tracking.subscribedNewsletter = true;
    tracking.timestamp = Date.now();
    saveTracking(tracking);
  }

  // Mark tool as completed
  function markToolCompleted(toolId) {
    const tracking = getTracking();
    if (!tracking.completedTools.includes(toolId)) {
      tracking.completedTools.push(toolId);
      tracking.timestamp = Date.now();
      saveTracking(tracking);
    }
  }

  // Check if newsletter is subscribed
  function isNewsletterSubscribed() {
    return getTracking().subscribedNewsletter;
  }

  // Check if tool is completed
  function isToolCompleted(toolId) {
    return getTracking().completedTools.includes(toolId);
  }

  // Hide CTAs based on tracking
  function hideCompletedCTAs() {
    const tracking = getTracking();

    // Hide tool CTAs if completed and show newsletter fallback
    tracking.completedTools.forEach(toolId => {
      const toolCTAs = document.querySelectorAll(`[data-cta-tool="${toolId}"]`);
      toolCTAs.forEach(toolCTA => {
        toolCTA.style.display = 'none';

        // Show newsletter fallback if not subscribed
        if (!tracking.subscribedNewsletter) {
          const parent = toolCTA.parentElement;
          const fallbackNewsletter = parent?.querySelector('[data-cta-fallback="true"]');
          if (fallbackNewsletter) {
            fallbackNewsletter.style.display = 'block';
          }
        }
      });
    });

    // Hide newsletter CTAs if subscribed
    if (tracking.subscribedNewsletter) {
      const subscribeCTAs = document.querySelectorAll('[data-cta-type="newsletter"]');
      subscribeCTAs.forEach(cta => {
        cta.style.display = 'none';
      });
    }
  }

  // Track newsletter subscription forms
  function trackNewsletterForms() {
    document.addEventListener('submit', function(e) {
      const form = e.target;
      if (form.matches('.subscribe-block-form, .subscribe-form')) {
        // Wait for successful submission (listen for success message)
        setTimeout(() => {
          const successMsg = form.closest('.subscribe-block, .subscribe-box')
            ?.querySelector('.subscribe-message-success');
          if (successMsg && !successMsg.classList.contains('hidden')) {
            markNewsletterSubscribed();
          }
        }, 1000);
      }
    });
  }

  // Initialize on page load
  function init() {
    hideCompletedCTAs();
    trackNewsletterForms();
  }

  // Public API
  window.WithstainCTATracking = {
    markNewsletterSubscribed,
    markToolCompleted,
    isNewsletterSubscribed,
    isToolCompleted,
    getTracking
  };

  // Auto-init
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
