const express = require('express');
const cors = require('cors');
const { OpenAI } = require('openai');
const multer = require('multer');
const fs = require('fs');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const upload = multer({ dest: 'uploads/' });

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function parseFile(file) {
  let fileContent = '';
  const fileType = file.mimetype;

  if (fileType === 'text/plain') {
    fileContent = fs.readFileSync(file.path, 'utf-8');
  } else if (fileType === 'application/pdf') {
    const dataBuffer = fs.readFileSync(file.path);
    const data = await pdfParse(dataBuffer);
    fileContent = data.text;
  } else if (fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    const data = await mammoth.extractRawText({ path: file.path });
    fileContent = data.value;
  }

  return fileContent;
}

app.post('/api/chat', upload.array('files', 5), async (req, res) => {
  try {
    const { prompt, model } = req.body;
    console.log('Received prompt:', prompt);
    console.log('Selected model:', model);

    let combinedFileContent = '';
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        combinedFileContent += await parseFile(file) + '\n';
      }
      console.log('Received file content:', combinedFileContent);
    }

    const messages = [{ role: "user", content: prompt }];
    if (combinedFileContent) {
      messages.push({ role: "user", content: combinedFileContent });
    }

    const response = await openai.chat.completions.create({
      model: model,
      messages: messages,
      max_tokens: 4000 // Increased token limit
    });

    console.log('OpenAI response:', response);

    res.json({ response: response.choices[0].message.content.trim() });
  } catch (error) {
    console.error('Error calling OpenAI:', error);
    res.status(500).json({ error: 'An error occurred while processing your request.', details: error.message });
  } finally {
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        fs.unlinkSync(file.path); // clean up the uploaded files
      }
    }
  }
});

app.post('/api/image', async (req, res) => {
  try {
    const { prompt } = req.body;
    console.log('Received image generation prompt:', prompt);

    const response = await openai.images.generate({
      prompt: prompt,
      n: 1,
      size: "1024x1024"
    });

    console.log('Image generation response:', response);

    res.json({ imageUrl: response.data[0].url });
  } catch (error) {
    console.error('Error generating image:', error);
    res.status(500).json({ error: 'An error occurred while generating the image.', details: error.message });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));