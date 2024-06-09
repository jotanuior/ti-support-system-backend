const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const nodemailer = require('nodemailer');

const app = express();
app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const questionSchema = new mongoose.Schema({
  question: String,
  answers: [{ text: String, votes: Number }],
});

const supportRequestSchema = new mongoose.Schema({
  name: String,
  email: String,
  issue: String,
});

const Question = mongoose.model('Question', questionSchema);
const SupportRequest = mongoose.model('SupportRequest', supportRequestSchema);

app.post('/ask', async (req, res) => {
  const { question } = req.body;
  const newQuestion = new Question({ question, answers: [] });
  await newQuestion.save();
  res.json(newQuestion);
});

app.get('/questions', async (req, res) => {
  const questions = await Question.find();
  res.json(questions);
});

app.post('/answer', async (req, res) => {
  const { questionId, answer } = req.body;
  const question = await Question.findById(questionId);
  question.answers.push({ text: answer, votes: 0 });
  await question.save();
  res.json(question);
});

app.post('/vote', async (req, res) => {
  const { questionId, answerId, vote } = req.body;
  const question = await Question.findById(questionId);
  const answer = question.answers.id(answerId);
  answer.votes += vote;
  await question.save();
  res.json(question);
});

app.post('/contact-support', async (req, res) => {
  const { name, email, issue } = req.body;
  const newRequest = new SupportRequest({ name, email, issue });
  await newRequest.save();

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'your-email@gmail.com',
      pass: 'your-email-password',
    },
  });

  const mailOptions = {
    from: 'your-email@gmail.com',
    to: 'support-team-email@gmail.com',
    subject: 'New Support Request',
    text: `Name: ${name}\nEmail: ${email}\nIssue: ${issue}`,
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.log(error);
      res.status(500).send('Error sending email');
    } else {
      console.log('Email sent: ' + info.response);
      res.status(200).send('Support request submitted');
    }
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
