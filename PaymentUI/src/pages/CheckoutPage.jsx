import { Box } from "@mui/material";

import PaymentSection from "../components/payment/PaymentSection";
import OrderSummary from "../components/checkout/OrderSummary";
import { motion } from "framer-motion";

function CheckoutPage() {
    return (
        <motion.div
            initial={{
                opacity: 0,
                y: 20,
            }}
            animate={{
                opacity: 1,
                y: 0,
            }}
            transition={{
                duration: 0.5,
            }}
        >
            <Box
                sx={{
                    display: "grid",

                    gridTemplateColumns: {
                        xs: "1fr",
                        lg: "1.4fr 0.8fr",
                    },

                    gap: {
                        xs: 3,
                        md: 4,
                    },

                    alignItems: "start",
                }}
            >
                <PaymentSection />

                <OrderSummary />
            </Box>
        </motion.div>
    );
}

export default CheckoutPage;