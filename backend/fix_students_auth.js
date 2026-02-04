const { db, auth, admin } = require('./firebase');

async function fixStudents() {
    console.log("Adding Auth accounts and emails to students 198-259...");

    const collegeCode = "CME001";
    const password = "password123";

    try {
        // 1. Find College
        const collegeQuery = await db.collection('colleges').where('code', '==', collegeCode).get();
        if (collegeQuery.empty) {
            console.error(`College ${collegeCode} not found.`);
            process.exit(1);
        }
        const collegeId = collegeQuery.docs[0].id;

        // 2. Fetch all students for this college
        const studentsSnapshot = await db.collection('students').where('college_id', '==', collegeId).get();
        console.log(`Found ${studentsSnapshot.size} students to update.`);

        for (const docSnap of studentsSnapshot.docs) {
            const student = docSnap.data();
            const pin = student.pin;
            const email = `student${pin}@${collegeCode.toLowerCase()}.com`;

            try {
                // Create Auth User
                let authUser;
                try {
                    authUser = await auth.createUser({
                        email: email,
                        password: password,
                        displayName: student.name
                    });
                    console.log(`Created Auth for: ${email}`);
                } catch (e) {
                    console.log(`Auth for ${email} already exists, fetching...`);
                    authUser = await auth.getUserByEmail(email);
                }

                // Update Firestore - move the data to a new doc with UID as ID (to match registration logic)
                const studentData = {
                    ...student,
                    email: email,
                    // No password in Firestore, it's in Auth
                };

                // Remove old doc and set new one with UID
                await db.collection('students').doc(docSnap.id).delete();
                await db.collection('students').doc(authUser.uid).set(studentData);

            } catch (err) {
                console.error(`Failed to update student ${pin}:`, err.message);
            }
        }

        console.log("All students updated with login credentials!");
        process.exit(0);
    } catch (err) {
        console.error("Process failed:", err);
        process.exit(1);
    }
}

fixStudents();
