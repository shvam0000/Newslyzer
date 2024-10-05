import { withPageAuthRequired } from '@auth0/nextjs-auth0';
import Link from 'next/link';
import Button from '@/components/shared/button';
import { Space_Grotesk } from 'next/font/google';

const spaceGrotesk = Space_Grotesk({
  weight: ['400', '700'],
  subsets: ['latin'],
});

export default function Profile({ user }) {
  console.log('user', user);

  return (
    <div
      className={`h-screen bg-hero-bg text-white py-20 space-y-8 ${spaceGrotesk.className} px-44`}>
      <div className="flex justify-between items-center">
        <h1 className="text-4xl font-bold">Welcome, {user.name}</h1>
      </div>
    </div>
  );
}

export const getServerSideProps = withPageAuthRequired();
