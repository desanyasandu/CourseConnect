import { NextResponse } from 'next/server';
import { executeOracleQuery } from '@/lib/oracle';

export async function GET() {
    try {
        const query = `
            SELECT c.title, COUNT(DISTINCT e.enrollment_id) AS total_enrollments, COALESCE(SUM(p.amount_paid), 0) AS total_revenue
            FROM COURSE c
            LEFT JOIN ENROLLMENT e ON c.course_id = e.course_id
            LEFT JOIN PAYMENT p ON e.enrollment_id = p.enrollment_id
            GROUP BY c.course_id, c.title
            ORDER BY total_enrollments DESC
        `;
        const analyticsData = await executeOracleQuery(query);

        return NextResponse.json({ success: true, data: analyticsData });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}