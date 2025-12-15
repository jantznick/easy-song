class AppFooter extends HTMLElement {
    connectedCallback() {
        this.innerHTML = `
            <footer class="bg-gray-900 text-gray-300">
                <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                    <div class="grid md:grid-cols-3 gap-8">
                        <div>
                            <div class="flex items-center gap-2 mb-4">
                                <div class="w-10 h-10 bg-gradient-to-br from-indigo-600 to-pink-500 rounded-xl flex items-center justify-center">
                                    <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"/>
                                    </svg>
                                </div>
                                <span class="font-display text-xl font-black text-white">Easy Song</span>
                            </div>
                            <p class="text-sm text-gray-400">
                                Learn languages through music. Master Spanish, English, and more with interactive lyrics and translations.
                            </p>
                        </div>
                        
                        <div>
                            <h3 class="font-display text-lg font-bold text-white mb-4">Product</h3>
                            <ul class="space-y-2">
                                <li><a href="index.html#features" class="hover:text-white transition-colors">Features</a></li>
                                <li><a href="index.html#pricing" class="hover:text-white transition-colors">Pricing</a></li>
                                <li><a href="index.html#faq" class="hover:text-white transition-colors">FAQ</a></li>
                                <li><a href="index.html#download" class="hover:text-white transition-colors">Download</a></li>
                            </ul>
                        </div>
                        
                        <div>
                            <h3 class="font-display text-lg font-bold text-white mb-4">Company</h3>
                            <ul class="space-y-2">
                                <li><a href="about.html" class="hover:text-white transition-colors">About</a></li>
                                <li><a href="careers.html" class="hover:text-white transition-colors">Careers</a></li>
                                <li><a href="contact.html" class="hover:text-white transition-colors">Contact</a></li>
                            </ul>
                        </div>
                    </div>
                    
                    <div class="border-t border-gray-800 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
                        <p class="text-sm text-gray-400">
                            © ${new Date().getFullYear()} Easy Song. All rights reserved.
                        </p>
                        <div class="flex gap-6 mt-4 md:mt-0">
                            <a href="#" class="text-sm text-gray-400 hover:text-white transition-colors">Privacy Policy</a>
                            <a href="#" class="text-sm text-gray-400 hover:text-white transition-colors">Terms of Service</a>
                        </div>
                    </div>
                </div>
            </footer>
        `;
    }
}

customElements.define('app-footer', AppFooter);

