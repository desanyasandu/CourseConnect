import { NextResponse } from 'next/server';
import { executeOracleQuery } from '@/lib/oracle';
import { connectMongo } from '@/lib/mongo';
import mongoose from 'mongoose';

export async function GET() {
    try {

        const oracleCourses = await executeOracleQuery('SELECT * FROM COURSE WHERE is_active = 1');


        await connectMongo();
        const db = mongoose.connection.db;


        const hybridCourses = await Promise.all(oracleCourses.map(async (course) => {
            const materials = await db.collection('course_materials').findOne({ course_id: course.COURSE_ID });
            const reviews = await db.collection('student_reviews').find({ course_id: course.COURSE_ID }).toArray();

            return {
                id: course.COURSE_ID,
                title: course.TITLE,
                description: course.DESCRIPTION,
                price: course.PRICE,
                category: course.CATEGORY,
                lectureNotes: materials ? materials.lecture_notes : [],
                reviews: reviews.map(r => ({ rating: r.rating, comment: r.comment }))
            };
        }));

        return NextResponse.json({ success: true, data: hybridCourses });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}