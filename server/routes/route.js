const express = require('express');
const router = express.Router();
const multer = require('multer');
const UserModel = require('../model/user');
//const puppeteer = require('puppeteer');
const upload = multer(); // No storage configuration for multer
const path = require('path');
const fs = require('fs');
const { promisify } = require('util');
//const unlinkAsync = promisify(fs.unlink);
//const pdf = require('html-pdf'); // Import html-pdf library
const pdfkit = require('pdfkit');


router.post('/form', upload.none(), async (req, res) => {
  const {
    studentName,
    dob,
    courseName,
    duration,
    mobileNumber,
    certificateNumber,
  } = req.body;

  try {
    const user = new UserModel({
      student_name: studentName,
      dob,
      course_name: courseName,
      mobile_number: mobileNumber,
      certificate_number: certificateNumber,
      duration,
    });

    await user.save();

    res.send('User created successfully');
  } catch (error) {
    console.error('Failed to create user:', error);
    res.status(500).send('An error occurred');
  }
});

// Route to generate the certificate and save it to the database
router.post('/generate-pdf', async (req, res) => {
  const { dataURL, studentName,mobileNumber,dob, courseName, duration, certificateNumber } = req.body;

  try {
    // Convert the data URL (base64 encoded image) to a buffer
    const buffer = Buffer.from(dataURL.split(',')[1], 'base64');

    // Create a PDF document using pdfkit
    const doc = new pdfkit({
      size: [595.28, 841.89], // You can use custom size, e.g., { width: 800, height: 600 }
      layout: 'landscape', // Set the orientation to landscape
      margin: 0, // Set margins to 0 to maximize the content area
      dpi: 1000,
    });

    // Stream the image buffer to the PDF document
    doc.image(buffer, {
      fit: [doc.page.width, doc.page.height], // Fit the image to the full page
    });

    // Save the PDF to a buffer
    const pdfBuffer = await new Promise((resolve, reject) => {
      const buffers = [];
      doc.on('data', (chunk) => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.end();
    });

    // Save the buffer to a file (you can use a unique filename)
    const fileName = `${studentName}_certificate.pdf`;
    const filePath = path.join(__dirname, '../uploads', fileName);
    await fs.promises.writeFile(filePath, pdfBuffer);
    const user = await UserModel.create({
      student_name: studentName,
      dob:dob,
      course_name: courseName,
      mobile_number: mobileNumber,
      certificate_number: certificateNumber,
      duration,
      certificate_file: `/download/${fileName}`, // Store the download link in the certificate_file field
    });
    res.status(200).send({ downloadLink: `/download/${fileName}` });
  } catch (error) {
    console.error('Failed to generate the certificate PDF:', error);
    res.status(500).send('An error occurred while generating the certificate PDF.');
  }
});


//To get the certificate by students
router.post('/api/certificates', async (req, res) => {
  const { certificateID, dateOfBirth } = req.body;

  try {
    const certificate = await UserModel.findOne({
      certificate_number: certificateID,
      dob: dateOfBirth,
    });

    if (certificate) {
      res.status(200).json({ certificateURL: certificate.certificate_file });
    } else {
      res.status(404).json({ message: 'Certificate not found backend' });
    }
  } catch (error) {
    console.error('Error fetching certificate:', error);
    res.status(500).json({ message: 'An error occurred while fetching the certificate.' });
  }
});


// Route to handle certificate download
router.get('/download/:fileName', async (req, res) => {
  const { fileName } = req.params;
  const filePath = path.join(__dirname, '../uploads', fileName);

  try {
    if (!fs.existsSync(filePath)) {
      return res.status(404).send('File not found');
    }
    // Stream the PDF file to the client for download
    res.setHeader('Content-Type', 'application/pdf');
    fs.createReadStream(filePath).pipe(res);
  } catch (error) {
    console.error('Failed to download the certificate:', error);
    res.status(500).send('An error occurred while downloading the certificate.');
  }
});

//delete functionality
router.delete('/api/students/:name', async (req, res) => {
  const { name } = req.params;
  try {
    // Find the student by name and delete from the database
    const deletedStudent = await UserModel.findOneAndDelete({ student_name: name });
    if (!deletedStudent) {
      return res.status(404).send('Student not found');
    }

    // If the student was successfully deleted, remove the associated certificate file (optional)
    if (deletedStudent.certificate_file) {
      const filePath = path.join(__dirname, '../uploads', path.basename(deletedStudent.certificate_file));
      fs.unlinkSync(filePath);
    }
    res.status(200).send('Student deleted successfully');
  } catch (error) {
    console.error('Failed to delete student:', error);
    res.status(500).send('An error occurred while deleting the student.');
  }
});

router.get('/students', async (req, res) => {
  try {
    const students = await UserModel.find();
    res.status(200).json(students);
  } catch (error) {
    console.error('Failed to fetch students:', error);
    res.status(500).send('An error occurred while fetching students.');
  }
});
module.exports = router;