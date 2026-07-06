"use client";

import React, { useState, useEffect } from "react";

export default function Dashboard() {
    const [courses, setCourses] = useState([]);
    const [analytics, setAnalytics] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("All");
    const [isDarkMode, setIsDarkMode] = useState(false);

    // Initialize theme from localStorage or default to false (light mode)
    useEffect(() => {
        const storedTheme = localStorage.getItem("theme");
        if (storedTheme === "dark") {
            setIsDarkMode(true);
            document.documentElement.classList.add("dark");
        } else {
            setIsDarkMode(false);
            document.documentElement.classList.remove("dark");
        }
    }, []);

    // Fetch data
    useEffect(() => {
        async function fetchData() {
            try {
                setLoading(true);
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

        fetchData();
    }, []);

    const toggleDarkMode = () => {
        const newMode = !isDarkMode;
        setIsDarkMode(newMode);
        if (newMode) {
            document.documentElement.classList.add("dark");
            localStorage.setItem("theme", "dark");
        } else {
            document.documentElement.classList.remove("dark");
            localStorage.setItem("theme", "light");
        }
    };

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

    if (loading) {
        return (
            <div className={`min-h-screen ${isDarkMode ? "bg-slate-950 text-slate-100" : "bg-slate-50 text-slate-900"} flex flex-col justify-center items-center p-8 transition-colors duration-300`}>
                <div className="w-full max-w-6xl space-y-8 animate-pulse">
                    <div className={`h-12 ${isDarkMode ? "bg-slate-800" : "bg-slate-200"} rounded-lg w-1/3`}></div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className={`h-28 ${isDarkMode ? "bg-slate-800" : "bg-slate-200"} rounded-xl`}></div>
                        <div className={`h-28 ${isDarkMode ? "bg-slate-800" : "bg-slate-200"} rounded-xl`}></div>
                        <div className={`h-28 ${isDarkMode ? "bg-slate-800" : "bg-slate-200"} rounded-xl`}></div>
                    </div>
                    <div className={`h-8 ${isDarkMode ? "bg-slate-800" : "bg-slate-200"} rounded-lg w-1/4`}></div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <div className={`h-40 ${isDarkMode ? "bg-slate-800" : "bg-slate-200"} rounded-xl`}></div>
                        <div className={`h-40 ${isDarkMode ? "bg-slate-800" : "bg-slate-200"} rounded-xl`}></div>
                        <div className={`h-40 ${isDarkMode ? "bg-slate-800" : "bg-slate-200"} rounded-xl`}></div>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className={`min-h-screen ${isDarkMode ? "bg-slate-950 text-slate-100" : "bg-slate-50 text-slate-900"} flex flex-col justify-center items-center p-8 transition-colors duration-300`}>
                <div className="bg-red-950/30 border border-red-500/50 rounded-xl p-8 max-w-md text-center space-y-4">
                    <div className="text-red-400 text-5xl">⚠</div>
                    <h2 className="text-xl font-bold text-red-200">Error Loading Dashboard</h2>
                    <p className="text-slate-400 text-sm">{error}</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="px-4 py-2 bg-red-800 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className={`min-h-screen ${isDarkMode ? "bg-slate-950 text-slate-100 selection:bg-purple-500/30 selection:text-purple-300" : "bg-gradient-to-br from-indigo-50/70 via-slate-50 to-pink-50/40 text-slate-900 selection:bg-purple-500/10 selection:text-purple-900"} font-sans transition-colors duration-300 pb-24`}>

            {/* Dynamic blurred mesh decorations */}
            <div className={`absolute top-0 left-1/4 w-[500px] h-[500px] ${isDarkMode ? "bg-blue-500/10" : "bg-gradient-to-tr from-blue-300/20 to-purple-400/15"} rounded-full blur-[140px] pointer-events-none`} />
            <div className={`absolute top-1/4 right-1/4 w-[400px] h-[400px] ${isDarkMode ? "bg-purple-500/10" : "bg-gradient-to-tr from-purple-300/20 to-pink-400/15"} rounded-full blur-[140px] pointer-events-none`} />
            <div className={`absolute bottom-10 left-10 w-[500px] h-[500px] ${isDarkMode ? "bg-emerald-500/10" : "bg-gradient-to-tr from-emerald-300/15 to-blue-400/20"} rounded-full blur-[140px] pointer-events-none`} />

            <header className={`relative border-b ${isDarkMode ? "border-slate-800/80 bg-slate-950/80" : "border-slate-200/80 bg-white/70"} backdrop-blur-md sticky top-0 z-50 transition-all duration-300 shadow-sm`}>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <img
                            src="/logo.png"
                            alt="CourseConnect Logo"
                            className="w-10 h-10 rounded-xl object-contain bg-white shadow-md border border-slate-200/60 p-0.5"
                        />
                        <div>
                            <h1 className={`text-xl font-black bg-gradient-to-r ${isDarkMode ? "from-white via-slate-200 to-purple-400" : "from-slate-900 via-indigo-950 to-purple-600"} bg-clip-text text-transparent`}>
                                CourseConnect Hybrid Dashboard
                            </h1>
                            <p className={`text-[10px] tracking-wide uppercase font-bold ${isDarkMode ? "text-slate-400" : "text-indigo-600/80"}`}>Oracle Database + MongoDB NoSQL System</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        {/* Theme Toggle Button */}
                        <button
                            onClick={toggleDarkMode}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-xs font-bold transition-all duration-300 cursor-pointer ${isDarkMode
                                ? "bg-slate-900 border-slate-800 text-amber-400 hover:bg-slate-800 hover:border-slate-700"
                                : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50 shadow-md shadow-slate-100/50 hover:border-slate-300"
                                }`}
                        >
                            {isDarkMode ? (
                                <>
                                    <span className="text-sm">☀️</span> Light Mode
                                </>
                            ) : (
                                <>
                                    <span className="text-sm">🌙</span> Dark Mode
                                </>
                            )}
                        </button>

                        <div className={`flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-full ${isDarkMode ? "bg-slate-900 border-slate-800 text-slate-300" : "bg-white border-slate-200 text-slate-700 shadow-sm"}`}>
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                            <span>Systems Online</span>
                        </div>
                    </div>
                </div>
            </header>

            <main className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-16">

                {/* Welcome Hero Banner with Colorful Illustration */}
                <section className={`relative overflow-hidden rounded-3xl p-8 sm:p-10 ${isDarkMode ? "bg-slate-900 border border-slate-800" : "bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 text-white shadow-2xl shadow-indigo-500/25"}`}>
                    <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full blur-3xl pointer-events-none" />
                    <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
                        <div className="space-y-4 max-w-2xl text-center md:text-left">
                            <span className={`inline-block text-[10px] tracking-widest font-black uppercase py-1 px-2.5 rounded-full ${isDarkMode ? "bg-purple-500/20 text-purple-300" : "bg-white/20 text-white"}`}>
                                Architecture Analytics
                            </span>
                            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
                                Hybrid System Manager
                                <br />
                                by Desan Yasandu
                            </h2>
                            <p className={`text-sm sm:text-base ${isDarkMode ? "text-slate-300" : "text-white/80"} leading-relaxed`}>
                                Monitor relational SQL schemas from Oracle DB and unstructured document-based student files from MongoDB in a single, high-fidelity workspace.
                            </p>
                        </div>

                        {/* Colorful Illustration (SVG Mockup/Shapes) */}
                        <div className="relative flex justify-center items-center w-48 h-48 md:w-56 md:h-56 shrink-0 bg-white/10 rounded-2xl backdrop-blur-sm border border-white/20">
                            <svg viewBox="0 0 100 100" className="w-32 h-32 animate-pulse text-white">
                                {/* Data Grid nodes */}
                                <circle cx="20" cy="20" r="6" fill="#f43f5e" />
                                <circle cx="80" cy="20" r="8" fill="#3b82f6" />
                                <circle cx="50" cy="50" r="10" fill="#a855f7" />
                                <circle cx="20" cy="80" r="7" fill="#10b981" />
                                <circle cx="80" cy="80" r="9" fill="#f59e0b" />

                                {/* Connecting lines */}
                                <line x1="20" y1="20" x2="50" y2="50" stroke="white" strokeWidth="1" strokeDasharray="3" />
                                <line x1="80" y1="20" x2="50" y2="50" stroke="white" strokeWidth="1" />
                                <line x1="20" y1="80" x2="50" y2="50" stroke="white" strokeWidth="1" />
                                <line x1="80" y1="80" x2="50" y2="50" stroke="white" strokeWidth="1" strokeDasharray="2" />

                                {/* Core Oracle ring */}
                                <circle cx="50" cy="50" r="16" stroke="white" strokeWidth="1.5" fill="none" className="animate-spin duration-1000" strokeDasharray="4 2" />
                            </svg>
                            <div className="absolute -top-3 -right-3 px-2 py-1 bg-rose-500 rounded-md text-[9px] font-black uppercase text-white shadow-lg animate-bounce">
                                Live Data
                            </div>
                        </div>
                    </div>
                </section>

                {/* Overview Stats (Three colorful cards) */}
                <section className="grid grid-cols-1 sm:grid-cols-3 gap-8">

                    {/* Card 1: Total Enrollments */}
                    <div className={`relative overflow-hidden p-6 rounded-3xl border-t-4 border-t-blue-500 ${isDarkMode ? "bg-slate-900 border border-slate-800" : "bg-white border border-slate-200/80 shadow-lg shadow-slate-100/50 hover:shadow-xl hover:border-blue-300"} transition-all duration-300`}>
                        <div className="flex justify-between items-center mb-4">
                            <p className={`text-xs font-black tracking-wider ${isDarkMode ? "text-slate-400" : "text-slate-500"} uppercase`}>Total Enrollments</p>
                            <div className={`p-2 rounded-xl ${isDarkMode ? "bg-blue-500/10 text-blue-400" : "bg-blue-50 text-blue-600"}`}>
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                                </svg>
                            </div>
                        </div>
                        <h3 className={`text-3xl font-black ${isDarkMode ? "text-blue-400" : "text-blue-600"}`}>{totalAllEnrollments.toLocaleString()}</h3>
                        <div className="flex items-center gap-1.5 mt-2">
                            <span className={`text-[10px] font-bold ${isDarkMode ? "text-slate-500" : "text-slate-400"}`}>Active Students Registered</span>
                        </div>
                    </div>

                    {/* Card 2: Total Revenue */}
                    <div className={`relative overflow-hidden p-6 rounded-3xl border-t-4 border-t-emerald-500 ${isDarkMode ? "bg-slate-900 border border-slate-800" : "bg-white border border-slate-200/80 shadow-lg shadow-slate-100/50 hover:shadow-xl hover:border-emerald-300"} transition-all duration-300`}>
                        <div className="flex justify-between items-center mb-4">
                            <p className={`text-xs font-black tracking-wider ${isDarkMode ? "text-slate-400" : "text-slate-500"} uppercase`}>Total Revenue</p>
                            <div className={`p-2 rounded-xl ${isDarkMode ? "bg-emerald-500/10 text-emerald-400" : "bg-emerald-50 text-emerald-600"}`}>
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                        </div>
                        <h3 className={`text-3xl font-black ${isDarkMode ? "text-emerald-400" : "text-emerald-600"}`}>LKR {totalAllRevenue.toLocaleString()}</h3>
                        <div className="flex items-center gap-1.5 mt-2">
                            <span className={`text-[10px] font-bold ${isDarkMode ? "text-slate-500" : "text-slate-400"}`}>Fees collected via Oracle SQL</span>
                        </div>
                    </div>

                    {/* Card 3: Catalogue Size */}
                    <div className={`relative overflow-hidden p-6 rounded-3xl border-t-4 border-t-purple-500 ${isDarkMode ? "bg-slate-900 border border-slate-800" : "bg-white border border-slate-200/80 shadow-lg shadow-slate-100/50 hover:shadow-xl hover:border-purple-300"} transition-all duration-300`}>
                        <div className="flex justify-between items-center mb-4">
                            <p className={`text-xs font-black tracking-wider ${isDarkMode ? "text-slate-400" : "text-slate-500"} uppercase`}>Catalogue Size</p>
                            <div className={`p-2 rounded-xl ${isDarkMode ? "bg-purple-500/10 text-purple-400" : "bg-purple-50 text-purple-600"}`}>
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.168.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                </svg>
                            </div>
                        </div>
                        <h3 className={`text-3xl font-black ${isDarkMode ? "text-purple-400" : "text-purple-600"}`}>{courses.length}</h3>
                        <div className="flex items-center gap-1.5 mt-2">
                            <span className={`text-[10px] font-bold ${isDarkMode ? "text-slate-500" : "text-slate-400"}`}>Active modules mapped</span>
                        </div>
                    </div>
                </section>

                {/* Section 1: Business Intelligence Reports */}
                <section className="space-y-8">
                    <div className="flex items-center gap-3">
                        <div className="w-1.5 h-6 rounded-full bg-gradient-to-b from-blue-500 to-purple-500" />
                        <h2 className={`text-2xl font-black tracking-tight ${isDarkMode ? "text-white" : "text-slate-900"}`}>Business Intelligence Reports</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {analytics.map((report, idx) => {
                            const matchingCourse = courses.find(c => c.title?.toLowerCase() === report.TITLE?.toLowerCase());
                            const percent = Math.min(((Number(report.TOTAL_ENROLLMENTS) || 0) / maxEnrollments) * 100, 100);

                            return (
                                <div
                                    key={idx}
                                    className={`relative group overflow-hidden p-6 rounded-3xl ${isDarkMode ? "bg-slate-900/60 border-slate-800/80 hover:border-slate-700/80" : "bg-white border border-slate-200/60 hover:border-purple-300 shadow-md hover:shadow-xl hover:-translate-y-1"} border transition-all duration-300`}
                                >
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h4 className={`text-md font-bold ${isDarkMode ? "text-slate-100 group-hover:text-white" : "text-slate-900 group-hover:text-indigo-700"} line-clamp-1 transition-colors`}>
                                                {report.TITLE}
                                            </h4>
                                            {matchingCourse && (
                                                <span className={`inline-block mt-2 px-2.5 py-0.5 text-[9px] font-black tracking-widest uppercase rounded-full ${isDarkMode ? "bg-purple-500/10 border-purple-500/20 text-purple-300" : "bg-purple-100/60 border border-purple-200/50 text-purple-700"}`}>
                                                    {matchingCourse.category}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Enrollments Progress bar representation */}
                                    <div className="mt-4 space-y-1.5">
                                        <div className="flex justify-between text-[10px] font-bold text-slate-500">
                                            <span>Enrollment Weight</span>
                                            <span>{percent.toFixed(0)}%</span>
                                        </div>
                                        <div className={`w-full h-2 rounded-full ${isDarkMode ? "bg-slate-800" : "bg-slate-100"} overflow-hidden`}>
                                            <div
                                                style={{ width: `${percent}%` }}
                                                className="h-full rounded-full bg-gradient-to-r from-blue-500 to-purple-500"
                                            />
                                        </div>
                                    </div>

                                    <div className={`grid grid-cols-2 gap-4 mt-6 pt-4 border-t ${isDarkMode ? "border-slate-800/80" : "border-slate-100"}`}>
                                        <div>
                                            <p className={`text-[9px] font-black ${isDarkMode ? "text-slate-400" : "text-slate-500"} uppercase tracking-wider`}>Enrollments</p>
                                            <p className={`text-lg font-black ${isDarkMode ? "text-blue-400" : "text-blue-600"} mt-0.5`}>
                                                {Number(report.TOTAL_ENROLLMENTS).toLocaleString()}
                                            </p>
                                        </div>
                                        <div>
                                            <p className={`text-[9px] font-black ${isDarkMode ? "text-slate-400" : "text-slate-500"} uppercase tracking-wider`}>Revenue</p>
                                            <p className={`text-lg font-black ${isDarkMode ? "text-emerald-400" : "text-emerald-600"} mt-0.5`}>
                                                LKR {Number(report.TOTAL_REVENUE).toLocaleString()}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </section>

                {/* Section 2: Course Catalogue with Filter controls */}
                <section className="space-y-8">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="flex items-center gap-3">
                            <div className="w-1.5 h-6 rounded-full bg-gradient-to-b from-purple-500 to-emerald-500" />
                            <h2 className={`text-2xl font-black tracking-tight ${isDarkMode ? "text-white" : "text-slate-900"}`}>Course Catalogue</h2>
                        </div>

                        {/* Search and Filters */}
                        <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Search courses..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className={`w-full sm:w-64 px-4 py-2 text-sm ${isDarkMode ? "bg-slate-900 border-slate-800 text-slate-100 placeholder:text-slate-500" : "bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 shadow-sm focus:shadow-md focus:ring-2 focus:ring-purple-500/10"} border rounded-xl focus:outline-none focus:border-purple-500 transition`}
                                />
                            </div>
                            <div className={`flex gap-1.5 ${isDarkMode ? "bg-slate-900 border-slate-800" : "bg-slate-200/50 border-slate-200"} border rounded-xl p-1 overflow-x-auto max-w-full`}>
                                {categories.map((cat) => (
                                    <button
                                        key={cat}
                                        onClick={() => setSelectedCategory(cat)}
                                        className={`px-3.5 py-1.5 rounded-lg text-xs font-black transition whitespace-nowrap cursor-pointer ${selectedCategory === cat
                                            ? "bg-purple-600 text-white shadow-md shadow-purple-500/20"
                                            : isDarkMode
                                                ? "text-slate-400 hover:text-slate-200"
                                                : "text-slate-600 hover:bg-white hover:text-slate-900"
                                            }`}
                                    >
                                        {cat}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {filteredCourses.length === 0 ? (
                        <div className={`text-center py-16 ${isDarkMode ? "bg-slate-900/40 border-slate-800" : "bg-white border-slate-200"} border rounded-3xl shadow-sm`}>
                            <p className={`${isDarkMode ? "text-slate-400" : "text-slate-500"} text-sm font-semibold`}>No courses match your criteria.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {filteredCourses.map((course) => {
                                const analyticsData = getAnalyticsForCourse(course.title);

                                // Calculate average rating
                                const averageRating = course.reviews?.length > 0
                                    ? (course.reviews.reduce((acc, r) => acc + (Number(r.rating) || 0), 0) / course.reviews.length).toFixed(1)
                                    : null;

                                return (
                                    <div
                                        key={course.id}
                                        className={`flex flex-col relative overflow-hidden rounded-3xl ${isDarkMode ? "from-slate-900/90 to-slate-950 border-slate-800/80 hover:border-purple-500/35 hover:shadow-xl hover:shadow-purple-500/5" : "from-white to-slate-50/20 border-slate-200/60 shadow-lg shadow-slate-100/40 hover:shadow-2xl hover:border-purple-300 hover:-translate-y-1"} border transition-all duration-300`}
                                    >
                                        {/* Visual left colored strip */}
                                        <div className="absolute left-0 top-0 bottom-0 w-2.5 bg-gradient-to-b from-purple-500 via-indigo-500 to-blue-500" />

                                        <div className="p-6 pl-8 flex-1 space-y-6">
                                            {/* Top Meta info */}
                                            <div className="flex items-center justify-between">
                                                <span className={`px-2.5 py-1 text-xs font-black tracking-widest uppercase rounded-lg ${isDarkMode ? "bg-purple-500/10 border-purple-500/20 text-purple-300" : "bg-purple-100/60 border border-purple-200/50 text-purple-700"}`}>
                                                    {course.category}
                                                </span>
                                                <span className={`text-xl font-black ${isDarkMode ? "text-emerald-400" : "text-emerald-600"}`}>
                                                    LKR {course.price ? Number(course.price).toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "0.00"}
                                                </span>
                                            </div>

                                            {/* Header */}
                                            <div className="space-y-1">
                                                <h3 className={`text-xl font-bold ${isDarkMode ? "text-white" : "text-slate-900"} tracking-tight`}>{course.title}</h3>
                                                <p className={`${isDarkMode ? "text-slate-400" : "text-slate-600"} text-sm leading-relaxed`}>{course.description}</p>
                                            </div>

                                            {/* Relational Quick Stats */}
                                            <div className={`grid grid-cols-3 gap-2 py-3 px-4 rounded-2xl ${isDarkMode ? "bg-slate-950 border-slate-900/80" : "bg-slate-50 border-slate-200/60 shadow-inner"} border`}>
                                                <div className="text-center">
                                                    <p className={`text-[10px] ${isDarkMode ? "text-slate-500" : "text-slate-400"} uppercase tracking-wider font-bold`}>Course ID</p>
                                                    <p className={`text-sm font-black ${isDarkMode ? "text-slate-300" : "text-slate-700"} mt-0.5`}>#{course.id}</p>
                                                </div>
                                                <div className={`text-center border-x ${isDarkMode ? "border-slate-800/60" : "border-slate-200/60"}`}>
                                                    <p className={`text-[10px] ${isDarkMode ? "text-slate-500" : "text-slate-400"} uppercase tracking-wider font-bold`}>Students</p>
                                                    <p className={`text-sm font-black ${isDarkMode ? "text-blue-400" : "text-blue-600"} mt-0.5`}>
                                                        {Number(analyticsData.TOTAL_ENROLLMENTS).toLocaleString()}
                                                    </p>
                                                </div>
                                                <div className="text-center">
                                                    <p className={`text-[10px] ${isDarkMode ? "text-slate-500" : "text-slate-400"} uppercase tracking-wider font-bold`}>Rating</p>
                                                    <p className="text-sm font-black text-amber-500 mt-0.5">
                                                        {averageRating ? `★ ${averageRating}` : "N/A"}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* MongoDB Unstructured Data Sub-section */}
                                            <div className={`pt-4 border-t ${isDarkMode ? "border-slate-800/80" : "border-slate-100"} space-y-6`}>
                                                <div>
                                                    <h4 className={`text-xs font-black uppercase tracking-widest ${isDarkMode ? "text-slate-300" : "text-indigo-950"} flex items-center gap-2 mb-3`}>
                                                        <span className="w-2 h-2 rounded-full bg-blue-500" />
                                                        Lecture Notes (MongoDB Document)
                                                    </h4>
                                                    {course.lectureNotes && course.lectureNotes.length > 0 ? (
                                                        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                            {course.lectureNotes.map((note, noteIdx) => (
                                                                <li
                                                                    key={noteIdx}
                                                                    className={`flex items-center gap-2 text-xs ${isDarkMode ? "text-slate-400 bg-slate-900/60 hover:bg-slate-900 hover:text-slate-200 border-slate-800/50" : "text-slate-700 bg-indigo-50/40 hover:bg-indigo-50 hover:text-indigo-800 hover:border-indigo-200 border-slate-200/80"} py-2.5 px-3.5 rounded-xl border transition cursor-pointer shadow-sm`}
                                                                >
                                                                    <span className="text-indigo-500 text-sm">📝</span>
                                                                    <span className="truncate font-medium">{note}</span>
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    ) : (
                                                        <p className="text-xs text-slate-400 italic pl-4">No lecture notes uploaded yet.</p>
                                                    )}
                                                </div>

                                                <div>
                                                    <h4 className={`text-xs font-black uppercase tracking-widest ${isDarkMode ? "text-slate-300" : "text-indigo-950"} flex items-center gap-2 mb-3`}>
                                                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                                                        Student Feedback Reviews ({course.reviews?.length || 0})
                                                    </h4>
                                                    {course.reviews && course.reviews.length > 0 ? (
                                                        <div className="space-y-3 max-h-44 overflow-y-auto pr-1">
                                                            {course.reviews.map((rev, revIdx) => (
                                                                <div
                                                                    key={revIdx}
                                                                    className={`p-3.5 rounded-xl ${isDarkMode ? "bg-slate-950 border-slate-900" : "bg-slate-100/30 hover:bg-white border-slate-200/70"} border transition-colors shadow-sm`}
                                                                >
                                                                    <div className="flex items-center justify-between gap-2 mb-1.5">
                                                                        <span className="text-amber-500 text-xs font-black">
                                                                            {"★".repeat(Number(rev.rating))}
                                                                            {"☆".repeat(5 - Number(rev.rating))}
                                                                        </span>
                                                                    </div>
                                                                    <p className={`text-xs ${isDarkMode ? "text-slate-400" : "text-slate-600"} italic font-medium leading-relaxed`}>"{rev.comment}"</p>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <p className="text-xs text-slate-400 italic pl-4">No student reviews available.</p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </section>
            </main>

            <footer className={`border-t ${isDarkMode ? "border-slate-900 bg-slate-950" : "border-slate-200 bg-slate-100"} py-8 text-center text-slate-500 text-xs transition-colors duration-300`}>
                <p>© 2026 CourseConnect. Relational Oracle Database & NoSQL MongoDB Hybrid System.</p>
            </footer>
        </div>
    );
}
