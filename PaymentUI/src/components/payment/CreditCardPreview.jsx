import { Box, Typography } from "@mui/material";
import { motion } from "framer-motion";
import { ShieldCheck } from "lucide-react";

function CreditCardPreview({
    cardName,
    cardNumber,
    expiry,
    cardType,
}) {
    const formattedCardNumber =
        cardNumber
            ?.replace(/\D/g, "")
            .slice(0, 16)
            .replace(/(.{4})/g, "$1 ")
            .trim() ||
        "4242 4242 4242 4242";

    const formattedExpiry =
        expiry
            ?.replace(/[^\d/]/g, "")
            .slice(0, 5) || "12/28";

    const formattedName =
        cardName
            ?.replace(/[^a-zA-Z\s]/g, "")
            .toUpperCase()
            .trim() || "NANDAN NILEKANI";

    return (
        <motion.div
            whileHover={{
                rotateY: 8,
                rotateX: 4,
            }}
            transition={{
                type: "spring",
                stiffness: 120,
            }}
            style={{
                perspective: 1000,
            }}
        >
            <Box
                sx={{
                    height: {
                        xs: 200,
                        md: 220,
                    },

                    borderRadius: "24px",

                    p: {
                        xs: 2.5,
                        md: 3,
                    },

                    position: "relative",

                    overflow: "hidden",

                    background:
                        "linear-gradient(135deg, rgba(124,77,255,0.9), rgba(0,229,255,0.75))",

                    boxShadow:
                        "0 20px 40px rgba(0,0,0,0.45)",

                    display: "flex",

                    flexDirection: "column",

                    justifyContent: "space-evenly",

                    color: "#fff",

                    "&::before": {
                        content: '""',

                        position: "absolute",

                        inset: 0,

                        background:
                            "linear-gradient(135deg, rgba(255,255,255,0.18), transparent)",

                        pointerEvents: "none",
                    },
                }}
            >
                <Box
                    sx={{
                        position: "absolute",

                        width: 220,

                        height: 220,

                        borderRadius: "50%",

                        background:
                            "rgba(255,255,255,0.15)",

                        top: -80,

                        right: -60,
                    }}
                />

                <Box
                    sx={{
                        display: "flex",

                        justifyContent:
                            "space-between",

                        alignItems: "center",
                    }}
                >
                    <ShieldCheck size={18} />

                    <Typography
                        sx={{
                            fontWeight: 700,

                            letterSpacing: 1,

                            fontSize: "0.95rem",
                        }}
                    >
                        {cardType || "VISA"}
                    </Typography>
                </Box>

                <Typography
                    variant="h6"
                    fontWeight={700}
                >
                    GlassPay
                </Typography>

                <Typography
                    variant="h5"
                    letterSpacing={3}
                    fontWeight={600}
                    sx={{
                        mt: 1,
                    }}
                >
                    {formattedCardNumber}
                </Typography>

                <Box
                    sx={{
                        display: "flex",

                        justifyContent:
                            "space-between",

                        mt: 2,
                    }}
                >
                    <Box>
                        <Typography
                            variant="caption"
                            sx={{
                                opacity: 0.8,
                            }}
                        >
                            CARD HOLDER
                        </Typography>

                        <Typography
                            sx={{
                                fontWeight: 500,
                            }}
                        >
                            {formattedName}
                        </Typography>
                    </Box>

                    <Box>
                        <Typography
                            variant="caption"
                            sx={{
                                opacity: 0.8,
                            }}
                        >
                            EXPIRES
                        </Typography>

                        <Typography
                            sx={{
                                fontWeight: 500,
                            }}
                        >
                            {formattedExpiry}
                        </Typography>
                    </Box>
                </Box>
            </Box>
        </motion.div>
    );
}

export default CreditCardPreview;