const { db } = require('./firebase');

async function seedDatabase() {
    console.log("Starting database seeding for Poly Network...");

    // ============================================
    // COLLEGES
    // ============================================
    const colleges = [
        {
            id: "college_001",
            code: "PIT01",
            name: "Polytechnic Institute of Technology",
            location: "Main Campus",
            settings: {
                working_days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
                periods_per_day: 8,
                lunch_after_period: 4,
                study_hour_period: 8
            },
            created_at: new Date()
        },
        {
            id: "college_002",
            code: "SPC01",
            name: "Sri Prakash College",
            location: "East Campus",
            settings: {
                working_days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
                periods_per_day: 7,
                lunch_after_period: 4,
                study_hour_period: 7
            },
            created_at: new Date()
        }
    ];

    // ============================================
    // ADMINS
    // ============================================
    const admins = [
        {
            uid: "admin_pit01",
            name: "Admin User",
            email: "admin@pit01.edu",
            college_id: "college_001",
            role: "admin",
            created_at: new Date()
        },
        {
            uid: "admin_spc01",
            name: "SPC Admin",
            email: "admin@spc01.edu",
            college_id: "college_002",
            role: "admin",
            created_at: new Date()
        }
    ];

    // ============================================
    // CLASSES
    // ============================================
    const classes = [
        {
            id: "class_cs_2024_1_a",
            college_id: "college_001",
            branch: "Computer Science",
            year: "2024",
            semester: "1",
            section: "A",
            pin_validation_rule: {
                type: "regex",
                pattern: "^24CS[0-9]{3}$"
            }
        },
        {
            id: "class_cs_2024_1_b",
            college_id: "college_001",
            branch: "Computer Science",
            year: "2024",
            semester: "1",
            section: "B",
            pin_validation_rule: {
                type: "regex",
                pattern: "^24CS[0-9]{3}$"
            }
        },
        {
            id: "class_ec_2024_1_a",
            college_id: "college_001",
            branch: "Electronics",
            year: "2024",
            semester: "1",
            section: "A",
            pin_validation_rule: {
                type: "range",
                min: 24001,
                max: 24060
            }
        },
        {
            id: "class_me_2024_1_a",
            college_id: "college_002",
            branch: "Mechanical",
            year: "2024",
            semester: "1",
            section: "A",
            pin_validation_rule: {
                type: "regex",
                pattern: "^SPC24ME[0-9]{2}$"
            }
        }
    ];

    // ============================================
    // TEACHERS
    // ============================================
    const teachers = [
        {
            uid: "T01",
            name: "Dr. Smith",
            email: "t01@pit01.edu",
            college_id: "college_001",
            role: "teacher",
            is_class_teacher: true,
            class_id_assigned: "class_cs_2024_1_a",
            subjects: ["Data Structures", "Programming"]
        },
        {
            uid: "T02",
            name: "Prof. Johnson",
            email: "t02@pit01.edu",
            college_id: "college_001",
            role: "teacher",
            is_class_teacher: true,
            class_id_assigned: "class_cs_2024_1_b",
            subjects: ["Database Systems", "Web Development"]
        },
        {
            uid: "T03",
            name: "Dr. Williams",
            email: "t03@pit01.edu",
            college_id: "college_001",
            role: "teacher",
            is_class_teacher: false,
            class_id_assigned: null,
            subjects: ["Mathematics", "Physics"]
        },
        {
            uid: "T04",
            name: "Prof. Kumar",
            email: "t04@spc01.edu",
            college_id: "college_002",
            role: "teacher",
            is_class_teacher: true,
            class_id_assigned: "class_me_2024_1_a",
            subjects: ["Thermodynamics", "Mechanics"]
        }
    ];

    // ============================================
    // STUDENTS
    // ============================================
    const students = [
        {
            uid: "24CS001",
            pin: "24CS001",
            name: "John Doe",
            email: "24cs001@pit01.edu",
            college_id: "college_001",
            class_id: "class_cs_2024_1_a",
            role: "student",
            parent_phone: "9876543210"
        },
        {
            uid: "24CS002",
            pin: "24CS002",
            name: "Jane Smith",
            email: "24cs002@pit01.edu",
            college_id: "college_001",
            class_id: "class_cs_2024_1_a",
            role: "student",
            parent_phone: "9876543211"
        },
        {
            uid: "24CS003",
            pin: "24CS003",
            name: "Bob Wilson",
            email: "24cs003@pit01.edu",
            college_id: "college_001",
            class_id: "class_cs_2024_1_a",
            role: "student",
            parent_phone: "9876543212"
        },
        {
            uid: "24CS101",
            pin: "24CS101",
            name: "Alice Brown",
            email: "24cs101@pit01.edu",
            college_id: "college_001",
            class_id: "class_cs_2024_1_b",
            role: "student",
            parent_phone: "9876543213"
        },
        {
            uid: "SPC24ME01",
            pin: "SPC24ME01",
            name: "Rahul Sharma",
            email: "spc24me01@spc01.edu",
            college_id: "college_002",
            class_id: "class_me_2024_1_a",
            role: "student",
            parent_phone: "9876543214"
        }
    ];

    // ============================================
    // TEACHING ASSIGNMENTS
    // ============================================
    const teachingAssignments = [
        {
            id: "ta_001",
            college_id: "college_001",
            teacher_id: "T01",
            class_id: "class_cs_2024_1_a",
            subject: "Data Structures",
            periods_per_week: 4
        },
        {
            id: "ta_002",
            college_id: "college_001",
            teacher_id: "T01",
            class_id: "class_cs_2024_1_b",
            subject: "Data Structures",
            periods_per_week: 4
        },
        {
            id: "ta_003",
            college_id: "college_001",
            teacher_id: "T02",
            class_id: "class_cs_2024_1_a",
            subject: "Database Systems",
            periods_per_week: 3
        },
        {
            id: "ta_004",
            college_id: "college_001",
            teacher_id: "T03",
            class_id: "class_cs_2024_1_a",
            subject: "Mathematics",
            periods_per_week: 5
        },
        {
            id: "ta_005",
            college_id: "college_002",
            teacher_id: "T04",
            class_id: "class_me_2024_1_a",
            subject: "Thermodynamics",
            periods_per_week: 4
        }
    ];

    // ============================================
    // QUIZZES
    // ============================================
    const quizzes = [
        {
            id: "quiz_001",
            college_id: "college_001",
            class_id: "class_cs_2024_1_a",
            title: "Data Structures Basics",
            subject: "Data Structures",
            status: "active",
            created_by: "T01",
            created_at: new Date()
        },
        {
            id: "quiz_002",
            college_id: "college_001",
            class_id: "class_cs_2024_1_a",
            title: "SQL Fundamentals",
            subject: "Database Systems",
            status: "draft",
            created_by: "T02",
            created_at: new Date()
        }
    ];

    // ============================================
    // QUIZ QUESTIONS
    // ============================================
    const quizQuestions = [
        {
            id: "qq_001",
            quiz_id: "quiz_001",
            question: "What is the time complexity of binary search?",
            options: ["O(n)", "O(log n)", "O(n²)", "O(1)"],
            correct_answer: 1
        },
        {
            id: "qq_002",
            quiz_id: "quiz_001",
            question: "Which data structure uses LIFO?",
            options: ["Queue", "Stack", "Array", "Linked List"],
            correct_answer: 1
        },
        {
            id: "qq_003",
            quiz_id: "quiz_001",
            question: "What is the worst case complexity of quicksort?",
            options: ["O(n log n)", "O(n)", "O(n²)", "O(log n)"],
            correct_answer: 2
        }
    ];

    // ============================================
    // MATERIALS
    // ============================================
    const materials = [
        {
            id: "mat_001",
            college_id: "college_001",
            class_id: "class_cs_2024_1_a",
            subject: "Data Structures",
            title: "Introduction to Arrays",
            description: "Basic concepts of arrays and their operations",
            file_url: "https://example.com/arrays.pdf",
            file_type: "pdf",
            uploaded_by: "T01",
            created_at: new Date()
        },
        {
            id: "mat_002",
            college_id: "college_001",
            class_id: "class_cs_2024_1_a",
            subject: "Database Systems",
            title: "SQL Commands Reference",
            description: "Complete reference for SQL commands",
            file_url: "https://example.com/sql.pdf",
            file_type: "pdf",
            uploaded_by: "T02",
            created_at: new Date()
        }
    ];

    // ============================================
    // TIMETABLES
    // ============================================
    const timetables = [
        // Monday schedule for class_cs_2024_1_a
        { id: "tt_001", college_id: "college_001", class_id: "class_cs_2024_1_a", day: "Monday", period: 1, teacher_id: "T01", subject: "Data Structures", is_lab: false },
        { id: "tt_002", college_id: "college_001", class_id: "class_cs_2024_1_a", day: "Monday", period: 2, teacher_id: "T03", subject: "Mathematics", is_lab: false },
        { id: "tt_003", college_id: "college_001", class_id: "class_cs_2024_1_a", day: "Monday", period: 3, teacher_id: "T02", subject: "Database Systems", is_lab: false },
        { id: "tt_004", college_id: "college_001", class_id: "class_cs_2024_1_a", day: "Monday", period: 4, teacher_id: "T03", subject: "Mathematics", is_lab: false },
        // Period 5-7: Lab (3 consecutive periods)
        { id: "tt_005", college_id: "college_001", class_id: "class_cs_2024_1_a", day: "Monday", period: 5, teacher_id: "T01", subject: "DS Lab", is_lab: true },
        { id: "tt_006", college_id: "college_001", class_id: "class_cs_2024_1_a", day: "Monday", period: 6, teacher_id: "T01", subject: "DS Lab", is_lab: true },
        { id: "tt_007", college_id: "college_001", class_id: "class_cs_2024_1_a", day: "Monday", period: 7, teacher_id: "T01", subject: "DS Lab", is_lab: true },
        { id: "tt_008", college_id: "college_001", class_id: "class_cs_2024_1_a", day: "Monday", period: 8, teacher_id: null, subject: "Study Hour", is_lab: false },

        // Tuesday schedule
        { id: "tt_009", college_id: "college_001", class_id: "class_cs_2024_1_a", day: "Tuesday", period: 1, teacher_id: "T02", subject: "Database Systems", is_lab: false },
        { id: "tt_010", college_id: "college_001", class_id: "class_cs_2024_1_a", day: "Tuesday", period: 2, teacher_id: "T01", subject: "Data Structures", is_lab: false },
        { id: "tt_011", college_id: "college_001", class_id: "class_cs_2024_1_a", day: "Tuesday", period: 3, teacher_id: "T03", subject: "Mathematics", is_lab: false },
        { id: "tt_012", college_id: "college_001", class_id: "class_cs_2024_1_a", day: "Tuesday", period: 4, teacher_id: "T01", subject: "Data Structures", is_lab: false },
        { id: "tt_013", college_id: "college_001", class_id: "class_cs_2024_1_a", day: "Tuesday", period: 5, teacher_id: "T03", subject: "Mathematics", is_lab: false },
        { id: "tt_014", college_id: "college_001", class_id: "class_cs_2024_1_a", day: "Tuesday", period: 6, teacher_id: "T02", subject: "Database Systems", is_lab: false },
        { id: "tt_015", college_id: "college_001", class_id: "class_cs_2024_1_a", day: "Tuesday", period: 7, teacher_id: "T03", subject: "Mathematics", is_lab: false },
        { id: "tt_016", college_id: "college_001", class_id: "class_cs_2024_1_a", day: "Tuesday", period: 8, teacher_id: null, subject: "Study Hour", is_lab: false },

        // Wednesday schedule
        { id: "tt_017", college_id: "college_001", class_id: "class_cs_2024_1_a", day: "Wednesday", period: 1, teacher_id: "T02", subject: "DB Lab", is_lab: true },
        { id: "tt_018", college_id: "college_001", class_id: "class_cs_2024_1_a", day: "Wednesday", period: 2, teacher_id: "T02", subject: "DB Lab", is_lab: true },
        { id: "tt_019", college_id: "college_001", class_id: "class_cs_2024_1_a", day: "Wednesday", period: 3, teacher_id: "T02", subject: "DB Lab", is_lab: true },
        { id: "tt_020", college_id: "college_001", class_id: "class_cs_2024_1_a", day: "Wednesday", period: 4, teacher_id: "T01", subject: "Data Structures", is_lab: false },
        { id: "tt_021", college_id: "college_001", class_id: "class_cs_2024_1_a", day: "Wednesday", period: 5, teacher_id: "T03", subject: "Mathematics", is_lab: false },
        { id: "tt_022", college_id: "college_001", class_id: "class_cs_2024_1_a", day: "Wednesday", period: 6, teacher_id: "T02", subject: "Database Systems", is_lab: false },
        { id: "tt_023", college_id: "college_001", class_id: "class_cs_2024_1_a", day: "Wednesday", period: 7, teacher_id: "T01", subject: "Data Structures", is_lab: false },
        { id: "tt_024", college_id: "college_001", class_id: "class_cs_2024_1_a", day: "Wednesday", period: 8, teacher_id: null, subject: "Study Hour", is_lab: false },

        // Thursday schedule
        { id: "tt_025", college_id: "college_001", class_id: "class_cs_2024_1_a", day: "Thursday", period: 1, teacher_id: "T03", subject: "Mathematics", is_lab: false },
        { id: "tt_026", college_id: "college_001", class_id: "class_cs_2024_1_a", day: "Thursday", period: 2, teacher_id: "T01", subject: "Data Structures", is_lab: false },
        { id: "tt_027", college_id: "college_001", class_id: "class_cs_2024_1_a", day: "Thursday", period: 3, teacher_id: "T02", subject: "Database Systems", is_lab: false },
        { id: "tt_028", college_id: "college_001", class_id: "class_cs_2024_1_a", day: "Thursday", period: 4, teacher_id: "T03", subject: "Mathematics", is_lab: false },
        { id: "tt_029", college_id: "college_001", class_id: "class_cs_2024_1_a", day: "Thursday", period: 5, teacher_id: "T01", subject: "Data Structures", is_lab: false },
        { id: "tt_030", college_id: "college_001", class_id: "class_cs_2024_1_a", day: "Thursday", period: 6, teacher_id: "T02", subject: "Database Systems", is_lab: false },
        { id: "tt_031", college_id: "college_001", class_id: "class_cs_2024_1_a", day: "Thursday", period: 7, teacher_id: "T03", subject: "Mathematics", is_lab: false },
        { id: "tt_032", college_id: "college_001", class_id: "class_cs_2024_1_a", day: "Thursday", period: 8, teacher_id: null, subject: "Study Hour", is_lab: false },

        // Friday schedule
        { id: "tt_033", college_id: "college_001", class_id: "class_cs_2024_1_a", day: "Friday", period: 1, teacher_id: "T01", subject: "Data Structures", is_lab: false },
        { id: "tt_034", college_id: "college_001", class_id: "class_cs_2024_1_a", day: "Friday", period: 2, teacher_id: "T02", subject: "Database Systems", is_lab: false },
        { id: "tt_035", college_id: "college_001", class_id: "class_cs_2024_1_a", day: "Friday", period: 3, teacher_id: "T03", subject: "Mathematics", is_lab: false },
        { id: "tt_036", college_id: "college_001", class_id: "class_cs_2024_1_a", day: "Friday", period: 4, teacher_id: "T01", subject: "Data Structures", is_lab: false },
        { id: "tt_037", college_id: "college_001", class_id: "class_cs_2024_1_a", day: "Friday", period: 5, teacher_id: "T03", subject: "Mathematics", is_lab: false },
        { id: "tt_038", college_id: "college_001", class_id: "class_cs_2024_1_a", day: "Friday", period: 6, teacher_id: "T02", subject: "Database Systems", is_lab: false },
        { id: "tt_039", college_id: "college_001", class_id: "class_cs_2024_1_a", day: "Friday", period: 7, teacher_id: "T01", subject: "Data Structures", is_lab: false },
        { id: "tt_040", college_id: "college_001", class_id: "class_cs_2024_1_a", day: "Friday", period: 8, teacher_id: null, subject: "Study Hour", is_lab: false },

        // Saturday schedule
        { id: "tt_041", college_id: "college_001", class_id: "class_cs_2024_1_a", day: "Saturday", period: 1, teacher_id: "T03", subject: "Mathematics", is_lab: false },
        { id: "tt_042", college_id: "college_001", class_id: "class_cs_2024_1_a", day: "Saturday", period: 2, teacher_id: "T01", subject: "Data Structures", is_lab: false },
        { id: "tt_043", college_id: "college_001", class_id: "class_cs_2024_1_a", day: "Saturday", period: 3, teacher_id: "T02", subject: "Database Systems", is_lab: false },
        { id: "tt_044", college_id: "college_001", class_id: "class_cs_2024_1_a", day: "Saturday", period: 4, teacher_id: "T03", subject: "Mathematics", is_lab: false }
    ];

    // ============================================
    // ATTENDANCE RECORDS (Sample)
    // ============================================
    const attendanceRecords = [
        {
            id: "att_001",
            college_id: "college_001",
            class_id: "class_cs_2024_1_a",
            date: "2026-02-01",
            period: 1,
            present: ["24CS001", "24CS002"],
            absent: ["24CS003"],
            marked_by: "T01",
            marked_at: new Date()
        }
    ];

    // ============================================
    // CONCERNS
    // ============================================
    const concerns = [
        {
            id: "concern_001",
            college_id: "college_001",
            class_id: "class_cs_2024_1_a",
            reporter_pin: "24CS001",
            reported_pin: "24CS003",
            category: "Discipline",
            description: "Disturbance during class",
            anonymous: false,
            status: "open",
            created_at: new Date(),
            escalated: false
        }
    ];

    try {
        // Seed Colleges
        console.log("Seeding colleges...");
        for (const college of colleges) {
            await db.collection('colleges').doc(college.id).set(college);
            console.log(`  ✓ ${college.name}`);
        }

        // Seed Admins
        console.log("Seeding admins...");
        for (const admin of admins) {
            await db.collection('admins').doc(admin.uid).set(admin);
            console.log(`  ✓ ${admin.name}`);
        }

        // Seed Classes
        console.log("Seeding classes...");
        for (const cls of classes) {
            await db.collection('classes').doc(cls.id).set(cls);
            console.log(`  ✓ ${cls.branch} - ${cls.section}`);
        }

        // Seed Teachers
        console.log("Seeding teachers...");
        for (const teacher of teachers) {
            await db.collection('teachers').doc(teacher.uid).set(teacher);
            console.log(`  ✓ ${teacher.name}`);
        }

        // Seed Students
        console.log("Seeding students...");
        for (const student of students) {
            await db.collection('students').doc(student.uid).set(student);
            console.log(`  ✓ ${student.name}`);
        }

        // Seed Teaching Assignments
        console.log("Seeding teaching assignments...");
        for (const ta of teachingAssignments) {
            await db.collection('teaching_assignments').doc(ta.id).set(ta);
            console.log(`  ✓ ${ta.teacher_id} -> ${ta.subject}`);
        }

        // Seed Quizzes
        console.log("Seeding quizzes...");
        for (const quiz of quizzes) {
            await db.collection('quizzes').doc(quiz.id).set(quiz);
            console.log(`  ✓ ${quiz.title}`);
        }

        // Seed Quiz Questions
        console.log("Seeding quiz questions...");
        for (const qq of quizQuestions) {
            await db.collection('quiz_questions').doc(qq.id).set(qq);
            console.log(`  ✓ Question for ${qq.quiz_id}`);
        }

        // Seed Materials
        console.log("Seeding materials...");
        for (const mat of materials) {
            await db.collection('materials').doc(mat.id).set(mat);
            console.log(`  ✓ ${mat.title}`);
        }

        // Seed Timetables
        console.log("Seeding timetables...");
        for (const tt of timetables) {
            await db.collection('timetables').doc(tt.id).set(tt);
        }
        console.log(`  ✓ ${timetables.length} slots created`);

        // Seed Attendance Records
        console.log("Seeding attendance records...");
        for (const att of attendanceRecords) {
            await db.collection('attendance_records').doc(att.id).set(att);
            console.log(`  ✓ ${att.date} Period ${att.period}`);
        }

        // Seed Concerns
        console.log("Seeding concerns...");
        for (const concern of concerns) {
            await db.collection('concerns').doc(concern.id).set(concern);
            console.log(`  ✓ Concern ${concern.id}`);
        }

        console.log("\n========================================");
        console.log("✓ Database seeding completed successfully!");
        console.log("========================================");
        console.log("\nSeeded data summary:");
        console.log(`  - Colleges: ${colleges.length}`);
        console.log(`  - Admins: ${admins.length}`);
        console.log(`  - Classes: ${classes.length}`);
        console.log(`  - Teachers: ${teachers.length}`);
        console.log(`  - Students: ${students.length}`);
        console.log(`  - Teaching Assignments: ${teachingAssignments.length}`);
        console.log(`  - Quizzes: ${quizzes.length}`);
        console.log(`  - Quiz Questions: ${quizQuestions.length}`);
        console.log(`  - Materials: ${materials.length}`);
        console.log(`  - Timetable Slots: ${timetables.length}`);
        console.log(`  - Attendance Records: ${attendanceRecords.length}`);
        console.log(`  - Concerns: ${concerns.length}`);

    } catch (error) {
        console.error("Error seeding database:", error);
    } finally {
        process.exit();
    }
}

seedDatabase();
