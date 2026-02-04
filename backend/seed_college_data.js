const { db, admin, auth } = require('./firebase');

async function seedData() {
    console.log("Starting seeding process with Firebase Auth...");

    const collegeCode = "CME001";
    const collegeData = {
        name: "Computer Engineering Department",
        code: collegeCode,
        address: "Main Campus, Block B",
        status: "active",
        created_at: admin.firestore.FieldValue.serverTimestamp()
    };

    try {
        // 1. Create College
        const collegeRef = await db.collection('colleges').add(collegeData);
        const collegeId = collegeRef.id;
        console.log(`Created College with ID: ${collegeId}`);

        // 2. Create Admin
        const adminEmail = `admin@${collegeCode.toLowerCase()}.com`;
        const adminPass = "password123";

        let adminUid;
        try {
            const authUser = await auth.createUser({
                email: adminEmail,
                password: adminPass,
                displayName: "College Admin"
            });
            adminUid = authUser.uid;
            console.log(`Created Admin Auth User: ${adminEmail}`);
        } catch (e) {
            console.log(`Admin ${adminEmail} might already exist, trying to fetch UID...`);
            const authUser = await auth.getUserByEmail(adminEmail);
            adminUid = authUser.uid;
        }

        await db.collection('admins').doc(adminUid).set({
            college_id: collegeId,
            uid: "ADMN",
            name: "College Admin",
            email: adminEmail,
            role: "admin",
            status: "active",
            created_at: admin.firestore.FieldValue.serverTimestamp()
        });
        console.log(`Updated Admin Firestore doc for: ${adminEmail}`);

        // 3. Create Subjects
        const subjectsData = [
            { name: "Web Technologies", code: "WT", type: "theory" },
            { name: "Computer Networks & Cyber Security", code: "CN&CS", type: "theory" },
            { name: "Java Programming", code: "JAVA", type: "theory" },
            { name: "Software Engineering", code: "SE", type: "theory" },
            { name: "Computer Organization & Microprocessors", code: "CO&MP", type: "theory" },
            { name: "WT & JAVA Lab", code: "WT-JAVA-LAB", type: "lab" },
            { name: "CS & CNCS Lab", code: "CS-CNCS-LAB", type: "lab" },
            { name: "Activities", code: "ACTIVITIES", type: "other" }
        ];

        const subjectRefs = {};
        for (const sub of subjectsData) {
            const ref = await db.collection('subjects').add({
                ...sub,
                college_id: collegeId,
                status: "active",
                created_at: admin.firestore.FieldValue.serverTimestamp()
            });
            subjectRefs[sub.code] = ref.id;
        }
        console.log("Created all subjects.");

        // 4. Create Class
        const classData = {
            college_id: collegeId,
            branch: "Computer Engineering",
            year: "2",
            semester: "4",
            section: "CME-D",
            pin_validation_rule: { type: "range", min: 100, max: 999 },
            subject_sessions: {
                [subjectRefs["WT"]]: 7,
                [subjectRefs["CN&CS"]]: 7,
                [subjectRefs["JAVA"]]: 7,
                [subjectRefs["SE"]]: 6,
                [subjectRefs["CO&MP"]]: 6,
                [subjectRefs["WT-JAVA-LAB"]]: 6,
                [subjectRefs["CS-CNCS-LAB"]]: 6,
                [subjectRefs["ACTIVITIES"]]: 3
            },
            status: "active",
            created_at: admin.firestore.FieldValue.serverTimestamp()
        };

        const classRef = await db.collection('classes').add(classData);
        const classId = classRef.id;
        console.log(`Created Class CME-D with ID: ${classId}`);

        // 5. Create Teachers & Assignments
        const teachers = [
            {
                name: "WT Teacher",
                email: "wt@cme001.com",
                uid: "WTT",
                assignments: [
                    { subject_id: subjectRefs["WT"], class_id: classId },
                    { subject_id: subjectRefs["WT-JAVA-LAB"], class_id: classId }
                ]
            },
            {
                name: "CN&CS Teacher",
                email: "cncs@cme001.com",
                uid: "CNT",
                assignments: [
                    { subject_id: subjectRefs["CN&CS"], class_id: classId },
                    { subject_id: subjectRefs["CS-CNCS-LAB"], class_id: classId }
                ]
            },
            {
                name: "JAVA Teacher",
                email: "java@cme001.com",
                uid: "JVT",
                assignments: [
                    { subject_id: subjectRefs["JAVA"], class_id: classId },
                    { subject_id: subjectRefs["WT-JAVA-LAB"], class_id: classId }
                ]
            },
            {
                name: "SE Teacher",
                email: "se@cme001.com",
                uid: "SET",
                assignments: [
                    { subject_id: subjectRefs["SE"], class_id: classId }
                ]
            },
            {
                name: "CO&MP Teacher",
                email: "comp@cme001.com",
                uid: "COT",
                assignments: [
                    { subject_id: subjectRefs["CO&MP"], class_id: classId }
                ]
            }
        ];

        for (const t of teachers) {
            let teacherUid;
            try {
                const authUser = await auth.createUser({
                    email: t.email,
                    password: "password123",
                    displayName: t.name
                });
                teacherUid = authUser.uid;
                console.log(`Created Teacher Auth User: ${t.email}`);
            } catch (e) {
                console.log(`Teacher ${t.email} might already exist, fetching UID...`);
                const authUser = await auth.getUserByEmail(t.email);
                teacherUid = authUser.uid;
            }

            await db.collection('teachers').doc(teacherUid).set({
                college_id: collegeId,
                name: t.name,
                email: t.email,
                uid: t.uid,
                role: "teacher",
                is_class_teacher: false,
                subject_assignments: t.assignments,
                status: "active",
                created_at: admin.firestore.FieldValue.serverTimestamp()
            });
            console.log(`Updated Teacher Firestore doc for: ${t.email}`);
        }

        console.log("Seeding complete!");
        process.exit(0);
    } catch (err) {
        console.error("Seeding failed:", err);
        process.exit(1);
    }
}

seedData();
