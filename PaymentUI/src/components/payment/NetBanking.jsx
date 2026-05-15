import {
    Box,
    Button,
    MenuItem,
    TextField,
    Typography,
} from "@mui/material";

import { banks } from "../../data/banks";

import { useSnackbar } from "notistack";
import { useState } from "react";



function NetBanking() {
    const [selectedBank, setSelectedBank] =
        useState("");

    const [loading, setLoading] =
        useState(false);

    const { enqueueSnackbar } =
        useSnackbar();

    const handleBankPayment = () => {
        if (!selectedBank) {
            enqueueSnackbar(
                "Please select a bank",
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
                `Redirected to ${selectedBank}`,
                {
                    variant: "success",
                }
            );
        }, 2000);
    };
    return (
        <Box
            sx={{
                p: {
                    xs: 2,
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
                mb={4}
            >
                Net Banking
            </Typography>

            <Typography
                sx={{
                    mb: 3,
                    opacity: 0.7,
                }}
            >
                Select your bank to continue
            </Typography>

            <TextField
                select
                fullWidth
                label="Select Bank"
                value={selectedBank}
                onChange={(e) =>
                    setSelectedBank(e.target.value)
                }
                sx={{
                    mb: 4,
                }}
            >
                {banks.map((bank) => (
                    <MenuItem
                        key={bank}
                        value={bank}
                    >
                        {bank}
                    </MenuItem>
                ))}
            </TextField>

            <Button
                fullWidth
                variant="contained"
                disabled={loading}
                onClick={handleBankPayment}
                sx={{
                    py: 1.5,

                    background:
                        "linear-gradient(135deg, #7c4dff 0%, #3b82f6 50%, #06b6d4 100%)",
                }}
            >
                {loading
                    ? "Redirecting..."
                    : "Continue to Bank"}
            </Button>
        </Box>
    );
}

export default NetBanking;