const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const cors = require('cors');
const connectDB = require('./model/connection');
const routes = require('./routes/route');
const path = require('path');


app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');

// app.use(bodyParser.urlencoded({ extended: true }));
// app.use(bodyParser.json());
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));
app.use(cors());

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/', routes);

connectDB(); // Establish MongoDB connection

const port = process.env.PORT || 8000;

app.listen(port, () => {
  console.log(`Server started on port ${port}`);
});