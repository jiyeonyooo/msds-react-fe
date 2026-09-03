import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "../../components/ui";
import { getPrograms, reserveProgram } from "./program.ts";
import { ApiError } from "../../lib/apiError.ts";
import type { ProgramResponse } from "./types.ts";

export default function ProgramListPage() {
  const [programs, setPrograms] = useState<ProgramResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [reservingId, setReservingId] = useState<number | null>(null);

  const loadPrograms = () => {
    setLoading(true);
    getPrograms()
      .then(setPrograms)
      .catch(() => setError("프로그램 목록을 불러오지 못했습니다."))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadPrograms();
  }, []);

  const handleReserve = async (programId: number) => {
    setError("");
    setNotice("");
    setReservingId(programId);
    try {
      await reserveProgram({ programId, quantity: 1 });
      setNotice("예약이 완료되었습니다.");
      loadPrograms();
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setError("예약하려면 먼저 로그인해 주세요.");
      } else {
        setError(err instanceof ApiError && err.message ? err.message : "예약 중 오류가 발생했습니다.");
      }
    } finally {
      setReservingId(null);
    }
  };

  return (
    <main>
      <section className="bg-[#fbfaf6] px-6 py-16 md:px-[100px] md:py-24">
        <div className="mx-auto max-w-[1240px]">
          <p className="text-[11px] font-medium tracking-[0.17em] text-gold-500">
            MINDFUL PROGRAMS
          </p>
          <h1 className="mt-4 max-w-[672px] font-display text-[52px] leading-[0.95] font-semibold text-navy-900 md:text-[64px]">
            Practice stillness,
            <br />
            one day at a time.
          </h1>
          <p className="mt-4 max-w-[512px] text-sm leading-7 text-ink-500">
            숙박 중 참여할 수 있는 명상 프로그램을 만나보세요.
          </p>
          <Link
            className="mt-6 inline-block text-xs font-medium tracking-[0.08em] text-navy-900 underline underline-offset-4 hover:text-gold-500"
            to="/reviews"
          >
            GUEST REVIEWS →
          </Link>
        </div>
      </section>

      <section className="bg-white px-6 py-14 md:px-[100px]">
        <div className="mx-auto max-w-[1240px]">
          {notice && (
            <p
              className="mb-6 rounded-sm border border-border-accent bg-[#faf6ed] px-4 py-3 text-sm text-ink-700"
              role="status"
            >
              {notice}
            </p>
          )}
          {error && (
            <p
              className="mb-6 rounded-sm border border-error-border bg-[#f8eeeb] px-4 py-3 text-sm text-error"
              role="alert"
            >
              {error}
            </p>
          )}

          {loading && <p className="py-12 text-sm text-ink-500">불러오는 중…</p>}

          {!loading && programs.length === 0 && (
            <div className="border border-dashed border-[#c7bfad] px-6 py-24 text-center text-sm leading-7 text-ink-500">
              현재 등록된 프로그램이 없습니다.
            </div>
          )}

          {!loading && programs.length > 0 && (
            <div className="grid gap-6 md:grid-cols-2">
              {programs.map((p) => (
                <article
                  key={p.id}
                  className="grid overflow-hidden rounded-[14px] border border-border-subtle bg-white sm:grid-cols-[200px_1fr]"
                >
                  <div className="grid h-[200px] place-items-center overflow-hidden bg-[#e8e3d9] text-[10px] text-ink-500 sm:h-full">
                    {p.pictureUrl ? (
                      <img alt={p.name} className="size-full object-cover" src={p.pictureUrl} />
                    ) : (
                      "NO IMAGE"
                    )}
                  </div>
                  <div className="flex flex-col gap-3 px-6 py-6">
                    <p className="text-[10px] font-medium tracking-[0.14em] text-gold-500">
                      {p.status === "OPEN" ? "모집중" : "마감"}
                    </p>
                    <h3 className="font-display text-2xl font-semibold text-navy-900">{p.name}</h3>
                    <p className="mt-auto text-xs font-medium text-ink-500">
                      잔여 {p.remain} / 정원 {p.capacity}
                    </p>
                    <Button
                      disabled={p.status !== "OPEN" || reservingId === p.id}
                      onClick={() => handleReserve(p.id)}
                      size="sm"
                    >
                      {reservingId === p.id ? "예약 중…" : "예약하기"}
                    </Button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}