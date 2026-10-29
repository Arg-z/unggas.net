"use client";

import { useActionState } from "react";
import { daftar, masuk, type ActionResult } from "@/app/actions/auth";

export function DaftarForm({ denganEmail }: { denganEmail: boolean }) {
  const [state, action, pending] = useActionState<ActionResult | null, FormData>(daftar, null);
  return (
    <form action={action} className="flex flex-col gap-4">
      <input
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        className="hidden"
        aria-hidden="true"
      />
      <label className="block">
        <span className="label">Username</span>
        <input
          name="username"
          required
          minLength={3}
          maxLength={32}
          autoComplete="username"
          placeholder="contoh: peternak_puyuh"
          className="input mt-2"
        />
      </label>
      {denganEmail && (
        <label className="block">
          <span className="label">Email</span>
          <input
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="nama@email.com"
            className="input mt-2"
          />
        </label>
      )}
      <label className="block">
        <span className="label">Password</span>
        <input
          name="password"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          className="input mt-2"
        />
        <span className="hint mt-1.5 block">Minimal 8 karakter.</span>
      </label>
      {state && !state.ok && (
        <p role="alert" className="alert-error">
          {state.alasan}
        </p>
      )}
      <button type="submit" disabled={pending} className="btn btn-primary mt-1">
        {pending ? "Mendaftarkan..." : "Daftar"}
      </button>
    </form>
  );
}

export function MasukForm({ denganEmail }: { denganEmail: boolean }) {
  const [state, action, pending] = useActionState<ActionResult | null, FormData>(masuk, null);
  return (
    <form action={action} className="flex flex-col gap-4">
      <label className="block">
        <span className="label">{denganEmail ? "Username atau email" : "Username"}</span>
        <input
          name="identitas"
          required
          autoComplete="username"
          placeholder={denganEmail ? undefined : "peternak_puyuh"}
          className="input mt-2"
        />
      </label>
      <label className="block">
        <span className="label">Password</span>
        <input
          name="password"
          type="password"
          required
          autoComplete="current-password"
          className="input mt-2"
        />
      </label>
      {state && !state.ok && (
        <p role="alert" className="alert-error">
          {state.alasan}
        </p>
      )}
      <button type="submit" disabled={pending} className="btn btn-primary mt-1">
        {pending ? "Memeriksa..." : "Masuk"}
      </button>
    </form>
  );
}
