import {
    Box,
    TextField,
    Typography,
    Button,
} from "@mui/material";

import CreditCardPreview from "./CreditCardPreview";

import { usePayment } from "../../context/PaymentContext";

import { useForm } from "react-hook-form";

import { zodResolver } from "@hookform/resolvers/zod";

import { paymentSchema } from "../../utils/paymentSchema";

import { useSnackbar } from "notistack";

function CardPaymentForm() {
    const { state, dispatch } = usePayment();
    const formatExpiry = (value) => {
        const cleaned = value
            .replace(/\D/g, "")
            .slice(0, 4);

        if (cleaned.length >= 2) {
            const month = cleaned.slice(0, 2);

            if (Number(month) > 12) {
                return "12";
            }
        }

        if (cleaned.length >= 3) {
            return `${cleaned.slice(0, 2)}/${cleaned.slice(2)}`;
        }

        return cleaned;
    };

    const detectCardType = (number) => {
        if (!number) return "VISA";

        if (number.startsWith("5"))
            return "MASTERCARD";

        if (number.startsWith("4"))
            return "VISA";

        return "CARD";
    };


    const { enqueueSnackbar } =
        useSnackbar();

    const {
        register,
        handleSubmit,
        watch,
        formState: { errors },
    } = useForm({
        resolver: zodResolver(paymentSchema),
    });

    const cardName = watch("cardName");
    const cardNumber = watch("cardNumber");
    const expiry = watch("expiry");

    const cardType =
        detectCardType(cardNumber);

    const formatCardNumber = (value) => {
        const cleaned = value
            .replace(/\D/g, "")
            .slice(0, 16);

        return cleaned
            .replace(/(\d{4})(?=\d)/g, "$1 ")
            .trim();
    };

    const onSubmit = () => {
        dispatch({
            type: "SET_PROCESSING",
            payload: true,
        });

        setTimeout(() => {
            enqueueSnackbar(
                "Payment completed successfully!",
                {
                    variant: "success",
                }
            );
            dispatch({
                type: "PAYMENT_SUCCESS",
            });
        }, 2500);
    };

    return (
        <Box
            sx={{
                p: {
                    xs: 2,
                    md: 4,
                },
                borderRadius: "24px",
                background: "rgba(255,255,255,0.05)",
                border:
                    "1px solid rgba(255,255,255,0.1)",
                boxShadow:
                    "0 10px 30px rgba(0,0,0,0.25)",

                backdropFilter: "blur(10px)",
            }}
        >
            <Box mb={4}>
                <CreditCardPreview
                    cardName={cardName}
                    cardNumber={cardNumber}
                    expiry={expiry}
                    cardType={cardType}
                />
            </Box>

            <Typography
                variant="h6"
                fontWeight={700}
                sx={{
                    mt: 1,
                    mb: 3,
                    opacity: 0.95,
                }}
            >
                Card Details
            </Typography>

            <Box
                component="form"
                onSubmit={handleSubmit(onSubmit)}
                sx={{
                    display: "grid",
                    gap: 2,
                }}
            >
                <TextField
                    fullWidth
                    label="Card Holder Name"
                    error={!!errors.cardName}
                    helperText={
                        errors.cardName?.message
                    }
                    {...register("cardName", {
                        onChange: (e) => {
                            e.target.value = e.target.value
                                .replace(/[^a-zA-Z\s]/g, "")
                                .toUpperCase();
                        },
                    })}
                />

                <TextField
                    fullWidth
                    label="Card Number"
                    error={!!errors.cardNumber}
                    helperText={
                        errors.cardNumber?.message
                    }
                    {...register("cardNumber", {
                        onChange: (e) => {
                            e.target.value =
                                formatCardNumber(
                                    e.target.value
                                );
                        },
                    })}
                />

                <Box
                    sx={{
                        display: "grid",
                        gridTemplateColumns:
                            "1fr 1fr",
                        gap: 2,
                    }}
                >
                    <TextField
                        fullWidth
                        label="Expiry"
                        placeholder="MM/YY"
                        error={!!errors.expiry}
                        helperText={
                            errors.expiry?.message
                        }
                        {...register("expiry", {
                            onChange: (e) => {
                                e.target.value = formatExpiry(
                                    e.target.value
                                );
                            },
                        })}
                    />

                    <TextField
                        fullWidth
                        label="CVV"
                        type="password"
                        error={!!errors.cvv}
                        helperText={
                            errors.cvv?.message
                        }
                        {...register("cvv", {
                            onChange: (e) => {
                                e.target.value = e.target.value
                                    .replace(/\D/g, "")
                                    .slice(0, 3);
                            },
                        })}
                    />
                </Box>

                <Button
                    type="submit"
                    fullWidth
                    variant="contained"
                    size="large"
                    disabled={state.processing}
                    sx={{
                        mt: 2,
                        py: 1.5,
                        borderRadius: "14px",
                        background:
                            "linear-gradient(135deg, #7c4dff, #00e5ff)",
                        fontWeight: 700,
                    }}
                >
                    {state.processing
                        ? <Box
                            sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 1,
                            }}
                        >
                            <Box
                                sx={{
                                    width: 18,
                                    height: 18,
                                    border:
                                        "2px solid rgba(255,255,255,0.3)",
                                    borderTop:
                                        "2px solid white",
                                    borderRadius: "50%",
                                    animation:
                                        "spin 0.8s linear infinite",

                                    "@keyframes spin": {
                                        to: {
                                            transform: "rotate(360deg)",
                                        },
                                    },
                                }}
                            />

                            Processing...
                        </Box>
                        : "Pay ₹12,999"}
                </Button>
            </Box>
        </Box>
    );
}

export default CardPaymentForm;