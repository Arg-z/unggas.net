import { permanentRedirect } from "next/navigation";

// Landing sudah menjadi halaman depan; URL lama diarahkan permanen.
export default function MulaiPage() {
  permanentRedirect("/");
}
