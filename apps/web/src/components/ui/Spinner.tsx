import * as s from "./Spinner.css";

export function Spinner() {
  return <span className={s.spinner} role="status" aria-label="Loading" />;
}
