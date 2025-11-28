// app/api/revalidate/route.js
import { revalidatePath } from 'next/cache';
import { NextResponse } from 'next/server';

export async function POST() {
    try {
        // Revalidate semua halaman yang menggunakan settings
        revalidatePath('/', 'layout');

        return NextResponse.json({ revalidated: true, now: Date.now() });
    } catch (err) {
        return NextResponse.json({
            revalidated: false,
            error: err.message
        }, { status: 500 });
    }
}