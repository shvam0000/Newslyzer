import { useUser, withPageAuthRequired } from '@auth0/nextjs-auth0';
import Link from 'next/link';

export default function Profile({ user }) {
  console.log('user', user);

  return (
    <div>
      <h1>Welcome, {user.name}</h1>
      <p>Email: {user.email}</p>

      <Link href="/api/auth/logout">
        {' '}
        <button>Logout</button>
      </Link>
    </div>
  );
}

export const getServerSideProps = withPageAuthRequired();
