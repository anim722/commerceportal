const express = require("express");
const fs = require("fs");
const multer = require("multer");

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.static("publicc"));

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, "publicc/uploadss/"),
    filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname),
});
const upload = multer({ storage });

app.post("/upload", upload.single("file"), (req, res) => {
    res.json({ filePath: `/uploadss/${req.file.filename}` });
});

app.post("/save", (req, res) => {
    fs.readFile("data.json", (err, data) => {
        const existingData = err ? [] : JSON.parse(data);
        const newData = [...existingData, ...req.body];
        fs.writeFile("data.json", JSON.stringify(newData, null, 2), () => {
            res.status(200).send("Data saved successfully!");
        });
    });
});

app.get("/data", (req, res) => {
    fs.readFile("data.json", (err, data) => {
        res.json(err ? [] : JSON.parse(data));
    });
});

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
