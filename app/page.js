"use client";

import React, { useState, useEffect } from "react";

export default function Dashboard() {
    const [courses, setCourses] = useState([]);
    const [analytics, setAnalytics] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("All");

    // Modal Form States
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState("create"); // "create" | "edit"
    const [editingId, setEditingId] = useState(null);
    const [formTitle, setFormTitle] = useState("");
    const [formDescription, setFormDescription] = useState("");
    const [formPrice, setFormPrice] = useState("");
    const [formCategory, setFormCategory] = useState("Web Development");
    const [formNotes, setFormNotes] = useState("");
    const [formRating, setFormRating] = useState("5");
    const [formComment, setFormComment] = useState("");

    // Fetch data function (reusable for real-time updates)
    async function fetchData() {
        try {
            const [coursesRes, analyticsRes] = await Promise.all([
                fetch("/api/courses"),
                fetch("/api/analytics"),
            ]);

            if (!coursesRes.ok || !analyticsRes.ok) {
                throw new Error("Failed to fetch one or both endpoints");
            }

            const coursesJson = await coursesRes.json();
            const analyticsJson = await analyticsRes.json();

            if (coursesJson.success && analyticsJson.success) {
                setCourses(coursesJson.data || []);
                setAnalytics(analyticsJson.data || []);
            } else {
                throw new Error(coursesJson.error || analyticsJson.error || "Data load failed");
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        fetchData();
    }, []);

    const categories = ["All", ...new Set(courses.map((c) => c.category).filter(Boolean))];

    const filteredCourses = courses.filter((course) => {
        const matchesSearch =
            course.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            course.description?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory =
            selectedCategory === "All" || course.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    const getAnalyticsForCourse = (title) => {
        return (
            analytics.find((a) => a.TITLE?.toLowerCase() === title?.toLowerCase()) || {
                TOTAL_ENROLLMENTS: 0,
                TOTAL_REVENUE: 0,
            }
        );
    };

    const totalAllEnrollments = analytics.reduce((acc, curr) => acc + (Number(curr.TOTAL_ENROLLMENTS) || 0), 0);
    const totalAllRevenue = analytics.reduce((acc, curr) => acc + (Number(curr.TOTAL_REVENUE) || 0), 0);
    const maxEnrollments = Math.max(...analytics.map(a => Number(a.TOTAL_ENROLLMENTS) || 1), 1);

    // Dynamic Calendar Generation
    const [currentDate] = useState(new Date());
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth(); // 0-indexed
    const todayDate = currentDate.getDate();
    const monthName = currentDate.toLocaleString('default', { month: 'long' });

    const getDaysInMonth = (y, m) => new Date(y, m + 1, 0).getDate();
    const getFirstDayOfMonth = (y, m) => new Date(y, m, 1).getDay();

    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);

    const days = [];
    for (let i = 0; i < firstDay; i++) {
        days.push(null);
    }
    for (let d = 1; d <= daysInMonth; d++) {
        days.push(d);
    }

    // Dynamic course background mappings matching the LearnIQ image
    const getCourseCardStyles = (index) => {
        const styleIndex = index % 3;
        if (styleIndex === 0) {
            return {
                bg: "bg-[#e0f2fe]/80 border-[#bae6fd]", // soft teal/blue
                badgeBg: "bg-sky-500/10 text-sky-700",
                text: "text-sky-950",
                accent: "text-sky-500",
                icon: "📝",
                colorCode: "#0ea5e9"
            };
        }
        if (styleIndex === 1) {
            return {
                bg: "bg-[#fee2e2]/80 border-[#fecaca]", // soft rose/salmon
                badgeBg: "bg-rose-500/10 text-rose-700",
                text: "text-rose-950",
                accent: "text-rose-500",
                icon: "🎨",
                colorCode: "#f43f5e"
            };
        }
        return {
            bg: "bg-[#f3e8ff]/80 border-[#e9d5ff]", // soft purple
            badgeBg: "bg-purple-500/10 text-purple-700",
            text: "text-purple-950",
            accent: "text-purple-500",
            icon: "📷",
            colorCode: "#a855f7"
        };
    };

    // Modal Control Functions
    const openCreateModal = () => {
        setModalMode("create");
        setEditingId(null);
        setFormTitle("");
        setFormDescription("");
        setFormPrice("");
        setFormCategory("Web Development");
        setFormNotes("");
        setFormRating("5");
        setFormComment("");
        setIsModalOpen(true);
    };

    const openEditModal = (course) => {
        setModalMode("edit");
        setEditingId(course.id);
        setFormTitle(course.title || "");
        setFormDescription(course.description || "");
        setFormPrice(course.price || "");
        setFormCategory(course.category || "Web Development");
        setFormNotes((course.lectureNotes || []).join(", "));
        
        // Populate first review if available
        if (course.reviews && course.reviews.length > 0) {
            setFormRating(String(course.reviews[0].rating));
            setFormComment(course.reviews[0].comment || "");
        } else {
            setFormRating("5");
            setFormComment("");
        }
        setIsModalOpen(true);
    };

    // CRUD Submission Handler
    const handleFormSubmit = async (e) => {
        e.preventDefault();
        if (!formTitle || !formPrice) {
            alert("Title and Price are required fields!");
            return;
        }

        const notesArray = formNotes
            ? formNotes.split(",").map(n => n.trim()).filter(Boolean)
            : [];

        const reviewsArray = formComment
            ? [{ rating: Number(formRating), comment: formComment }]
            : [];

        const payload = {
            title: formTitle,
            description: formDescription,
            price: Number(formPrice),
            category: formCategory,
            lectureNotes: notesArray,
            reviews: reviewsArray
        };

        try {
            setLoading(true);
            let res;
            if (modalMode === "create") {
                res = await fetch("/api/courses", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload)
                });
            } else {
                res = await fetch("/api/courses", {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ id: editingId, ...payload })
                });
            }

            const data = await res.json();
            if (data.success) {
                setIsModalOpen(false);
                await fetchData();
            } else {
                alert(`Operation failed: ${data.error}`);
                setLoading(false);
            }
        } catch (err) {
            alert(`Error submitting form: ${err.message}`);
            setLoading(false);
        }
    };

    // DELETE Action
    const handleDeleteCourse = async (id) => {
        if (!confirm("Are you sure you want to delete this course from Oracle & MongoDB?")) {
            return;
        }

        try {
            setLoading(true);
            const res = await fetch(`/api/courses?id=${id}`, {
                method: "DELETE"
            });
            const data = await res.json();
            if (data.success) {
                await fetchData();
            } else {
                alert(`Delete failed: ${data.error}`);
                setLoading(false);
            }
        } catch (err) {
            alert(`Error deleting course: ${err.message}`);
            setLoading(false);
        }
    };

    if (loading && courses.length === 0) {
        return (
            <div className="min-h-screen bg-[#f0f5f9] flex items-center justify-center p-8">
                <div className="text-slate-500 font-extrabold text-lg flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full border-4 border-slate-300 border-t-indigo-600 animate-spin"></span>
                    Loading CourseConnect Dashboard...
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-[#f0f5f9] flex items-center justify-center p-8">
                <div className="bg-white border border-red-200 rounded-[32px] p-8 max-w-md text-center space-y-4 shadow-xl">
                    <div className="text-red-500 text-5xl">⚠️</div>
                    <h2 className="text-xl font-black text-slate-800">Connection Failed</h2>
                    <p className="text-slate-500 text-sm font-semibold">{error}</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black transition cursor-pointer shadow-md"
                    >
                        Retry Connection
                    </button>
                </div>
            </div>
        );
    }

    // Map first 3 courses to represent the left vertical cards
    const featuredCourses = filteredCourses.slice(0, 3);

    // Map some reviews for the center Column
    const activeReviews = courses.flatMap(c => (c.reviews || []).map(r => ({ ...r, courseTitle: c.title }))).slice(0, 3);

    return (
        <div className="min-h-screen w-full bg-[#f0f5f9] p-4 sm:p-6 lg:p-8 font-sans selection:bg-indigo-500/10 selection:text-indigo-900 flex flex-col justify-between gap-6 relative overflow-hidden">
            
            {/* Header bar */}
            <header className="flex flex-col md:flex-row items-center justify-between gap-4 pb-4 border-b border-slate-200/60">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-950 flex items-center justify-center text-white text-lg font-black shadow-md">
                        ●
                    </div>
                    <div>
                        <span className="text-lg font-black text-slate-900 tracking-tight">CourseConnect</span>
                        <span className="text-[10px] block font-black uppercase text-indigo-600/80 tracking-wider">Oracle + Mongo System</span>
                    </div>
                </div>

                {/* Navigation Pills (Matches LearnIQ Navigation Icons) */}
                <div className="flex items-center gap-1.5 bg-white border border-slate-200/60 rounded-full p-1.5 shadow-sm">
                    <button className="w-9 h-9 rounded-full bg-slate-950 text-white flex items-center justify-center text-sm font-black transition shadow-sm hover:scale-105 cursor-pointer">
                        㗊
                    </button>
                    <button className="w-9 h-9 rounded-full bg-transparent hover:bg-slate-100 text-slate-500 hover:text-slate-800 flex items-center justify-center text-sm transition cursor-pointer">
                        🎓
                    </button>
                    <button className="w-9 h-9 rounded-full bg-transparent hover:bg-slate-100 text-slate-500 hover:text-slate-800 flex items-center justify-center text-sm transition cursor-pointer">
                        📄
                    </button>
                    <button className="w-9 h-9 rounded-full bg-transparent hover:bg-slate-100 text-slate-500 hover:text-slate-800 flex items-center justify-center text-sm transition cursor-pointer">
                        💬
                    </button>
                    <button className="w-9 h-9 rounded-full bg-transparent hover:bg-slate-100 text-slate-500 hover:text-slate-800 flex items-center justify-center text-sm transition cursor-pointer">
                        📅
                    </button>
                    <button className="w-9 h-9 rounded-full bg-transparent hover:bg-slate-100 text-slate-500 hover:text-slate-800 flex items-center justify-center text-sm transition cursor-pointer">
                        📊
                    </button>
                    <button className="w-9 h-9 rounded-full bg-transparent hover:bg-slate-100 text-slate-500 hover:text-slate-800 flex items-center justify-center text-sm transition cursor-pointer">
                        ⚙️
                    </button>
                </div>

                {/* Notification & User Profile */}
                <div className="flex items-center gap-4">
                    <button className="w-10 h-10 rounded-full bg-white border border-slate-200/60 flex items-center justify-center text-slate-600 shadow-sm hover:bg-slate-50 transition cursor-pointer">
                        🔔
                    </button>
                    <div className="flex items-center gap-2">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 border border-white shadow-md flex items-center justify-center text-white font-extrabold text-sm overflow-hidden">
                            DY
                        </div>
                    </div>
                </div>
            </header>

            {/* Dashboard Grid Container */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 flex-1">

                {/* COLUMN 1 (LEFT): Welcome & New Courses (col-span-3) */}
                <div className="md:col-span-3 space-y-6">
                    <div className="space-y-1">
                        <h2 className="text-xl font-black text-slate-500 tracking-tight leading-tight">Welcome back!</h2>
                        <h3 className="text-3xl font-extrabold text-slate-900 tracking-tight leading-none">Desan Yasandu 👋</h3>
                    </div>

                    {/* Search & Filter widget */}
                    <div className="space-y-3">
                        <input
                            type="text"
                            placeholder="Filter courses..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full px-4 py-2.5 text-xs bg-white border border-slate-200 text-slate-900 placeholder:text-slate-400 rounded-xl focus:outline-none focus:border-indigo-500 shadow-sm transition"
                        />
                        <div className="flex flex-wrap gap-1">
                            {categories.slice(0, 4).map((cat) => (
                                <button
                                    key={cat}
                                    onClick={() => setSelectedCategory(cat)}
                                    className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase transition cursor-pointer ${selectedCategory === cat ? "bg-slate-950 text-white" : "bg-white text-slate-500 border border-slate-200/80 hover:bg-slate-50"}`}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Vertical stack of colorful course cards */}
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <h4 className="text-xs font-black uppercase text-slate-500 tracking-widest">New Courses</h4>
                            <button
                                onClick={openCreateModal}
                                className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-black uppercase rounded-lg shadow-sm transition cursor-pointer"
                            >
                                + Add Course
                            </button>
                        </div>
                        
                        {featuredCourses.length === 0 ? (
                            <p className="text-xs text-slate-400 italic">No courses found matching filters.</p>
                        ) : (
                            featuredCourses.map((course, idx) => {
                                const style = getCourseCardStyles(idx);
                                const notesCount = course.lectureNotes?.length || 0;
                                const averageRating = course.reviews?.length > 0
                                    ? (course.reviews.reduce((acc, r) => acc + (Number(r.rating) || 0), 0) / course.reviews.length).toFixed(1)
                                    : "4.8";

                                return (
                                    <div
                                        key={course.id}
                                        className={`p-4 rounded-3xl border ${style.bg} ${style.border} shadow-sm hover:shadow-md hover:scale-[1.02] transition-all duration-300 relative group`}
                                    >
                                        <div className="flex items-start justify-between">
                                            <span className={`w-8 h-8 rounded-xl ${style.badgeBg} flex items-center justify-center text-sm font-semibold`}>
                                                {style.icon}
                                            </span>
                                            
                                            {/* Course Action Buttons */}
                                            <div className="flex items-center gap-1">
                                                <button
                                                    onClick={() => openEditModal(course)}
                                                    className="w-7 h-7 rounded-full bg-white border border-slate-200/60 text-slate-700 flex items-center justify-center text-[10px] hover:bg-indigo-50 hover:text-indigo-600 transition shadow-sm cursor-pointer"
                                                    title="Edit Course"
                                                >
                                                    ✏️
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteCourse(course.id)}
                                                    className="w-7 h-7 rounded-full bg-white border border-slate-200/60 text-red-500 flex items-center justify-center text-[10px] hover:bg-red-50 transition shadow-sm cursor-pointer"
                                                    title="Delete Course"
                                                >
                                                    🗑️
                                                </button>
                                            </div>
                                        </div>
                                        <div className="mt-4 space-y-1">
                                            <h5 className={`text-md font-bold ${style.text} truncate`}>{course.title}</h5>
                                            <p className="text-[10px] text-slate-500 font-bold">{notesCount} Lessons/Notes</p>
                                        </div>
                                        <div className="mt-4 pt-3 border-t border-slate-200/40 flex items-center justify-between text-xs">
                                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Type: {course.category}</span>
                                            <span className="flex items-center gap-1 font-bold text-amber-600">
                                                ★ {averageRating}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* COLUMN 2 (MIDDLE): Premium Banner, Assignments, Checklists (col-span-4) */}
                <div className="md:col-span-4 space-y-6">
                    
                    {/* Go Premium Card Banner */}
                    <div className="relative overflow-hidden rounded-[28px] p-6 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-950 text-white shadow-xl flex items-center justify-between gap-4">
                        <div className="space-y-4 relative z-10">
                            <div className="flex items-center gap-2">
                                <span className="w-4 h-4 rounded-full bg-white flex items-center justify-center text-[8px] text-black">●</span>
                                <span className="text-[10px] font-black uppercase tracking-wider">CourseConnect</span>
                            </div>
                            <div className="space-y-1">
                                <h4 className="text-lg font-black leading-tight">Go Premium</h4>
                                <p className="text-[10px] text-slate-400 leading-normal max-w-[160px]">Explore 25k+ courses with lifetime membership.</p>
                            </div>
                            <button className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl text-[10px] font-black transition cursor-pointer shadow-md shadow-amber-500/10">
                                Get Access
                            </button>
                        </div>

                        {/* Books SVG Illustration */}
                        <div className="w-24 h-24 shrink-0 opacity-80">
                            <svg viewBox="0 0 100 100" className="w-full h-full text-indigo-400">
                                <rect x="25" y="40" width="30" height="50" rx="3" fill="currentColor" opacity="0.3" transform="rotate(-15 40 65)" />
                                <rect x="45" y="30" width="28" height="55" rx="3" fill="currentColor" opacity="0.6" />
                                <path d="M 45,30 L 73,30 L 59,10 Z" fill="#eab308" />
                                <circle cx="59" cy="45" r="4" fill="white" />
                            </svg>
                        </div>
                    </div>

                    {/* Recent Reviews (replaces Assignment list) */}
                    <div className="bg-white border border-slate-200/60 rounded-[28px] p-5 space-y-4 shadow-sm">
                        <div className="flex justify-between items-center">
                            <h4 className="text-sm font-black text-slate-900 tracking-tight">Student Feedback</h4>
                            <button className="text-[10px] font-black text-indigo-600 hover:text-indigo-800 transition">View All</button>
                        </div>

                        <div className="space-y-3">
                            {activeReviews.length === 0 ? (
                                <p className="text-xs text-slate-400 italic">No feedback reviews available yet.</p>
                            ) : (
                                activeReviews.map((review, idx) => (
                                    <div key={idx} className="flex items-center justify-between gap-3 p-3 bg-slate-50 hover:bg-slate-100/80 rounded-2xl transition border border-slate-100">
                                        <div className="flex items-center gap-3">
                                            <span className="text-lg">💬</span>
                                            <div className="space-y-0.5 max-w-[130px]">
                                                <p className="text-xs font-bold text-slate-800 truncate">{review.courseTitle}</p>
                                                <p className="text-[9px] text-slate-400 font-semibold truncate">&quot;{review.comment}&quot;</p>
                                            </div>
                                        </div>
                                        <span className={`px-2.5 py-1 rounded-full text-[8px] font-black uppercase tracking-wider ${review.rating >= 4 ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}>
                                            ★ {review.rating}.0
                                        </span>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* checklist - System status */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between p-3.5 bg-white border border-slate-200/60 rounded-2xl shadow-sm">
                            <div className="flex items-center gap-3">
                                <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-xs font-bold">✓</span>
                                <span className="text-xs font-bold text-slate-800">Oracle SQL Schema Sync</span>
                            </div>
                            <span className="text-slate-400 text-xs">🔗</span>
                        </div>
                        <div className="flex items-center justify-between p-3.5 bg-white border border-slate-200/60 rounded-2xl shadow-sm">
                            <div className="flex items-center gap-3">
                                <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-xs font-bold">✓</span>
                                <span className="text-xs font-bold text-slate-800">MongoDB Document Store</span>
                            </div>
                            <span className="text-slate-400 text-xs">🔗</span>
                        </div>
                        <div className="flex items-center justify-between p-3.5 bg-white border border-slate-200/60 rounded-2xl shadow-sm">
                            <div className="flex items-center gap-3">
                                <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-xs font-bold">✓</span>
                                <span className="text-xs font-bold text-slate-800">BI Analytics Aggregator</span>
                            </div>
                            <span className="text-slate-400 text-xs">🔗</span>
                        </div>
                    </div>

                </div>

                {/* COLUMN 3 (RIGHT-MIDDLE): Hours Activity (Bars) & Progress (col-span-3) */}
                <div className="md:col-span-3 space-y-6">
                    
                    {/* Hours Activity (Bar Chart representing live analytics) */}
                    <div className="bg-white border border-slate-200/60 rounded-[28px] p-5 space-y-4 shadow-sm relative">
                        <div className="flex justify-between items-center">
                            <div className="space-y-0.5">
                                <h4 className="text-sm font-black text-slate-900 tracking-tight">Enrollment Weights</h4>
                                <p className="text-[9px] font-bold text-slate-400">+3% Increase vs Last Week</p>
                            </div>
                            <button className="w-7 h-7 rounded-full bg-slate-50 border border-slate-200 text-slate-600 flex items-center justify-center text-xs hover:bg-slate-100 transition cursor-pointer">
                                ⚙
                            </button>
                        </div>

                        {/* Dynamic Bar Charts */}
                        <div className="flex items-end justify-between h-32 pt-4 px-2">
                            {analytics.slice(0, 6).map((report, idx) => {
                                const percent = Math.max(Math.min(((Number(report.TOTAL_ENROLLMENTS) || 0) / maxEnrollments) * 100, 100), 10);
                                const color = getCourseCardStyles(idx).colorCode;

                                return (
                                    <div key={idx} className="flex flex-col items-center gap-2 group relative">
                                        {/* Tooltip on Hover */}
                                        <span className="absolute bottom-full mb-1 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-950 text-white text-[8px] font-black py-1 px-1.5 rounded shadow-md pointer-events-none whitespace-nowrap z-20">
                                            {report.TOTAL_ENROLLMENTS} Students
                                        </span>
                                        
                                        {/* Bar */}
                                        <div className="w-4 bg-slate-100 rounded-full h-24 flex items-end">
                                            <div
                                                style={{ height: `${percent}%`, backgroundColor: color }}
                                                className="w-full rounded-full transition-all duration-500 ease-out"
                                            />
                                        </div>
                                        {/* Short Label */}
                                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-wider">
                                            C{idx + 1}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Category Progress widget */}
                    <div className="bg-white border border-slate-200/60 rounded-[28px] p-5 space-y-4 shadow-sm">
                        <h4 className="text-sm font-black text-slate-900 tracking-tight">Active Categories</h4>

                        <div className="space-y-4">
                            {categories.filter(c => c !== "All").slice(0, 3).map((cat, idx) => {
                                const style = getCourseCardStyles(idx);
                                const catCourses = courses.filter(c => c.category === cat);
                                const totalStudents = catCourses.reduce((sum, c) => sum + Number(getAnalyticsForCourse(c.title).TOTAL_ENROLLMENTS || 0), 0);
                                const progressPercent = Math.min((totalStudents / (totalAllEnrollments || 1)) * 100, 100);

                                return (
                                    <div key={cat} className="space-y-1.5">
                                        <div className="flex items-center justify-between text-xs font-bold">
                                            <span className="text-slate-800 flex items-center gap-1.5">
                                                <span>{style.icon}</span> {cat}
                                            </span>
                                            <span className="text-slate-500">{totalStudents} Enrollments</span>
                                        </div>
                                        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                            <div
                                                style={{ width: `${progressPercent}%`, backgroundColor: style.colorCode }}
                                                className="h-full rounded-full transition-all duration-500"
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                </div>

                {/* COLUMN 4 (RIGHT): Numbers & Calendar (col-span-2) */}
                <div className="md:col-span-2 space-y-6">
                    
                    {/* Num 1: Total Courses */}
                    <div className="bg-white border border-slate-200/60 rounded-[24px] p-5 space-y-1 shadow-sm">
                        <h3 className="text-3.5xl font-black text-slate-950 tracking-tight">
                            {courses.length.toString().padStart(2, '0')}
                        </h3>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-snug">
                            Total Courses
                        </p>
                    </div>

                    {/* Num 2: Total Revenue */}
                    <div className="bg-white border border-slate-200/60 rounded-[24px] p-5 space-y-1 shadow-sm">
                        <h3 className="text-2xl font-black text-slate-950 tracking-tight">
                            LKR {(totalAllRevenue / 1000).toFixed(0)}K
                        </h3>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-snug">
                            Total Revenue
                        </p>
                    </div>

                    {/* Calendar Widget */}
                    <div className="bg-white border border-slate-200/60 rounded-[24px] p-4 space-y-3 shadow-sm">
                        <div className="flex justify-between items-center">
                            <div className="space-y-0.5">
                                <h5 className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Calendar</h5>
                                <p className="text-xs font-extrabold text-slate-800 tracking-tight">{todayDate} {monthName}, {year}</p>
                            </div>
                            <button className="w-6 h-6 rounded-full bg-slate-950 text-white flex items-center justify-center text-xs font-black shadow cursor-pointer">
                                ↗
                            </button>
                        </div>

                        {/* Calendar Month Grid */}
                        <div className="grid grid-cols-7 gap-1 text-center">
                            {/* Weekday letters */}
                            {["S", "M", "T", "W", "T", "F", "S"].map((day, idx) => (
                                <span key={idx} className="text-[8px] font-black text-slate-400 uppercase">{day}</span>
                            ))}

                            {/* Day numbers */}
                            {days.map((day, idx) => {
                                if (day === null) {
                                    return <span key={`empty-${idx}`} />;
                                }
                                const isToday = day === todayDate;
                                return (
                                    <span
                                        key={`day-${day}`}
                                        className={`text-[9px] font-black h-4 w-4 flex items-center justify-center rounded-full mx-auto ${isToday ? "bg-orange-500 text-white shadow shadow-orange-500/20" : "text-slate-700 hover:bg-slate-100"}`}
                                    >
                                        {day}
                                    </span>
                                );
                            })}
                        </div>
                    </div>

                </div>

            </div>

            {/* Footer system connection log details */}
            <footer className="pt-4 border-t border-slate-200/60 flex flex-col sm:flex-row items-center justify-between gap-2 text-[10px] font-black text-slate-400 uppercase tracking-wider">
                <span>CourseConnect Hybrid Architecture Portal</span>
                <span>© 2026 CourseConnect. All Rights Reserved.</span>
            </footer>

            {/* CRUD CREATE / EDIT MODAL */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden animate-fade-in-up">
                        {/* Modal Header */}
                        <div className="px-6 py-4 bg-slate-950 text-white flex justify-between items-center">
                            <h3 className="font-extrabold text-sm uppercase tracking-wider">
                                {modalMode === "create" ? "Add New Hybrid Course" : "Edit Course details"}
                            </h3>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="text-slate-400 hover:text-white transition text-lg font-black cursor-pointer"
                            >
                                ✕
                            </button>
                        </div>

                        {/* Modal Form */}
                        <form onSubmit={handleFormSubmit} className="p-6 space-y-4 text-xs font-bold text-slate-700">
                            {/* Title (Oracle) */}
                            <div className="space-y-1.5">
                                <label className="block text-[10px] uppercase tracking-wider text-slate-400">Course Title (Oracle)</label>
                                <input
                                    type="text"
                                    required
                                    value={formTitle}
                                    onChange={(e) => setFormTitle(e.target.value)}
                                    placeholder="e.g. Master Class Next.js"
                                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 text-slate-900 bg-slate-50/50"
                                />
                            </div>

                            {/* Description (Oracle) */}
                            <div className="space-y-1.5">
                                <label className="block text-[10px] uppercase tracking-wider text-slate-400">Description (Oracle)</label>
                                <textarea
                                    value={formDescription}
                                    onChange={(e) => setFormDescription(e.target.value)}
                                    placeholder="Brief summary of the course..."
                                    rows="2"
                                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 text-slate-900 bg-slate-50/50 resize-none"
                                />
                            </div>

                            {/* Price & Category Grid (Oracle) */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="block text-[10px] uppercase tracking-wider text-slate-400">Price LKR (Oracle)</label>
                                    <input
                                        type="number"
                                        required
                                        value={formPrice}
                                        onChange={(e) => setFormPrice(e.target.value)}
                                        placeholder="5000"
                                        className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 text-slate-900 bg-slate-50/50"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="block text-[10px] uppercase tracking-wider text-slate-400">Category (Oracle)</label>
                                    <select
                                        value={formCategory}
                                        onChange={(e) => setFormCategory(e.target.value)}
                                        className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 text-slate-900 bg-slate-50/50 cursor-pointer"
                                    >
                                        <option value="Web Development">Web Development</option>
                                        <option value="Database">Database</option>
                                        <option value="Design">Design</option>
                                        <option value="General">General</option>
                                    </select>
                                </div>
                            </div>

                            {/* Lecture Notes (Mongo) */}
                            <div className="space-y-1.5">
                                <label className="block text-[10px] uppercase tracking-wider text-slate-400">Lecture Notes (MongoDB - comma separated)</label>
                                <input
                                    type="text"
                                    value={formNotes}
                                    onChange={(e) => setFormNotes(e.target.value)}
                                    placeholder="Introduction, Routing, Data Fetching"
                                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 text-slate-900 bg-slate-50/50"
                                />
                            </div>

                            {/* Initial Review / Student Feedback (Mongo) */}
                            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-150 space-y-3">
                                <h4 className="text-[10px] uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                                    <span>💬</span> Initial Review (MongoDB Document)
                                </h4>
                                <div className="grid grid-cols-5 items-center gap-2">
                                    <label className="col-span-2 text-[10px] uppercase tracking-wider text-slate-500">Student Rating</label>
                                    <select
                                        value={formRating}
                                        onChange={(e) => setFormRating(e.target.value)}
                                        className="col-span-3 px-3 py-1.5 border border-slate-200 rounded-lg text-slate-900 bg-white cursor-pointer"
                                    >
                                        <option value="5">★★★★★ (5)</option>
                                        <option value="4">★★★★☆ (4)</option>
                                        <option value="3">★★★☆☆ (3)</option>
                                        <option value="2">★★☆☆☆ (2)</option>
                                        <option value="1">★☆☆☆☆ (1)</option>
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <input
                                        type="text"
                                        value={formComment}
                                        onChange={(e) => setFormComment(e.target.value)}
                                        placeholder="Add student feedback review comment here..."
                                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-900 bg-white"
                                    />
                                </div>
                            </div>

                            {/* Form Actions */}
                            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl cursor-pointer transition text-[10px] uppercase"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-5 py-2.5 bg-slate-950 hover:bg-slate-900 text-white rounded-xl cursor-pointer transition text-[10px] uppercase shadow"
                                >
                                    {modalMode === "create" ? "Create Course" : "Save Changes"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
