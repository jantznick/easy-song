class AppHeader extends HTMLElement {
    connectedCallback() {
        this.innerHTML = `
            <header class="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200">
                <nav class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div class="flex items-center justify-between h-16">
                        <div class="flex items-center">
                            <a href="/" class="flex items-center gap-2">
                                <div class="w-10 h-10 bg-gradient-to-br from-indigo-600 to-pink-500 rounded-xl flex items-center justify-center">
                                    <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"/>
                                    </svg>
                                </div>
                                <span class="font-display text-xl font-black text-gray-900">Easy Song</span>
                            </a>
                        </div>
                        <div class="hidden md:flex items-center gap-8">
                            <a href="/#features" class="text-gray-700 hover:text-indigo-600 font-medium transition-colors">Features</a>
                            <a href="/#pricing" class="text-gray-700 hover:text-indigo-600 font-medium transition-colors">Pricing</a>
                            <a href="/#faq" class="text-gray-700 hover:text-indigo-600 font-medium transition-colors">FAQ</a>
                            <a href="/about" class="text-gray-700 hover:text-indigo-600 font-medium transition-colors">About</a>
                            <a href="/#download" class="bg-indigo-600 text-white px-6 py-2 rounded-full font-bold hover:bg-indigo-700 transition-all">
                                Get Started
                            </a>
                        </div>
                        <button class="md:hidden p-2 text-gray-700" id="mobile-menu-button">
                            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
                            </svg>
                        </button>
                    </div>
                    <!-- Mobile Menu -->
                    <div class="hidden md:hidden pb-4" id="mobile-menu">
                        <div class="flex flex-col gap-4">
                            <a href="/#features" class="text-gray-700 hover:text-indigo-600 font-medium">Features</a>
                            <a href="/#pricing" class="text-gray-700 hover:text-indigo-600 font-medium">Pricing</a>
                            <a href="/#faq" class="text-gray-700 hover:text-indigo-600 font-medium">FAQ</a>
                            <a href="/about" class="text-gray-700 hover:text-indigo-600 font-medium">About</a>
                            <a href="/#download" class="bg-indigo-600 text-white px-6 py-2 rounded-full font-bold text-center">
                                Get Started
                            </a>
                        </div>
                    </div>
                </nav>
            </header>
            <div class="h-16"></div>
        `;
        
        // Mobile menu toggle
        const menuButton = this.querySelector('#mobile-menu-button');
        const mobileMenu = this.querySelector('#mobile-menu');
        
        if (menuButton && mobileMenu) {
            menuButton.addEventListener('click', () => {
                mobileMenu.classList.toggle('hidden');
            });
        }
    }
}

customElements.define('app-header', AppHeader);

