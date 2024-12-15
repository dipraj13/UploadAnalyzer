const express = require("express");
const multer = require("multer");
const { exec } = require("child_process");
const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");

const app = express();
const cors = require("cors");
app.use(cors());

// MongoDB connection setup
mongoose.connect("mongodb://localhost:27017/file-db", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

  const Record = mongoose.model('Record', new mongoose.Schema({
    Name: { type: String },
    Email: { type: String },
    Details: { type: String }
}), 'files-data');
module.exports = Record;

// Configure multer for file uploads
const upload = multer({ dest: "uploads/" });

// Endpoint to upload PDF and process it
app.post("/upload", upload.single("file"), (req, res) => {
  if (!req.file) {
    return res.status(400).send("No file uploaded.");
  }

  const filePath = path.join(__dirname, req.file.path);

  // Run the Python script to process the PDF
  const pythonScript = `python extract-data.py "${filePath}"`;

  exec(pythonScript, (error, stdout, stderr) => {
    // Clean up the uploaded file
    fs.unlinkSync(filePath);

    if (error) {
      console.error(`Error executing Python script: ${stderr}`);
      return res.status(500).send("Error processing file.");
    }

    console.log("Python script output:", stdout);
    res.status(200).send("File processed and data stored in MongoDB!");
  });
});

// Endpoint to fetch all records from the database
app.get("/records", async (req, res) => {
  try {
    const records = await Record.find({});  // Fetch records from MongoDB
    res.status(200).json(records);  // Return records as a JSON response
  } catch (error) {
    console.error("Error fetching records:", error);
    res.status(500).send("Error fetching records.");
  }
});

// Start server
const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
