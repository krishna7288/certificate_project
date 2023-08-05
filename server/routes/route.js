const express = require('express');
const router = express.Router();
const multer = require('multer');
const UserModel = require('../model/user');
const pdfkit = require('pdfkit');
const { Readable } = require('stream');
const dropboxV2Api = require('dropbox-v2-api');
require('dotenv').config();

const dropbox = dropboxV2Api.authenticate({
  token:process.env.DROP
});

  const upload = multer(); // No storage configuration for multer

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




router.post('/generate-pdf', async (req, res) => {
  const { dataURL, studentName, mobileNumber, dob, courseName, duration, certificateNumber } = req.body;

  try {
    const buffer = Buffer.from(dataURL.split(',')[1], 'base64');

    const doc = new pdfkit({
      size: [595.28, 841.89],
      layout: 'landscape',
      margin: 0,
      dpi: 1000,
    });

    doc.image(buffer, {
      fit: [doc.page.width, doc.page.height],
    });

    const pdfBuffer = await new Promise((resolve, reject) => {
      const buffers = [];
      doc.on('data', (chunk) => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.end();
    });

    const timestamp = Date.now(); // Get a unique timestamp
    const fileName = `${timestamp}_${studentName}_certificate.pdf`; // Include the timestamp in the file name

    const uploadResult = await new Promise((resolve, reject) => {
      const readableStream = new Readable(); // Create a readable stream
      readableStream.push(pdfBuffer);
      readableStream.push(null); // Signal the end of the stream

      dropbox(
        {
          resource: 'files/upload',
          parameters: {
            path: `/Certificates/${fileName}`, // Use the new file name with timestamp
          },
          readStream: readableStream, // Pass the readable stream here
        },
        (err, result) => {
          if (err) {
            reject(err);
          } else {
            resolve(result);
          }
        }
      );
    });

    // Construct the Dropbox shared link URL
    const sharedLink = `https://www.dropbox.com/s/${uploadResult.id}/${fileName}?dl=1`;

    const user = await UserModel.create({
      student_name: studentName,
      dob,
      course_name: courseName,
      mobile_number: mobileNumber,
      certificate_number: certificateNumber,
      duration,
      certificate_file: sharedLink, // Store the shared link URL
    });

    res.status(200).send({ downloadLink: sharedLink });
  } catch (error) {
    console.error('Failed to generate the certificate PDF:', error);
    res.status(500).send('An error occurred while generating the certificate PDF.');
  }
});


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

router.get('/download/:fileName', async (req, res) => {
  const { fileName } = req.params;
  const filePath = path.join(__dirname, '../uploads', fileName);

  try {
    if (!fs.existsSync(filePath)) {
      return res.status(404).send('File not found');
    }

    res.setHeader('Content-Type', 'application/pdf');
    fs.createReadStream(filePath).pipe(res);
  } catch (error) {
    console.error('Failed to download the certificate:', error);
    res.status(500).send('An error occurred while downloading the certificate.');
  }
});

router.delete('/api/students/:name', async (req, res) => {
  const { name } = req.params;
  try {
    const deletedStudent = await UserModel.findOneAndDelete({ student_name: name });
    if (!deletedStudent) {
      return res.status(404).send('Student not found');
    }

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
