import AsyncStorage from '@react-native-async-storage/async-storage';

const COOKIE_STORAGE_KEY = '@easysong:session_cookie';

/**
 * Save cookies from a response
 * Extracts the session cookie and stores it in AsyncStorage
 */
export async function saveCookiesFromResponse(response: Response): Promise<void> {
  try {
    // React Native fetch may return Set-Cookie as a string or array
    // Try to get it as a string first
    let setCookieHeader = response.headers.get('set-cookie');
    
    // If not found, try getting all Set-Cookie headers (some implementations return arrays)
    if (!setCookieHeader) {
      // Check if headers.getAll exists (some polyfills)
      const allCookies = (response.headers as any).getAll?.('set-cookie');
      if (allCookies && Array.isArray(allCookies) && allCookies.length > 0) {
        setCookieHeader = allCookies[0]; // Take the first one (session cookie)
      }
    }
    
    if (!setCookieHeader) {
      return;
    }

    // Parse the Set-Cookie header to extract the session cookie
    // Format: "easysong.sid=session_id_value; Path=/; HttpOnly; SameSite=Lax; Expires=..."
    // Note: We can't simply split by comma because expiration dates may contain commas
    // Instead, we'll look for the cookie name (easysong.sid) and extract its value
    
    // Find the session cookie by name
    const sessionCookieMatch = setCookieHeader.match(/easysong\.sid=([^;]+)/);
    if (sessionCookieMatch && sessionCookieMatch[1]) {
      const cookieValue = sessionCookieMatch[1].trim();
      // Store the session cookie as "easysong.sid=value"
      await AsyncStorage.setItem(COOKIE_STORAGE_KEY, `easysong.sid=${cookieValue}`);
    } else {
      // Fallback: try to parse any cookie (for backwards compatibility)
      // Extract the cookie name and value (everything before the first semicolon)
      const [nameValue] = setCookieHeader.split(';');
      const [name, value] = nameValue.split('=');
      
      if (name && value) {
        await AsyncStorage.setItem(COOKIE_STORAGE_KEY, `${name.trim()}=${value.trim()}`);
      }
    }
  } catch (error) {
    console.error('Error saving cookies:', error);
  }
}

/**
 * Get cookies for a request
 * Retrieves the stored session cookie to include in requests
 */
export async function getCookiesForRequest(): Promise<string> {
  try {
    const cookie = await AsyncStorage.getItem(COOKIE_STORAGE_KEY);
    return cookie || '';
  } catch (error) {
    console.error('Error getting cookies:', error);
    return '';
  }
}

/**
 * Clear all cookies
 * Removes the stored session cookie
 */
export async function clearCookies(): Promise<void> {
  try {
    await AsyncStorage.removeItem(COOKIE_STORAGE_KEY);
  } catch (error) {
    console.error('Error clearing cookies:', error);
  }
}
