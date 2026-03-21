import { NextResponse } from "next/server"

export function apiSuccess<T>(data: T, status: number = 200) {
  return NextResponse.json({ ok: true, ...data as object }, { status })
}

export function apiError(message: string, status: number = 400) {
  return NextResponse.json({ ok: false, error: message }, { status })
}
