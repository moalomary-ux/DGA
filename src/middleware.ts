// MOCK MIDDLEWARE — يسمح لكل الـ requests بدون auth check
import { NextResponse } from 'next/server';
export function middleware() { return NextResponse.next(); }
export const config = { matcher: [] };
