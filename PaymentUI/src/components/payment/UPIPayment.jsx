import {
  Box,
  Button,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import { motion } from "framer-motion";

import { useState } from "react";

import { useSnackbar } from "notistack";

import { upiApps } from "../../data/upiApps";

function UPIPayment() {
  const [selectedApp, setSelectedApp] =
    useState("gpay");

  const [upiId, setUpiId] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const { enqueueSnackbar } =
    useSnackbar();

  const validateUPI = (upi) => {
    return /^[a-zA-Z0-9.\-_]{2,}@[a-zA-Z]{2,}$/.test(
      upi
    );
  };

  const handleUPIChange = (e) => {
    const value = e.target.value
      .replace(/\s/g, "")
      .toLowerCase();

    setUpiId(value);

    if (!value) {
      setError("");
      return;
    }

    if (!validateUPI(value)) {
      setError("Enter valid UPI ID");
    } else {
      setError("");
    }
  };

  const handleUPIPayment = () => {
    if (!upiId) {
      enqueueSnackbar(
        "UPI ID is required",
        {
          variant: "error",
        }
      );

      return;
    }

    if (!validateUPI(upiId)) {
      enqueueSnackbar(
        "Please enter a valid UPI ID",
        {
          variant: "error",
        }
      );

      return;
    }

    setLoading(true);

    setTimeout(() => {
      setLoading(false);

      enqueueSnackbar(
        `Payment successful via ${
          upiApps.find(
            (app) =>
              app.id === selectedApp
          )?.name
        }`,
        {
          variant: "success",
        }
      );

      setUpiId("");
    }, 2000);
  };

  return (
    <Box
      sx={{
        p: {
          xs: 2.5,
          md: 4,
        },

        borderRadius: "28px",

        background:
          "rgba(255,255,255,0.05)",

        border:
          "1px solid rgba(255,255,255,0.08)",

        backdropFilter: "blur(10px)",

        boxShadow:
          "0 10px 30px rgba(0,0,0,0.25)",
      }}
    >
      <Typography
        variant="h5"
        fontWeight={700}
        sx={{
          mb: 1,
        }}
      >
        Pay using UPI
      </Typography>

      <Typography
        sx={{
          mb: 4,
          opacity: 0.7,
        }}
      >
        Choose your preferred UPI app
      </Typography>

      <Stack
        direction="row"
        spacing={2}
        flexWrap="wrap"
        useFlexGap
        sx={{
          mb: 4,
        }}
      >
        {upiApps.map((app) => {
          const active =
            selectedApp === app.id;

          return (
            <motion.div
              key={app.id}
              whileTap={{
                scale: 0.96,
              }}
            >
              <Box
                onClick={() =>
                  setSelectedApp(app.id)
                }
                sx={{
                  width: 120,

                  p: 2,

                  borderRadius: "20px",

                  cursor: "pointer",

                  transition:
                    "all 0.3s ease",

                  background: active
                    ? `${app.color}22`
                    : "rgba(255,255,255,0.04)",

                  border: active
                    ? `1px solid ${app.color}`
                    : "1px solid rgba(255,255,255,0.08)",

                  textAlign: "center",

                  backdropFilter:
                    "blur(10px)",

                  "&:hover": {
                    transform:
                      "translateY(-4px)",
                  },
                }}
              >
                <Box
                  sx={{
                    width: 52,
                    height: 52,

                    borderRadius: "16px",

                    background: app.color,

                    margin:
                      "0 auto 12px",

                    display: "flex",

                    alignItems:
                      "center",

                    justifyContent:
                      "center",

                    fontWeight: 700,

                    fontSize: "1.1rem",
                  }}
                >
                  {app.name.charAt(0)}
                </Box>

                <Typography
                  fontWeight={600}
                >
                  {app.name}
                </Typography>
              </Box>
            </motion.div>
          );
        })}
      </Stack>

      <TextField
        fullWidth
        label="UPI ID"
        placeholder="name@upi"
        value={upiId}
        onChange={handleUPIChange}
        error={!!error}
        helperText={error}
        autoComplete="off"
        sx={{
          mb: 3,

          "& .MuiInputLabel-root": {
            background:
              "#3f4657",

            px: 0.5,
          },
        }}
      />

      <Button
        fullWidth
        variant="contained"
        disabled={loading}
        onClick={handleUPIPayment}
        sx={{
          py: 1.6,

          fontWeight: 700,

          background:
            "linear-gradient(135deg, #7c4dff 0%, #3b82f6 50%, #06b6d4 100%)",
        }}
      >
        {loading
          ? "Processing Payment..."
          : `Pay with ${
              upiApps.find(
                (app) =>
                  app.id ===
                  selectedApp
              )?.name
            }`}
      </Button>
    </Box>
  );
}

export default UPIPayment;