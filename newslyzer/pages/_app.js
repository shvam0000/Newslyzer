import '@/styles/globals.css';
import { UserProvider } from '@auth0/nextjs-auth0/client';
import NavBar from '@/components/shared/navbar';
import Footer from '@/components/shared/footer';

export default function App({ Component, pageProps }) {
  return (
    <UserProvider>
      <NavBar />
      <Component {...pageProps} />
      <Footer />
    </UserProvider>
  );
}
