

const express = require('express');
const cors = require("cors");

const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');
const app = express();
const PORT = 3000;

//const express = require('express');
const multer = require('multer');
const pathh = require('path');
const fss = require('fs');


app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'home.html')); // Default page as home.html
  });
// Set up storage for uploaded files
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = pathh.join(__dirname, 'public/uploads');
    if (!fss.existsSync(dir)) {
      fss.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + pathh.extname(file.originalname));
  },
});

const upload = multer({ storage });

// Middleware
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));

app.set('view engine', 'ejs');

app.set('views', path.join(__dirname, 'views'));


// Static folder for downloads
app.use('/download', express.static(path.join(__dirname, 'uploads')));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));

// Ensure uploads folders exist
const classFolders = ['fybcom', 'sybcom', 'tybcom', 'fymcom', 'symcom'];
classFolders.forEach(folder => {
    const dir = path.join(__dirname, 'uploads', folder);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
});

// Multer setup for file uploads (Renamed storage to fileStorage)
const fileStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        const className = req.body.className.toLowerCase(); // Convert to lowercase
        const uploadPath = path.join(__dirname, 'uploads', className);
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        cb(null, file.originalname);
    }
});
const fileUploader = multer({ storage: fileStorage });

// Store uploaded files data
const studyMaterialData = {};
const syllabusData = {};

// Handle file upload (Renamed upload to fileUploader)
app.post('/upload', fileUploader.single('file'), (req, res) => {
    const className = req.body.className.toLowerCase();
    const fileType = req.body.fileType; // 'studyMaterial' or 'syllabus'

    if (!studyMaterialData[className]) studyMaterialData[className] = [];
    if (!syllabusData[className]) syllabusData[className] = [];

    const fileInfo = { originalname: req.file.originalname, filename: req.file.filename };

    if (fileType === 'studyMaterial') {
        studyMaterialData[className].push(fileInfo);
    } else if (fileType === 'syllabus') {
        syllabusData[className].push(fileInfo);
    }

    res.send(`<script>alert("File Uploaded Successfully!"); window.history.back();</script>`);
});

// Student login credentials
const studentCredentials = {
    fybcom: { id: 'student', password: '1234' },
    sybcom: { id: 'student', password: '4321' },
    tybcom: { id: 'student', password: '2134' },
    fymcom: { id: 'student', password: '3421' },
    symcom: { id: 'student', password: '4444' }
};

// Student login route
app.post('/student-login', (req, res) => {
    const { studentId, password, className } = req.body;
    if (studentCredentials[className] && studentCredentials[className].id === studentId && studentCredentials[className].password === password) {
        return res.redirect(`/${className}`);
    } else {
        return res.send('<script>alert("Invalid Credentials"); window.history.back();</script>');
    }
});

// Student Pages (Dynamic Data)
app.get('/:className', (req, res) => {
    const className = req.params.className.toLowerCase();
    res.render(className, { 
        studyMaterial: studyMaterialData[className] || [], 
        syllabus: syllabusData[className] || [] 
    });
});

// In-memory storage for files (simulate database)

// ✅ Enable JSON & URL Encoding
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

// ✅ Serve Static Files
app.use(express.static("public"));
app.use("/uploads", express.static("uploads"));

// ✅ Multer Storage Setup
const storagee = multer.diskStorage({
    destination: function (req, file, cb) {
        const className = req.body.className; // Get Class Name
        if (!className) return cb(new Error("Class name is required"));

        const uploadPath = path.join(__dirname, "uploads", className);
        fs.mkdirSync(uploadPath, { recursive: true });
        cb(null, uploadPath);
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + "-" + file.originalname);
    }
});

const uploade = multer({ storagee });

// ✅ Upload Route
app.post("/upload", uploade.single("file"), (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ success: false, error: "No file uploaded" });

        const fileData = {
            fileName: req.file.filename,
            className: req.body.className,
            description: req.body.description || "",
            filetype: req.body.filetype || "study material"
        };

        res.json({ success: true, message: "File uploaded successfully!", fileData });
    } catch (error) {
        console.error("Upload error:", error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ✅ Get Uploaded Files
app.get("/files/:className", (req, res) => {
    const className = req.params.className;
    const classPath = path.join(__dirname, "uploads", className);

    if (!fs.existsSync(classPath)) return res.json([]);

    const files = fs.readdirSync(classPath).map(file => ({
        fileName: file,
        filePath: `/uploads/${className}/${file}`
    }));

    res.json(files);
});

// ✅ Download File
app.get("/download/:className/:fileName", (req, res) => {
    const { className, fileName } = req.params;
    const filePath = path.join(__dirname, "uploads", className, fileName);

    if (!fs.existsSync(filePath)) return res.status(404).send("File not found");

    res.download(filePath);
});

// ✅ Delete File (Only Teacher Can)
app.delete("/delete/:className/:fileName", (req, res) => {
    const { className, fileName } = req.params;
    const filePath = path.join(__dirname, "uploads", className, fileName);

    if (!fs.existsSync(filePath)) return res.status(404).json({ success: false, error: "File not found" });

    fs.unlinkSync(filePath);
    res.json({ success: true, message: "File deleted successfully!" });
});

// ✅ Start Server


// 🔹 Global Error Handler (Prevents Server from Crashing)
app.use((err, req, res, next) => {
    console.error("❌ Unexpected Server Error:", err);
    res.status(500).json({ success: false, error: "Something went wrong!" });
});


// 🔹 Global Error Handler (Prevents Server from Crashing)
app.use((err, req, res, next) => {
    console.error("❌ Unexpected Server Error:", err);
    res.status(500).json({ success: false, error: "Something went wrong!" });
});



// Handle class-specific page (e.g., fybcom)
app.get('/:class', (req, res) => {
    const { class: selectedClass } = req.params;
    const classFiles = files.filter(file => file.class === selectedClass);
    res.render(selectedClass, { files: classFiles });
});




app.get('/download/:filename', (req, res) => {
  const filePath = pathh.join(__dirname, 'public/uploads', req.params.filename);
  res.download(filePath);
});

// Start server
///app.listen(PORT, () => {
 // console.log(`Server running at http://localhost:${PORT}`);
//});

// File paths
const studentsFilePath = path.join(__dirname, 'data', 'students.json');
const reportsDir = path.join(__dirname, 'reports');

// Middleware


app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));


// Ensure necessary directories and files exist
if (!fs.existsSync(studentsFilePath)) {
    fs.mkdirSync(path.dirname(studentsFilePath), { recursive: true });
    fs.writeFileSync(studentsFilePath, '[]', 'utf8');
}

if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir);
}

// API to add a student
app.post('/api/add-student', (req, res) => {
    const newStudent = req.body;

    // Read existing student data
    fs.readFile(studentsFilePath, 'utf8', (err, data) => {
        if (err) {
            res.status(500).send('Error reading student data');
        } else {
            const students = JSON.parse(data);
            students.push(newStudent);

            // Write updated data to file
            fs.writeFile(studentsFilePath, JSON.stringify(students, null, 2), (err) => {
                if (err) {
                    res.status(500).send('Error saving student data');
                } else {
                    res.status(200).send('Student added successfully');
                }
            });
        }
    });
});

// API to get all students
app.get('/api/students', (req, res) => {
    fs.readFile(studentsFilePath, 'utf8', (err, data) => {
        if (err) {
            res.status(500).send('Error reading students file');
        } else {
            res.json(JSON.parse(data));
        }
    });
});

// Serve the student details page
app.get('/student', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'student-details.html'));
});

     




// API to download the student report
app.get('/api/download-report', (req, res) => {
    const reportPath = path.join(reportsDir, 'student-report.csv');

    fs.readFile(studentsFilePath, 'utf8', (err, data) => {
        if (err) {
            res.status(500).send('Error reading students file');
        } else {
            const students = JSON.parse(data);
            const csvData = [
                ['Name', 'Address', 'Gender', 'Marks', 'Phone', 'Email', 'Date of Birth'],
                ...students.map(student => [
                    student.name,
                    student.fathersName,
                    student.gender,
                    student.marks,
                    student.phone,
                    student.email,
                    student.dob,
                ]),
            ]
            .map(row => row.join(','))
            .join('\n');

            fs.writeFile(reportPath, csvData, (err) => {
                if (err) {
                    res.status(500).send('Error generating report');
                } else {
                    res.download(reportPath);
                }
            });
        }
    });
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
});