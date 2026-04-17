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

// Hardcoded Pakistan IP ranges for testing (since external services are blocked)
const pakistanLocations = {
  "119.154": { city: "Rawalpindi", region: "Punjab", lat: 33.5981, lon: 73.0441 },
  "119.159": { city: "Islamabad", region: "Islamabad", lat: 33.6844, lon: 73.0479 },
  "203.99": { city: "Karachi", region: "Sindh", lat: 24.8607, lon: 67.0011 },
  "39.32": { city: "Lahore", region: "Punjab", lat: 31.5497, lon: 74.3436 },
  "182.48": { city: "Faisalabad", region: "Punjab", lat: 31.418, lon: 72.3456 },
  "202.61": { city: "Peshawar", region: "KPK", lat: 34.0084, lon: 71.5784 },
};

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

    let location = { lat: 0, lon: 0, area: "unknown" };

    // Check if IP is from Pakistan (hardcoded ranges)
    const ipPrefix = ip.split(".").slice(0, 2).join(".");
    if (pakistanLocations[ipPrefix]) {
      const loc = pakistanLocations[ipPrefix];
      location = {
        lat: loc.lat,
        lon: loc.lon,
        area: `${loc.city}, ${loc.region}`,
      };
      console.log("✓ Found location from Pakistan ISP database:", location);
      return res.json({ ip, location });
    }

    // Try external services as backup
    const services = [
      {
        name: "abstract-api",
        url: `https://ipgeolocation.abstractapi.com/v1/?api_key=test&ip_address=${ip}`,
      },
      {
        name: "ip-api-json",
        url: `https://ip-api.com/json/${ip}?fields=lat,lon,city,region,country`,
      },
    ];

    for (const service of services) {
      try {
        console.log(`Trying ${service.name} for IP: ${ip}`);
        const response = await fetch(service.url, { timeout: 8000 });
        if (response.ok) {
          const data = await response.json();
          console.log(`${service.name} response:`, data);
          
          if (data.latitude && data.longitude) {
            location = {
              lat: data.latitude,
              lon: data.longitude,
              area: data.city || data.region || "unknown",
            };
            console.log(`✓ Got location from ${service.name}:`, location);
            return res.json({ ip, location });
          }
        }
      } catch (e) {
        console.log(`✗ ${service.name} failed:`, e.message);
      }
    }

    console.log("No location found, returning default with IP");
    res.json({ ip, location });
  } catch (err) {
    console.log("Geolocation endpoint error:", err);
    res.json({ ip: "", location: { lat: 0, lon: 0, area: "unknown" } });
  }
});

module.exports = router;
