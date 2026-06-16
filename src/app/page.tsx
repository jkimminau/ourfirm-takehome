import * as styles from "./page.css";

export default function Home() {
  return (
    <main className={styles.main}>
      <span className={styles.badge}>ourfirm-takehome · scaffold</span>
      <h1 className={styles.title}>Document Region Extractor</h1>
      <p className={styles.subtitle}>
        Upload a PDF and extract its signature, letterhead, and footer as
        downloadable PNG or JPEG images. The interface and extraction pipeline
        are coming next.
      </p>
    </main>
  );
}
