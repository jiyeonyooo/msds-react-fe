// src/pages/ProgramListPage.tsx
import { useEffect, useState } from "react";
import { getPrograms, reserveProgram } from "./program.ts";
import { ApiError } from "../../lib/apiError.ts";
import type { ProgramResponse } from "./types.ts";
import { Link } from "react-router-dom";

export default function ProgramListPage() {
  const [programs, setPrograms] = useState<ProgramResponse[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
  getPrograms().then((data) => {
    console.log("받은 데이터:", data);
    setPrograms(data);
  }).catch(console.error);
}, []);

  const handleReserve = async (programId: number) => {
    setError(null);
    try {
      await reserveProgram({ programId, quantity: 1 });
      setPrograms(await getPrograms());
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message); // 백엔드가 텍스트로 에러를 내려주는 경우
      } else {
        setError("예약 중 오류가 발생했습니다.");
      }
    }
  };

  return (
    <div>
      <Link to="/reviews">
        <button>
          후기 게시판 보기
        </button>
      </Link>
      {error && <p style={{ color: "red" }}>{error}</p>}
      <ul>
        {programs.map((p) => (
          <li key={p.id}>
            {p.name} ({p.remain}/{p.capacity})
            <button disabled={p.status === "CLOSED"} onClick={() => handleReserve(p.id)}>
              예약
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}