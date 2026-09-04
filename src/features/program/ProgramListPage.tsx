import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "../../components/ui";
import { getPrograms, reserveProgram, getMyReservations } from "./program.ts";
import { ApiError } from "../../lib/apiError.ts";
import { resolveProgramImageUrl } from "../../lib/imageUrl.ts";
import type { ProgramResponse, ReservationResponse } from "./types.ts";

export default function ProgramListPage() {
  const [programs, setPrograms] = useState<ProgramResponse[]>([]);
  const [myReservations, setMyReservations] = useState<ReservationResponse[]>([]);
  const [quantities, setQuantities] = useState<Record<number, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [reservingId, setReservingId] = useState<number | null>(null);

  const loadAll = () => {
    setLoading(true);
    Promise.all([getPrograms(), getMyReservations().catch(() => [] as ReservationResponse[])])
      .then(([programData, reservationData]) => {
        setPrograms(programData);
        setMyReservations(reservationData);
      })
      .catch(() => setError("프로그램 목록을 불러오지 못했습니다."))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    void Promise.resolve().then(loadAll)
  }, []);

  const reservedProgramNames = new Set(
    myReservations.filter((r) => r.status === "RESERVED").map((r) => r.programName),
  );

  const handleQuantityChange = (programId: number, value: number) => {
    setQuantities((prev) => ({ ...prev, [programId]: value }));
  };

  const handleReserve = async (programId: number, maxRemain: number) => {
    setError("");
    setNotice("");
    const quantity = quantities[programId] ?? 1;
    if (quantity < 1 || quantity > maxRemain) {
      setError(`인원은 1명 이상 ${maxRemain}명 이하로 입력해주세요.`);
      return;
    }
    if (reservingId !== null) return;
    setReservingId(programId);
    try {
      await reserveProgram({ programId, quantity });
      setNotice("예약이 완료되었습니다.");
      loadAll();
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
      <section className="bg-subtle">
        <div className="mx-auto max-w-[1240px] px-6 py-16 md:px-12 md:py-20">
          <p className="text-[11px] font-medium tracking-[0.17em] text-gold-500">
            MINDFUL PROGRAMS · 마음챙김 프로그램
          </p>
          <h1 className="mt-5 max-w-[620px] text-5xl font-medium leading-[1.15] tracking-[-0.035em] md:text-[62px]">
            고요를 연습하는 하루,
            <br />
            나를 돌보는 시간
          </h1>
          <p className="mt-6 max-w-[620px] text-sm leading-7 text-secondary">
            머무는 동안 몸과 마음을 천천히 가다듬어 보세요.
            <br className="hidden md:block" />
            숙박 중 참여할 수 있는 다양한 명상 프로그램을 안내합니다.
          </p>
          <Link
            className="mt-6 inline-flex min-h-11 items-center rounded-sm bg-navy-900 px-6 text-xs font-medium tracking-[0.05em] text-white transition hover:bg-navy-700"
            to="/reviews"
          >
            이용 후기 보기
          </Link>
        </div>
      </section>

      <section className="bg-white px-6 py-14 md:px-[100px]">
        <div className="mx-auto max-w-[1240px]">
          <div aria-live="polite" className="mb-6 min-h-[46px]">
            {notice && (
              <p
                className="rounded-sm border border-border-accent bg-[#faf6ed] px-4 py-3 text-sm text-ink-700"
                role="status"
              >
                {notice}
              </p>
            )}
            {error && (
              <p
                className="rounded-sm border border-error-border bg-[#f8eeeb] px-4 py-3 text-sm text-error"
                role="alert"
              >
                {error}
              </p>
            )}
          </div>

          {loading && <p className="py-12 text-sm text-ink-500">불러오는 중…</p>}

          {!loading && programs.length === 0 && (
            <div className="border border-dashed border-[#c7bfad] px-6 py-24 text-center text-sm leading-7 text-ink-500">
              현재 등록된 프로그램이 없습니다.
            </div>
          )}

          {!loading && programs.length > 0 && (
            <div className="grid gap-6 md:grid-cols-2">
              {programs.map((p) => {
                const alreadyReserved = reservedProgramNames.has(p.name);
                const isReserving = reservingId === p.id;
                return (
                  <article
                    key={p.id}
                    className="grid overflow-hidden rounded-[14px] border border-border-subtle bg-white sm:grid-cols-[200px_1fr]"
                  >
                    <div className="grid h-[200px] place-items-center overflow-hidden bg-[#e8e3d9] text-[10px] text-ink-500 sm:h-full">
                      {p.pictureUrl ? (
                      <img alt={p.name} className="size-full object-cover" src={resolveProgramImageUrl(p.pictureUrl)} />
                      ) : (
                        "NO IMAGE"
                      )}
                    </div>
                    <div className="flex flex-col gap-3 px-6 py-6">
                      <p className="text-[10px] font-medium tracking-[0.14em] text-gold-500">
                        {p.status === "OPEN" ? "모집중" : "마감"}
                      </p>
                      <h3 className="font-display text-2xl font-semibold text-navy-900">{p.name}</h3>
                      <p className="text-xs font-medium text-ink-500">
                        잔여 {p.remain} / 정원 {p.capacity}
                      </p>

                      {alreadyReserved ? (
                        <p className="mt-auto text-xs text-ink-500">이미 예약한 프로그램입니다.</p>
                      ) : (
                        <div className="mt-auto flex items-center gap-2">
                          <label className="flex items-center gap-1 text-xs text-ink-700">
                            인원
                            <input
                              type="number"
                              min={1}
                              max={p.remain}
                              value={quantities[p.id] ?? 1}
                              onChange={(e) => handleQuantityChange(p.id, Number(e.target.value))}
                              className="w-16 rounded-sm border border-[#cfc7ba] px-2 py-1 text-sm"
                              disabled={p.status !== "OPEN" || isReserving}
                            />
                            명
                          </label>
                          <Button
                            disabled={p.status !== "OPEN" || isReserving || p.remain === 0}
                            onClick={() => handleReserve(p.id, p.remain)}
                            size="sm"
                          >
                            {isReserving ? "예약 중…" : "예약하기"}
                          </Button>
                        </div>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
