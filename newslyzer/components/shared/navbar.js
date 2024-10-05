import { useUser } from '@auth0/nextjs-auth0/client'; // Ensure this import is at the top
import Image from 'next/image';
import Shapes from './Shapes.png';
import { Space_Grotesk } from 'next/font/google';
import Link from 'next/link';

const spaceGrotesk = Space_Grotesk({
  weight: ['400', '700'],
  subsets: ['latin'],
});

export default function NavBar() {
  const { user, isLoading } = useUser();

  if (isLoading) {
    return <div>Loading...</div>; // Add a loading spinner or text while authentication is being processed
  }

  return (
    <nav>
      <div
        className={`bg-hero-bg flex justify-between items-center px-44 pt-10 ${spaceGrotesk.className} text-xl font-semibold`}>
        {/* Home Link */}
        <Link href="/">
          <div>Home</div>
        </Link>

        {/* Image (Shapes) */}
        <figure>
          <Image src={Shapes} alt="Shapes" height={100} width={20} />
        </figure>

        {!user ? (
          <Link href="/api/auth/login">
            <div>Login</div>
          </Link>
        ) : (
          <Link href="/profile">
            <div>Profile</div>
          </Link>
        )}
      </div>
    </nav>
  );
}
