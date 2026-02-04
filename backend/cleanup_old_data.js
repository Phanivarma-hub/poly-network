const { db } = require('./firebase');

async function cleanup() {
    const oldCollegeId = "HWxAor4ecV9eKfLFcnTZ";
    console.log(`Cleaning up old college: ${oldCollegeId}`);

    const collections = ['admins', 'teachers', 'students', 'classes', 'subjects'];

    for (const coll of collections) {
        const snapshot = await db.collection(coll).where('college_id', '==', oldCollegeId).get();
        console.log(`Deleting ${snapshot.size} docs from ${coll}...`);
        const batch = db.batch();
        snapshot.forEach(doc => batch.delete(doc.ref));
        await batch.commit();
    }

    await db.collection('colleges').doc(oldCollegeId).delete();
    console.log("Cleanup complete!");
    process.exit(0);
}

cleanup();
