const express = require("express");
const phoneRoutes = require("./phoneRoutes");
const brandRoutes = require("./brandRoutes");
const adminRoutes = require("./adminRoutes");

const router = express.Router();

router.get("/health", (req, res) => {
  res.status(200).json({ success: true, data: { status: "ok", timestamp: new Date().toISOString() } });
});

router.use("/phones", phoneRoutes);
router.use("/brands", brandRoutes);
router.use("/admin", adminRoutes);

module.exports = router;
