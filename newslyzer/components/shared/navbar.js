import { useUser } from '@auth0/nextjs-auth0/client'; // Ensure this import is at the top
import Image from 'next/image';
import Shapes from './Shapes.png';
import { Space_Grotesk } from 'next/font/google';
import Link from 'next/link';
import { LogoutIcon, ProfileIcon } from '@/utils/icons';

const spaceGrotesk = Space_Grotesk({
  weight: ['400', '700'],
  subsets: ['latin'],
});

export default function NavBar() {
  const { user, isLoading } = useUser();

  return (
    <nav>
      <div
        className={`bg-hero-bg flex justify-between items-center px-44 py-5 ${spaceGrotesk.className} text-xl font-semibold`}>
        {/* Home Link */}
        <div className="flex items-center space-x-3">
          <Link href="/">
            <div>Home</div>
          </Link>
          <Link href="/newslyzer">
            <div classNames="hover:underline">NewsLyzer</div>
          </Link>
        </div>

        {/* Image (Shapes) */}
        <figure>
          <Image src={Shapes} alt="Shapes" height={100} width={20} />
        </figure>

        {!user ? (
          <Link href="/api/auth/login">
            <div>Login</div>
          </Link>
        ) : (
          <div
            className="flex items-center space-x-3
          ">
            <Link href="/profile" className="flex items-center space-x-1">
              <img
                src={user.picture}
                alt="Profile Picture"
                className="w-8 h-8 rounded-full"
              />
              <div>Profile</div>
            </Link>
            <Link
              href="/api/auth/logout"
              className="flex items-center space-x-1">
              <LogoutIcon />
              <span>Log out</span>
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}
