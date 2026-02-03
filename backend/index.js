const express = require("express");
const cors = require("cors");
const { auth, db } = require("./firebase");

const app = express();

app.use(cors());
app.use(express.json());

// Endpoint to create Auth users for newly approved colleges (Super Admin only)
app.post("/api/admin/create-auth-user", async (req, res) => {
    const { email, password, name, uid, collegeId, role } = req.body;

    try {
        const userRecord = await auth.createUser({
            uid: uid,
            email: email,
            password: password,
            displayName: name
        });

        console.log(`Successfully created new auth user: ${userRecord.uid}`);
        res.status(201).json({ success: true, uid: userRecord.uid });
    } catch (error) {
        console.error("Error creating auth user:", error);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.get("/", (req, res) => {
    res.send("Poly Network Backend is running");
});

app.listen(5000, () => {
    console.log("Server running on http://localhost:5000");
});
