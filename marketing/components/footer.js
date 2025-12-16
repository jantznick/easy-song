class AppFooter extends HTMLElement {
    connectedCallback() {
        this.innerHTML = `
            <footer class="bg-gray-900 text-gray-300">
                <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                    <div class="grid md:grid-cols-2 gap-8 mb-8">
                        <!-- Left: Logo, Tagline, Download Icons -->
                        <div>
                            <div class="flex items-center gap-2 mb-3">
                                <div class="w-10 h-10 bg-gradient-to-br from-indigo-600 to-pink-500 rounded-xl flex items-center justify-center">
                                    <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"/>
                                    </svg>
                                </div>
                                <span class="font-display text-xl font-black text-white">Easy Song</span>
                            </div>
                            <p class="text-sm text-gray-400 mb-6">
                                Learn languages through music. A tool built by a language learner, for language learners.
                            </p>
                            <div class="flex flex-col sm:flex-row gap-4">
                                <a href="#" class="inline-flex items-center justify-center gap-2 bg-gray-800 hover:bg-gray-700 px-4 py-2 rounded-lg transition-colors">
                                    <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-1.02.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                                    </svg>
                                    <span class="text-sm font-semibold text-white">App Store</span>
                                </a>
                                <a href="#" class="inline-flex items-center justify-center gap-2 bg-gray-800 hover:bg-gray-700 px-4 py-2 rounded-lg transition-colors">
                                    <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M3,20.5V3.5C3,2.91 3.34,2.39 3.84,2.15L13.69,12L3.84,21.85C3.34,21.6 3,21.09 3,20.5M16.81,15.12L6.05,21.34L14.54,12.85L16.81,15.12M20.16,10.81C20.5,11.08 20.75,11.5 20.75,12C20.75,12.5 20.53,12.9 20.18,13.18L17.89,14.5L15.39,12L17.89,9.5L20.16,10.81M6.05,2.66L16.81,8.88L14.54,11.15L6.05,2.66Z"/>
                                    </svg>
                                    <span class="text-sm font-semibold text-white">Google Play</span>
                                </a>
                            </div>
                        </div>
                        
                        <!-- Right: Links -->
                        <div class="flex flex-col md:items-end">
                            <h3 class="font-display text-lg font-bold text-white mb-4">Links</h3>
                            <ul class="space-y-2 text-right">
                                <li><a href="/#features" class="hover:text-white transition-colors">Features</a></li>
                                <li><a href="/#pricing" class="hover:text-white transition-colors">Pricing</a></li>
                                <li><a href="/#faq" class="hover:text-white transition-colors">FAQ</a></li>
                                <li><a href="/about" class="hover:text-white transition-colors">About</a></li>
                            </ul>
                        </div>
                    </div>
                    
                    <div class="border-t border-gray-800 pt-8">
                        <div class="flex flex-col md:flex-row justify-between items-center gap-4">
                            <p class="text-sm text-gray-500">
                                © ${new Date().getFullYear()} Easy Song. All rights reserved.
                            </p>
                            <div class="flex gap-6">
                                <a href="/privacy-policy" class="text-sm text-gray-400 hover:text-white transition-colors">Privacy Policy</a>
                                <a href="/terms" class="text-sm text-gray-400 hover:text-white transition-colors">Terms of Service</a>
                            </div>
                        </div>
                    </div>
                </div>
            </footer>
        `;
    }
}

customElements.define('app-footer', AppFooter);
