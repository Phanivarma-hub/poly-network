const { db } = require('./firebase');

async function seedDatabase() {
    console.log("Starting database seeding...");

    const colleges = [
        {
            id: "college_001",
            name: "Polytechnic Institute of technology",
            code: "PIT01",
            location: "Main Campus",
            created_at: new Date()
        }
    ];

    const admins = [
        {
            uid: "admin_poly_01",
            name: "Super Admin",
            email: "admin@pit01.edu",
            college_id: "college_001",
            role: "admin",
            created_at: new Date()
        }
    ];

    const classes = [
        {
            id: "class_cs_2024_a",
            college_id: "college_001",
            branch: "Computer Science",
            year: "2024",
            semester: "1",
            section: "A",
            pin_validation_rule: {
                type: "regex",
                pattern: "^24093\\sCM\\s[0-9]{3}$"
            }
        }
    ];

    const teachers = [
        {
            uid: "T01",
            name: "Dr. Smith",
            email: "smith@pit01.edu",
            college_id: "college_001",
            role: "teacher",
            is_class_teacher: true,
            class_id_assigned: "class_cs_2024_a"
        }
    ];

    try {
        // Seed Colleges
        for (const college of colleges) {
            await db.collection('colleges').doc(college.id).set(college);
            console.log(`Seeded college: ${college.name}`);
        }

        // Seed Admins
        for (const admin of admins) {
            await db.collection('admins').doc(admin.uid).set(admin);
            console.log(`Seeded admin: ${admin.name}`);
        }

        // Seed Classes
        for (const cls of classes) {
            await db.collection('classes').doc(cls.id).set(cls);
            console.log(`Seeded class: ${cls.id}`);
        }

        // Seed Teachers
        for (const teacher of teachers) {
            await db.collection('teachers').doc(teacher.uid).set(teacher);
            console.log(`Seeded teacher: ${teacher.name}`);
        }

        console.log("Seeding completed successfully!");
    } catch (error) {
        console.error("Error seeding database:", error);
    } finally {
        process.exit();
    }
}

seedDatabase();
