
const express = require("express");
const cors = require("cors");
//const https = require("https");
const fs = require("fs");
const path = require("path");

const app = express();
const port = 8085;

/*const options = {
    key: fs.readFileSync(path.join(__dirname, "ssl", "privkey.pem")),
    cert: fs.readFileSync(path.join(__dirname, "ssl", "cert.pem")),
    ca: fs.readFileSync(path.join(__dirname, "ssl", "chain.pem"))
}*/

app.use(cors());
app.use(express.json());

app.get("/quizzes", (req, res) => {
    const filePath = path.join(__dirname, "questions.json");
  
    fs.readFile(filePath, (err, data) => {
        if (err) {
            console.error("Error reading quiz data:", err);
            return res.status(500).json({ message: "Error reading quiz data" });
        }
  
    res.json(JSON.parse(data));
    });
});

app.post("/save-quiz", (req, res) => {
  const { quiz, info, id } = req.body;
  const filePath = path.join(__dirname, "questions.json");

    fs.readFile(filePath, (err, data) => {
        let quizzes = [];

        if (!err) {
            quizzes = JSON.parse(data);
        }

        let quizIndex = -1;

        if (id >= 0 && id < quizzes.length) {
          quizzes[id] = { quiz, info };
          quizIndex = id;
          console.log(`Quiz: ${info.name} at index ${id} updated`);
        } else {
          quizzes.push({ quiz, info });
          quizIndex = quizzes.length - 1;
          console.log("New quiz added");
        }

        fs.writeFile(filePath, JSON.stringify(quizzes, null, 2), (err) => {
            if (err) {
                console.error("Error saving quiz data:", err);
                return res.status(500).json({ message: "Error saving quiz data" });
          }
          console.log("Quiz saved/updated successfully");
          return res.json({ message: "Quiz saved/updated successfully", quizIndex });
      });
  });
});

//start the server

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});

/*https.createServer(options, app).listen(port, () => {
    console.log(`console.log(server is running on https://localhost:${port})`);
});*/

