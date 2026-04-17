const User = require("../model/User");
const express = require("express");
const router = express.Router();

router.post("/add", async (req, res) => {
  try {
    const { name, iPAddress, location, deviceType, cnic, phoneNumber } = req.body;
    const user = new User({ name, iPAddress, location, deviceType, cnic, phoneNumber });
    await user.save();
    res.status(201).json(user);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.put("/update/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name, iPAddress, location, deviceType, cnic, phoneNumber } = req.body;
    const user = await User.findByIdAndUpdate(
      id,
      { name, iPAddress, location, deviceType, cnic, phoneNumber },
        { new: true }   
    );
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(user);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

module.exports = router;