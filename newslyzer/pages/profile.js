import { withPageAuthRequired } from '@auth0/nextjs-auth0';

export default function Profile({ user }) {
  return (
    <div>
      <h1>Welcome, {user.name}</h1>
      <p>Email: {user.email}</p>
    </div>
  );
}

export const getServerSideProps = withPageAuthRequired();
