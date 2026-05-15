import {
    Box,
    Divider,
    Stack,
    Typography,
} from "@mui/material";

function OrderSummary() {
    return (
        <Box
            sx={{
                p: 3,

                borderRadius: "28px",

                background:
                    "rgba(255,255,255,0.05)",

                border:
                    "1px solid rgba(255,255,255,0.08)",

                backdropFilter: "blur(12px)",

                boxShadow:
                    "0 10px 30px rgba(0,0,0,0.25)",

                position: "sticky",
                top: 24,
            }}
        >
            <Typography
                variant="h5"
                fontWeight={700}
                sx={{
                    mb: 5,
                    letterSpacing: "-0.5px",
                }}
            >
                Order Summary
            </Typography>

            <Stack spacing={4}>
                <Box>
                    <Typography
                        fontWeight={700}
                        fontSize="1.1rem"
                    >
                        MacBook Pro M3
                    </Typography>

                    <Typography
                        variant="body2"
                        sx={{
                            opacity: 0.7,
                            mt: 1,
                        }}
                    >
                        Quantity: 1
                    </Typography>
                </Box>

                <Divider />

                <Stack spacing={2}>
                    <Stack
                        direction="row"
                        justifyContent="space-between"
                    >
                        <Typography>
                            Subtotal
                        </Typography>

                        <Typography>
                            ₹11,999
                        </Typography>
                    </Stack>

                    <Stack
                        direction="row"
                        justifyContent="space-between"
                    >
                        <Typography>
                            GST
                        </Typography>

                        <Typography>
                            ₹1,000
                        </Typography>
                    </Stack>
                </Stack>

                <Divider />

                <Stack
                    direction="row"
                    justifyContent="space-between"
                >
                    <Typography
                        fontWeight={700}
                        fontSize="1.1rem"
                    >
                        Total
                    </Typography>

                    <Typography
                        fontWeight={700}
                        fontSize="1.1rem"
                    >
                        ₹12,999
                    </Typography>
                </Stack>
            </Stack>
        </Box>
    );
}

export default OrderSummary;