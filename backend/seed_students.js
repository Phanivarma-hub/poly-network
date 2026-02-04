const { db, admin } = require('./firebase');

async function seedStudents() {
    console.log("Starting student seeding process...");

    const collegeCode = "CME001";
    const section = "CME-D";

    try {
        // 1. Find College
        const collegeQuery = await db.collection('colleges').where('code', '==', collegeCode).get();
        if (collegeQuery.empty) {
            console.error(`College with code ${collegeCode} not found.`);
            process.exit(1);
        }
        const collegeId = collegeQuery.docs[0].id;
        console.log(`Found College: ${collegeId}`);

        // 2. Find Class
        const classQuery = await db.collection('classes')
            .where('college_id', '==', collegeId)
            .where('section', '==', section)
            .get();

        if (classQuery.empty) {
            console.error(`Class with section ${section} not found in college ${collegeCode}.`);
            process.exit(1);
        }
        const classId = classQuery.docs[0].id;
        console.log(`Found Class: ${classId}`);

        // 3. Seed Students
        const batch = db.batch();
        let count = 0;

        for (let pin = 198; pin <= 259; pin++) {
            const studentRef = db.collection('students').doc();
            const pinStr = pin.toString();

            batch.set(studentRef, {
                college_id: collegeId,
                class_id: classId,
                pin: pinStr,
                uid: `STU${pinStr}`,
                name: `Student ${pinStr}`,
                role: 'student',
                status: 'active',
                created_at: admin.firestore.FieldValue.serverTimestamp()
            });
            count++;
        }

        await batch.commit();
        console.log(`Successfully seeded ${count} students (PIN 198 to 259).`);
        process.exit(0);
    } catch (err) {
        console.error("Seeding failed:", err);
        process.exit(1);
    }
}

seedStudents();
