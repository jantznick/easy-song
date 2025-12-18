const fs = require('fs');
const path = require('path');

// Read .env file and extract only SHOWADS
function getShowAdsFromEnv() {
  const envPath = path.join(__dirname, '.env');
  
  // If .env doesn't exist, default to true (show ads)
  if (!fs.existsSync(envPath)) {
    return true;
  }
  
  try {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const lines = envContent.split('\n');
    
    // Look for SHOWADS line
    for (const line of lines) {
      const trimmed = line.trim();
      // Skip comments and empty lines
      if (!trimmed || trimmed.startsWith('#')) continue;
      
      // Check if this is the SHOWADS variable
      if (trimmed.startsWith('SHOWADS=')) {
        const value = trimmed.split('=')[1]?.trim().replace(/^["']|["']$/g, '');
        // Return false only if explicitly set to 'false', otherwise true
        return value !== 'false';
      }
    }
    
    // If SHOWADS not found, default to true
    return true;
  } catch (error) {
    console.warn('Error reading .env file:', error.message);
    return true; // Default to showing ads if there's an error
  }
}

module.exports = {
  expo: {
    name: 'easy-song-mobile',
    slug: 'easy-song-mobile',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'automatic',
    splash: {
      image: './assets/icon.png',
      resizeMode: 'contain',
      backgroundColor: '#bbcedf'
    },
    assetBundlePatterns: [
      '**/*'
    ],
    ios: {
      supportsTablet: true,
      bundleIdentifier: 'com.easysong.mobile'
    },
    android: {
      adaptiveIcon: {
        foregroundImage: './assets/icon.png',
        backgroundColor: '#6366F1'
      },
      package: 'com.easysong.mobile'
    },
    web: {
      favicon: './assets/icon.png'
    },
    plugins: [
      'expo-asset',
      'react-native-localize',
      [
        'react-native-google-mobile-ads',
        {
          androidAppId: 'ca-app-pub-3940256099942544~3347511713',
          iosAppId: 'ca-app-pub-3940256099942544~1458002511'
        }
      ]
    ],
    extra: {
      eas: {
        projectId: '83a2e914-9fd8-4a00-9e71-d5c5f66c4bec'
      },
      // Only expose SHOWADS - other secrets remain private
      showAds: getShowAdsFromEnv()
    }
  }
};

