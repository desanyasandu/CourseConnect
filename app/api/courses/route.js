import { NextResponse } from 'next/server';
import { executeOracleQuery } from '@/lib/oracle';
import { connectMongo } from '@/lib/mongo';
import mongoose from 'mongoose';

export async function GET() {
    try {
        const oracleCourses = await executeOracleQuery('SELECT * FROM COURSE WHERE is_active = 1');

        if (!oracleCourses || oracleCourses.length === 0) {
            return NextResponse.json({ success: true, data: [] });
        }

        await connectMongo();
        const db = mongoose.connection.db;

        const courseIds = oracleCourses.map(course => course.COURSE_ID);

        // Fetch course materials and reviews in parallel for all courses to resolve N+1 queries
        const [allMaterials, allReviews] = await Promise.all([
            db.collection('course_materials').find({ course_id: { $in: courseIds } }).toArray(),
            db.collection('student_reviews').find({ course_id: { $in: courseIds } }).toArray()
        ]);

        // Map course materials by course_id for O(1) lookup
        const materialsMap = new Map(allMaterials.map(m => [m.course_id, m]));

        // Group student reviews by course_id for O(1) lookup
        const reviewsMap = new Map();
        allReviews.forEach(r => {
            if (!reviewsMap.has(r.course_id)) {
                reviewsMap.set(r.course_id, []);
            }
            reviewsMap.get(r.course_id).push(r);
        });

        const hybridCourses = oracleCourses.map((course) => {
            const courseId = course.COURSE_ID;
            const materials = materialsMap.get(courseId);
            const reviews = reviewsMap.get(courseId) || [];

            return {
                id: courseId,
                title: course.TITLE,
                description: course.DESCRIPTION,
                price: course.PRICE,
                category: course.CATEGORY,
                lectureNotes: materials ? materials.lecture_notes : [],
                reviews: reviews.map(r => ({ rating: r.rating, comment: r.comment }))
            };
        });

        return NextResponse.json({ success: true, data: hybridCourses });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const body = await request.json();
        const { title, description, price, category, lectureNotes, reviews } = body;

        if (!title || !price) {
            return NextResponse.json({ success: false, error: 'Title and Price are required' }, { status: 400 });
        }

        // 1. Generate next sequential course ID from Oracle DB
        const courses = await executeOracleQuery('SELECT COURSE_ID FROM COURSE');
        const maxIdNum = courses.reduce((max, c) => {
            const num = parseInt(c.COURSE_ID.replace('C', ''), 10);
            return isNaN(num) ? max : Math.max(max, num);
        }, 0);
        const newCourseId = `C${String(maxIdNum + 1).padStart(3, '0')}`;

        // 2. Insert into Oracle DB
        await executeOracleQuery(
            `INSERT INTO COURSE (COURSE_ID, TITLE, DESCRIPTION, PRICE, CATEGORY, IS_ACTIVE)
             VALUES (:id, :title, :description, :price, :category, 1)`,
            {
                id: newCourseId,
                title: title,
                description: description || '',
                price: Number(price),
                category: category || 'General'
            }
        );

        // 3. Connect to MongoDB and save unstructured details
        await connectMongo();
        const db = mongoose.connection.db;

        // Save lecture notes if provided
        if (lectureNotes && Array.isArray(lectureNotes)) {
            await db.collection('course_materials').updateOne(
                { course_id: newCourseId },
                { $set: { lecture_notes: lectureNotes } },
                { upsert: true }
            );
        }

        // Save reviews if provided
        if (reviews && Array.isArray(reviews) && reviews.length > 0) {
            const reviewsToInsert = reviews.map(r => ({
                course_id: newCourseId,
                rating: Number(r.rating) || 5,
                comment: r.comment || ''
            }));
            await db.collection('student_reviews').insertMany(reviewsToInsert);
        }

        return NextResponse.json({ success: true, data: { id: newCourseId } });
    } catch (error) {
        console.error('POST Error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function PUT(request) {
    try {
        const body = await request.json();
        const { id, title, description, price, category, lectureNotes, reviews } = body;

        if (!id || !title || !price) {
            return NextResponse.json({ success: false, error: 'Course ID, Title and Price are required' }, { status: 400 });
        }

        // 1. Update Oracle DB
        await executeOracleQuery(
            `UPDATE COURSE 
             SET TITLE = :title, DESCRIPTION = :description, PRICE = :price, CATEGORY = :category
             WHERE COURSE_ID = :id`,
            {
                id,
                title,
                description: description || '',
                price: Number(price),
                category: category || 'General'
            }
        );

        // 2. Connect to MongoDB and update unstructured details
        await connectMongo();
        const db = mongoose.connection.db;

        // Update lecture notes
        await db.collection('course_materials').updateOne(
            { course_id: id },
            { $set: { lecture_notes: lectureNotes || [] } },
            { upsert: true }
        );

        // Update student reviews (Delete old ones and replace)
        await db.collection('student_reviews').deleteMany({ course_id: id });
        if (reviews && Array.isArray(reviews) && reviews.length > 0) {
            const reviewsToInsert = reviews.map(r => ({
                course_id: id,
                rating: Number(r.rating) || 5,
                comment: r.comment || ''
            }));
            await db.collection('student_reviews').insertMany(reviewsToInsert);
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('PUT Error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function DELETE(request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ success: false, error: 'Course ID is required' }, { status: 400 });
        }

        // 1. Soft delete in Oracle DB (set is_active = 0)
        await executeOracleQuery(
            'UPDATE COURSE SET IS_ACTIVE = 0 WHERE COURSE_ID = :id',
            { id }
        );

        // 2. Connect to MongoDB and delete unstructured details
        await connectMongo();
        const db = mongoose.connection.db;
        await Promise.all([
            db.collection('course_materials').deleteOne({ course_id: id }),
            db.collection('student_reviews').deleteMany({ course_id: id })
        ]);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('DELETE Error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}