import '@/styles/globals.css';
import { UserProvider } from '@auth0/nextjs-auth0/client';
import NavBar from '@/components/shared/navbar'; // Import NavBar here
import Footer from '@/components/shared/footer'; // Import Footer here if you want it globally

export default function App({ Component, pageProps }) {
  return (
    <UserProvider>
      <NavBar />
      <Component {...pageProps} />
      <Footer />
    </UserProvider>
  );
}
