const mongoose = require('mongoose');
const RecyclingPoint = require('../models/RecyclingPoint'); // adjust path if needed

// Connect to your MongoDB
mongoose.connect('mongodb://localhost:27017/recyclingApp', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('Connected to DB');

  // Create a new recycling point
  const newPoint = new RecyclingPoint({
    name: "West Park Recycling Center",
    address: "123 Green St, Girne",
    city: "Kyrenia",
    lat: 35.3404,
    lng: 33.3175,
    materials: ["Plastic", "Glass"],
    tags: ["city-center", "public"]
  });

  return newPoint.save();
}).then(doc => {
  console.log("Inserted:", doc);
  mongoose.disconnect();
}).catch(err => {
  console.error(err);
  mongoose.disconnect();
});
