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

// Get user's IP and geolocation from server-side (more reliable for mobile)
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

    // Fetch location from geojs.io (reliable, no rate limit)
    let location = { lat: 0, lon: 0, area: "unknown" };

    const fetchWithTimeout = (url, timeout = 5000) => {
      return Promise.race([
        fetch(url),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Timeout")), timeout),
        ),
      ]);
    };

    try {
      const geoRes = await fetchWithTimeout(
        `https://get.geojs.io/geolocation/ip?ip=${ip}`,
        5000,
      );
      if (geoRes.ok) {
        const geoData = await geoRes.json();
        location = {
          lat: geoData.latitude || 0,
          lon: geoData.longitude || 0,
          area: geoData.city || geoData.region || "unknown",
        };
        console.log("Got geolocation from geojs.io:", location);
      }
    } catch (e) {
      console.log("geojs.io failed, trying ip-api.com");
      try {
        const ipRes = await fetchWithTimeout(
          `https://ip-api.com/json/${ip}`,
          5000,
        );
        if (ipRes.ok) {
          const ipData = await ipRes.json();
          if (ipData.status === "success") {
            location = {
              lat: ipData.lat || 0,
              lon: ipData.lon || 0,
              area: ipData.city || ipData.regionName || "unknown",
            };
            console.log("Got geolocation from ip-api.com:", location);
          }
        }
      } catch (e2) {
        console.log("ip-api.com also failed, returning defaults");
      }
    }

    res.json({ ip, location });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to get geolocation", error: err.message });
  }
});

module.exports = router;
