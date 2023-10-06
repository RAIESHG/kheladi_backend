const express = require('express');
const mongoose = require('mongoose'); // Import mongoose
const bcrypt = require('bcrypt');
const cors = require('cors');  // Import the cors package

const app = express();
const PORT = 3000;

const uri = "mongodb+srv://bplforum:Computer12.@cluster0.zqmka8n.mongodb.net/?retryWrites=true&w=majority";

// Connect using mongoose
mongoose.connect(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    // useCreateIndex: true
}).then(() => {
    console.log('Mongoose connected successfully');
}).catch(err => {
    console.error('Mongoose connection error:', err);
});

const UserSchema = new mongoose.Schema({
    username: { type: String, unique: true }, // Ensure usernames are unique
    password: String
});

const User = mongoose.model('User', UserSchema);

app.use(express.json());
app.use(cors());

app.get('/', async (req, res) => {
    try {
        res.status(201).send({ message: 'User registered successfully' });
    } catch (error) {
        console.error(error); // Log the error for debugging
        res.status(500).send({ error: 'Server error' });
    }
});
app.post('/register', async (req, res) => {
    try {
        const { username, password } = req.body;

        // Hash the password before saving
        // const hashedPassword = await bcrypt.hash(password, 10);

        const user = new User({
            username: username,
            password: password
        });

        await user.save();

        res.status(201).send({ message: 'User registered successfully' });
    } catch (error) {
        console.error(error); // Log the error for debugging
        res.status(500).send({ error: 'Server error' });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
