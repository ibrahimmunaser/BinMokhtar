import { redirect } from 'next/navigation';

/**
 * Redirect /account to /profile for consistency
 */
export default function AccountRedirect() {
  redirect('/profile');
}
