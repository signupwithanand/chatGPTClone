const express = require('express');
const cors = require('cors');
const { OpenAI } = require('openai');
const multer = require('multer');
const fs = require('fs');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const upload = multer({ dest: 'uploads/' });

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

app.post('/api/chat', upload.single('file'), async (req, res) => {
  try {
    const { prompt, model } = req.body;
    console.log('Received prompt:', prompt);
    console.log('Selected model:', model);

    let fileContent = '';
    if (req.file) {
      fileContent = fs.readFileSync(req.file.path, 'utf-8');
      console.log('Received file content:', fileContent);
    }

    let response;
    if (model === 'gpt-4o') {
      if (req.file) {
        response = await openai.chat.completions.create({
          model: model,
          messages: [{ role: "user", content: prompt }, { role: "user", content: fileContent }],
          max_tokens: 150
        });
      } else {
        response = await openai.chat.completions.create({
          model: model,
          messages: [{ role: "user", content: prompt }],
          max_tokens: 150
        });
      }
    } else {
      response = await openai.chat.completions.create({
        model: model,
        messages: [{ role: "user", content: prompt }],
        max_tokens: 150
      });
    }

    console.log('OpenAI response:', response);

    res.json({ response: response.choices[0].message.content.trim() });
  } catch (error) {
    console.error('Error calling OpenAI:', error);
    res.status(500).json({ error: 'An error occurred while processing your request.', details: error.message });
  } finally {
    if (req.file) {
      fs.unlinkSync(req.file.path); // clean up the uploaded file
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
