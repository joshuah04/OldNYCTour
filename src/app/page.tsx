import Link from "next/link";
import { FontSizeControl } from "@/components/FontSizeControl";

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-6 px-5 py-8">
      <header className="text-center">
        <p style={{ fontSize: "3rem", lineHeight: 1 }} aria-hidden>
          🗽
        </p>
        <h1 className="mt-3 font-extrabold" style={{ fontSize: "2rem" }}>
          뉴욕 나들이
        </h1>
        <p className="mt-2" style={{ color: "var(--text-soft)", fontSize: "1.15rem" }}>
          어르신을 위한 뉴욕 여행 도우미
        </p>
      </header>

      <section className="card" aria-label="소개">
        <p style={{ fontSize: "1.15rem", lineHeight: 1.7 }}>
          휴대폰이 지금 계신 곳을 알아서, 주변 건물과 볼거리를 <b>목소리로</b>{" "}
          안내해 드립니다. 근처 <b>맛집</b>과 <b>가는 길</b>도 알려드립니다.
        </p>
      </section>

      <Link
        href="/tour"
        className="big-button big-button--primary"
        style={{ minHeight: 92, fontSize: "1.5rem", justifyContent: "center" }}
      >
        🚶 나들이 시작하기
      </Link>

      <FontSizeControl />

      <p
        className="text-center"
        style={{ color: "var(--text-soft)", fontSize: "0.95rem" }}
      >
        시작을 누르면 위치 사용을 허용해 주세요.
        <br />
        위치는 안내를 위해서만 사용되며 저장하지 않습니다.
      </p>
    </main>
  );
}
