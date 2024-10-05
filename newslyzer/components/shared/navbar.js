import { useUser } from '@auth0/nextjs-auth0';

export default function NavBar() {
  const { user } = useUser();

  return (
    <nav>
      {!user ? (
        <a href="/api/auth/login">Login</a>
      ) : (
        <>
          <a href="/profile">Profile</a>
          <a href="/api/auth/logout">Logout</a>
        </>
      )}
    </nav>
  );
}
