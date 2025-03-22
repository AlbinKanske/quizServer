const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const readline = require('readline');

const app = express();
const port = process.env.PORT || 8085;

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const admin = require('firebase-admin');

const serviceAccount = require('./quiz-storage-4c93e-firebase-adminsdk-fbsvc-673c47b8af.json');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: 'https://quiz-storage-4c93e-default-rtdb.europe-west1.firebasedatabase.app'
});

const db = admin.database();

async function cleanQuizzes() {
    try {
        const dbRef = db.ref('/quizzes');
        const snapshot = await dbRef.once('value');
        let Data = snapshot.val();

        if (!Data) {
            console.log("No quizzes found in Firebase to clean.");
            return;
        }

        Data = Object.entries(Data).map(([key, value]) => ({
            ...value
        }));

        let deleted = 0;

        for (let i = 0; i < Data.length; i++) {
            let quiz = Data[i].quiz;
            if (
                JSON.stringify(quiz[0]) === JSON.stringify(
                    {"alts":[""],"answer":[""],"question":"","type":"write"}
                ) ||
                JSON.stringify(quiz[0]) === JSON.stringify(
                    {"alts":['', '', '', ''],"answer":['', '', '', ''],"question":"","type":"write"}
                ) ||
                JSON.stringify(quiz[0]) === JSON.stringify({})
            ) {
                try {
                    Data.splice(i, 1);  
                    deleted++;  
                    i--;
                } catch (removeError) {
                    console.error(`Error removing quiz with ID ${Data[i].id}:`, removeError);
                }
            }
        }

        console.log(`${deleted} empty ${deleted === 1 ? "quiz" : "quizzes"} found and deleted.`);

        for (let j = 0; j < Data.length; j++) {
            try {
                if (Data[j] == null) {
                    Data.splice(j, 1);
                    j--;
                }
            } catch (error) {
                console.error(`Error updating quiz at index ${j}:`, error);
            }
        }

        try {
            const dbRef = db.ref('/quizzes');
            await dbRef.set(Data);
            console.log("Quizzes updated successfully in Firebase");
        } catch (error) {
            console.error("Error updating quizzes in Firebase:", error);
        }

        console.log("Quizzes cleaned and updated in Firebase successfully!");

    } catch (err) {
        console.error("Error during cleanQuizzes:", err);
    }
}


app.get("/clean-quiz", async (req, res) => {
    try {
        await cleanQuizzes();
        res.send("Cleaning quizzes in Firebase");
    } catch (error) {
        console.error("Error in /clean-quiz endpoint:", error);
        res.status(500).send("Error cleaning quizzes");
    }
})

app.use(cors());
app.use(express.json());

app.get("/quizzes", async (req, res) => {
    try {
        const dbRef = db.ref('/quizzes');
        
        const snapshot = await dbRef.once('value');
        
        const quizzes = snapshot.val();

        if (quizzes) {
            res.json(quizzes);
        } else {
            res.json([]);
        }
    } catch (error) {
        console.error("Error reading quiz data from Firebase:", error);
        return res.status(500).json({
            message: "Error reading quiz data from Firebase",
            error: error.message
        });
    }
});

app.post("/save-quiz", async (req, res) => {
    const { quiz, info, id } = req.body;

    try {
        const dbRef = db.ref('/quizzes');

        if (id !== undefined && id >= 0) {
            await dbRef.child(id.toString()).update({
                quiz,
                info
            });
            console.log(`Quiz: ${info.name} at index ${id} updated in Firebase`);
            return res.json({
                message: "Quiz updated successfully in Firebase",
                quizIndex: id
            });
        } else {
            const quizzesSnapshot = await dbRef.once('value');
            const quizzes = quizzesSnapshot.val();
            const newIndex = quizzes ? Object.keys(quizzes).length : 0;

            await dbRef.child(newIndex.toString()).set({
                quiz,
                info
            });

            console.log(`New quiz added with index: ${newIndex}`);
            return res.json({
                message: "Quiz saved successfully to Firebase",
                quizIndex: newIndex
            });
        }
    } catch (error) {
        console.error("Error saving quiz data to Firebase:", error);
        return res.status(500).json({
            message: "Error saving quiz data to Firebase",
            error: error.message
        });
    }
});

function executeCommand(command) {
    switch (command) {
        case "cleanUp":
            cleanQuizzes();
            break;
        case "stop":
            console.log("Shutting down server...");
            setTimeout(() => {
                process.exit();
            }, 350);
            break;
        default:
            console.log("Invalid command");
    }
}

rl.on("line", (input) => {
    executeCommand(input);
    rl.prompt();
})

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});

