const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mqtt = require('mqtt');
require('dotenv').config();

const app = express();
const server = http.createServer(app);

// Validations for required environment variables

const THINGNAME = 'Yug'; // Your thing name
const AWS_IOT_ENDPOINT =
    'a1lt7b88vgfoh5-ats.iot.ap-southeast-2.amazonaws.com'; // Your AWS IoT endpoint
const topic = 'esp32/pub';


const requiredEnvVars = ['rootCA', 'cert', 'privateKey'];
requiredEnvVars.forEach((varName) => {
  if (!process.env[varName]) {
    console.error(`Error: Missing required environment variable ${varName}`);
    process.exit(1);
  }
});



const rootCA = process.env.rootCA;
const cert = process.env.cert;
const privateKey = process.env.privateKey;

const io = socketIo(server, {
  cors: {
    origin: "*",  // Allow all origins; in production, you should be more restrictive
    methods: ["GET", "POST"]
  }
});

const mqttOptions = {
  key: Buffer.from(privateKey, 'utf8'),
  cert: Buffer.from(cert, 'utf8'),
  ca: Buffer.from(rootCA, 'utf8'),
  clientId: THINGNAME,
  protocol: 'mqtts',
  host: AWS_IOT_ENDPOINT,
  port: 8883,
};

console.log('Connecting to MQTT broker...');
let client;
try {
  client = mqtt.connect(mqttOptions);
} catch (error) {
  console.error('Failed to connect to MQTT broker:', error);
  process.exit(1);
}

let messages = [];

client.on('connect', () => {
  console.log('Connected to MQTT broker');
  try {
    client.subscribe(topic);
  } catch (error) {
    console.error('Error during MQTT connection:', error);
  }
});

client.on('message', (receivedTopic, payload) => {
  try {
    const receivedMessage = payload.toString();
    console.log(receivedMessage);
    messages.push(receivedMessage);
    io.emit('newMessage', receivedMessage);
  } catch (error) {
    console.error('Error handling MQTT message:', error);
  }
});

client.on('error', (error) => {
  console.error('MQTT client error:', error);
});

client.on('close', () => {
  console.log('MQTT connection closed');
});

io.on('connection', (socket) => {
  console.log('Client connected');

  socket.on('subscribeData', ({ topic }) => {
    try {
      if (topic) {
        client.unsubscribe(topic);
      }
      client.subscribe(topic, (error) => {
        if (error) {
          console.error('Error subscribing to topic:', error);
        } else {
          console.log(`Subscribed to topic: ${topic}`);
        }
      });
    } catch (error) {
      console.error('Error handling subscribeData event:', error);
    }
  });

  socket.on('sendToBackend', ({ topic, message }) => {
    try {
      console.log('Received message on the backend:', message);
    } catch (error) {
      console.error('Error handling sendToBackend event:', error);
    }
  });

  socket.on('sendToMQTT', ({ topic, message }) => {
    try {
      if (!topic || !message) {
        console.error('Both topic and message are required');
        return;
      }
      client.publish(topic, message, (error) => {
        if (error) {
          console.error('Error publishing message to MQTT:', error);
        } else {
          console.log('Message published to MQTT successfully');
        }
      });
    } catch (error) {
      console.error('Error handling sendToMQTT event:', error);
    }
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
