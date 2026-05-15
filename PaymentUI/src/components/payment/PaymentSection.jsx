import { Box, Typography } from "@mui/material";

import PaymentMethods from "./PaymentMethods";
import CardPaymentForm from "./CardPaymentForm";
import UPIPayment from "./UPIPayment";
import NetBanking from "./NetBanking";

import { usePayment } from "../../context/PaymentContext";
import { motion, AnimatePresence } from "framer-motion";
import PaymentSuccess from "./PaymentSuccess";

function PaymentSection() {
    const { state } = usePayment();

    const renderPaymentForm = () => {
        switch (state.selectedMethod) {
            case "upi":
                return <UPIPayment />;

            case "banking":
                return <NetBanking />;

            default:
                return <CardPaymentForm />;
        }
    };

    const successOpen = state.paymentSuccess;

    return (
        <Box
            sx={{
                width: "100%",
            }}
        >
            <Typography
                variant="h4"
                fontWeight={700}
                sx={{
                    mb: 4,
                    letterSpacing: "-1px",
                }}
            >
                Complete Payment
            </Typography>

            <PaymentMethods />

            <AnimatePresence mode="wait">
                <motion.div
                    key={state.selectedMethod}
                    initial={{
                        opacity: 0,
                        y: 20,
                    }}
                    animate={{
                        opacity: 1,
                        y: 0,
                    }}
                    exit={{
                        opacity: 0,
                        y: -20,
                    }}
                    transition={{
                        duration: 0.3,
                    }}
                    style={{
                        marginTop: "40px",
                    }}
                >
                    {renderPaymentForm()}
                </motion.div>
            </AnimatePresence>
            <PaymentSuccess open={successOpen} />
        </Box>
    );
}

export default PaymentSection;