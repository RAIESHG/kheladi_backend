const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mqtt = require('mqtt');

const app = express();
const server = http.createServer(app);
require('dotenv').config();

const THINGNAME = 'Yug'; // Your thing name
const AWS_IOT_ENDPOINT =
    'a1lt7b88vgfoh5-ats.iot.ap-southeast-2.amazonaws.com'; // Your AWS IoT endpoint
const topic = 'esp32/pub';

// Amazon Root CA 1
const rootCA = process.env.rootCA;

// Device Certificate
const cert = process.env.cert;

// Device Private Key
const privateKey = process.env.privateKey;

// Socket.io Configuration
// Socket.io Configuration
const io = socketIo(server, {
  cors: {
      origin: "*",  // Allow all origins; in production, you should be more restrictive
      methods: ["GET", "POST"]
  }
});

// MQTT Configuration


const mqttOptions = {
  key: Buffer.from(privateKey, 'utf8'), // Replace with your private key
  cert: Buffer.from(cert, 'utf8'), // Replace with your certificate
  ca: Buffer.from(rootCA, 'utf8'), // Replace with your root CA
  clientId: 'myClientId',
  protocol: 'mqtts', // Use 'mqtts' for secure MQTT
  host: AWS_IOT_ENDPOINT,
  port: 8883, // Default port for MQTT over TLS
};

console.log('Connecting to MQTT broker...');

const client = mqtt.connect(mqttOptions);

let messages = [];

client.on('connect', () => {
  try {
    console.log('Connected to MQTT broker');
    client.subscribe(topic);
  } catch (error) {
    console.error('Error during MQTT connection:', error);
    // Handle the error here, such as retrying the connection or taking other appropriate actions.
  }
});

client.on('message', (receivedTopic, payload) => {
  const receivedMessage = payload.toString();
  console.log(receivedMessage);
  messages.push(receivedMessage);
  io.emit('newMessage', receivedMessage);
});

io.on('connection', (socket) => {
  console.log('Client connected');

  socket.on('subscribeData', ({ topic }) => {
    if (topic) {
      // Unsubscribe from the previous topic, if any
      client.unsubscribe(topic);
    }

    client.subscribe(topic, (error) => {
      if (error) {
        console.error('Error subscribing to topic:', error);
      } else {
        console.log(`Subscribed to topic: ${topic}`);
      }
    });
  });

  socket.on('sendToBackend', ({ topic, message }) => {
    // Handle messages sent to the backend (e.g., process them or perform actions)
    console.log('Received message on the backend:', message);
  });

  socket.on('sendToMQTT', ({ topic, message }) => {
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
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

// ... Other API routes ...

// Start the server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});