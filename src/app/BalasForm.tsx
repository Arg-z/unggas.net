"use client";

import { useActionState } from "react";
import { balas, type ActionResult } from "@/app/actions/forum";

export function BalasForm({ discussionId }: { discussionId: number }) {
  const [state, action, pending] = useActionState<ActionResult | null, FormData>(balas, null);
  return (
    <form action={action} className="panel px-4 py-4 sm:px-5 sm:py-5">
      <input type="hidden" name="discussionId" value={discussionId} />
      <label htmlFor="content" className="label">
        Tulis balasan
      </label>
      <textarea
        id="content"
        name="content"
        required
        minLength={2}
        maxLength={20000}
        rows={5}
        className="input mt-3"
        placeholder="Tulis tanggapanmu di sini..."
      />
      {state && !state.ok && (
        <p role="alert" className="alert-error mt-3">
          {state.alasan}
        </p>
      )}
      {state && state.ok && (
        <p role="status" className="alert-ok mt-3">
          Balasan terkirim.
        </p>
      )}
      <div className="mt-4 flex justify-end">
        <button type="submit" disabled={pending} className="btn btn-primary w-full sm:w-auto">
          {pending ? "Mengirim..." : "Kirim balasan"}
        </button>
      </div>
    </form>
  );
}
