import '../styles/globals.css'

export default function MyApp({ Component, pageProps }) {
  return (
    <>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:rounded-md focus:bg-white focus:px-4 focus:py-2 focus:text-spuncast-navy"
      >
        Skip to main content
      </a>
      <Component {...pageProps} />
    </>
  )
}
