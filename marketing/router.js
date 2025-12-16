// Simple hash navigation handler
(function() {
    // Handle hash navigation after page load
    function handleHashNavigation() {
        const hash = window.location.hash;
        if (hash) {
            setTimeout(() => {
                const target = document.querySelector(hash);
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            }, 100);
        }
    }
    
    // Smooth scrolling for anchor links
    document.addEventListener('click', function(e) {
        const link = e.target.closest('a');
        if (link) {
            const href = link.getAttribute('href');
            // Handle same-page anchor links
            if (href && href.startsWith('#')) {
                const target = document.querySelector(href);
                if (target) {
                    e.preventDefault();
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            }
        }
    });
    
    // Handle hash on page load
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', handleHashNavigation);
    } else {
        handleHashNavigation();
    }
})();

