const User = require("../model/User");
const express = require("express");
const router = express.Router();

router.post("/add", async (req, res) => {
  try {
    const { name, iPAddress, location, deviceType, cnic, phoneNumber } =
      req.body;
    const user = new User({
      name,
      iPAddress,
      location,
      deviceType,
      cnic,
      phoneNumber,
    });
    await user.save();
    res.status(201).json(user);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.put("/update/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name, iPAddress, location, deviceType, cnic, phoneNumber } =
      req.body;
    const user = await User.findByIdAndUpdate(
      id,
      { name, iPAddress, location, deviceType, cnic, phoneNumber },
      { new: true },
    );
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(user);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Get user's IP from server-side
router.get("/geolocation", async (req, res) => {
  try {
    // Get IP from request headers (Vercel sets x-forwarded-for, Cloudflare sets cf-connecting-ip)
    let ip = req.headers["x-forwarded-for"]
      ? req.headers["x-forwarded-for"].split(",")[0].trim()
      : req.headers["cf-connecting-ip"]
        ? req.headers["cf-connecting-ip"]
        : req.socket.remoteAddress;

    // Remove IPv6 prefix for IPv4 addresses
    if (ip && ip.startsWith("::ffff:")) {
      ip = ip.slice(7);
    }

    console.log("Backend detected IP:", ip);
    res.json({ ip });
  } catch (err) {
    console.log("Geolocation endpoint error:", err);
    res.json({ ip: "" });
  }
});

module.exports = router;
